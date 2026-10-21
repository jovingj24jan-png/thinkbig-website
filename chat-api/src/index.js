import Anthropic from '@anthropic-ai/sdk';
import knowledge from './knowledge.json' with { type: 'json' };
import { createIndex, search } from './retrieve.js';
import { SYSTEM_PROMPT, contextBlock } from './prompt.js';

const MODEL = 'claude-opus-5-5';
// Answers are short; the cap bounds what one public request can cost (thinking included)
const MAX_TOKENS = 6000;
const TIMEOUT_MS = 45_000;
const LIMITS = { bodyBytes: 32_000, messages: 20, userChars: 1500, assistantChars: 6000, totalChars: 30_000 };
const FALLBACK_RATE = { requests: 12, windowMs: 60_000 };

const index = createIndex(knowledge.chunks);

const json = (status, body, headers = {}) =>
  new Response(JSON.stringify(body), { status, headers: { 'content-type': 'application/json', ...headers } });

const fail = (status, code, message, headers) => json(status, { error: { code, message } }, headers);

function corsHeaders(request, env) {
  const origin = request.headers.get('origin');
  const allowed = (env.ALLOWED_ORIGINS ?? '').split(',').map((o) => o.trim()).filter(Boolean);
  if (!origin || !allowed.includes(origin)) return null;
  return {
    'access-control-allow-origin': origin,
    'access-control-allow-methods': 'POST, OPTIONS',
    'access-control-allow-headers': 'content-type',
    'access-control-max-age': '86400',
    vary: 'origin',
  };
}

// Best-effort per-isolate limiter, used only when the RATE_LIMITER binding is not configured
const recent = new Map();
function localLimit(key) {
  const now = Date.now();
  const hits = (recent.get(key) ?? []).filter((t) => now - t < FALLBACK_RATE.windowMs);
  if (hits.length >= FALLBACK_RATE.requests) return false;
  hits.push(now);
  recent.set(key, hits);
  if (recent.size > 5000) recent.delete(recent.keys().next().value);
  return true;
}

async function allowed(request, env) {
  const key = request.headers.get('cf-connecting-ip') ?? 'unknown';
  if (env.RATE_LIMITER) return (await env.RATE_LIMITER.limit({ key })).success;
  return localLimit(key);
}

// Visitors are asked not to share personal details; anything that still looks like
// contact information is removed before the text leaves for the AI provider.
export function redact(text) {
  return text
    .replace(/[\w.+-]+@[\w-]+(\.[\w-]+)+/g, '[email removed]')
    .replace(/\+?\d[\d\s().-]{7,}\d/g, (m) => (m.replace(/\D/g, '').length >= 8 ? '[number removed]' : m));
}

export function validate(body) {
  const messages = body?.messages;
  if (!Array.isArray(messages) || messages.length === 0 || messages.length > LIMITS.messages) return 'Send between 1 and 20 messages.';
  let total = 0;
  for (const [i, m] of messages.entries()) {
    const role = i % 2 === 0 ? 'user' : 'assistant';
    if (m?.role !== role || typeof m.content !== 'string') return 'Messages must alternate user and assistant text, starting with the user.';
    const text = m.content.trim();
    if (!text) return 'Messages cannot be empty.';
    if (text.length > (role === 'user' ? LIMITS.userChars : LIMITS.assistantChars)) return 'A message is too long.';
    total += text.length;
  }
  if (messages.at(-1).role !== 'user') return 'The last message must come from the visitor.';
  if (total > LIMITS.totalChars) return 'The conversation is too long. Please start a new chat.';
  return null;
}

function buildRequest(messages) {
  const userTurns = messages.filter((m) => m.role === 'user').map((m) => m.content);
  // Follow-ups like "how much is it?" lean on the previous question for context
  const query = userTurns.slice(-2).join(' ');
  const chunks = search(index, query, { k: 6 });
  const history = messages.map((m) => ({ role: m.role, content: m.role === 'user' ? redact(m.content.trim()) : m.content.trim() }));
  const last = history.pop();
  history.push({ role: 'user', content: `${contextBlock(chunks)}\n\nVisitor question:\n${last.content}` });
  const sources = [];
  for (const c of chunks) {
    if (c.pinned || c.page === 'Footer' || sources.some((s) => s.url === c.url)) continue;
    sources.push({ title: `${c.heading} · ${c.page}`, url: c.url });
    if (sources.length === 3) break;
  }
  return { history, sources };
}

function errorFor(err) {
  if (err instanceof Anthropic.APIConnectionTimeoutError) return ['timeout', 'The assistant took too long to answer. Please try again.'];
  if (err instanceof Anthropic.RateLimitError) return ['busy', 'The assistant is busy right now. Please try again in a moment.'];
  if (err instanceof Anthropic.AuthenticationError || err instanceof Anthropic.PermissionDeniedError) return ['unavailable', 'The assistant is not available right now.'];
  if (err instanceof Anthropic.BadRequestError) return ['unavailable', 'The assistant could not answer that request.'];
  if (err instanceof Anthropic.APIError && (err.status ?? 0) >= 500) return ['busy', 'The assistant is busy right now. Please try again in a moment.'];
  if (err instanceof Anthropic.APIConnectionError) return ['unavailable', 'The assistant could not be reached. Please try again.'];
  return ['unavailable', 'Something went wrong. Please try again.'];
}

function streamAnswer({ env, history, sources, cors, signal }) {
  const encoder = new TextEncoder();
  const { readable, writable } = new TransformStream();
  const writer = writable.getWriter();
  const abort = new AbortController();
  signal?.addEventListener('abort', () => abort.abort());

  const send = async (event) => {
    try {
      await writer.write(encoder.encode(`data: ${JSON.stringify(event)}\n\n`));
    } catch {
      abort.abort(); // the visitor closed the chat or stopped the answer
    }
  };

  const run = async () => {
    const started = Date.now();
    const client = new Anthropic({
      apiKey: env.ANTHROPIC_API_KEY,
      baseURL: env.ANTHROPIC_BASE_URL || undefined,
      timeout: TIMEOUT_MS,
      maxRetries: 1,
    });
    try {
      await send({ type: 'sources', items: sources });
      const stream = client.beta.messages.stream(
        {
          model: MODEL,
          max_tokens: MAX_TOKENS,
          output_config: { effort: 'low' },
          betas: ['server-side-fallback-2026-07-01'],
          fallbacks: 'default',
          system: [{ type: 'text', text: SYSTEM_PROMPT, cache_control: { type: 'ephemeral' } }],
          messages: history,
        },
        { signal: abort.signal },
      );
      for await (const event of stream) {
        if (event.type === 'content_block_start' && event.content_block.type === 'fallback') {
          // A declined partial answer is discarded; the fallback model's answer replaces it
          await send({ type: 'reset' });
        } else if (event.type === 'content_block_delta' && event.delta.type === 'text_delta') {
          await send({ type: 'text', text: event.delta.text });
        }
      }
      const final = await stream.finalMessage();
      if (final.stop_reason === 'refusal') {
        await send({ type: 'error', code: 'refusal', message: "I can't help with that here. Please ask about THINKBIG, or contact the team." });
      } else {
        await send({ type: 'done', stop: final.stop_reason });
      }
      console.log(JSON.stringify({
        event: 'chat', ok: true, ms: Date.now() - started, stop: final.stop_reason,
        input: final.usage.input_tokens, output: final.usage.output_tokens, cacheRead: final.usage.cache_read_input_tokens,
      }));
    } catch (err) {
      if (abort.signal.aborted) {
        console.log(JSON.stringify({ event: 'chat', ok: false, reason: 'aborted', ms: Date.now() - started }));
      } else {
        const [code, message] = errorFor(err);
        console.error(JSON.stringify({ event: 'chat', ok: false, code, status: err?.status ?? null, type: err?.constructor?.name, ms: Date.now() - started }));
        await send({ type: 'error', code, message });
      }
    } finally {
      try { await writer.close(); } catch { /* already closed by the visitor */ }
    }
  };

  return {
    response: new Response(readable, {
      headers: { 'content-type': 'text/event-stream; charset=utf-8', 'cache-control': 'no-store', ...cors },
    }),
    done: run(),
  };
}

export default {
  async fetch(request, env, ctx) {
    const url = new URL(request.url);
    const cors = corsHeaders(request, env);

    if (url.pathname === '/health' && request.method === 'GET') {
      return json(200, { ok: true, configured: Boolean(env.ANTHROPIC_API_KEY), chunks: knowledge.chunks.length, knowledge: knowledge.generated });
    }
    if (url.pathname !== '/chat') return fail(404, 'not_found', 'Not found.');
    if (!cors) return fail(403, 'origin', 'This origin is not allowed.');
    if (request.method === 'OPTIONS') return new Response(null, { status: 204, headers: cors });
    if (request.method !== 'POST') return fail(405, 'method', 'Use POST.', cors);
    if (!env.ANTHROPIC_API_KEY) return fail(503, 'unavailable', 'The assistant is not configured yet.', cors);

    const declared = Number(request.headers.get('content-length') ?? 0);
    if (declared > LIMITS.bodyBytes) return fail(413, 'too_large', 'The request is too large.', cors);
    const raw = await request.text();
    if (raw.length > LIMITS.bodyBytes) return fail(413, 'too_large', 'The request is too large.', cors);

    let body;
    try { body = JSON.parse(raw); } catch { return fail(400, 'invalid', 'Send JSON.', cors); }
    const problem = validate(body);
    if (problem) return fail(400, 'invalid', problem, cors);

    if (!(await allowed(request, env))) {
      return fail(429, 'rate_limited', 'You are sending messages quickly. Please wait a minute and try again.', { ...cors, 'retry-after': '60' });
    }

    const { history, sources } = buildRequest(body.messages);
    const { response, done } = streamAnswer({ env, history, sources, cors, signal: request.signal });
    ctx?.waitUntil?.(done);
    return response;
  },
};
