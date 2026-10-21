// Site-wide settings. Everything here ends up in public JavaScript, so never add secrets.

// Where the "Login" links go. Leave empty until the product login URL exists;
// visitors then see a friendly "not available yet" message instead of a dead link.
export const LOGIN_URL = '';

// Endpoint that receives demo requests as JSON (POST). Leave empty to run the
// form in preview mode: it validates and shows a clear "not sent" confirmation.
// Use a public form-handling URL (e.g. a Formspree/Getform form endpoint or your
// own API). Never paste a private API key here.
export const DEMO_FORM_ENDPOINT = '';

// THINKBIG AI chat. Leave empty: the chat runs as a clearly labelled preview with pre-written
// sample answers (src/js/chat/samples.js). Connecting real AI is a future step: set this to an
// API endpoint that streams answers (contract in src/js/chat/providers.js). It is a public
// address, never a secret; API keys must stay on that server and never appear in this code.
export const CHAT_API_URL = '';

// App store listings. Leave a url empty until that app is published: the site then
// shows "Coming soon". Add rating (e.g. 4.8) and reviews (e.g. '1,200+') only from the
// real store listing; stars and review counts are shown only for live apps.
export const APP_STORES = {
  appStore: { url: '', rating: null, reviews: '' },
  googlePlay: { url: '', rating: null, reviews: '' },
};

// Plans shown in the home page pricing comparison. These are an EXAMPLE structure:
// replace names, inclusions and prices with your confirmed plans. While price is null
// the site shows "Price to be confirmed" and labels the section as a placeholder.
// Set PRICING_CONFIRMED to true once everything below is final.
export const PRICING_CONFIRMED = false;
export const PRICING_CURRENCY = '₹';
export const PRICING_PLANS = [
  { id: 'starter', name: 'Starter', for: 'For a single preschool or day care getting started.', price: null, period: 'per month' },
  { id: 'growth', name: 'Growth', for: 'For schools with several classrooms and programs.', price: null, period: 'per month', featured: true },
  { id: 'group', name: 'Multi-location', for: 'For groups running two or more centers.', price: null, period: 'per month' },
];
// Each row: [feature, starter, growth, group]. true = included, false = not included,
// or a short string for a limited or different version.
export const PRICING_ROWS = [
  ['Attendance & check-in', true, true, true],
  ['Parent app & messaging', true, true, true],
  ['Daily diary & photo updates', true, true, true],
  ['Billing & fee invoices', 'Basic', true, true],
  ['Admissions & waitlists', false, true, true],
  ['Montessori observations & progress reports', false, true, true],
  ['Staff schedules', false, true, true],
  ['Multi-location dashboard', false, false, true],
  ['Onboarding support', 'Guided setup', 'Guided setup', 'Dedicated onboarding'],
];

// Public contact details shown in the Contact section. Empty values are hidden.
export const CONTACT = {
  email: '',
  phone: '',
};
