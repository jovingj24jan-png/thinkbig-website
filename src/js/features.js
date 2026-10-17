// Feature explorer: shows one feature's details at a time inside the Features section.
// Menu links, search results and shared URLs open a feature through the 'feature:show' event.
export function initFeatures() {
  const explorer = document.querySelector('[data-feature-explorer]');
  if (!explorer) return;

  const items = [...explorer.querySelectorAll('[data-fx-target]')];
  const panels = [...explorer.querySelectorAll('[data-feature-panel]')];
  const groups = [...explorer.querySelectorAll('[data-fx-group]')];
  const tabs = [...explorer.querySelectorAll('[data-fx-group-tab]')];

  const activate = (id, { focusItem = false } = {}) => {
    const panel = panels.find((p) => p.id === id);
    if (!panel) return;
    const group = panel.dataset.group;

    panels.forEach((p) => {
      const on = p === panel;
      if (on && p.hidden) {
        p.hidden = false;
        p.classList.remove('is-entering');
        void p.offsetWidth; // restart the entrance animation
        p.classList.add('is-entering');
      } else if (!on) {
        p.hidden = true;
      }
    });

    items.forEach((item) => {
      const on = item.dataset.fxTarget === id;
      if (on) item.setAttribute('aria-current', 'true');
      else item.removeAttribute('aria-current');
      if (on && focusItem) item.focus({ preventScroll: true });
    });
    groups.forEach((g) => g.classList.toggle('is-active', g.dataset.fxGroup === group));
    tabs.forEach((t) => t.setAttribute('aria-pressed', String(t.dataset.fxGroupTab === group)));
  };

  items.forEach((item) => item.addEventListener('click', () => activate(item.dataset.fxTarget)));

  tabs.forEach((tab) => {
    tab.addEventListener('click', () => {
      const first = items.find((i) => i.closest('[data-fx-group]').dataset.fxGroup === tab.dataset.fxGroupTab);
      if (first) activate(first.dataset.fxTarget);
    });
  });

  explorer.addEventListener('click', (e) => {
    const next = e.target.closest('[data-fx-next]');
    if (next) activate(next.dataset.fxNext, { focusItem: true });
  });

  // Arrow keys move through the feature list
  explorer.querySelector('.fx__nav').addEventListener('keydown', (e) => {
    const index = items.indexOf(document.activeElement);
    if (index === -1) return;
    const moves = { ArrowDown: index + 1, ArrowUp: index - 1, Home: 0, End: items.length - 1 };
    if (!(e.key in moves)) return;
    e.preventDefault();
    const target = items[(moves[e.key] + items.length) % items.length];
    target.focus();
    activate(target.dataset.fxTarget);
  });

  document.addEventListener('feature:show', (e) => activate(e.detail));

  const initial = panels.find((p) => !p.hidden) ?? panels[0];
  if (initial) activate(initial.id);
}
