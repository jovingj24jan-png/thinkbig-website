import { prefersReducedMotion, splitLetters } from './utils.js';

/*
 * Page motion in the LittleBloom style: letter waves and reveals on titles, floating
 * decorations with scroll parallax, tilting cards, and a small celebration when a
 * request is sent. Everything is presentational and switches off for reduced motion.
 */

const smoothstep = (v) => (v <= 0 ? 0 : v >= 1 ? 1 : v * v * (3 - 2 * v));
const finePointer = window.matchMedia('(hover: hover) and (pointer: fine)');

// x/y in % of the section, size in px, depth = parallax strength
const DECOR = {
  included: [
    { shape: 'star', x: 6, y: 9, size: 30, depth: 0.6, motion: 'float' },
    { shape: 'cloud', x: 92, y: 7, size: 120, depth: 0.3, motion: 'drift' },
    { shape: 'sparkle', color: 'pink', x: 96, y: 52, size: 22, depth: 0.8, motion: 'twinkle' },
    { shape: 'ring', color: 'lilac', x: 3, y: 66, size: 56, depth: 0.4, motion: 'spin' },
    { shape: 'heart', color: 'pink', x: 52, y: 96, size: 20, depth: 0.7, motion: 'float' },
  ],
  apps: [
    { shape: 'cloud', x: 9, y: 22, size: 110, depth: 0.3, motion: 'drift' },
    { shape: 'star', x: 88, y: 18, size: 26, depth: 0.7, motion: 'float' },
    { shape: 'sparkle', color: 'blue', x: 14, y: 78, size: 20, depth: 0.8, motion: 'twinkle' },
    { shape: 'ring', color: 'yellow', x: 91, y: 74, size: 48, depth: 0.5, motion: 'spin' },
  ],
  final: [
    { shape: 'sparkle', color: 'yellow', x: 7, y: 14, size: 24, depth: 0.8, motion: 'twinkle' },
    { shape: 'star', x: 93, y: 11, size: 30, depth: 0.6, motion: 'float' },
    { shape: 'ring', color: 'pink', x: 95, y: 62, size: 60, depth: 0.4, motion: 'spin' },
    { shape: 'heart', color: 'mint', x: 5, y: 82, size: 22, depth: 0.6, motion: 'float' },
  ],
};

const SHAPES = {
  star: '<svg viewBox="0 0 40 40"><use href="#art-star" /></svg>',
  cloud: '<svg viewBox="0 0 160 96"><use href="#art-cloud" /></svg>',
  sparkle: '<svg class="icon" viewBox="0 0 24 24"><use href="#i-sparkle" /></svg>',
  heart: '<svg class="icon" viewBox="0 0 24 24"><use href="#i-heart" /></svg>',
  ring: '',
};

function initDecor() {
  document.querySelectorAll('[data-deco]').forEach((section) => {
    const items = DECOR[section.dataset.deco];
    if (!items) return;
    const layer = document.createElement('div');
    layer.className = 'deco';
    layer.setAttribute('aria-hidden', 'true');
    layer.innerHTML = items.map((d, i) => `
      <span class="deco__item deco__item--${d.motion} deco-shape--${d.shape} ${d.color ? `deco--${d.color}` : ''}"
        style="left:${d.x}%;top:${d.y}%;--size:${d.size}px;--depth:${d.depth};--d:${i}">${SHAPES[d.shape]}</span>`).join('');
    section.prepend(layer);
  });
}

// Loops only run while their section is on screen; decorations drift with scroll.
function initInView() {
  const sections = [...document.querySelectorAll('main > section, .site-footer')];
  const visible = new Set();
  let frame = null;

  const onScroll = () => {
    frame = null;
    visible.forEach((section) => {
      const rect = section.getBoundingClientRect();
      section.style.setProperty('--parallax', ((rect.top + rect.height / 2 - innerHeight / 2) / innerHeight).toFixed(3));
    });
  };
  const schedule = () => { if (frame === null) frame = requestAnimationFrame(onScroll); };

  const observer = new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
      entry.target.classList.toggle('in-view', entry.isIntersecting);
      if (entry.isIntersecting) visible.add(entry.target);
      else visible.delete(entry.target);
    });
    schedule();
  }, { rootMargin: '10% 0px' });
  sections.forEach((s) => observer.observe(s));
  window.addEventListener('scroll', schedule, { passive: true });
  window.addEventListener('resize', schedule);
}

// Splits a heading into letters while keeping one readable copy for screen readers.
function splitHeading(heading) {
  const label = heading.textContent.replace(/\s+/g, ' ').trim();
  const visual = document.createElement('span');
  visual.className = 'title-chars';
  visual.setAttribute('aria-hidden', 'true');
  [...heading.childNodes].forEach((n) => visual.appendChild(n));
  const copy = document.createElement('span');
  copy.className = 'visually-hidden';
  copy.textContent = label;
  heading.append(copy, visual);
  return splitLetters(visual);
}

// Letters near the pointer lift and grow.
function letterProximity(container, chars) {
  if (!finePointer.matches) return;
  const items = chars.map((el) => ({ el, x: 0, y: 0, current: 0, goal: 0 }));
  let measured = false;
  let size = 40;
  let frame = null;

  const measure = () => {
    size = parseFloat(getComputedStyle(container).fontSize) || 40;
    items.forEach((c) => {
      const r = c.el.getBoundingClientRect();
      c.x = r.left + r.width / 2;
      c.y = r.top + r.height / 2;
    });
    measured = true;
  };

  const render = () => {
    let moving = false;
    items.forEach((c) => {
      if (c.current === c.goal) return;
      c.current += (c.goal - c.current) * 0.2;
      if (Math.abs(c.goal - c.current) < 0.003) c.current = c.goal;
      else moving = true;
      c.el.style.translate = c.current ? `0 ${(-0.14 * c.current).toFixed(3)}em` : '';
      c.el.style.scale = c.current ? (1 + 0.12 * c.current).toFixed(3) : '';
    });
    frame = moving ? requestAnimationFrame(render) : null;
  };

  const setGoals = (x, y) => {
    items.forEach((c) => {
      if (x === null) c.goal = 0;
      else c.goal = smoothstep((1 - Math.hypot((x - c.x) / (size * 1.6), (y - c.y) / (size * 1.1))) * 1.5);
    });
    if (frame === null) frame = requestAnimationFrame(render);
  };

  container.addEventListener('pointerenter', () => { measured = false; });
  container.addEventListener('pointermove', (e) => {
    if (e.pointerType !== 'mouse') return;
    if (!measured) measure();
    setGoals(e.clientX, e.clientY);
  });
  container.addEventListener('pointerleave', () => setGoals(null, null));
  window.addEventListener('scroll', () => { measured = false; }, { passive: true });
}

function initTitles() {
  // Hero headline: a lift wave runs through the letters, like the home page
  document.querySelectorAll('[data-wave]').forEach((title) => {
    const chars = splitHeading(title);
    let delay = 0.9;
    chars.forEach((c) => {
      c.style.animationDelay = `${delay.toFixed(2)}s`;
      delay += 0.045;
    });
    requestAnimationFrame(() => title.classList.add('is-live'));
    letterProximity(title, chars);
  });

  // Section titles: letters rise in when the title scrolls into view
  const observer = new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
      if (!entry.isIntersecting) return;
      entry.target.classList.add('is-in');
      observer.unobserve(entry.target);
    });
  }, { threshold: 0.4 });

  document.querySelectorAll('[data-split]').forEach((title) => {
    const chars = splitHeading(title);
    chars.forEach((c, i) => c.style.setProperty('--c', i));
    observer.observe(title);
    letterProximity(title, chars);
  });
}

// Cards tilt toward the pointer with a soft spotlight underneath it.
function initTilt() {
  if (!finePointer.matches) return;
  const TILT = 6;
  document.querySelectorAll('[data-tilt], .store-card').forEach((card) => {
    card.classList.add('tiltable');
    card.addEventListener('pointermove', (e) => {
      if (e.pointerType !== 'mouse') return;
      const r = card.getBoundingClientRect();
      const px = (e.clientX - r.left) / r.width;
      const py = (e.clientY - r.top) / r.height;
      card.classList.add('is-tilting');
      card.style.setProperty('--rx', `${((0.5 - py) * TILT).toFixed(2)}deg`);
      card.style.setProperty('--ry', `${((px - 0.5) * TILT * 1.3).toFixed(2)}deg`);
      card.style.setProperty('--mx', `${(px * 100).toFixed(1)}%`);
      card.style.setProperty('--my', `${(py * 100).toFixed(1)}%`);
    });
    card.addEventListener('pointerleave', () => {
      card.classList.remove('is-tilting');
      card.style.setProperty('--rx', '0deg');
      card.style.setProperty('--ry', '0deg');
    });
  });
}

// A short burst of confetti when a request panel appears.
function initCelebrate() {
  const COLORS = ['#f46b9b', '#ffd966', '#a7d8f0', '#b8e6c1', '#d5c5f2', '#ffbe98'];
  document.querySelectorAll('[data-pf-success]').forEach((panel) => {
    new MutationObserver(() => {
      if (panel.hidden) return;
      panel.querySelector('.confetti')?.remove();
      const burst = document.createElement('span');
      burst.className = 'confetti';
      burst.setAttribute('aria-hidden', 'true');
      burst.innerHTML = Array.from({ length: 22 }, (_, i) => {
        const angle = (i / 22) * Math.PI * 2;
        const dist = 90 + Math.random() * 90;
        return `<i style="--x:${(Math.cos(angle) * dist).toFixed(0)}px;--y:${(Math.sin(angle) * dist * 0.75 - 30).toFixed(0)}px;--r:${Math.round(Math.random() * 540 - 270)}deg;--c:${COLORS[i % COLORS.length]};--delay:${(Math.random() * 120).toFixed(0)}ms"></i>`;
      }).join('');
      panel.prepend(burst);
      setTimeout(() => burst.remove(), 1800);
    }).observe(panel, { attributes: true, attributeFilter: ['hidden'] });
  });
}

export function initPageMotion() {
  initDecor();
  if (prefersReducedMotion()) {
    document.querySelectorAll('[data-split], [data-wave]').forEach((t) => t.classList.add('is-in'));
    return;
  }
  document.documentElement.classList.add('motion');
  initInView();
  initTitles();
  initTilt();
  initCelebrate();
}
