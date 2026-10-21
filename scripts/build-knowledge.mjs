// Builds chat-api/src/knowledge.json: the approved THINKBIG content the AI assistant answers from.
// It reads the website's own pages and public settings, so re-run it whenever the site changes:
//   npm run knowledge
import { readFileSync, writeFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { parse } from 'node-html-parser';
import * as config from '../src/config.js';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const OUT = resolve(root, 'chat-api/src/knowledge.json');

const PAGES = [
  { file: 'index.html', title: 'Home' },
  { file: 'features.html', title: 'Features' },
  { file: 'pricing.html', title: 'Pricing' },
  { file: 'daycare.html', title: 'Day Care' },
  { file: 'preschools.html', title: 'Pre Schools' },
  { file: 'montessori.html', title: 'Montessori' },
  { file: 'multisite.html', title: 'Multisite Centers' },
  { file: 'whats-new.html', title: "What's New" },
  { file: 'privacy.html', title: 'Privacy Policy' },
  { file: 'terms.html', title: 'Terms of Service' },
];

// Product mock-ups show invented sample data (names, amounts), and decorative or
// interactive-only markup has no informational value, so none of it is indexed.
const DROP = [
  'script', 'style', 'svg', 'noscript', 'template', 'form', 'select',
  '[aria-hidden="true"]', '[role="img"]', '.pv-scene', '.visually-hidden', '.title-chars',
  '.fx-preview', '.fx-next', '.fx-panel__actions', '.sample-tag', '[data-pricing-mount]', '[data-store-badges]', '.carousel__nav', '.ms-why__nav', '.ms-slider__nav',
];

const clean = (text) => text.replace(/\s+/g, ' ').replace(/\s([.,;:!?])/g, '$1').trim();

function textOf(node) {
  // Keep list items and headings readable as separate sentences
  node.querySelectorAll('li, h1, h2, h3, h4, p, dt, dd, button').forEach((el) => {
    el.insertAdjacentHTML('beforeend', ' ');
  });
  node.querySelectorAll('li').forEach((li) => li.insertAdjacentHTML('afterbegin', '• '));
  return clean(node.textContent);
}

function chunksForPage({ file, title }) {
  const html = readFileSync(resolve(root, file), 'utf8');
  const doc = parse(html, { comment: false });
  const main = doc.querySelector('main');
  if (!main) return [];
  DROP.forEach((sel) => main.querySelectorAll(sel).forEach((el) => el.remove()));

  const chunks = [];
  const add = (el, anchor) => {
    const heading = clean(el.querySelector('h1, h2, h3')?.textContent ?? title);
    const text = textOf(el);
    if (text.length < 60) return;
    chunks.push({ page: title, url: anchor ? `${file}#${anchor}` : file, heading, text });
  };

  // Feature details and FAQ answers are the most precise sources, so each one is its own chunk
  main.querySelectorAll('article[id], .acc-item').forEach((el) => {
    const anchor = el.getAttribute('id') ?? el.querySelector('.acc-panel')?.getAttribute('id');
    add(el, el.matches('article') ? anchor : el.closest('section')?.getAttribute('id'));
    el.remove();
  });

  main.querySelectorAll('section').forEach((section) => {
    if (section.querySelector('section')) return;
    add(section, section.getAttribute('id'));
  });
  return chunks;
}

// Public settings decide what the assistant may say about pricing, contact and the demo form.
function siteFacts() {
  const plans = config.PRICING_PLANS.map((p) => `${p.name} (${p.for})`).join('; ');
  const facts = [
    'THINKBIG is a preschool and Montessori school management platform that connects school owners, teachers and families. Tagline: "Big Ideas. Brighter Futures."',
    'The website pages are: Home (index.html), Features (features.html), Pricing (pricing.html), Day Care (daycare.html), Pre Schools (preschools.html), Montessori (montessori.html), Multisite Centers (multisite.html), What\'s New (whats-new.html), Privacy Policy (privacy.html) and Terms of Service (terms.html).',
    config.PRICING_CONFIRMED
      ? `Published plans: ${config.PRICING_PLANS.map((p) => `${p.name}: ${p.price === null ? 'price on request' : `${config.PRICING_CURRENCY}${p.price} ${p.period}`}`).join('; ')}.`
      : `Prices are not published. Pricing is tailored to each program's size and number of locations, and the team prepares a personal quote. The pricing page asks a few questions to request one. Example plan structure on the site (prices to be confirmed): ${plans}.`,
    'To book a demo or request a quote, visitors use the demo request form on the home page (index.html#demo) or the questionnaire on the pricing page (pricing.html). Every "Get a Demo" button leads there.',
    config.DEMO_FORM_ENDPOINT
      ? 'Demo and pricing requests submitted on the website are sent to the THINKBIG team.'
      : 'The website request forms currently run in preview mode: they check the answers but do not send them to the THINKBIG team yet. Say so if a visitor asks whether their request was received.',
    config.CONTACT.email || config.CONTACT.phone
      ? `Contact: ${[config.CONTACT.email, config.CONTACT.phone].filter(Boolean).join(', ')}.`
      : 'No public email address or phone number is published on the website yet. The office address is in the website footer.',
    config.APP_STORES.appStore.url || config.APP_STORES.googlePlay.url
      ? 'The THINKBIG mobile app is available in the app stores linked on the website.'
      : 'The THINKBIG mobile apps for the App Store and Google Play are marked "Coming soon".',
    config.LOGIN_URL ? 'Existing customers can log in from the Login link.' : 'Online login is not available on the website yet.',
    'Customer testimonials are not published yet; the site shows THINKBIG principles instead until customer stories are verified.',
  ];
  return { page: 'Site facts', url: 'index.html', heading: 'THINKBIG at a glance', text: facts.join(' '), pinned: true };
}

function footerChunk() {
  const doc = parse(readFileSync(resolve(root, 'partials/footer.html'), 'utf8'));
  DROP.forEach((sel) => doc.querySelectorAll(sel).forEach((el) => el.remove()));
  const brand = doc.querySelector('.footer-brand, .site-footer__brand') ?? doc;
  return { page: 'Footer', url: 'index.html#contact', heading: 'Company and address', text: textOf(brand).slice(0, 900) };
}

const chunks = [siteFacts(), footerChunk(), ...PAGES.flatMap(chunksForPage)];
const seen = new Set();
const unique = chunks.filter((c) => (seen.has(c.text) ? false : seen.add(c.text)));
unique.forEach((c, i) => { c.id = `k${i}`; });

writeFileSync(OUT, `${JSON.stringify({ generated: new Date().toISOString().slice(0, 10), chunks: unique }, null, 1)}\n`);
const chars = unique.reduce((n, c) => n + c.text.length, 0);
console.log(`knowledge.json: ${unique.length} chunks, ${chars} characters`);
