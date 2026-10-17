import { prefersReducedMotion } from './utils.js';

/*
 * Typing demonstration for the Smart Assistant mockup. Purely visual: it cycles
 * through example prompts and never produces answers. Screen readers get the
 * prompts as a plain list (the typed text is aria-hidden), the loop pauses while
 * off-screen, and reduced motion shows a complete prompt without animating.
 */
const TYPE_MS = 55;
const ERASE_MS = 22;
const HOLD_MS = 1600;
const GAP_MS = 450;

function createTyper(root) {
  const out = root.querySelector('[data-typer-text]');
  const send = root.querySelector('[data-typer-send]');
  const prompts = [...root.querySelectorAll('[data-prompt]')].map((p) => p.textContent.trim());
  let timer = null;
  let running = false;
  let promptIndex = 0;
  let charIndex = 0;
  let phase = 'type';

  const schedule = (fn, ms) => {
    clearTimeout(timer);
    timer = setTimeout(fn, ms);
  };

  const tick = () => {
    if (!running) return;
    const text = prompts[promptIndex];
    if (phase === 'type') {
      charIndex += 1;
      out.textContent = text.slice(0, charIndex);
      if (charIndex < text.length) return schedule(tick, TYPE_MS + Math.random() * 40);
      phase = 'hold';
      send.classList.add('is-ready');
      return schedule(tick, HOLD_MS);
    }
    if (phase === 'hold') {
      send.classList.remove('is-ready');
      send.classList.add('is-sent');
      phase = 'erase';
      return schedule(tick, 380);
    }
    if (phase === 'erase') {
      send.classList.remove('is-sent');
      charIndex -= 2;
      out.textContent = text.slice(0, Math.max(0, charIndex));
      if (charIndex > 0) return schedule(tick, ERASE_MS);
      phase = 'type';
      charIndex = 0;
      promptIndex = (promptIndex + 1) % prompts.length;
      return schedule(tick, GAP_MS);
    }
  };

  return {
    start() {
      if (running || !prompts.length) return;
      if (prefersReducedMotion()) {
        out.textContent = prompts[0];
        send.classList.add('is-ready');
        return;
      }
      running = true;
      schedule(tick, GAP_MS);
    },
    stop() {
      running = false;
      clearTimeout(timer);
    },
  };
}

export function initWhatsNew() {
  const roots = [...document.querySelectorAll('[data-typer]')];
  if (!roots.length) return;

  const typers = new Map(roots.map((r) => [r, createTyper(r)]));

  // Only animate while the demo is on screen
  const observer = new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
      const typer = typers.get(entry.target);
      if (entry.isIntersecting) typer.start();
      else typer.stop();
    });
  }, { threshold: 0.25 });
  roots.forEach((r) => observer.observe(r));

  // Stop timers when leaving the page; resume if it is restored from the back/forward cache
  window.addEventListener('pagehide', () => typers.forEach((t) => t.stop()));
  window.addEventListener('pageshow', (e) => {
    if (!e.persisted) return;
    roots.forEach((r) => {
      observer.unobserve(r);
      observer.observe(r);
    });
  });
}
