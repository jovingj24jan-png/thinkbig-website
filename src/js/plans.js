import { PRICING_CONFIRMED, PRICING_CURRENCY, PRICING_PLANS, PRICING_ROWS } from '../config.js';
import { escapeHtml } from './utils.js';

const PLAN_ICONS = ['i-home', 'i-building', 'i-pin'];
const PLAN_TINTS = ['tint-mint', 'tint-pink', 'tint-blue'];

const price = (plan) => (plan.price == null
  ? '<span class="price-card__tbc">Price to be confirmed</span>'
  : `<span class="price-card__amount">${PRICING_CURRENCY}${escapeHtml(String(plan.price))}</span><span class="price-card__period">${escapeHtml(plan.period ?? '')}</span>`);

const cell = (value) => {
  if (value === true) return '<span class="compare__yes" title="Included"><svg class="icon" aria-hidden="true"><use href="#i-check" /></svg><span class="visually-hidden">Included</span></span>';
  if (value === false) return '<span class="compare__no" aria-hidden="true">—</span><span class="visually-hidden">Not included</span>';
  return `<span class="compare__text">${escapeHtml(value)}</span>`;
};

// Home page pricing: plan cards and a comparison table, built from src/config.js.
export function initPlans() {
  const grid = document.querySelector('[data-pricing-plans]');
  const table = document.querySelector('[data-pricing-table]');
  if (!grid || !table) return;

  document.querySelector('[data-plans-flag]').hidden = PRICING_CONFIRMED;

  grid.innerHTML = PRICING_PLANS.map((plan, i) => {
    const highlights = PRICING_ROWS.filter((row) => row[i + 1] !== false).slice(0, 5);
    return `
      <li class="price-card${plan.featured ? ' price-card--featured' : ''}" data-reveal style="--d: ${i}">
        ${plan.featured ? '<span class="price-card__ribbon">Most popular</span>' : ''}
        <span class="price-card__icon ${PLAN_TINTS[i % 3]}"><svg class="icon" aria-hidden="true"><use href="#${PLAN_ICONS[i % 3]}" /></svg></span>
        <h3>${escapeHtml(plan.name)}</h3>
        <p class="price-card__for">${escapeHtml(plan.for)}</p>
        <p class="price-card__price">${price(plan)}</p>
        <ul class="price-card__list">
          ${highlights.map((row) => `<li>${escapeHtml(row[0])}${typeof row[i + 1] === 'string' ? ` <small>(${escapeHtml(row[i + 1])})</small>` : ''}</li>`).join('')}
        </ul>
        <a class="btn ${plan.featured ? 'btn--primary' : 'btn--secondary'} btn--block" href="pricing.html">${plan.price == null ? 'Get your pricing' : 'Get started'}</a>
      </li>`;
  }).join('');

  table.insertAdjacentHTML('beforeend', `
    <thead>
      <tr><th scope="col">Features</th>${PRICING_PLANS.map((p) => `<th scope="col"${p.featured ? ' class="is-featured"' : ''}>${escapeHtml(p.name)}</th>`).join('')}</tr>
    </thead>
    <tbody>
      ${PRICING_ROWS.map((row) => `<tr><th scope="row">${escapeHtml(row[0])}</th>${row.slice(1).map((v, i) => `<td${PRICING_PLANS[i]?.featured ? ' class="is-featured"' : ''}>${cell(v)}</td>`).join('')}</tr>`).join('')}
    </tbody>`);
}
