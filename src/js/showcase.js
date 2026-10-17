// Interactive product previews. All figures are fictional sample data.

const LOCATIONS = {
  all: {
    enrolled: [142, 'children'],
    present: [128, '90% attendance'],
    enquiries: [18, '6 tours booked'],
    invoices: [9, 'this week'],
    bars: [88, 92, 90],
    pipeline: [12, 6, 4, 3],
  },
  sunrise: {
    enrolled: [84, 'children'],
    present: [79, '94% attendance'],
    enquiries: [11, '4 tours booked'],
    invoices: [5, 'this week'],
    bars: [91, 95, 94],
    pipeline: [7, 4, 3, 2],
  },
  meadow: {
    enrolled: [58, 'children'],
    present: [49, '84% attendance'],
    enquiries: [7, '2 tours booked'],
    invoices: [4, 'this week'],
    bars: [83, 88, 84],
    pipeline: [5, 2, 1, 1],
  },
};

function initDashboard() {
  const select = document.querySelector('[data-dash-location]');
  if (!select) return;
  const bars = [...document.querySelectorAll('[data-dash-bars] li')];
  const pipeline = [...document.querySelectorAll('[data-dash-pipeline] li')];

  select.addEventListener('change', () => {
    const data = LOCATIONS[select.value];
    ['enrolled', 'present', 'enquiries', 'invoices'].forEach((key) => {
      document.querySelector(`[data-kpi="${key}"]`).textContent = data[key][0];
      document.querySelector(`[data-kpi-note="${key}"]`).textContent = data[key][1];
    });
    data.bars.forEach((value, i) => bars[i].style.setProperty('--h', `${value}%`));
    const max = data.pipeline[0];
    data.pipeline.forEach((value, i) => {
      pipeline[i].querySelector('b').style.setProperty('--w', `${(value / max) * 100}%`);
      pipeline[i].querySelector('em').textContent = value;
    });
  });
}

function initRollCall() {
  const roll = document.querySelector('[data-roll]');
  if (!roll) return;
  const items = [...roll.querySelectorAll('.roll__item')];
  const count = document.querySelector('[data-roll-count]');
  const bar = document.querySelector('[data-roll-bar]');

  const update = () => {
    const present = items.filter((b) => b.getAttribute('aria-pressed') === 'true').length;
    count.textContent = `${present} of ${items.length} in`;
    bar.style.setProperty('--p', `${(present / items.length) * 100}%`);
  };

  items.forEach((button) => {
    button.addEventListener('click', () => {
      const next = button.getAttribute('aria-pressed') !== 'true';
      button.setAttribute('aria-pressed', String(next));
      const state = button.querySelector('.roll__state');
      state.textContent = next ? state.dataset.on : state.dataset.off;
      update();
    });
  });
}

const OBSERVATIONS = {
  practical: {
    area: 'Practical Life observation',
    text: 'Kabir carefully poured water between two small jugs and wiped up a spill on his own before returning the tray to the shelf.',
    next: 'Introduce pouring between three containers.',
  },
  sensorial: {
    area: 'Sensorial observation',
    text: 'Kabir graded the pink tower from largest to smallest, noticed one cube out of order and corrected it without help.',
    next: 'Offer the brown stair and invite him to compare it with the pink tower.',
  },
  language: {
    area: 'Language observation',
    text: 'Kabir traced the sandpaper letters m, a and t, saying each sound aloud, and began building short words with the moveable alphabet.',
    next: 'Continue with three-letter phonetic words and picture cards.',
  },
  mathematics: {
    area: 'Mathematics observation',
    text: 'Kabir was introduced to the number rods today. He counted rods one to five confidently and was curious about the longer rods.',
    next: 'Revisit rods 1–10 and pair them with the sandpaper numerals.',
  },
  cultural: {
    area: 'Cultural Studies observation',
    text: 'Kabir matched animal pictures to the continent puzzle map and shared with a friend that elephants live in Asia and Africa.',
    next: 'Introduce land and water form trays.',
  },
  creative: {
    area: 'Creative Expression observation',
    text: 'Kabir mixed blue and yellow paint at the easel, announced he had "made grass" and painted a garden for the class display.',
    next: 'Offer collage materials from the nature table.',
  },
};

function initJourney() {
  const journey = document.querySelector('[data-journey]');
  if (!journey) return;
  const buttons = [...journey.querySelectorAll('[data-area]')];
  const card = journey.querySelector('.obs-card');
  const fields = {
    area: card.querySelector('[data-obs-area]'),
    text: card.querySelector('[data-obs-text]'),
    next: card.querySelector('[data-obs-next]'),
  };
  const reduced = window.matchMedia('(prefers-reduced-motion: reduce)');
  let swapTimer;

  buttons.forEach((button) => {
    button.addEventListener('click', () => {
      buttons.forEach((b) => b.setAttribute('aria-pressed', String(b === button)));
      const data = OBSERVATIONS[button.dataset.area];
      const apply = () => {
        Object.entries(fields).forEach(([key, el]) => (el.textContent = data[key]));
        card.classList.remove('is-changing');
      };
      clearTimeout(swapTimer);
      if (reduced.matches) return apply();
      card.classList.add('is-changing');
      swapTimer = setTimeout(apply, 180);
    });
  });
}

export function initShowcase() {
  initDashboard();
  initRollCall();
  initJourney();
}
