import { prefersReducedMotion } from './utils.js';

// Feature marquee: the list is doubled so a -50% slide loops seamlessly.
// Speed matches the reference logo strip (~130px per second, linear).
const MARQUEE_PX_PER_SECOND = 130;

function initMarquee() {
  document.querySelectorAll('[data-marquee]').forEach((viewport) => {
    const track = viewport.querySelector('ul');
    if (prefersReducedMotion()) {
      viewport.classList.add('is-static');
      return;
    }
    [...track.children].forEach((li) => {
      const copy = li.cloneNode(true);
      copy.setAttribute('aria-hidden', 'true');
      copy.querySelector('a').tabIndex = -1;
      track.appendChild(copy);
    });

    const setSpeed = () => {
      track.style.setProperty('--marquee-duration', `${(track.scrollWidth / 2 / MARQUEE_PX_PER_SECOND).toFixed(1)}s`);
    };
    setSpeed();
    window.addEventListener('resize', setSpeed);
    viewport.classList.add('is-running');
  });
}

// Centered, looping slider (the reference uses slick with centerMode and infinite).
// Clones on both sides let it wrap without a visible jump.
function initSlider() {
  document.querySelectorAll('[data-ms-slider]').forEach((root) => {
    const viewport = root.querySelector('.ms-slider__viewport');
    const track = root.querySelector('[data-ms-track]');
    const originals = [...track.children];
    const count = originals.length;
    const status = root.querySelector('[data-ms-status]');
    const dotsWrap = root.querySelector('[data-ms-dots]');

    const makeClone = (slide) => {
      const c = slide.cloneNode(true);
      c.setAttribute('aria-hidden', 'true');
      c.removeAttribute('aria-label');
      c.removeAttribute('aria-roledescription');
      c.inert = true;
      return c;
    };
    track.prepend(...originals.map(makeClone));
    track.append(...originals.map(makeClone));
    const slides = [...track.children];

    const dots = originals.map((_, i) => {
      const dot = document.createElement('button');
      dot.type = 'button';
      dot.className = 'ms-slider__dot';
      dot.setAttribute('aria-label', `Show principle ${i + 1}`);
      dot.addEventListener('click', () => goTo(count + i));
      dotsWrap.appendChild(dot);
      return dot;
    });

    let index = count;
    let busy = false;

    const place = (animate) => {
      const slide = slides[index];
      const x = viewport.clientWidth / 2 - (slide.offsetLeft + slide.offsetWidth / 2);
      track.classList.toggle('is-animating', animate && !prefersReducedMotion());
      track.style.transform = `translateX(${x}px)`;
      const real = ((index - count) % count + count) % count;
      slides.forEach((s, i) => s.classList.toggle('is-active', i === index));
      dots.forEach((d, i) => d.setAttribute('aria-current', String(i === real)));
      return real;
    };

    const settle = () => {
      busy = false;
      if (index < count || index >= count * 2) {
        index = count + (((index - count) % count) + count) % count;
        place(false);
      }
    };

    const goTo = (target) => {
      if (busy) return;
      index = target;
      const real = place(true);
      const name = originals[real].querySelector('figcaption b')?.textContent ?? '';
      status.textContent = `Principle ${real + 1} of ${count}: ${name}`;
      if (track.classList.contains('is-animating')) busy = true;
      else settle();
    };

    track.addEventListener('transitionend', (e) => {
      if (e.target === track) settle();
    });

    root.querySelector('[data-ms-prev]').addEventListener('click', () => goTo(index - 1));
    root.querySelector('[data-ms-next]').addEventListener('click', () => goTo(index + 1));
    root.addEventListener('keydown', (e) => {
      if (e.key === 'ArrowRight') { e.preventDefault(); goTo(index + 1); }
      if (e.key === 'ArrowLeft') { e.preventDefault(); goTo(index - 1); }
    });

    let startX = null;
    viewport.addEventListener('pointerdown', (e) => { startX = e.clientX; });
    viewport.addEventListener('pointerup', (e) => {
      if (startX === null) return;
      const dx = e.clientX - startX;
      startX = null;
      if (Math.abs(dx) > 40) goTo(index + (dx < 0 ? 1 : -1));
    });
    viewport.addEventListener('pointercancel', () => { startX = null; });

    window.addEventListener('resize', () => place(false));
    place(false);
    // Fonts change slide widths after first paint
    document.fonts?.ready.then(() => place(false));
  });
}

// Numbers count up once when they scroll into view (1s, like the reference).
function initCountUp() {
  const items = document.querySelectorAll('[data-count]');
  if (!items.length || prefersReducedMotion() || !('IntersectionObserver' in window)) return;

  const run = (el) => {
    const end = Number(el.dataset.count);
    const start = performance.now();
    const tick = (now) => {
      const t = Math.min(1, (now - start) / 1000);
      el.textContent = String(Math.round(end * t));
      if (t < 1) requestAnimationFrame(tick);
    };
    el.textContent = '0';
    requestAnimationFrame(tick);
    // rAF pauses in background tabs; always finish on the real number
    setTimeout(() => { el.textContent = String(end); }, 1100);
  };

  const observer = new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
      if (!entry.isIntersecting || entry.target.dataset.counted) return;
      entry.target.dataset.counted = 'true';
      run(entry.target);
      observer.unobserve(entry.target);
    });
  });
  items.forEach((el) => observer.observe(el));
}

// Shared by the audience pages rebuilt from the reference layout (multisite, preschools)
export function initMultisite() {
  initMarquee();
  initSlider();
  initCountUp();
}
