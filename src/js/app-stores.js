import { APP_STORES } from '../config.js';

const STORES = [
  { key: 'appStore', name: 'Apple App Store', badgeTop: 'Download on the', badgeName: 'App Store', icon: 'i-apple' },
  { key: 'googlePlay', name: 'Google Play Store', badgeTop: 'Get it on', badgeName: 'Google Play', icon: 'i-play' },
];

const stars = (rating) => {
  const row = '<svg viewBox="0 0 120 24" aria-hidden="true">' +
    [0, 1, 2, 3, 4].map((i) => `<path transform="translate(${i * 24} 0)" d="m12 2.5 2.9 6 6.6.8-4.9 4.5 1.3 6.5L12 17.1l-5.9 3.2 1.3-6.5L2.5 9.3l6.6-.8z" />`).join('') +
    '</svg>';
  return `<span class="stars" role="img" aria-label="Rated ${rating} out of 5">
    <span class="stars__base">${row}</span>
    <span class="stars__fill" style="width: ${(Math.min(5, rating) / 5) * 100}%">${row}</span>
  </span>`;
};

// Store badges (top strip, footer). Without a store link they show as "coming soon".
function badge(store) {
  const { url } = APP_STORES[store.key] ?? {};
  const inner = `
    <svg class="store-badge__icon" aria-hidden="true"><use href="#${store.icon}" /></svg>
    <span class="store-badge__text"><small>${store.badgeTop}</small><strong>${store.badgeName}</strong></span>`;
  return url
    ? `<a class="store-badge" href="${url}" target="_blank" rel="noopener">${inner}</a>`
    : `<span class="store-badge is-soon" aria-label="${store.badgeName}, coming soon">${inner}<em aria-hidden="true">Soon</em></span>`;
}

// Large store cards (pricing page). Stars and review counts appear only when real
// ratings are entered in src/config.js.
function card(store) {
  const { url, rating, reviews } = APP_STORES[store.key] ?? {};
  const live = Boolean(url);
  const rated = live && typeof rating === 'number';
  return `
    <li class="store-card">
      <span class="store-card__logo store-card__logo--${store.key}"><svg aria-hidden="true"><use href="#${store.icon}" /></svg></span>
      <h3>${store.name}</h3>
      ${rated
        ? `${stars(rating)}<p class="store-card__meta">${rating.toFixed(1)}${reviews ? ` · (${reviews})` : ''}</p>`
        : `<span class="chip chip--warn store-card__soon">${live ? 'New on the store' : 'Coming soon'}</span>`}
      ${live
        ? `<a class="btn btn--secondary btn--sm store-card__cta" href="${url}" target="_blank" rel="noopener">Download the app</a>`
        : '<p class="store-card__note">The THINKBIG app for families and teachers is on its way.</p>'}
    </li>`;
}

export function initAppStores() {
  document.querySelectorAll('[data-store-badges]').forEach((el) => {
    el.innerHTML = STORES.map(badge).join('');
  });
  document.querySelectorAll('[data-store-cards]').forEach((el) => {
    el.innerHTML = STORES.map(card).join('');
  });
}
