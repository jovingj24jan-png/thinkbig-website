import { CHAT_API_URL } from '../config.js';
import { prefersReducedMotion } from './utils.js';

/*
 * THINKBIG AI: a floating website assistant. Answers come from the chat API
 * (chat-api/), which grounds a Claude model in the website's own content.
 * The conversation lives in sessionStorage, so it follows the visitor across
 * pages in this tab only and disappears when the tab closes or "New chat" is used.
 */

const GREETING = "Hi! 👋 I'm the THINKBIG assistant. I can help you explore our preschool and Montessori management platform, find features, and learn how to get started. What would you like to know?";
const SUGGESTIONS = [
  'What is THINKBIG?',
  'How does THINKBIG help preschools?',
  'What Montessori features are available?',
  'How does attendance tracking work?',
  'Can parents receive daily updates?',
  'How does billing and fee management work?',
  'Can THINKBIG manage multiple school locations?',
  'How can I book a demo?',
];
const STORE_KEY = 'thinkbig-chat';
const NUDGE_KEY = 'thinkbig-chat-nudged';
const MAX_HISTORY = 19; // the API accepts up to 20 messages; the new question is the 20th
const MAX_INPUT = 1500;

const BASE = import.meta.env.BASE_URL;
const configured = Boolean(CHAT_API_URL);

const escapeHtml = (s) => s.replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]);

// Only links to this website's own pages are rendered as links
function safeHref(href) {
  if (/^#[\w-]+$/.test(href)) return href;
  const m = href.match(/^(?:\.\/|\/)?([a-z-]+\.html)(#[\w-]+)?$/);
  return m ? `${BASE}${m[1]}${m[2] ?? ''}` : null;
}

function inline(text) {
  return escapeHtml(text)
    .replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>')
    .replace(/\[([^\]]+)\]\(([^)\s]+)\)/g, (all, label, href) => {
      const url = safeHref(href.replace(/&amp;/g, '&'));
      return url ? `<a href="${url}">${label}</a>` : label;
    });
}

// A small Markdown subset: paragraphs, bullet lists, bold and site links
function renderMarkdown(text) {
  const blocks = [];
  let list = null;
  text.split('\n').forEach((line) => {
    const item = line.match(/^\s*(?:[-*•]|\d+\.)\s+(.*)/);
    if (item) {
      list ??= [];
      list.push(`<li>${inline(item[1])}</li>`);
      return;
    }
    if (list) { blocks.push(`<ul>${list.join('')}</ul>`); list = null; }
    if (line.trim()) blocks.push(`<p>${inline(line.trim())}</p>`);
  });
  if (list) blocks.push(`<ul>${list.join('')}</ul>`);
  return blocks.join('');
}

function load() {
  try { return JSON.parse(sessionStorage.getItem(STORE_KEY)) ?? []; } catch { return []; }
}

function save(history) {
  try { sessionStorage.setItem(STORE_KEY, JSON.stringify(history)); } catch { /* storage unavailable */ }
}

const icon = (id, cls = 'icon') => `<svg class="${cls}" aria-hidden="true"><use href="#${id}" /></svg>`;

function markup() {
  const root = document.createElement('div');
  root.className = 'tb-chat';
  root.innerHTML = `
    <div class="tb-chat__nudge" data-chat-nudge hidden>
      <button class="tb-chat__nudge-text" type="button" data-chat-open>Questions about THINKBIG? <strong>Ask our AI assistant</strong></button>
      <button class="tb-chat__nudge-close" type="button" aria-label="Dismiss" data-chat-dismiss>${icon('i-close')}</button>
    </div>
    <button class="tb-chat__launcher" type="button" aria-label="Chat with THINKBIG AI" aria-expanded="false" aria-controls="tb-chat-panel" data-chat-launcher>
      <span class="tb-chat__launcher-icon tb-chat__launcher-icon--chat">${icon('i-chat')}<span class="tb-chat__spark">${icon('i-sparkle')}</span></span>
      <span class="tb-chat__launcher-icon tb-chat__launcher-icon--close">${icon('i-close')}</span>
    </button>
    <section class="tb-chat__panel" id="tb-chat-panel" role="dialog" aria-labelledby="tb-chat-title" aria-describedby="tb-chat-note" hidden data-chat-panel>
      <header class="tb-chat__head">
        <span class="tb-chat__avatar" aria-hidden="true"><svg><use href="#logo-mark" /></svg></span>
        <div class="tb-chat__titles">
          <h2 class="tb-chat__title" id="tb-chat-title">THINKBIG AI</h2>
          <p class="tb-chat__status"><span class="tb-chat__dot${configured ? '' : ' is-off'}"></span>${configured ? 'Answers from the THINKBIG website' : 'Not connected yet'}</p>
        </div>
        <button class="tb-chat__icon-btn" type="button" aria-label="Start a new chat" title="New chat" data-chat-new>${icon('i-plus')}</button>
        <button class="tb-chat__icon-btn" type="button" aria-label="Close chat" title="Close" data-chat-close>${icon('i-close')}</button>
      </header>
      <p class="tb-chat__note" id="tb-chat-note">You're chatting with AI, which can make mistakes. Please don't share personal or children's details. Need a person? <a href="${BASE}index.html#demo">Talk to our team</a>.</p>
      <div class="tb-chat__log" role="log" aria-live="polite" aria-relevant="additions" tabindex="0" aria-label="Conversation" data-chat-log></div>
      <form class="tb-chat__composer" data-chat-form>
        <label class="visually-hidden" for="tb-chat-input">Message THINKBIG AI</label>
        <textarea id="tb-chat-input" rows="1" maxlength="${MAX_INPUT}" placeholder="${configured ? 'Ask about THINKBIG…' : 'The assistant is not available yet'}" ${configured ? '' : 'disabled'} data-chat-input></textarea>
        <button class="tb-chat__send" type="submit" aria-label="Send message" disabled data-chat-send>${icon('i-arrow')}</button>
        <button class="tb-chat__stop" type="button" aria-label="Stop the answer" hidden data-chat-stop><span aria-hidden="true"></span></button>
      </form>
      <p class="visually-hidden" aria-live="assertive" data-chat-announce></p>
    </section>`;
  return root;
}

export function initChat() {
  if (document.querySelector('.tb-chat')) return;
  const root = markup();
  document.body.appendChild(root);
  document.documentElement.classList.add('has-chat');

  const $ = (sel) => root.querySelector(sel);
  const launcher = $('[data-chat-launcher]');
  const panel = $('[data-chat-panel]');
  const log = $('[data-chat-log]');
  const form = $('[data-chat-form]');
  const input = $('[data-chat-input]');
  const send = $('[data-chat-send]');
  const stop = $('[data-chat-stop]');
  const nudge = $('[data-chat-nudge]');
  const announce = $('[data-chat-announce]');
  const phone = window.matchMedia('(max-width: 599px)');

  let history = load();
  let controller = null;

  const scrollDown = () => { log.scrollTop = log.scrollHeight; };

  function bubble(role, html, extraClass = '') {
    const el = document.createElement('div');
    el.className = `tb-msg tb-msg--${role} ${extraClass}`.trim();
    el.innerHTML = `<div class="tb-msg__bubble">${html}</div>`;
    log.appendChild(el);
    scrollDown();
    return el;
  }

  function sourcesHtml(items) {
    if (!items?.length) return '';
    const links = items.map((s) => {
      const url = safeHref(s.url);
      return url ? `<a class="tb-msg__source" href="${url}">${escapeHtml(s.title)}</a>` : '';
    }).join('');
    return links ? `<div class="tb-msg__sources"><span>From our website</span>${links}</div>` : '';
  }

  function renderSuggestions() {
    log.querySelector('.tb-chat__suggest')?.remove();
    if (!configured || history.length) return;
    const wrap = document.createElement('div');
    wrap.className = 'tb-chat__suggest';
    wrap.setAttribute('role', 'group');
    wrap.setAttribute('aria-label', 'Suggested questions');
    wrap.innerHTML = SUGGESTIONS.map((q) => `<button type="button" class="tb-chip">${escapeHtml(q)}</button>`).join('');
    wrap.addEventListener('click', (e) => {
      const chip = e.target.closest('.tb-chip');
      if (chip) ask(chip.textContent);
    });
    log.appendChild(wrap);
  }

  function renderAll() {
    log.innerHTML = '';
    bubble('assistant', renderMarkdown(GREETING));
    if (!configured) {
      bubble('assistant', `<p>The THINKBIG AI assistant isn't connected yet, so I can't answer questions here today. In the meantime:</p>
        <ul><li><a href="${BASE}features.html">Explore every feature</a></li><li><a href="${BASE}pricing.html">Get pricing for your program</a></li><li><a href="${BASE}index.html#demo">Book a demo with our team</a></li></ul>`, 'tb-msg--notice');
    }
    history.forEach((m) => bubble(m.role, m.role === 'user' ? `<p>${escapeHtml(m.content)}</p>` : renderMarkdown(m.content) + sourcesHtml(m.sources)));
    renderSuggestions();
  }

  const updateSend = () => { send.disabled = !configured || !input.value.trim() || Boolean(controller); };

  const autosize = () => {
    input.style.height = 'auto';
    input.style.height = `${Math.min(input.scrollHeight, 140)}px`;
  };

  function setBusy(busy) {
    send.hidden = busy;
    stop.hidden = !busy;
    if (!busy) controller = null;
    updateSend();
  }

  // Sends at most MAX_HISTORY earlier messages, starting with a visitor message
  function payload(earlier, question) {
    let past = earlier.map(({ role, content }) => ({ role, content: content.slice(0, 6000) })).slice(-MAX_HISTORY);
    while (past.length && past[0].role !== 'user') past.shift();
    return { messages: [...past, { role: 'user', content: question }] };
  }

  async function ask(text, { retry = false } = {}) {
    const question = text.trim().slice(0, MAX_INPUT);
    if (!question || controller || !configured) return;
    log.querySelector('.tb-chat__suggest')?.remove();
    log.querySelectorAll('.tb-msg--error').forEach((el) => el.remove());

    if (!retry) {
      // A question left unanswered by an error is replaced by the new one
      if (history.at(-1)?.role === 'user') history.pop();
      history.push({ role: 'user', content: question });
      save(history);
      bubble('user', `<p>${escapeHtml(question)}</p>`);
    }
    const body = payload(history.slice(0, -1), question);
    input.value = '';
    autosize();

    const reply = bubble('assistant', '<span class="tb-typing" aria-label="THINKBIG AI is typing"><i></i><i></i><i></i></span>');
    const target = reply.querySelector('.tb-msg__bubble');
    controller = new AbortController();
    setBusy(true);
    announce.textContent = 'THINKBIG AI is answering';

    let answer = '';
    let sources = [];
    let failure = null;
    let stopped = false;

    try {
      const res = await fetch(CHAT_API_URL, {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify(body),
        signal: controller.signal,
      });
      if (!res.ok || !res.body) {
        const data = await res.json().catch(() => null);
        throw Object.assign(new Error(data?.error?.message ?? 'The assistant could not be reached.'), { code: data?.error?.code });
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
          if (event.type === 'sources') sources = event.items;
          else if (event.type === 'reset') answer = '';
          else if (event.type === 'text') answer += event.text;
          else if (event.type === 'error') failure = event;
          if (event.type === 'text' || event.type === 'reset') {
            target.innerHTML = answer ? renderMarkdown(answer) : target.innerHTML;
            scrollDown();
          }
        }
      }
    } catch (err) {
      if (err.name === 'AbortError') stopped = true;
      else failure = { code: err.code ?? 'network', message: err.code ? err.message : 'The assistant could not be reached. Check your connection and try again.' };
    }

    if (stopped && answer) answer += '\n\n(Stopped)';
    if (answer && !failure) {
      target.innerHTML = renderMarkdown(answer) + sourcesHtml(sources);
      history.push({ role: 'assistant', content: answer, sources });
      save(history);
      announce.textContent = 'THINKBIG AI answered';
    } else if (stopped) {
      reply.remove();
      history.pop();
      save(history);
      input.value = question;
      autosize();
      announce.textContent = 'Answer stopped';
    } else {
      reply.remove();
      // The question stays on screen; a retry resends it without adding it twice
      const errorEl = bubble('assistant', `<p>${escapeHtml(failure?.message ?? 'Something went wrong. Please try again.')}</p>${failure?.code === 'refusal' ? '' : '<button type="button" class="tb-retry">Try again</button>'}`, 'tb-msg--error');
      if (failure?.code === 'refusal') {
        history.pop();
        save(history);
      }
      errorEl.querySelector('.tb-retry')?.addEventListener('click', () => {
        errorEl.remove();
        ask(question, { retry: true });
      });
      announce.textContent = failure?.message ?? 'Something went wrong';
    }
    setBusy(false);
    scrollDown();
    if (!phone.matches || document.activeElement === document.body) input.focus({ preventScroll: true });
  }

  // ---------- Open / close ----------

  const fitViewport = () => {
    const vv = window.visualViewport;
    if (!vv) return;
    root.style.setProperty('--tb-vh', `${vv.height}px`);
    root.style.setProperty('--tb-vt', `${vv.offsetTop}px`);
  };

  function open() {
    if (!panel.hidden) return;
    hideNudge(true);
    panel.hidden = false;
    root.classList.add('is-open');
    launcher.setAttribute('aria-expanded', 'true');
    launcher.setAttribute('aria-label', 'Close THINKBIG AI chat');
    document.documentElement.classList.toggle('tb-chat-locked', phone.matches);
    fitViewport();
    if (!log.childElementCount) renderAll();
    // A fresh chat starts at the greeting; an ongoing one at the latest message
    if (history.length) scrollDown();
    else log.scrollTop = 0;
    (configured ? input : panel.querySelector('[data-chat-close]')).focus({ preventScroll: true });
  }

  function close() {
    if (panel.hidden) return;
    controller?.abort();
    panel.hidden = true;
    root.classList.remove('is-open');
    launcher.setAttribute('aria-expanded', 'false');
    launcher.setAttribute('aria-label', 'Chat with THINKBIG AI');
    document.documentElement.classList.remove('tb-chat-locked');
    launcher.focus({ preventScroll: true });
  }

  function hideNudge(remember) {
    nudge.hidden = true;
    if (remember) try { sessionStorage.setItem(NUDGE_KEY, '1'); } catch { /* storage unavailable */ }
  }

  launcher.addEventListener('click', () => (panel.hidden ? open() : close()));
  root.querySelector('[data-chat-close]').addEventListener('click', close);
  root.querySelector('[data-chat-open]').addEventListener('click', open);
  root.querySelector('[data-chat-dismiss]').addEventListener('click', () => hideNudge(true));
  root.querySelector('[data-chat-new]').addEventListener('click', () => {
    controller?.abort();
    history = [];
    save(history);
    try { sessionStorage.removeItem(STORE_KEY); } catch { /* storage unavailable */ }
    renderAll();
    announce.textContent = 'Started a new chat';
    if (configured) input.focus();
  });
  stop.addEventListener('click', () => controller?.abort());

  panel.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') { e.stopPropagation(); close(); }
    // On phones the panel covers the page, so focus stays inside it
    if (e.key === 'Tab' && phone.matches) {
      const items = [...panel.querySelectorAll('button:not([disabled]):not([hidden]), a[href], textarea:not([disabled]), [tabindex="0"]')];
      const first = items[0];
      const last = items.at(-1);
      if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus(); }
      else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); }
    }
  });

  input.addEventListener('input', () => { autosize(); updateSend(); });
  input.addEventListener('keydown', (e) => {
    if (e.key === 'Enter' && !e.shiftKey && !e.isComposing) {
      e.preventDefault();
      ask(input.value);
    }
  });
  form.addEventListener('submit', (e) => {
    e.preventDefault();
    ask(input.value);
  });

  window.visualViewport?.addEventListener('resize', fitViewport);
  window.visualViewport?.addEventListener('scroll', fitViewport);
  phone.addEventListener('change', () => {
    document.documentElement.classList.toggle('tb-chat-locked', phone.matches && !panel.hidden);
  });

  // A one-time, dismissible welcome prompt; skipped on small phones where it would cover content
  let nudged = false;
  try { nudged = sessionStorage.getItem(NUDGE_KEY) === '1'; } catch { nudged = true; }
  if (!nudged && !history.length && window.matchMedia('(min-width: 480px)').matches) {
    setTimeout(() => { if (panel.hidden) nudge.hidden = false; }, prefersReducedMotion() ? 2500 : 6000);
  }
}
