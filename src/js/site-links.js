import { LOGIN_URL, CONTACT } from '../config.js';
import { goTo, showToast } from './utils.js';
import { prefillDemoForm, focusDemoForm } from './demo-form.js';

function initDemoLinks() {
  // Pages without the demo form (e.g. pricing) let these links navigate to the home page's form
  if (!document.getElementById('demo')) return;
  document.querySelectorAll('[data-demo-link]').forEach((link) => {
    link.addEventListener('click', (e) => {
      e.preventDefault();
      prefillDemoForm({ role: link.dataset.role, locations: link.dataset.locations, program: link.dataset.program });
      requestAnimationFrame(() => {
        goTo('#demo', { focus: false });
        focusDemoForm();
      });
    });
  });
}

// Same-page anchors, including links that name the current page (e.g. features.html#f-…
// while on features.html), scroll in place so the page can react to them.
function initInPageLinks() {
  document.addEventListener('click', (e) => {
    const link = e.target.closest('a[href*="#"]');
    if (!link || e.defaultPrevented || e.metaKey || e.ctrlKey || e.shiftKey) return;
    const url = new URL(link.href, location.href);
    if (url.pathname !== location.pathname || !url.hash || url.hash === '#') return;
    if (goTo(url.hash)) e.preventDefault();
  });
}

// Delegated so login links added later (e.g. inside the pricing card) behave the same
function initLogin() {
  document.querySelectorAll('[data-login]').forEach((link) => {
    if (LOGIN_URL) link.href = LOGIN_URL;
  });
  if (LOGIN_URL) return;
  document.addEventListener('click', (e) => {
    const link = e.target.closest('[data-login]');
    if (!link) return;
    e.preventDefault();
    document.querySelector('[data-mobile-menu]')?.close();
    showToast('The THINKBIG login is not available yet. Book a demo to get early access.');
  });
}

async function copyText(text) {
  if (navigator.clipboard && window.isSecureContext) {
    try {
      await navigator.clipboard.writeText(text);
      return;
    } catch {
      // Permission denied or unfocused document: fall through to the legacy path
    }
  }
  const area = Object.assign(document.createElement('textarea'), { value: text });
  area.setAttribute('readonly', '');
  area.style.cssText = 'position:fixed;opacity:0;';
  document.body.append(area);
  area.select();
  const ok = document.execCommand('copy');
  area.remove();
  if (!ok) throw new Error('Copy failed');
}

function initCopyAddress() {
  const button = document.querySelector('[data-copy-address]');
  const address = document.querySelector('[data-address]');
  if (!button || !address) return;
  const label = button.querySelector('span');

  button.addEventListener('click', async () => {
    try {
      await copyText(`THINKBIG, ${address.textContent.trim()}`);
      button.classList.add('is-copied');
      label.textContent = 'Address copied';
      showToast('Address copied to your clipboard.');
      setTimeout(() => {
        button.classList.remove('is-copied');
        label.textContent = 'Copy address';
      }, 2500);
    } catch {
      showToast('Copying is blocked in this browser. Please select the address to copy it.');
    }
  });
}

function initContactLines() {
  const list = document.querySelector('[data-contact-lines]');
  if (!list) return;
  const items = [];
  if (CONTACT.email) {
    items.push(`<li><svg class="icon icon--sm" aria-hidden="true"><use href="#i-mail"/></svg><a href="mailto:${CONTACT.email}">${CONTACT.email}</a></li>`);
  }
  if (CONTACT.phone) {
    items.push(`<li><svg class="icon icon--sm" aria-hidden="true"><use href="#i-phone"/></svg><a href="tel:${CONTACT.phone.replace(/[^\d+]/g, '')}">${CONTACT.phone}</a></li>`);
  }
  list.innerHTML = items.join('');
  list.hidden = !items.length;
}

function initBackToTop() {
  const button = document.querySelector('[data-to-top]');
  if (!button) return;
  const update = () => button.classList.toggle('is-visible', window.scrollY > window.innerHeight * 1.2);
  update();
  window.addEventListener('scroll', update, { passive: true });
  button.addEventListener('click', () => {
    goTo('#top', { focus: false });
    document.querySelector('.brand')?.focus({ preventScroll: true });
  });
}

export function initSiteLinks() {
  initDemoLinks();
  initInPageLinks();
  initLogin();
  initCopyAddress();
  initContactLines();
  initBackToTop();
  document.querySelectorAll('[data-year]').forEach((el) => (el.textContent = new Date().getFullYear()));

  // Honour a hash in the URL on first load (e.g. a shared link to #pricing)
  if (location.hash.length > 1) {
    requestAnimationFrame(() => goTo(location.hash, { focus: false }));
  }
}
