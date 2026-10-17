import { DEMO_FORM_ENDPOINT } from '../config.js';

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

const RULES = {
  name: (v) => (v.length < 2 ? 'Please enter your name.' : ''),
  email: (v) => {
    if (!v) return 'Please enter your work email.';
    return EMAIL_PATTERN.test(v) ? '' : 'Please enter a valid email address, like name@school.org.';
  },
  organization: (v) => (!v ? 'Please enter your school or organization.' : ''),
  role: (v) => (!v ? 'Please choose your role.' : ''),
};

const isPreview = () => !DEMO_FORM_ENDPOINT;

async function sendRequest(data) {
  if (isPreview()) {
    // Preview mode: no endpoint is configured, so nothing leaves the browser.
    await new Promise((resolve) => setTimeout(resolve, 900));
    return;
  }

  const response = await fetch(DEMO_FORM_ENDPOINT, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
    body: JSON.stringify(data),
  });
  if (!response.ok) throw new Error(`Request failed with ${response.status}`);
}

export function initDemoForm() {
  const form = document.querySelector('[data-demo-form]');
  if (!form) return;

  const success = document.querySelector('[data-form-success]');
  const status = form.querySelector('[data-form-status]');
  const submit = form.querySelector('[data-submit]');
  const label = submit.querySelector('.btn__label');
  const defaultLabel = label.textContent;

  form.querySelector('[data-form-mode]').textContent = isPreview()
    ? 'Preview mode: this form is not connected yet, so requests are checked here but not sent to THINKBIG.'
    : 'We only use these details to arrange your demo.';

  const validateField = (name) => {
    const field = form.elements[name];
    const message = RULES[name](field.value.trim());
    const wrapper = field.closest('.field');
    wrapper.classList.toggle('has-error', Boolean(message));
    wrapper.classList.toggle('is-valid', !message);
    field.setAttribute('aria-invalid', String(Boolean(message)));
    form.querySelector(`[data-error-for="${name}"]`).textContent = message;
    return !message;
  };

  Object.keys(RULES).forEach((name) => {
    const field = form.elements[name];
    field.addEventListener('blur', () => {
      if (field.value.trim() || field.dataset.touched) validateField(name);
      field.dataset.touched = 'true';
    });
    field.addEventListener(field.tagName === 'SELECT' ? 'change' : 'input', () => {
      if (field.closest('.field').classList.contains('has-error')) validateField(name);
    });
  });

  const setLoading = (loading) => {
    submit.disabled = loading;
    submit.classList.toggle('is-loading', loading);
    submit.setAttribute('aria-busy', String(loading));
    label.textContent = loading ? 'Sending…' : defaultLabel;
  };

  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    status.textContent = '';
    status.classList.remove('is-error');

    const invalid = Object.keys(RULES).filter((name) => !validateField(name));
    if (invalid.length) {
      status.textContent = `Please check ${invalid.length === 1 ? 'the highlighted field' : `the ${invalid.length} highlighted fields`}.`;
      status.classList.add('is-error');
      form.elements[invalid[0]].focus();
      return;
    }

    const data = Object.fromEntries(new FormData(form).entries());
    setLoading(true);

    try {
      await sendRequest(data);
      showSuccess(data);
    } catch {
      status.textContent = "Sorry, we couldn't send your request just now. Please check your connection and try again.";
      status.classList.add('is-error');
    } finally {
      setLoading(false);
    }
  });

  const showSuccess = ({ name, email }) => {
    const firstName = name.trim().split(/\s+/)[0];
    success.querySelector('[data-success-title]').textContent = isPreview()
      ? `Thanks, ${firstName}! Your request looks good.`
      : `Thank you, ${firstName}!`;
    success.querySelector('[data-success-text]').textContent = isPreview()
      ? 'This website is in preview mode, so your request has not been sent to the THINKBIG team yet. Once the form is connected, requests like this will reach us directly.'
      : `Your demo request has been sent. We'll reply to ${email} to arrange a time.`;
    form.hidden = true;
    success.hidden = false;
    success.focus();
  };

  success.querySelector('[data-form-reset]').addEventListener('click', () => {
    form.reset();
    form.querySelectorAll('.field').forEach((f) => f.classList.remove('has-error', 'is-valid'));
    form.querySelectorAll('[aria-invalid]').forEach((f) => f.removeAttribute('aria-invalid'));
    form.querySelectorAll('[data-touched]').forEach((f) => delete f.dataset.touched);
    success.hidden = true;
    form.hidden = false;
    form.elements.name.focus();
  });
}

// Pre-selects form options from the link that brought the visitor here (e.g. a pricing card).
export function prefillDemoForm({ role, locations, program } = {}) {
  const form = document.querySelector('[data-demo-form]');
  if (!form) return;
  if (role) form.elements.role.value = role;
  if (locations) form.elements.locations.value = locations;
  if (program && !form.elements.message.value.trim()) form.elements.message.value = program;
}

export function focusDemoForm() {
  const form = document.querySelector('[data-demo-form]');
  const success = document.querySelector('[data-form-success]');
  if (!form) return;
  (form.hidden ? success : form.elements.name).focus({ preventScroll: true });
}
