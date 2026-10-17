import heroSrc from '../assets/hero-scl.webp';
import { prefersReducedMotion, splitLetters } from './utils.js';

/*
 * First-page animation, matching the LittleBloom landing page.
 * Animated regions of the flat hero picture: each "part" is a soft-edged window onto
 * the same image, aligned pixel-for-pixel over the original, then moved slightly.
 * Every motion also scales the part up a little so it always covers the original
 * underneath (no doubled edges). Coordinates are centre x/y and half-size rx/ry in
 * source pixels. Later parts paint above earlier ones where windows overlap.
 */
const IMAGE = { src: heroSrc, width: 1536, height: 1024 };

const PARTS = [
  { name: 'sun', x: 1412, y: 193, rx: 92, ry: 84, motion: 'sun', dur: 6 },
  { name: 'cloud', x: 695, y: 178, rx: 95, ry: 56, motion: 'drift', dur: 9 },
  { name: 'cloud-rainbow', x: 1313, y: 340, rx: 50, ry: 30, motion: 'drift', dur: 11, delay: -4 },
  { name: 'girl', x: 815, y: 458, rx: 150, ry: 232, motion: 'soar', dur: 5, core: 86 },
  { name: 'boy', x: 1352, y: 502, rx: 100, ry: 136, motion: 'hop', dur: 4.2, delay: -1.2, core: 84 },
  { name: 'teddy', x: 1380, y: 722, rx: 92, ry: 92, motion: 'breathe', dur: 4.8, delay: -2 },
  { name: 'bird', x: 862, y: 170, rx: 68, ry: 68, motion: 'fly', dur: 3.6, core: 84 },

  { name: 'star-bird', x: 942, y: 205, rx: 20, ry: 20, motion: 'twinkle', dur: 2.6 },
  { name: 'star-sun', x: 1310, y: 159, rx: 20, ry: 20, motion: 'twinkle', dur: 3.1, delay: -1 },
  { name: 'star-left', x: 645, y: 537, rx: 30, ry: 30, motion: 'twinkle', dur: 3.4, delay: -0.6 },
  { name: 'star-tiny-left', x: 693, y: 587, rx: 12, ry: 12, motion: 'twinkle', dur: 2.2, delay: -1.5 },
  { name: 'star-bottom', x: 827, y: 705, rx: 26, ry: 26, motion: 'twinkle', dur: 2.9, delay: -2.1 },
  { name: 'star-right', x: 1479, y: 553, rx: 26, ry: 26, motion: 'twinkle', dur: 3.3, delay: -0.3 },
  { name: 'star-rainbow', x: 1289, y: 410, rx: 11, ry: 11, motion: 'twinkle', dur: 2.4, delay: -1.8 },

  { name: 'bell', x: 1239, y: 237, rx: 15, ry: 15, motion: 'ring', dur: 4, origin: '50% 15%' },
  { name: 'highlight-arrow', x: 1170, y: 703, rx: 10, ry: 14, motion: 'nudge', dur: 1.8 },
];

/*
 * Pointer-proximity reaction, layered on top of the looping animations.
 * lift is % of the piece's own height, rotate in degrees. Keep scale growth
 * ((scale - 1) / 2) at least as large as lift so a part still covers its original.
 * reach: extra source pixels around each object where the pointer starts to count.
 */
const HOVER = {
  reach: 50,
  letter: { lift: 7, scale: 1.16 },
  default: { lift: 4, scale: 1.1 },
  twinkle: { scale: 1.35, rotate: 18 },
  sun: { scale: 1.1, rotate: 8 },
  fly: { lift: 3, scale: 1.12 },
  soar: { lift: 1.5, scale: 1.04 },
  hop: { lift: 1.5, scale: 1.04 },
  breathe: { lift: 1.5, scale: 1.05, rotate: 2 },
  drift: { lift: 2, scale: 1.06 },
  ring: { scale: 1.25, rotate: 14 },
  nudge: { scale: 1.3 },
};

// Headline lift wave: runs through the lines in reading order once per cycle.
const TEXT = { cycle: 7, startDelay: 0.6, lineGap: 0.12 };

const pct = (value, total) => `${(value / total) * 100}%`;
const smoothstep = (v) => (v <= 0 ? 0 : v >= 1 ? 1 : v * v * (3 - 2 * v));

// Shows the image region `box` (source pixels) inside `el`, pixel-aligned with the original.
function showRegion(el, box) {
  const { src, width, height } = IMAGE;
  Object.assign(el.style, {
    backgroundImage: `url("${src}")`,
    backgroundSize: `${(width / box.w) * 100}% ${(height / box.h) * 100}%`,
    backgroundPosition: `${(box.x / (width - box.w)) * 100}% ${(box.y / (height - box.h)) * 100}%`,
  });
}

function buildParts(layer) {
  const targets = [];
  const fragment = document.createDocumentFragment();

  PARTS.forEach((part) => {
    const coverage = (part.core ?? 72) / 100;
    const w = (part.rx / coverage) * 2;
    const h = (part.ry / coverage) * 2;
    const left = part.x - w / 2;
    const top = part.y - h / 2;

    const el = document.createElement('span');
    el.className = `part part--${part.motion}`;
    Object.assign(el.style, {
      left: pct(left, IMAGE.width),
      top: pct(top, IMAGE.height),
      width: pct(w, IMAGE.width),
      height: pct(h, IMAGE.height),
      animationDuration: `${part.dur}s`,
      animationDelay: `${part.delay ?? 0}s`,
    });
    el.style.setProperty('--core', `${coverage * 100}%`);
    if (part.origin) el.style.transformOrigin = part.origin;
    showRegion(el, { x: left, y: top, w, h });
    fragment.appendChild(el);

    const reaction = HOVER[part.motion] ?? HOVER.default;
    targets.push({ el, kind: 'part', x: part.x, y: part.y, rx: part.rx + HOVER.reach, ry: part.ry + HOVER.reach, ...reaction });
  });

  layer.appendChild(fragment);
  return targets;
}

// Splits the eyebrow and headline into letters for the lift wave, keeping a
// single readable copy of the text for assistive technology.
function buildLetters(hero) {
  const eyebrow = hero.querySelector('.hero__eyebrow');
  const title = hero.querySelector('.hero__title');
  if (!eyebrow || !title) return [];

  const readable = (el, text) => {
    const copy = document.createElement('span');
    copy.className = 'visually-hidden';
    copy.textContent = text;
    el.prepend(copy);
  };

  const eyebrowText = eyebrow.textContent.replace(/\s+/g, ' ').trim();
  const eyebrowInner = document.createElement('span');
  eyebrowInner.setAttribute('aria-hidden', 'true');
  eyebrowInner.className = 'hero__eyebrow-text';
  const marks = eyebrow.querySelector('.hero__marks');
  [...eyebrow.childNodes].filter((n) => n !== marks).forEach((n) => eyebrowInner.appendChild(n));
  eyebrow.prepend(eyebrowInner);
  readable(eyebrow, eyebrowText);

  const lines = [...title.querySelectorAll('.hero__line')];
  const titleText = lines.map((l) => l.textContent.replace(/\s+/g, ' ').trim()).join(' ');
  lines.forEach((l) => l.setAttribute('aria-hidden', 'true'));
  readable(title, titleText);

  const groups = [
    { chars: splitLetters(eyebrowInner), step: 0.03 },
    ...lines.map((line) => ({ chars: splitLetters(line), step: 0.06 })),
  ];

  let delay = TEXT.startDelay;
  const targets = [];
  groups.forEach(({ chars, step }) => {
    chars.forEach((char) => {
      char.style.animationDuration = `${TEXT.cycle}s`;
      char.style.animationDelay = `${delay.toFixed(2)}s`;
      delay += step;
      targets.push({ el: char, kind: 'letter', ...HOVER.letter });
    });
    delay += TEXT.lineGap;
  });
  return targets;
}

function initReveal(reveal, image) {
  const imageReady = image.complete && image.naturalWidth
    ? Promise.resolve()
    : new Promise((resolve) => {
        image.addEventListener('load', resolve, { once: true });
        image.addEventListener('error', resolve, { once: true });
      });
  // The hero gets is-live too, which starts the letter wave and accent loops with the picture
  const show = () => imageReady.then(() => requestAnimationFrame(() => {
    reveal.classList.add('is-revealed');
    reveal.closest('[data-hero]')?.classList.add('is-live');
  }));

  if (!('IntersectionObserver' in window)) return show();
  const observer = new IntersectionObserver((entries) => {
    if (!entries.some((e) => e.isIntersecting)) return;
    observer.disconnect();
    show();
  }, { threshold: 0.15 });
  observer.observe(reveal);
}

// The picture tilts up to 1° toward the mouse, eased.
function initTilt(hero, tilt) {
  const MAX_TILT = 1;
  const EASE = 0.08;
  const finePointer = window.matchMedia('(hover: hover) and (pointer: fine)');
  const target = { x: 0, y: 0 };
  const current = { x: 0, y: 0 };
  let frame = null;

  const render = () => {
    current.x += (target.x - current.x) * EASE;
    current.y += (target.y - current.y) * EASE;
    const settled = Math.abs(target.x - current.x) < 0.002 && Math.abs(target.y - current.y) < 0.002;
    if (settled) Object.assign(current, target);
    tilt.style.setProperty('--rx', `${current.x.toFixed(3)}deg`);
    tilt.style.setProperty('--ry', `${current.y.toFixed(3)}deg`);
    frame = settled ? null : requestAnimationFrame(render);
  };
  const schedule = () => { if (frame === null) frame = requestAnimationFrame(render); };

  hero.addEventListener('pointermove', (e) => {
    if (e.pointerType !== 'mouse' || !finePointer.matches || prefersReducedMotion()) return;
    const rect = tilt.getBoundingClientRect();
    target.y = Math.max(-1, Math.min(1, ((e.clientX - rect.left) / rect.width - 0.5) * 2)) * MAX_TILT;
    target.x = Math.max(-1, Math.min(1, ((e.clientY - rect.top) / rect.height - 0.5) * 2)) * -MAX_TILT;
    schedule();
  });
  hero.addEventListener('pointerleave', () => {
    target.x = 0;
    target.y = 0;
    schedule();
  });
}

/*
 * Pointer proximity: pieces near the pointer lift, grow and turn. Uses the individual
 * translate/scale/rotate properties, which compose with the looping keyframe
 * `transform` instead of replacing it. Touch gets a short press-and-hold version.
 */
function initProximity(hero, layer, targets) {
  const HOVER_EASE = 0.18;
  const TOUCH_HOLD_MS = 700;
  const pointer = { x: null, y: null };
  let frame = null;
  let touchTimer = null;
  let measured = false;

  targets.forEach((t) => { t.current = 0; t.goal = 0; });

  const measureLetters = () => {
    targets.forEach((t) => {
      if (t.kind !== 'letter') return;
      const r = t.el.getBoundingClientRect();
      t.cx = r.left + r.width / 2;
      t.cy = r.top + r.height / 2;
      t.size = r.height || 40;
    });
    measured = true;
  };

  const apply = (t) => {
    const f = t.current;
    t.el.style.translate = f && t.lift ? `0 ${(-t.lift * f).toFixed(3)}%` : '';
    t.el.style.scale = f && t.scale ? (1 + (t.scale - 1) * f).toFixed(4) : '';
    t.el.style.rotate = f && t.rotate ? `${(t.rotate * f).toFixed(2)}deg` : '';
  };

  const render = () => {
    let moving = false;
    targets.forEach((t) => {
      if (t.current === t.goal) return;
      t.current += (t.goal - t.current) * HOVER_EASE;
      if (Math.abs(t.goal - t.current) < 0.002) t.current = t.goal;
      else moving = true;
      apply(t);
    });
    frame = moving ? requestAnimationFrame(render) : null;
  };

  const update = () => {
    const rect = layer.getBoundingClientRect();
    const ix = pointer.x === null ? null : ((pointer.x - rect.left) / rect.width) * IMAGE.width;
    const iy = pointer.y === null ? null : ((pointer.y - rect.top) / rect.height) * IMAGE.height;
    if (pointer.x !== null && !measured) measureLetters();

    targets.forEach((t) => {
      if (pointer.x === null) {
        t.goal = 0;
      } else if (t.kind === 'letter') {
        const d = Math.hypot((pointer.x - t.cx) / (t.size * 1.3), (pointer.y - t.cy) / (t.size * 0.95));
        t.goal = smoothstep((1 - d) * 1.6);
      } else {
        const d = Math.hypot((ix - t.x) / t.rx, (iy - t.y) / t.ry);
        t.goal = smoothstep((1 - d) * 1.6);
      }
    });
    if (frame === null) frame = requestAnimationFrame(render);
  };

  const setPointer = (x, y) => {
    pointer.x = x;
    pointer.y = y;
    update();
  };

  hero.addEventListener('pointerenter', () => { measured = false; });
  hero.addEventListener('pointermove', (e) => {
    if (e.pointerType !== 'mouse' || prefersReducedMotion()) return;
    setPointer(e.clientX, e.clientY);
  });
  hero.addEventListener('pointerleave', () => setPointer(null, null));
  hero.addEventListener('pointerdown', (e) => {
    if (e.pointerType === 'mouse' || prefersReducedMotion()) return;
    measured = false;
    setPointer(e.clientX, e.clientY);
    clearTimeout(touchTimer);
    touchTimer = setTimeout(() => setPointer(null, null), TOUCH_HOLD_MS);
  });
  window.addEventListener('scroll', () => { measured = false; }, { passive: true });
  window.addEventListener('resize', () => { measured = false; });
}

export function initHeroScene() {
  const hero = document.querySelector('[data-hero]');
  const reveal = hero?.querySelector('[data-hero-reveal]');
  const tilt = hero?.querySelector('[data-hero-tilt]');
  const layer = hero?.querySelector('[data-hero-parts]');
  const image = reveal?.querySelector('img');
  if (!hero || !reveal || !tilt || !layer || !image) return;

  const targets = [...buildParts(layer), ...buildLetters(hero)];
  initReveal(reveal, image);
  initTilt(hero, tilt);
  initProximity(hero, layer, targets);
}
