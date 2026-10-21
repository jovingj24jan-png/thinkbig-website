import { CHAT_API_URL } from '../../config.js';
import { prefersReducedMotion } from '../utils.js';
import { findSample } from './samples.js';

/*
 * Where chat answers come from. The interface (index.js) only talks to a provider:
 *
 *   provider.mode        'sample' | 'live'
 *   provider.ask({ messages, signal })  → async iterable of events:
 *     { type: 'sources', items: [{ title, url }] }
 *     { type: 'text', text }          (appended to the answer as it streams)
 *     { type: 'reset' }               (discard the text so far)
 *     { type: 'done' }
 *   Failures are thrown as ChatError (code + friendly message); aborting the signal stops the answer.
 *
 * Today the website uses the sample provider: pre-written answers, clearly labelled in the UI.
 * Real AI is a future step: set CHAT_API_URL in src/config.js to an API that streams the events
 * above as server-sent events (`data: {json}` lines), and the live provider is used instead.
 * No API keys ever belong in this frontend code.
 */

export class ChatError extends Error {
  constructor(code, message) {
    super(message);
    this.code = code;
  }
}

const wait = (ms, signal) =>
  new Promise((resolve, reject) => {
    const t = setTimeout(resolve, ms);
    signal?.addEventListener('abort', () => {
      clearTimeout(t);
      reject(new DOMException('Aborted', 'AbortError'));
    }, { once: true });
  });

// For testing the error and retry states: ?chat-demo=error makes the next sample answer fail once
let failNext = new URLSearchParams(location.search).get('chat-demo') === 'error';

const sampleProvider = {
  mode: 'sample',
  async *ask({ messages, signal }) {
    const question = messages.at(-1).content;
    await wait(prefersReducedMotion() ? 300 : 900, signal);
    if (failNext) {
      failNext = false;
      throw new ChatError('busy', 'The assistant is busy right now. Please try again in a moment.');
    }
    const sample = findSample(question);
    yield { type: 'sources', items: sample.sources };
    if (prefersReducedMotion()) {
      yield { type: 'text', text: sample.answer };
    } else {
      // Reveal the sample a few words at a time, like a streamed reply
      const parts = sample.answer.match(/\S+\s*/g) ?? [];
      for (let i = 0; i < parts.length; i += 3) {
        await wait(28, signal);
        yield { type: 'text', text: parts.slice(i, i + 3).join('') };
      }
    }
    yield { type: 'done' };
  },
};

const liveProvider = {
  mode: 'live',
  async *ask({ messages, signal }) {
    let res;
    try {
      res = await fetch(CHAT_API_URL, {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ messages }),
        signal,
      });
    } catch (err) {
      if (err.name === 'AbortError') throw err;
      throw new ChatError('network', 'The assistant could not be reached. Check your connection and try again.');
    }
    if (!res.ok || !res.body) {
      const data = await res.json().catch(() => null);
      throw new ChatError(data?.error?.code ?? 'unavailable', data?.error?.message ?? 'The assistant could not be reached.');
    }
    const reader = res.body.pipeThrough(new TextDecoderStream()).getReader();
    let buffer = '';
    for (;;) {
      const { value, done } = await reader.read();
      if (done) break;
      buffer += value;
      const parts = buffer.split('\n\n');
      buffer = parts.pop();
      for (const part of parts) {
        if (!part.startsWith('data: ')) continue;
        const event = JSON.parse(part.slice(6));
        if (event.type === 'error') throw new ChatError(event.code, event.message);
        yield event;
      }
    }
  },
};

export const chatProvider = CHAT_API_URL ? liveProvider : sampleProvider;
