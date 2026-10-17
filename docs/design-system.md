# THINKBIG Design System — Playful Pastel

Implementation reference for the marketing website. It mirrors the project design
specification and the planned Figma file, so tokens, components and states have the
same names in design and code.

## 1. Design tokens

All tokens are CSS custom properties in `src/styles/tokens.css`. Use them instead of
hardcoded values.

### Colour

| Token | Value | Use |
| --- | --- | --- |
| `--primary` | `#F46B9B` | Primary CTAs, highlights, important actions |
| `--primary-hover` | `#D93D77` | Button hover and active states |
| `--primary-text` | `#C2306A` | Pink for small text and labels (AA on light surfaces) |
| `--secondary` | `#A7D8F0` | Learning sections, secondary visuals |
| `--yellow` | `#FFD966` | Rewards, achievements, decorations |
| `--mint` | `#B8E6C1` | Health, wellbeing, positive states |
| `--lavender` | `#D5C5F2` | Creative activities, imagination |
| `--peach` | `#FFBE98` | Events and celebrations |
| `--background` | `#FFFDF8` | Page background |
| `--surface` | `#FFFFFF` | Cards, forms, content surfaces |
| `--heading` | `#344563` | Headings, body text, essential labels |
| `--muted` | `#64748B` | Secondary descriptions |
| `--border` | `#EAE7E2` | Dividers, input borders, card outlines |

Feature card backgrounds: `--card-attendance` `#E4F5E9`, `--card-activities` `#FCE7F0`,
`--card-meals` `#FFF1CC`, `--card-learning` `#E3F2FC`, `--card-health` `#FFE6E8`,
`--card-communication` `#E5F8F5`.

Status: `--ok` / `--ok-bg`, `--warn` / `--warn-bg`, `--error` / `--error-bg`.

Balance: roughly 60% warm white, 20% pastel, 10% navy, 10% pink. Pastels are
backgrounds, never small text.

### Typography

| Token | Mobile → desktop | Font |
| --- | --- | --- |
| `--fs-hero` | 38 → 64px | Fredoka 600 |
| `--fs-h2` | 30 → 44px | Fredoka 600 |
| `--fs-h3` | 24 → 28px | Fredoka 600 |
| `--fs-body` | 17px (16–18px range) | Nunito Sans 400 |
| `--fs-btn` | 16px | Nunito Sans 700 |
| `--fs-sm` | 14px | Nunito Sans 500 |

`--font-heading` (Fredoka) and `--font-body` (Nunito Sans). Heading line height 1.1–1.2,
body 1.5–1.6. Fonts are self-hosted from `@fontsource` packages: the same Google Fonts
families, bundled with the site so it works offline and sends no requests to Google.

### Shape, spacing and motion

- Radii: `--radius-sm` 12px, `--radius-md` 16px, `--radius-lg` 24px (cards), `--radius-xl` 32px, `--radius-pill` 50px.
- Spacing: 4px base scale `--s-1` … `--s-16`; sections use `--section-y`.
- Buttons: `--btn-h` 56px, `--btn-pad-x` 32px for large CTAs.
- Motion: `--t-fast` 160ms and `--t-base` 220ms for UI transitions; entrances 400–600ms.
  `prefers-reduced-motion` turns continuous motion off.

## 2. Components and states

| Component | Where | States implemented |
| --- | --- | --- |
| Primary button (`.btn--primary`, `.hero-btn--primary`) | CTAs | default, hover, active, focus-visible, disabled, loading (`.is-loading`) |
| Secondary button (`.btn--secondary`, `.hero-btn--secondary`) | CTAs | default, hover, active, focus-visible |
| Card (`.module-card`, `.price-card`, `.h-card`…) | Sections | default, hover lift |
| Input / select / textarea (`.field`) | Demo and pricing forms | default, hover, focus, error (`.has-error` + message linked by `aria-describedby`), valid |
| Accordion (`.acc-item`) | FAQ | collapsed, expanded (`aria-expanded`), focus-visible, keyboard (arrows, Home, End) |
| Dropdown / mega menu (`.nav-menu`) | Header | closed, open (hover, click, keyboard), Escape to close |
| Pricing questionnaire (`.pf-card`) | Pricing page | each step, error, loading, success, exit messages |
| Feature explorer (`.fx`) | Features | selected item, panel entrance |
| Toast (`.toast`) | Global | hidden, visible |

Focus: every interactive element shows a 3px `--primary-hover` outline with 3px offset.

## 3. Illustration and icons

- The hero uses one soft 3D clay illustration (`src/assets/hero-scl.webp`).
- Decorative SVG art (sun, clouds, rainbow, stars) uses radial-gradient "clay" lighting
  to stay in the same family.
- Icons: inline SVG sprite, 24px grid, 2px rounded strokes.
- Informative images have descriptive `alt`; decorative ones are `aria-hidden` or empty `alt`.

## 4. Figma structure

Organise the design file to match the code:

1. **Brand Foundations:** logo, voice, colour balance.
2. **Design Tokens:** variables named exactly as in section 1.
3. **Components:** variants for each state in section 2.
4. **Illustrations:** clay character and scene library.
5. **Website Desktop:** 1440 and 1280 frames.
6. **Website Mobile:** 768, 390 and 320 frames.
7. **School Dashboard**
8. **Teacher App**
9. **Parent App**
10. **Prototypes**

Use Auto Layout, variables, component variants and named states (`hover`, `focus`,
`disabled`, `loading`, `error`, `success`, `empty`).

## 5. Accessibility notes

Checked with an automated contrast audit of both pages. Two values required by the
brand specification do not meet WCAG AA:

- White text on `--primary` buttons: 2.8:1 (AA needs 4.5:1).
- "Minds" in `--secondary` in the hero headline: 1.5:1 (AA large text needs 3:1).

To meet AA, set `--btn-primary-bg: var(--primary-text);` (`#C2306A`, 5.3:1) in
`tokens.css`, and use a deeper blue such as `#2F8FCB` (3.5:1) for "Minds". These need a
brand decision.
