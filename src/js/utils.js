export const prefersReducedMotion = () => window.matchMedia('(prefers-reduced-motion: reduce)').matches;

let toastTimer;

export function showToast(message) {
  const toast = document.querySelector('[data-toast]');
  if (!toast) return;
  toast.textContent = message;
  toast.classList.add('is-visible');
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => toast.classList.remove('is-visible'), 3600);
}

// Scrolls to an in-page target and moves keyboard focus there, so screen reader
// and keyboard users land where sighted users do. FAQ panels are opened first.
export function goTo(hash, { focus = true } = {}) {
  let target = hash && hash.length > 1 ? document.getElementById(decodeURIComponent(hash.slice(1))) : null;
  if (!target) return false;

  // Feature details live inside the explorer: open the requested one, then scroll to it
  if (target.matches('[data-feature-panel]')) {
    document.dispatchEvent(new CustomEvent('feature:show', { detail: target.id }));
    target = target.closest('[data-feature-explorer]') ?? target;
  }

  // Home feature categories live in an accordion: open the requested one first
  if (target.matches('[data-cat]')) {
    document.dispatchEvent(new CustomEvent('category:show', { detail: target.dataset.cat }));
  }

  if (target.matches('.acc-panel')) {
    const trigger = document.querySelector(`[aria-controls="${target.id}"]`);
    if (trigger?.getAttribute('aria-expanded') === 'false') trigger.click();
    target = trigger ?? target;
  }

  target.scrollIntoView({ behavior: prefersReducedMotion() ? 'auto' : 'smooth', block: 'start' });
  if (location.hash !== hash) history.pushState(null, '', hash);

  if (focus) {
    if (!target.matches('a, button, input, select, textarea, [tabindex]')) {
      target.setAttribute('tabindex', '-1');
    }
    target.focus({ preventScroll: true });
  }
  return true;
}

export function escapeHtml(text) {
  return text.replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]);
}

// Wraps each letter of `root` in a span, keeping words unbroken and skipping icons.
export function splitLetters(root) {
  const chars = [];
  const walk = (node) => {
    [...node.childNodes].forEach((child) => {
      if (child.nodeType === Node.TEXT_NODE) {
        const fragment = document.createDocumentFragment();
        child.textContent.split(/(\s+)/).forEach((chunk) => {
          if (!chunk) return;
          if (/^\s+$/.test(chunk)) {
            fragment.append(' ');
            return;
          }
          const word = document.createElement('span');
          word.className = 'word';
          [...chunk].forEach((ch) => {
            const span = document.createElement('span');
            span.className = 'char';
            span.textContent = ch;
            word.appendChild(span);
            chars.push(span);
          });
          fragment.appendChild(word);
        });
        child.replaceWith(fragment);
      } else if (child.nodeType === Node.ELEMENT_NODE && child.namespaceURI !== 'http://www.w3.org/2000/svg') {
        walk(child);
      }
    });
  };
  walk(root);
  return chars;
}
