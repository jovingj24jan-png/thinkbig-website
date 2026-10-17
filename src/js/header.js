import { goTo } from './utils.js';

const finePointer = window.matchMedia('(hover: hover) and (pointer: fine)');

function initDropdowns() {
  const items = [...document.querySelectorAll('[data-menu-item]')];

  const close = (item, { returnFocus = false } = {}) => {
    const trigger = item.querySelector('[data-menu-trigger]');
    item.classList.remove('is-open');
    trigger.setAttribute('aria-expanded', 'false');
    if (returnFocus) trigger.focus();
  };

  const open = (item) => {
    items.forEach((other) => other !== item && close(other));
    item.classList.add('is-open');
    item.querySelector('[data-menu-trigger]').setAttribute('aria-expanded', 'true');
  };

  const links = (item) => [...item.querySelectorAll('[data-menu] a')];

  items.forEach((item) => {
    const trigger = item.querySelector('[data-menu-trigger]');
    let hoverTimer;

    trigger.addEventListener('click', () => {
      item.classList.contains('is-open') ? close(item) : open(item);
    });

    item.addEventListener('pointerenter', (e) => {
      if (e.pointerType !== 'mouse' || !finePointer.matches) return;
      clearTimeout(hoverTimer);
      hoverTimer = setTimeout(() => open(item), 80);
    });

    item.addEventListener('pointerleave', (e) => {
      if (e.pointerType !== 'mouse' || !finePointer.matches) return;
      clearTimeout(hoverTimer);
      hoverTimer = setTimeout(() => close(item), 180);
    });

    item.addEventListener('keydown', (e) => {
      const list = links(item);
      const index = list.indexOf(document.activeElement);

      if (e.key === 'Escape' && item.classList.contains('is-open')) {
        e.preventDefault();
        close(item, { returnFocus: true });
      } else if (e.key === 'ArrowDown') {
        e.preventDefault();
        if (!item.classList.contains('is-open')) open(item);
        list[Math.min(index + 1, list.length - 1)]?.focus();
      } else if (e.key === 'ArrowUp' && index > -1) {
        e.preventDefault();
        index === 0 ? trigger.focus() : list[index - 1].focus();
      }
    });

    item.addEventListener('focusout', (e) => {
      if (!item.contains(e.relatedTarget)) close(item);
    });

    links(item).forEach((link) => link.addEventListener('click', () => close(item)));
  });

  document.addEventListener('click', (e) => {
    items.forEach((item) => !item.contains(e.target) && close(item));
  });
}

function initDrawer() {
  const drawer = document.querySelector('[data-mobile-menu]');
  const openBtn = document.querySelector('[data-mobile-open]');
  if (!drawer || !openBtn) return;

  const setExpanded = (value) => openBtn.setAttribute('aria-expanded', String(value));

  openBtn.addEventListener('click', () => {
    drawer.showModal();
    setExpanded(true);
  });

  drawer.querySelector('[data-mobile-close]').addEventListener('click', () => drawer.close());
  drawer.addEventListener('close', () => setExpanded(false));

  // Clicking the backdrop (the dialog element itself, outside its content) closes it
  drawer.addEventListener('click', (e) => {
    if (e.target === drawer) drawer.close();
  });

  drawer.querySelectorAll('[data-drawer-link]').forEach((link) => {
    link.addEventListener('click', (e) => {
      const hash = link.getAttribute('href');
      if (!hash?.startsWith('#')) return;
      e.preventDefault();
      drawer.close();
      // Wait a frame so the dialog's focus restoration doesn't fight our scroll
      requestAnimationFrame(() => goTo(hash, { focus: !link.hasAttribute('data-demo-link') }));
    });
  });

  window.matchMedia('(min-width: 1024px)').addEventListener('change', (e) => {
    if (e.matches && drawer.open) drawer.close();
  });
}

function initScrollState() {
  const header = document.querySelector('[data-header]');
  if (!header) return;
  const update = () => header.classList.toggle('is-scrolled', window.scrollY > 8);
  update();
  window.addEventListener('scroll', update, { passive: true });
}

export function initHeader() {
  initDropdowns();
  initDrawer();
  initScrollState();
}
