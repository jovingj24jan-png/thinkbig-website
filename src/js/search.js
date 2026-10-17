import { goTo, escapeHtml } from './utils.js';

// Local, client-side index of the site. Add an entry here when you add a section.
// '#…' targets are on the home page; links to other pages open them.
const INDEX = [
  { title: 'Features overview', desc: 'Everything your preschool needs', href: 'features.html', icon: 'i-sparkle', tint: 'tint-yellow', keywords: 'features tools platform all' },
  { title: 'Billing & payments', desc: 'Billing & finances · Set up fee plans once and let THINKBIG raise invo', href: 'features.html#f-billing-payments', icon: 'i-wallet', tint: 'tint-yellow', keywords: 'feature billing & finances fee plans by program, class or child recurring and one-off charges a clear balance for every family gentle reminders for overdue fees' },
  { title: 'Fee invoices', desc: 'Billing & finances · Create neat, branded invoices in seconds and send', href: 'features.html#f-fee-invoices', icon: 'i-wallet', tint: 'tint-yellow', keywords: 'feature billing & finances your school name and logo on every invoice discounts, sibling offers and late fees send through the app or by email download or print any time' },
  { title: 'Payment receipts', desc: 'Billing & finances · Every recorded payment gets a receipt, so familie', href: 'features.html#f-payment-receipts', icon: 'i-wallet', tint: 'tint-yellow', keywords: 'feature billing & finances receipts issued as payments are recorded full payment history for each family statements for any date range easy to share or reprint' },
  { title: 'Expense tracking', desc: 'Billing & finances · Log school spending alongside fees to see where t', href: 'features.html#f-expense-tracking', icon: 'i-wallet', tint: 'tint-yellow', keywords: 'feature billing & finances categories for supplies, food, staff and more attach bills and photos monthly income and spending view export for your accountant' },
  { title: 'Family communication', desc: 'Staff & family · Message families one-to-one, by class or school-wide,', href: 'features.html#f-family-communication', icon: 'i-chat', tint: 'tint-pink', keywords: 'feature staff & family class and school announcements private messages with parents photo and video updates read status, so nothing is missed' },
  { title: 'Daily diary', desc: 'Staff & family · Teachers capture meals, naps, activities and moods in', href: 'features.html#f-daily-diary', icon: 'i-chat', tint: 'tint-pink', keywords: 'feature staff & family quick-tap entries for daily routines photos attached to moments notes for each child shared with families as you go' },
  { title: 'Staff schedules', desc: 'Staff & family · Plan shifts and room assignments so every classroom i', href: 'features.html#f-staff-schedules', icon: 'i-chat', tint: 'tint-pink', keywords: 'feature staff & family weekly rota by room leave and cover at a glance staff check-in and check-out updates when schedules change' },
  { title: 'Classroom management', desc: 'Staff & family · Organize rooms, children and routines so teachers alw', href: 'features.html#f-classroom-management', icon: 'i-chat', tint: 'tint-pink', keywords: 'feature staff & family rooms, age groups and capacities move children between rooms daily routines for each class room numbers at a glance' },
  { title: 'Parent mobile app', desc: 'Staff & family · Families get one friendly app for updates, photos, fe', href: 'features.html#f-parent-app', icon: 'i-chat', tint: 'tint-pink', keywords: 'feature staff & family daily updates and photos fees, invoices and receipts messages and announcements attendance and pickup details' },
  { title: 'Montessori observations', desc: 'Learning & development · Record what you see across the Montessori are', href: 'features.html#f-montessori-observations', icon: 'i-sprout', tint: 'tint-lav', keywords: 'feature learning & development practical life, sensorial, language, maths and cultural photos and notes on every observation introduced, practising and confident stages shared with families when you choose' },
  { title: 'Lesson planning', desc: 'Learning & development · Plan weekly themes and activities, and link t', href: 'features.html#f-lesson-planning', icon: 'i-sprout', tint: 'tint-lav', keywords: 'feature learning & development weekly plans for each class a reusable activity library materials list for every activity plans linked to learning areas' },
  { title: 'Daily routines', desc: "Learning & development · Set each class's rhythm of the day, so teache", href: 'features.html#f-daily-routines', icon: 'i-sprout', tint: 'tint-lav', keywords: 'feature learning & development templates for each age group arrival, circle, work cycle, meals and rest changes shared with families printable day plans' },
  { title: 'Progress reports', desc: 'Learning & development · Turn observations into warm, clear reports th', href: 'features.html#f-progress-reports', icon: 'i-sprout', tint: 'tint-lav', keywords: 'feature learning & development built from your observations teacher comments for each area term or custom reporting periods share digitally or print' },
  { title: 'Admissions & enrollment', desc: 'School management · Follow every family from first enquiry to first da', href: 'features.html#f-admissions-enrollment', icon: 'i-building', tint: 'tint-blue', keywords: 'feature school management online enquiry and application forms tour booking and follow-ups waitlists by program offer and enrollment tracking' },
  { title: 'Attendance & check-in', desc: 'School management · Check children in and out with a tap and see a liv', href: 'features.html#f-attendance-checkin', icon: 'i-building', tint: 'tint-blue', keywords: 'feature school management one-tap check-in and check-out live headcount by room absence notes from parents attendance reports by day or month' },
  { title: 'Multi-location dashboard', desc: 'School management · Run several centers from one login, switching betw', href: 'features.html#f-multi-location', icon: 'i-building', tint: 'tint-blue', keywords: 'feature school management switch between locations instantly group-wide reports shared settings and fee plans access by role and location' },
  { title: 'Health & safety records', desc: 'School management · Keep allergies, medical notes and authorized picku', href: 'features.html#f-health-safety', icon: 'i-building', tint: 'tint-blue', keywords: 'feature school management allergy and medical notes authorized pickup list incident and wellbeing notes safety drills and notices' },
  { title: 'Meals & nutrition', desc: 'School management · Plan menus, note dietary needs and record what eac', href: 'features.html#f-meals-nutrition', icon: 'i-building', tint: 'tint-blue', keywords: 'feature school management weekly menus shared with families dietary needs flagged at mealtimes quick meal logging for each child water and snack tracking' },
  { title: 'Forms & documents', desc: 'School management · Collect consent forms, records and documents digit', href: 'features.html#f-forms-documents', icon: 'i-building', tint: 'tint-blue', keywords: 'feature school management digital consent and permission forms documents stored for each child and staff member reminders for missing forms parents complete forms from their phone' },
  { title: 'Who we serve', desc: 'Every kind of early-years program', href: '#who-we-serve', icon: 'i-users', tint: 'tint-pink', keywords: 'who we serve audience programs schools' },
  { title: 'Pre Schools', desc: 'You run a preschool with an early-learning program', href: '#serve-preschools', icon: 'i-building', tint: 'tint-blue', keywords: 'who we serve audience program preschools' },
  { title: 'Montessori', desc: 'Your classrooms follow Montessori principles', href: '#serve-montessori', icon: 'i-sprout', tint: 'tint-lav', keywords: 'who we serve audience program montessori schools' },
  { title: 'Day Care', desc: 'You care for little ones through meals, naps and play', href: '#serve-daycare', icon: 'i-heart', tint: 'tint-pink', keywords: 'who we serve audience program daycare & childcare centers' },
  { title: 'Multisite Centers', desc: 'You manage several centers or branches', href: '#serve-multisite', icon: 'i-pin', tint: 'tint-rose', keywords: 'who we serve audience program multi-location groups' },
  { title: 'For schools & owners', desc: 'Admissions, billing and the school dashboard', href: '#cat-admissions', icon: 'i-building', tint: 'tint-blue', keywords: 'schools owners directors principal dashboard reports' },
  { title: 'For teachers', desc: 'Attendance, diaries and observations', href: '#cat-management', icon: 'i-pencil', tint: 'tint-mint', keywords: 'teachers staff diary app mobile' },
  { title: 'For parents', desc: 'Daily updates in the parent app', href: '#cat-communication', icon: 'i-heart', tint: 'tint-pink', keywords: 'parents families guardians app updates meals naps' },
  { title: 'Montessori learning journey', desc: 'Practical Life, Sensorial, Language and more', href: '#cat-learning', icon: 'i-sprout', tint: 'tint-lav', keywords: 'montessori practical life sensorial language mathematics cultural creative' },
  { title: 'Health, safety & wellbeing', desc: 'Allergies, pickups and wellbeing', href: '#cat-management', icon: 'i-shield', tint: 'tint-rose', keywords: 'health safety allergy allergies medical pickup wellbeing nutrition meals' },
  { title: 'How it works', desc: 'Three steps to get started', href: '#how-it-works', icon: 'i-sparkle', tint: 'tint-yellow', keywords: 'how it works setup onboarding start steps' },
  { title: 'Pricing', desc: 'Plans and a tailored quote', href: 'pricing.html', icon: 'i-wallet', tint: 'tint-yellow', keywords: 'pricing price cost plans quote' },
  { title: 'Savings estimate', desc: 'See how much time THINKBIG could save', href: '#savings', icon: 'i-clock', tint: 'tint-mint', keywords: 'savings calculator estimate time hours cost' },
  { title: 'FAQ', desc: 'Frequently asked questions', href: '#faq', icon: 'i-question', tint: 'tint-blue', keywords: 'faq questions help' },
  { title: 'Book a demo', desc: 'Request a walkthrough', href: '#demo', icon: 'i-mail', tint: 'tint-pink', keywords: 'demo contact book request call talk sales' },
  { title: 'Contact & address', desc: 'Koramangala, Bengaluru', href: '#demo', icon: 'i-pin', tint: 'tint-pink', keywords: 'contact address location office bengaluru bangalore koramangala ejipura' },
];

// FAQ questions are indexed straight from the page so they never drift out of sync.
function faqEntries() {
  return [...document.querySelectorAll('.acc-trigger')].map((btn) => ({
    title: btn.textContent.trim(),
    desc: 'FAQ',
    href: `#${btn.getAttribute('aria-controls')}`,
    icon: 'i-question',
    tint: 'tint-blue',
    keywords: btn.closest('.acc-item').querySelector('.acc-panel').textContent,
  }));
}

const SUGGESTED = ['features.html', 'pricing.html', '#cat-learning', '#demo'];

function highlight(text, terms) {
  let html = escapeHtml(text);
  terms.forEach((term) => {
    const safe = escapeHtml(term).replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    html = html.replace(new RegExp(`(${safe})`, 'gi'), '<mark>$1</mark>');
  });
  return html;
}

export function initSearch() {
  const dialog = document.querySelector('[data-search]');
  if (!dialog) return;
  const input = dialog.querySelector('[data-search-input]');
  const results = dialog.querySelector('[data-search-results]');
  const count = dialog.querySelector('[data-search-count]');
  const entries = [...INDEX, ...faqEntries()];

  const render = () => {
    const query = input.value.trim().toLowerCase();
    const terms = query.split(/\s+/).filter(Boolean);

    let matches;
    if (!terms.length) {
      matches = SUGGESTED.map((href) => entries.find((e) => e.href === href)).filter(Boolean);
      count.textContent = 'Popular pages';
    } else {
      matches = entries
        .map((entry) => {
          const title = entry.title.toLowerCase();
          const haystack = `${title} ${entry.desc} ${entry.keywords}`.toLowerCase();
          if (!terms.every((t) => haystack.includes(t))) return null;
          const score = terms.reduce((s, t) => s + (title.includes(t) ? 3 : 1), 0);
          return { entry, score };
        })
        .filter(Boolean)
        .sort((a, b) => b.score - a.score)
        .slice(0, 8)
        .map((m) => m.entry);
      count.textContent = `${matches.length} result${matches.length === 1 ? '' : 's'}`;
    }

    if (!matches.length) {
      results.innerHTML = `<li class="search__empty">No results for “${escapeHtml(input.value.trim())}”. Try “attendance”, “billing” or “pricing”.</li>`;
      return;
    }

    results.innerHTML = matches
      .map(
        (e) => `<li><a class="search__result" href="${e.href}">
          <span class="menu-link__icon ${e.tint}"><svg class="icon" aria-hidden="true"><use href="#${e.icon}"/></svg></span>
          <span><strong>${highlight(e.title, terms)}</strong><small>${escapeHtml(e.desc)}</small></span>
        </a></li>`,
      )
      .join('');
  };

  const open = () => {
    document.querySelector('[data-mobile-menu]')?.close();
    input.value = '';
    render();
    dialog.showModal();
    input.focus();
  };

  // Sections that live on the home page open it when searching from another page
  const go = (href) => {
    dialog.close();
    requestAnimationFrame(() => {
      if (!goTo(href)) location.href = href.startsWith('#') ? `./${href}` : href;
    });
  };

  document.querySelectorAll('[data-search-open]').forEach((btn) => btn.addEventListener('click', open));
  dialog.querySelector('[data-search-close]').addEventListener('click', () => dialog.close());
  dialog.addEventListener('click', (e) => e.target === dialog && dialog.close());

  input.addEventListener('input', render);

  dialog.querySelector('[data-search-form]').addEventListener('submit', (e) => {
    e.preventDefault();
    const first = results.querySelector('a');
    if (first) go(first.getAttribute('href'));
  });

  results.addEventListener('click', (e) => {
    const link = e.target.closest('a');
    if (!link) return;
    e.preventDefault();
    go(link.getAttribute('href'));
  });

  dialog.addEventListener('keydown', (e) => {
    if (e.key !== 'ArrowDown' && e.key !== 'ArrowUp') return;
    const links = [...results.querySelectorAll('a')];
    if (!links.length) return;
    e.preventDefault();
    const index = links.indexOf(document.activeElement);
    if (e.key === 'ArrowDown') links[Math.min(index + 1, links.length - 1)].focus();
    else if (index <= 0) input.focus();
    else links[index - 1].focus();
  });

  document.addEventListener('keydown', (e) => {
    const typing = e.target.closest('input, textarea, select, [contenteditable]');
    const shortcut = (e.key === '/' && !typing) || ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k');
    if (!shortcut || dialog.open) return;
    e.preventDefault();
    open();
  });
}
