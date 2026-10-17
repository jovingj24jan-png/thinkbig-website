import { DEMO_FORM_ENDPOINT } from '../config.js';
import { prefersReducedMotion } from './utils.js';

const STATES = [
  'Andhra Pradesh', 'Arunachal Pradesh', 'Assam', 'Bihar', 'Chhattisgarh', 'Goa', 'Gujarat', 'Haryana',
  'Himachal Pradesh', 'Jharkhand', 'Karnataka', 'Kerala', 'Madhya Pradesh', 'Maharashtra', 'Manipur',
  'Meghalaya', 'Mizoram', 'Nagaland', 'Odisha', 'Punjab', 'Rajasthan', 'Sikkim', 'Tamil Nadu', 'Telangana',
  'Tripura', 'Uttar Pradesh', 'Uttarakhand', 'West Bengal', 'Andaman and Nicobar Islands', 'Chandigarh',
  'Dadra and Nagar Haveli and Daman and Diu', 'Delhi', 'Jammu and Kashmir', 'Ladakh', 'Lakshadweep',
  'Puducherry', 'Outside India',
];

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;
const isPreview = () => !DEMO_FORM_ENDPOINT;

const icon = (name) => `<svg class="icon" aria-hidden="true"><use href="#${name}" /></svg>`;

// Answer rows: click one and the questionnaire moves straight on.
const option = (value, label, iconName, tint) => `
  <button class="pf-option" type="button" data-value="${value}">
    ${iconName ? `<span class="pf-option__icon ${tint}">${icon(iconName)}</span>` : ''}
    <span class="pf-option__label">${label}</span>
    <span class="pf-option__arrow">${icon('i-arrow')}</span>
  </button>`;

const STEPS = {
  role: {
    question: '',
    options: [
      ['admin', "I'm an <strong>owner</strong> or <strong>director</strong>", 'i-building', 'tint-blue'],
      ['staff', "I'm a <strong>staff member</strong>", 'i-users', 'tint-mint'],
      ['parent', "I'm a <strong>parent</strong> or <strong>guardian</strong>", 'i-heart', 'tint-pink'],
    ],
  },
  intent: {
    question: 'What brings you here today?',
    options: [
      ['interested', "I'm <strong>interested in THINKBIG</strong> for my school", 'i-sparkle', 'tint-yellow'],
      ['login', 'I want to <strong>log in</strong> to my account', 'i-login', 'tint-blue'],
    ],
  },
  status: {
    question: 'Is your school welcoming children yet?',
    options: [
      ['Open and enrolling', "Yes, we're <strong>open and enrolling</strong>", 'i-check', 'tint-mint'],
      ['Opening within 3 months', 'Opening <strong>within 3 months</strong>', 'i-clock', 'tint-yellow'],
      ['Opening in more than 3 months', 'Opening in <strong>more than 3 months</strong>', 'i-attendance', 'tint-lav'],
    ],
  },
  capacity: { question: "What is your program's maximum enrollment capacity?" },
  locations: {
    question: 'How many locations does your program have?',
    options: [
      ['1', '<strong>1</strong> location', 'i-home', 'tint-mint'],
      ['2-9', '<strong>2–9</strong> locations', 'i-building', 'tint-blue'],
      ['10+', '<strong>10+</strong> locations', 'i-pin', 'tint-rose'],
    ],
  },
  email: { question: "What's your email?" },
  contact: { question: "Lastly, what's your contact information?" },
};

const BASE_PATH = ['role', 'status', 'capacity', 'locations', 'email', 'contact'];

function template(id, kind) {
  const optionStep = (key) => `
    <div class="pf-step" data-pf-step="${key}" hidden>
      ${STEPS[key].question ? `<h3 class="pf-step__q" tabindex="-1">${STEPS[key].question}</h3>` : '<h3 class="visually-hidden pf-step__q" tabindex="-1">Which best describes you?</h3>'}
      <div class="pf-options" role="group" aria-label="${STEPS[key].question || 'Which best describes you?'}">
        ${STEPS[key].options.map((o) => option(...o)).join('')}
      </div>
    </div>`;

  const field = (name, label, type, extra = '') => `
    <div class="field">
      <label for="${id}-${name}">${label} <span class="req" aria-hidden="true">*</span></label>
      <input id="${id}-${name}" name="${name}" type="${type}" aria-describedby="${id}-${name}-err" ${extra} />
      <p class="field__error" id="${id}-${name}-err" data-pf-error="${name}"></p>
    </div>`;

  return `
    <form class="pf" novalidate data-pricing-form>
      <button class="pf-back" type="button" data-pf-back hidden>${icon('i-arrow')} Back</button>
      <p class="pf__intro">${kind === 'demo request' ? "We'll need a little info to set up your tour." : "We'll need some info to customize your pricing."}</p>
      <div class="pf__progress" aria-hidden="true" data-pf-segments></div>
      <p class="pf__count" data-pf-count aria-live="polite">1 of 6</p>

      ${optionStep('role')}
      ${optionStep('intent')}
      ${optionStep('status')}

      <div class="pf-step" data-pf-step="capacity" hidden>
        <h3 class="pf-step__q" tabindex="-1">${STEPS.capacity.question}</h3>
        <div class="pf-range">
          <output class="pf-range__value" for="${id}-capacity" data-pf-capacity-out><strong>25</strong> children</output>
          <label class="visually-hidden" for="${id}-capacity">Maximum number of children</label>
          <input id="${id}-capacity" name="capacity" type="range" min="1" max="100" step="1" value="25" data-pf-capacity />
          <div class="pf-range__marks" aria-hidden="true"><span>1</span><span>25</span><span>50</span><span>75</span><span>100+</span></div>
        </div>
        <button class="btn btn--primary pf-continue" type="submit">Continue ${icon('i-arrow')}</button>
      </div>

      ${optionStep('locations')}

      <div class="pf-step" data-pf-step="email" hidden>
        <h3 class="pf-step__q" tabindex="-1">${STEPS.email.question}</h3>
        ${field('email', 'Work email', 'email', 'autocomplete="email" inputmode="email" placeholder="you@school.org"')}
        <button class="btn btn--primary pf-continue" type="submit">Continue ${icon('i-arrow')}</button>
      </div>

      <div class="pf-step" data-pf-step="contact" hidden>
        <h3 class="pf-step__q" tabindex="-1">${STEPS.contact.question}</h3>
        <div class="field-row">
          ${field('firstName', 'First name', 'text', 'autocomplete="given-name"')}
          ${field('lastName', 'Last name', 'text', 'autocomplete="family-name"')}
        </div>
        ${field('organization', 'School or organization', 'text', 'autocomplete="organization"')}
        <div class="field-row">
          ${field('phone', 'Phone', 'tel', 'autocomplete="tel" inputmode="tel" placeholder="+91"')}
          <div class="field">
            <label for="${id}-state">State <span class="req" aria-hidden="true">*</span></label>
            <select id="${id}-state" name="state" aria-describedby="${id}-state-err">
              <option value="">Choose one</option>
              ${STATES.map((s) => `<option>${s}</option>`).join('')}
            </select>
            <p class="field__error" id="${id}-state-err" data-pf-error="state"></p>
          </div>
        </div>
        <label class="pf-consent">
          <input type="checkbox" name="consent" value="yes" aria-describedby="${id}-consent-err" />
          <span>I agree to be contacted by THINKBIG by phone or email about my pricing request.</span>
        </label>
        <p class="field__error" id="${id}-consent-err" data-pf-error="consent"></p>
        <button class="btn btn--primary pf-continue" type="submit">
          <span class="btn__spinner" aria-hidden="true"></span><span class="btn__label">Request pricing</span>
        </button>
      </div>

      <div class="pf-exit" data-pf-exit="login" hidden tabindex="-1">
        <span class="pf-exit__icon tint-blue">${icon('i-login')}</span>
        <h3>Looking for your account?</h3>
        <p>Use Login to sign in to THINKBIG. Not a customer yet? Go back and choose “I'm interested in THINKBIG”.</p>
        <div class="pf-exit__actions"><a class="btn btn--primary" href="#" data-login>Go to login</a></div>
      </div>
      <div class="pf-exit" data-pf-exit="parent" hidden tabindex="-1">
        <span class="pf-exit__icon tint-pink">${icon('i-heart')}</span>
        <h3>Your school will invite you</h3>
        <p>Families join THINKBIG through their child's school. Ask your school office for an invitation, or tell them about THINKBIG.</p>
        <div class="pf-exit__actions"><a class="btn btn--primary" href="./#cat-communication">See the parent app</a></div>
      </div>

      <p class="form-status" role="status" aria-live="polite" data-pf-status></p>
      <p class="pf__fine">Every school is different, so we prepare a personal quote for each one. Complete this form and our team can share your pricing or arrange a time to talk.</p>
      <p class="pf__fine pf__fine--mode" data-pf-mode></p>
    </form>

    <div class="form-success pf-success" tabindex="-1" hidden data-pf-success>
      <span class="form-success__icon">${icon('i-check')}</span>
      <h3 data-pf-success-title>Thank you!</h3>
      <p data-pf-success-text></p>
      <div class="pf-exit__actions">
        <a class="btn btn--primary" href="./#features">Explore features</a>
        <button class="btn btn--secondary" type="button" data-pf-restart>Start again</button>
      </div>
    </div>`;
}

async function sendRequest(data) {
  if (isPreview()) {
    // Preview mode: no endpoint is configured, so nothing leaves the browser.
    await new Promise((resolve) => setTimeout(resolve, 900));
    return;
  }
  const response = await fetch(DEMO_FORM_ENDPOINT, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
    body: JSON.stringify({ type: data.request ?? 'pricing', ...data }),
  });
  if (!response.ok) throw new Error(`Request failed with ${response.status}`);
}

function mount(card, id) {
  // data-request="demo" (home page) changes the wording; the default is a pricing request
  const kind = card.dataset.request === 'demo' ? 'demo request' : 'pricing request';
  card.innerHTML = template(id, kind);
  const form = card.querySelector('[data-pricing-form]');
  const success = card.querySelector('[data-pf-success]');
  const back = form.querySelector('[data-pf-back]');
  const count = form.querySelector('[data-pf-count]');
  const segments = form.querySelector('[data-pf-segments]');
  const status = form.querySelector('[data-pf-status]');
  const capacity = form.querySelector('[data-pf-capacity]');
  const capacityOut = form.querySelector('[data-pf-capacity-out]');
  const steps = Object.fromEntries([...form.querySelectorAll('[data-pf-step]')].map((s) => [s.dataset.pfStep, s]));
  const exits = [...form.querySelectorAll('[data-pf-exit]')];
  const answers = {};
  let path = [...BASE_PATH];
  let index = 0;
  let onExit = false;

  form.querySelector('[data-pf-mode]').textContent = isPreview()
    ? 'Preview mode: this form is not connected yet, so your answers are checked here but not sent to THINKBIG.'
    : '';

  const setStatus = (message = '') => {
    status.textContent = message;
    status.classList.toggle('is-error', Boolean(message));
  };

  // Keep the current question on screen (matters on phones, where the card is tall)
  const keepInView = () => {
    const top = card.getBoundingClientRect().top;
    const headerH = document.querySelector('[data-header]')?.offsetHeight ?? 0;
    if (top < headerH || top > window.innerHeight * 0.6) {
      window.scrollTo({ top: window.scrollY + top - headerH - 16, behavior: prefersReducedMotion() ? 'auto' : 'smooth' });
    }
  };

  const reveal = (el, focus) => {
    el.hidden = false;
    if (!prefersReducedMotion()) {
      el.classList.remove('is-entering');
      void el.offsetWidth; // restart the entrance animation
      el.classList.add('is-entering');
    }
    if (focus) {
      keepInView();
      (el.querySelector('.pf-step__q') ?? el).focus({ preventScroll: true });
    }
  };

  const render = ({ focus = true } = {}) => {
    Object.values(steps).forEach((s) => (s.hidden = true));
    exits.forEach((e) => (e.hidden = true));
    onExit = false;
    setStatus();
    // Back on the first question the route isn't known yet, so show the standard length
    if (index === 0) path = [...BASE_PATH];
    const key = path[index];
    count.textContent = `${index + 1} of ${path.length}`;
    segments.innerHTML = path.map((_, i) => `<span class="${i < index ? 'is-done' : i === index ? 'is-done is-current' : ''}"></span>`).join('');
    back.hidden = index === 0;
    steps[key].querySelectorAll('.pf-option').forEach((b) => b.classList.toggle('is-selected', answers[key] === b.dataset.value));
    reveal(steps[key], focus);
  };

  const showExit = (name) => {
    Object.values(steps).forEach((s) => (s.hidden = true));
    onExit = true;
    back.hidden = false;
    setStatus();
    reveal(exits.find((e) => e.dataset.pfExit === name), true);
  };

  const advance = () => {
    index = Math.min(index + 1, path.length - 1);
    render();
  };

  // Answer rows
  form.addEventListener('click', (e) => {
    const button = e.target.closest('.pf-option');
    if (!button) return;
    const key = button.closest('[data-pf-step]').dataset.pfStep;
    answers[key] = button.dataset.value;
    button.parentElement.querySelectorAll('.pf-option').forEach((b) => b.classList.toggle('is-selected', b === button));

    if (key === 'role') {
      if (button.dataset.value === 'parent') return showExit('parent');
      // Staff are asked what brings them here; owners go straight to the pricing questions
      path = button.dataset.value === 'staff' ? ['role', 'intent', ...BASE_PATH.slice(1)] : [...BASE_PATH];
    }
    if (key === 'intent' && button.dataset.value === 'login') return showExit('login');
    advance();
  });

  back.addEventListener('click', () => {
    if (onExit) render();
    else {
      index = Math.max(0, index - 1);
      render();
    }
  });

  const fieldError = (name, message) => {
    const field = form.elements[name];
    field.closest('.field')?.classList.toggle('has-error', Boolean(message));
    field.setAttribute('aria-invalid', String(Boolean(message)));
    const out = form.querySelector(`[data-pf-error="${name}"]`);
    out.textContent = message;
    out.classList.toggle('is-shown', Boolean(message));
    return !message;
  };

  const validate = (key) => {
    if (key === 'email') {
      const v = form.elements.email.value.trim();
      const ok = fieldError('email', !v ? 'Please enter your work email.' : EMAIL_PATTERN.test(v) ? '' : 'Please enter a valid email address, like name@school.org.');
      if (!ok) form.elements.email.focus();
      return ok;
    }
    if (key === 'contact') {
      const rules = [
        ['firstName', (v) => (v ? '' : 'Please enter your first name.')],
        ['lastName', (v) => (v ? '' : 'Please enter your last name.')],
        ['organization', (v) => (v ? '' : 'Please enter your school or organization.')],
        ['phone', (v) => ((v.match(/\d/g) || []).length >= 7 ? '' : 'Please enter a phone number we can reach you on.')],
        ['state', (v) => (v ? '' : 'Please choose your state.')],
      ];
      const bad = rules.filter(([name, rule]) => !fieldError(name, rule(form.elements[name].value.trim()))).map(([n]) => n);
      if (!fieldError('consent', form.elements.consent.checked ? '' : 'Please agree so we can contact you about your pricing.')) bad.push('consent');
      if (bad.length) {
        setStatus(`Please check ${bad.length === 1 ? 'the highlighted field' : `the ${bad.length} highlighted fields`}.`);
        form.elements[bad[0]].focus();
        return false;
      }
    }
    return true;
  };

  const submit = async () => {
    const button = steps.contact.querySelector('.pf-continue');
    const label = button.querySelector('.btn__label');
    const data = { request: card.dataset.request ?? 'pricing', ...answers, ...Object.fromEntries(new FormData(form).entries()) };
    button.disabled = true;
    button.classList.add('is-loading');
    label.textContent = 'Sending…';
    try {
      await sendRequest(data);
      const name = data.firstName.trim();
      success.querySelector('[data-pf-success-title]').textContent = isPreview() ? `Thanks, ${name}! Your answers look good.` : `Thank you, ${name}!`;
      success.querySelector('[data-pf-success-text]').textContent = isPreview()
        ? `This website is in preview mode, so your ${kind} has not been sent to the THINKBIG team yet. Once the form is connected, requests like this will reach us directly.`
        : `Your ${kind} has been sent. We'll be in touch at ${data.email}.`;
      form.hidden = true;
      success.hidden = false;
      success.focus();
    } catch {
      setStatus("Sorry, we couldn't send your request just now. Please check your connection and try again.");
    } finally {
      button.disabled = false;
      button.classList.remove('is-loading');
      label.textContent = 'Request pricing';
    }
  };

  // Continue buttons (and Enter in a text field) submit the form for the current step
  form.addEventListener('submit', (e) => {
    e.preventDefault();
    const key = path[index];
    if (onExit || !['capacity', 'email', 'contact'].includes(key)) return;
    if (!validate(key)) return;
    if (key === 'contact') submit();
    else advance();
  });

  form.addEventListener('input', (e) => {
    if (e.target.closest('.field')?.classList.contains('has-error') || e.target.name === 'consent') fieldError(e.target.name, '');
    if (status.textContent) setStatus();
  });

  const updateCapacity = () => {
    const v = Number(capacity.value);
    capacityOut.innerHTML = `<strong>${v >= 100 ? '100+' : v}</strong> ${v === 1 ? 'child' : 'children'}`;
    capacity.style.setProperty('--fill', `${((v - 1) / 99) * 100}%`);
    capacity.setAttribute('aria-valuetext', `${v >= 100 ? '100 or more' : v} children`);
  };
  capacity.addEventListener('input', updateCapacity);
  updateCapacity();

  card.querySelector('[data-pf-restart]').addEventListener('click', () => {
    form.reset();
    Object.keys(answers).forEach((k) => delete answers[k]);
    form.querySelectorAll('.has-error').forEach((f) => f.classList.remove('has-error'));
    form.querySelectorAll('.is-shown').forEach((f) => { f.textContent = ''; f.classList.remove('is-shown'); });
    updateCapacity();
    path = [...BASE_PATH];
    index = 0;
    success.hidden = true;
    form.hidden = false;
    render();
  });

  render({ focus: false });
}

export function initPricingForm() {
  document.querySelectorAll('[data-pricing-mount]').forEach((card, i) => mount(card, `pf${i + 1}`));
}
