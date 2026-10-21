import { test, before, after } from 'node:test';
import assert from 'node:assert/strict';
import { createServer } from 'node:http';
import worker, { redact, validate } from '../src/index.js';
import knowledge from '../src/knowledge.json' with { type: 'json' };
import { createIndex, search } from '../src/retrieve.js';

const ORIGIN = 'https://jovingj24jan-png.github.io';
const env = (extra = {}) => ({ ALLOWED_ORIGINS: `${ORIGIN},http://localhost:5173`, ANTHROPIC_API_KEY: 'test-key', ...extra });
const post = (body, headers = {}) =>
  new Request('https://api.example/chat', {
    method: 'POST',
    headers: { origin: ORIGIN, 'content-type': 'application/json', 'cf-connecting-ip': '203.0.113.9', ...headers },
    body: typeof body === 'string' ? body : JSON.stringify(body),
  });
const ask = (text) => ({ messages: [{ role: 'user', content: text }] });

// ---------- Validation, redaction, retrieval ----------

test('validate accepts alternating turns and rejects bad shapes', () => {
  assert.equal(validate({ messages: [{ role: 'user', content: 'Hi' }, { role: 'assistant', content: 'Hello' }, { role: 'user', content: 'Fees?' }] }), null);
  assert.match(validate({}), /between 1 and 20/);
  assert.match(validate({ messages: [{ role: 'assistant', content: 'x' }] }), /alternate/);
  assert.match(validate({ messages: [{ role: 'user', content: '   ' }] }), /empty/);
  assert.match(validate({ messages: [{ role: 'user', content: 'x'.repeat(1501) }] }), /too long/);
  assert.match(validate({ messages: [{ role: 'user', content: 'a' }, { role: 'assistant', content: 'b' }] }), /last message/);
  assert.match(validate({ messages: Array.from({ length: 21 }, (_, i) => ({ role: i % 2 ? 'assistant' : 'user', content: 'x' })) }), /between 1 and 20/);
});

test('redact removes emails and phone numbers but keeps short numbers', () => {
  assert.equal(redact('Mail me at priya.rao@example.com'), 'Mail me at [email removed]');
  assert.equal(redact('Call +91 98765 43210 today'), 'Call [number removed] today');
  assert.equal(redact('We have 3 centers and 120 children'), 'We have 3 centers and 120 children');
});

test('retrieval finds the right website content', () => {
  const index = createIndex(knowledge.chunks);
  const top = (q) => search(index, q).filter((c) => !c.pinned).slice(0, 3).map((c) => c.url);
  assert.ok(top('Can THINKBIG manage multiple school locations?').some((u) => /multi-location|multisite/.test(u)), 'multi-location');
  assert.ok(top('How does billing and fee management work?').some((u) => /billing|fee/.test(u)), 'billing');
  assert.ok(top('What Montessori features are available?').some((u) => /montessori/.test(u)), 'montessori');
  assert.ok(top('How does attendance tracking work?').some((u) => /attendance/.test(u)), 'attendance');
  assert.ok(top('Can parents receive daily updates?').some((u) => /diary|communication|parent-app/.test(u)), 'daily updates');
  assert.ok(top('What is THINKBIG?').includes('index.html#faq'), 'what is');
  assert.ok(search(index, 'How can I book a demo?')[0].pinned, 'site facts always included');
});

test('knowledge contains no sample-data names from product mock-ups', () => {
  const text = knowledge.chunks.map((c) => c.text).join(' ');
  assert.doesNotMatch(text, /Ananya|Priya Rao|Kabir|Sunrise Campus|Lotus Montessori|Sample data/);
});

// ---------- Request handling ----------

test('health reports configuration without revealing secrets', async () => {
  const res = await worker.fetch(new Request('https://api.example/health'), env());
  const body = await res.json();
  assert.equal(body.configured, true);
  assert.doesNotMatch(JSON.stringify(body), /test-key/);
});

test('rejects unknown origins, missing origins and wrong methods', async () => {
  assert.equal((await worker.fetch(post(ask('Hi'), { origin: 'https://evil.example' }), env())).status, 403);
  const noOrigin = new Request('https://api.example/chat', { method: 'POST', body: '{}' });
  assert.equal((await worker.fetch(noOrigin, env())).status, 403);
  const get = new Request('https://api.example/chat', { headers: { origin: ORIGIN } });
  assert.equal((await worker.fetch(get, env())).status, 405);
});

test('answers CORS preflight for allowed origins only', async () => {
  const pre = new Request('https://api.example/chat', { method: 'OPTIONS', headers: { origin: ORIGIN } });
  const res = await worker.fetch(pre, env());
  assert.equal(res.status, 204);
  assert.equal(res.headers.get('access-control-allow-origin'), ORIGIN);
});

test('returns 503 when the API key is not configured', async () => {
  const res = await worker.fetch(post(ask('Hi')), env({ ANTHROPIC_API_KEY: '' }));
  assert.equal(res.status, 503);
});

test('rejects oversized and malformed bodies', async () => {
  assert.equal((await worker.fetch(post('x'.repeat(40_000)), env())).status, 413);
  assert.equal((await worker.fetch(post('{not json'), env())).status, 400);
  assert.equal((await worker.fetch(post({ messages: [] }), env())).status, 400);
});

test('applies the rate limiter binding', async () => {
  const limiter = { limit: async () => ({ success: false }) };
  const res = await worker.fetch(post(ask('Hi')), env({ RATE_LIMITER: limiter }));
  assert.equal(res.status, 429);
  assert.equal(res.headers.get('retry-after'), '60');
});

// ---------- Streaming through the real SDK against a local stand-in API ----------

let server;
let baseURL;
let scenario = 'answer';
let captured = null;

const sse = (res, events) => {
  res.writeHead(200, { 'content-type': 'text/event-stream' });
  for (const e of events) res.write(`event: ${e.type}\ndata: ${JSON.stringify(e)}\n\n`);
  res.end();
};
const start = { type: 'message_start', message: { id: 'msg_test', type: 'message', role: 'assistant', model: 'claude-opus-5-5', content: [], stop_reason: null, stop_sequence: null, usage: { input_tokens: 900, output_tokens: 1 } } };
const textBlock = (i, parts) => [
  { type: 'content_block_start', index: i, content_block: { type: 'text', text: '' } },
  ...parts.map((t) => ({ type: 'content_block_delta', index: i, delta: { type: 'text_delta', text: t } })),
  { type: 'content_block_stop', index: i },
];
const finish = (stop) => [
  { type: 'message_delta', delta: { stop_reason: stop, stop_sequence: null }, usage: { output_tokens: 40 } },
  { type: 'message_stop' },
];

before(async () => {
  server = createServer((req, res) => {
    let raw = '';
    req.on('data', (c) => { raw += c; });
    req.on('end', () => {
      captured = { headers: req.headers, body: JSON.parse(raw) };
      if (scenario === 'overloaded') {
        res.writeHead(529, { 'content-type': 'application/json' });
        res.end(JSON.stringify({ type: 'error', error: { type: 'overloaded_error', message: 'Overloaded' } }));
      } else if (scenario === 'refusal') {
        sse(res, [start, ...finish('refusal')]);
      } else if (scenario === 'fallback') {
        sse(res, [start, ...textBlock(0, ['Partial ']),
          { type: 'content_block_start', index: 1, content_block: { type: 'fallback', from: { model: 'claude-opus-5-5' }, to: { model: 'claude-opus-4-8' } } },
          { type: 'content_block_stop', index: 1 },
          ...textBlock(2, ['Fallback answer.']), ...finish('end_turn')]);
      } else {
        sse(res, [start, ...textBlock(0, ['THINKBIG helps ', 'preschools. [Book a demo](index.html#demo)']), ...finish('end_turn')]);
      }
    });
  });
  await new Promise((r) => server.listen(0, '127.0.0.1', r));
  baseURL = `http://127.0.0.1:${server.address().port}`;
});
after(() => server.close());

async function events(res) {
  const text = await res.text();
  return text.split('\n\n').filter(Boolean).map((block) => JSON.parse(block.replace(/^data: /, '')));
}

test('streams a grounded answer and sends a well-formed provider request', async () => {
  scenario = 'answer';
  const body = { messages: [
    { role: 'user', content: 'What is THINKBIG?' },
    { role: 'assistant', content: 'A preschool management platform.' },
    { role: 'user', content: 'How does billing work? Email me at a.parent@example.com' },
  ] };
  const res = await worker.fetch(post(body), env({ ANTHROPIC_BASE_URL: baseURL }));
  assert.equal(res.status, 200);
  assert.match(res.headers.get('content-type'), /text\/event-stream/);
  const out = await events(res);
  assert.equal(out[0].type, 'sources');
  assert.ok(out[0].items.length > 0 && out[0].items.every((s) => /^[a-z-]+\.html/.test(s.url)));
  assert.equal(out.filter((e) => e.type === 'text').map((e) => e.text).join(''), 'THINKBIG helps preschools. [Book a demo](index.html#demo)');
  assert.deepEqual(out.at(-1), { type: 'done', stop: 'end_turn' });

  const { body: sent, headers } = captured;
  assert.equal(sent.model, 'claude-opus-5-5');
  assert.equal(sent.fallbacks, 'default');
  assert.equal(sent.output_config.effort, 'low');
  assert.match(headers['anthropic-beta'], /server-side-fallback-2026-07-01/);
  assert.equal(headers['x-api-key'], 'test-key');
  assert.equal(sent.messages.length, 3);
  const lastTurn = sent.messages.at(-1).content;
  assert.match(lastTurn, /<website_content>/);
  assert.match(lastTurn, /\[email removed\]/);
  assert.doesNotMatch(JSON.stringify(sent), /a\.parent@example\.com|203\.0\.113\.9/);
});

test('discards a declined partial answer when the fallback model takes over', async () => {
  scenario = 'fallback';
  const out = await events(await worker.fetch(post(ask('Tell me about THINKBIG')), env({ ANTHROPIC_BASE_URL: baseURL })));
  const types = out.map((e) => e.type);
  assert.ok(types.indexOf('reset') > types.indexOf('text'));
  assert.equal(out.at(-2).text, 'Fallback answer.');
  assert.equal(out.at(-1).type, 'done');
});

test('turns a refusal into a polite error event', async () => {
  scenario = 'refusal';
  const out = await events(await worker.fetch(post(ask('Something off-topic')), env({ ANTHROPIC_BASE_URL: baseURL })));
  assert.equal(out.at(-1).type, 'error');
  assert.equal(out.at(-1).code, 'refusal');
});

test('maps provider overload to a retryable busy error', async () => {
  scenario = 'overloaded';
  const out = await events(await worker.fetch(post(ask('Hi')), env({ ANTHROPIC_BASE_URL: baseURL })));
  assert.deepEqual(out.at(-1).code, 'busy');
});
