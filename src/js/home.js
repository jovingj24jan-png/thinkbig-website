import { prefersReducedMotion } from './utils.js';

// Feature accordion: one category open at a time, with its product panel beside it.
function initFeatureAccordion() {
  const acc = document.querySelector('[data-bw-acc]');
  if (!acc) return;
  const items = [...acc.querySelectorAll('[data-cat]')];
  const visuals = [...acc.querySelectorAll('[data-visual]')];

  const open = (key) => {
    items.forEach((item) => {
      const on = item.dataset.cat === key;
      item.classList.toggle('is-open', on);
      item.querySelector('.bw-acc__trigger').setAttribute('aria-expanded', String(on));
    });
    visuals.forEach((v) => {
      const on = v.dataset.visual === key;
      if (on && v.hidden) {
        v.hidden = false;
        if (!prefersReducedMotion()) {
          v.classList.remove('is-entering');
          void v.offsetWidth; // restart the entrance animation
          v.classList.add('is-entering');
        }
      } else if (!on) {
        v.hidden = true;
      }
    });
  };

  items.forEach((item) => {
    item.querySelector('.bw-acc__trigger').addEventListener('click', () => open(item.dataset.cat));
  });
  document.addEventListener('category:show', (e) => open(e.detail));
}

// Savings estimate. Assumptions are stated on the page next to the form.
const MINUTES_PER_CHILD_PER_DAY = 1.5;
const SCHOOL_DAYS_PER_MONTH = 22;
const MINUTES_PER_LATE_FAMILY = 15;
const MINUTES_PER_STAFF = 30;

function initSavings() {
  const form = document.querySelector('[data-savings]');
  if (!form) return;
  const result = form.querySelector('[data-sv-result]');
  const out = (name) => form.querySelector(`[data-sv-out="${name}"]`);
  const ranges = [...form.querySelectorAll('input[type="range"]')];

  const labels = {
    children: (v) => `${v >= 200 ? '200+' : v} children`,
    staff: (v) => `${v >= 30 ? '30+' : v} staff`,
    late: (v) => `${v}%`,
  };

  const paint = (input) => {
    const v = Number(input.value);
    out(input.name).textContent = labels[input.name](v);
    input.style.setProperty('--fill', `${((v - input.min) / (input.max - input.min)) * 100}%`);
  };

  ranges.forEach((input) => {
    paint(input);
    input.addEventListener('input', () => {
      paint(input);
      if (!result.hidden) calculate(false);
    });
  });

  const calculate = (focus) => {
    const children = Number(form.elements.children.value);
    const staff = Number(form.elements.staff.value);
    const late = Number(form.elements.late.value) / 100;
    const daily = (children * MINUTES_PER_CHILD_PER_DAY * SCHOOL_DAYS_PER_MONTH) / 60;
    const fees = (children * late * MINUTES_PER_LATE_FAMILY) / 60;
    const coordination = (staff * MINUTES_PER_STAFF) / 60;
    const total = Math.round(daily + fees + coordination);
    const h = (n) => `${Math.round(n)} h`;
    result.innerHTML = `
      <p class="savings__headline">About <strong>${total} hours</strong> a month back for your team</p>
      <ul class="savings__breakdown">
        <li><span>Attendance &amp; daily updates</span><strong>${h(daily)}</strong></li>
        <li><span>Fee follow-ups</span><strong>${h(fees)}</strong></li>
        <li><span>Scheduling &amp; coordination</span><strong>${h(coordination)}</strong></li>
      </ul>
      <a class="btn btn--secondary btn--block" href="#demo" data-demo-link>See it in a demo</a>`;
    result.hidden = false;
    if (focus) result.focus({ preventScroll: true });
  };

  form.addEventListener('submit', (e) => {
    e.preventDefault();
    calculate(true);
  });
}

// Carousel: native horizontal scrolling with previous/next buttons.
function initCarousel() {
  document.querySelectorAll('[data-carousel]').forEach((carousel) => {
    const track = carousel.querySelector('[data-carousel-track]');
    const prev = carousel.querySelector('[data-carousel-prev]');
    const next = carousel.querySelector('[data-carousel-next]');
    const step = () => (track.firstElementChild?.getBoundingClientRect().width ?? 300) + 24;

    const update = () => {
      prev.disabled = track.scrollLeft <= 4;
      next.disabled = track.scrollLeft + track.clientWidth >= track.scrollWidth - 4;
    };

    const go = (dir) => track.scrollBy({ left: dir * step(), behavior: prefersReducedMotion() ? 'auto' : 'smooth' });
    prev.addEventListener('click', () => go(-1));
    next.addEventListener('click', () => go(1));
    track.addEventListener('scroll', update, { passive: true });
    track.addEventListener('keydown', (e) => {
      if (e.key === 'ArrowRight') { e.preventDefault(); go(1); }
      if (e.key === 'ArrowLeft') { e.preventDefault(); go(-1); }
    });
    window.addEventListener('resize', update);
    update();
  });
}

export function initHome() {
  initFeatureAccordion();
  initSavings();
  initCarousel();
}
