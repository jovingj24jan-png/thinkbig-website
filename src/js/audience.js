import { prefersReducedMotion } from './utils.js';

// Accessible tabs for the audience pages' feature card (arrow keys, Home, End).
export function initAudienceTabs() {
  document.querySelectorAll('[data-tabs]').forEach((root) => {
    const tabs = [...root.querySelectorAll('[role="tab"]')];
    const panels = [...root.querySelectorAll('[role="tabpanel"]')];

    const select = (tab, focus = false) => {
      tabs.forEach((t) => {
        const on = t === tab;
        t.setAttribute('aria-selected', String(on));
        t.tabIndex = on ? 0 : -1;
      });
      panels.forEach((p) => {
        const on = p.id === tab.getAttribute('aria-controls');
        if (on && p.hidden) {
          p.hidden = false;
          if (!prefersReducedMotion()) {
            p.classList.remove('is-entering');
            void p.offsetWidth; // restart the entrance animation
            p.classList.add('is-entering');
          }
        } else if (!on) {
          p.hidden = true;
        }
      });
      if (focus) tab.focus();
    };

    tabs.forEach((tab, i) => {
      tab.addEventListener('click', () => select(tab));
      tab.addEventListener('keydown', (e) => {
        const moves = { ArrowRight: i + 1, ArrowLeft: i - 1, Home: 0, End: tabs.length - 1 };
        if (!(e.key in moves)) return;
        e.preventDefault();
        select(tabs[(moves[e.key] + tabs.length) % tabs.length], true);
      });
    });
  });
}
