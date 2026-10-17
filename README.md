# THINKBIG — Marketing Website

**Big Ideas. Brighter Futures.**

The marketing site for THINKBIG, a preschool and Montessori school management platform. It's a static site built with [Vite](https://vite.dev) and vanilla JavaScript, and it deploys to GitHub Pages.

- No runtime frameworks or animation libraries. All interactions are plain JS modules.
- Fonts (Fredoka 600, Nunito Sans 400/500/700) are bundled locally through `@fontsource`. No requests go to Google Fonts.
- The first page is a live replica of the `scl.png` design. `src/assets/hero-scl.webp` is that image with the baked-in LittleBloom logo, navigation, copy, buttons, store badges and benefit labels digitally removed. The THINKBIG header, headline, buttons and benefit row are real HTML placed at the same positions; on screens 1024px and wider they are sized in `cqw` so the composition scales exactly with the picture. The animation matches the LittleBloom landing page and lives in `src/js/hero-scene.js`: the picture blurs into focus, floats and tilts toward the mouse; the sun, clouds, girl, boy, teddy, bird, stars, phone bell and highlight arrow are animated as soft-edged windows onto the same image; a lift wave runs through the headline letters; the sparkle marks burst, the pink buttons pulse and shine, and the benefit icons pop. Anything near the pointer lifts and grows (press-and-hold on touch). Keyframes are in `src/styles/motion.css`; `prefers-reduced-motion` turns it all off.
- To retune an animated part, edit its entry in the `PARTS` list in `src/js/hero-scene.js` (centre `x/y` and half-size `rx/ry` in source-image pixels, plus motion and duration).

## Requirements

- Node.js 20 or newer (22 recommended)

## Local development

```powershell
npm install
npm run dev        # http://localhost:5173
```

## Production build

```powershell
npm run build      # outputs to dist/
npm run preview    # serves dist/ at http://localhost:4173
```

## Deploying to GitHub Pages

The workflow in `.github/workflows/deploy.yml` builds and publishes the site on every push to `main`. It sets the Vite base path to `/<repository-name>/` automatically, so the repository can have any name.

1. Create a new, empty repository on GitHub (for example `thinkbig-website`).
2. Push this folder to it:

   ```powershell
   git init
   git add .
   git commit -m "Initial THINKBIG website"
   git branch -M main
   git remote add origin https://github.com/<your-user>/thinkbig-website.git
   git push -u origin main
   ```

3. On GitHub, open **Settings → Pages** and set **Source** to **GitHub Actions**.
4. Wait for the **Deploy to GitHub Pages** workflow to finish (see the **Actions** tab). The site will be at `https://<your-user>.github.io/<repository-name>/`.

If you use a different repository name or a custom domain, update `VITE_SITE_URL` in `.env`. It's used for the canonical URL and social-sharing tags. The workflow fills it in automatically for the default `github.io` address.

## Configuration

All settings live in `src/config.js`:

| Setting | Purpose |
| --- | --- |
| `LOGIN_URL` | Target of every **Login** link. While empty, clicking Login shows a "not available yet" message. |
| `DEMO_FORM_ENDPOINT` | URL that receives demo requests and pricing requests (sent with `type: "pricing"`) as a JSON `POST`. While empty, the form runs in **preview mode**: it validates input and clearly tells the visitor the request was **not** sent. |
| `APP_STORES` | App Store and Google Play listings. While a `url` is empty, the store badges (pricing page strip and every footer) and the store cards (pricing page) show **Coming soon**. Add the real store `url`, and the `rating` and `reviews` from that listing, to show download links, stars and review counts. Never enter ratings that aren't on the real listing. |
| `CONTACT.email` / `CONTACT.phone` | Public contact details shown under the address in the Contact section. Hidden while empty. |

### Connecting the demo form

1. Create a form endpoint with a static-site form service (for example Formspree, Getform or Basin), or with your own API that accepts JSON and allows CORS from your site.
2. Paste the public endpoint URL into `DEMO_FORM_ENDPOINT` in `src/config.js`.
3. Rebuild and deploy. The success message will then say the request was sent.

The form sends `name`, `email`, `organization`, `role`, `locations` and `message`. **Never put secret API keys in this project.** Everything in `src/config.js` and `.env` is shipped to the browser.

## Home page structure

The home page follows the section structure of mybrightwheel.com, with THINKBIG content and the Playful Pastel theme:

1. Hero: the scl.png illustration with the headline, Book a Demo / Explore Features and the benefit row, animated as on the LittleBloom page (`src/js/hero-scene.js`).
2. Proof strip with the app store badges.
3. Four value cards.
4. Who we serve (Day Care, Pre Schools, Multisite Centers, Montessori), in place of a customer-logo wall until real logos exist.
5. Feature accordion: five categories, each with its own interactive product panel (fees, parent app, Montessori journey, teacher register, school dashboard).
6. Savings estimate: the assumptions are shown on the page and set at the top of `src/js/home.js`.
7. Principles carousel, in place of testimonials until verified customer stories exist.
8. Product facts (no invented customer metrics).
9. Getting started.
10. Designed with you in mind (owners, teachers, families).
11. Tour: the questionnaire again.
12. FAQ and the demo request form.

The full feature explorer is on `features.html`; the plan comparison is on `pricing.html`.

## Design system

Tokens, type scale, component states, Figma structure and accessibility notes are documented in [`docs/design-system.md`](docs/design-system.md). Home page plans and prices are set in `src/config.js` (`PRICING_PLANS`, `PRICING_ROWS`, `PRICING_CONFIRMED`).

## Shared header and footer

The header, mobile menu, search and footer live once in `partials/`. Each page includes them with `<!-- include:header -->` and similar comments, and the small plugin in `vite.config.js` stitches them in during development and build. Edit the partial once and every page updates.

## Project structure

```text
thinkbig-website/
├── .github/workflows/deploy.yml   GitHub Pages build and deploy
├── public/                        Copied as-is (favicon, social image)
├── src/
│   ├── config.js                  Login URL, form endpoint, contact details
│   ├── main.js                    Entry: fonts, styles, feature modules
│   ├── legal.js                   Entry for the legal pages
│   ├── js/
│   │   ├── header.js              Dropdowns, mobile drawer, sticky header
│   │   ├── search.js              Local site search (Ctrl+K or /)
│   │   ├── accordion.js           FAQ accordion
│   │   ├── demo-form.js           Validation and submission states
│   │   ├── pricing-form.js        Pricing questionnaire card (rendered into each [data-pricing-mount])
│   │   ├── features.js            Feature explorer (details for each feature in the Features section)
│   │   ├── home.js                Home page: feature accordion, savings estimate, carousel, hero artwork
│   │   ├── showcase.js            Interactive dashboard, register and journey previews
│   │   ├── site-links.js          Anchors, demo CTAs, login, copy address, back to top
│   │   ├── motion.js              Scroll reveal and hero parallax
│   │   └── utils.js               Toast, focus-aware scrolling, helpers
│   └── styles/
│       ├── tokens.css             Playful Pastel v1.0 design tokens
│       ├── base.css               Reset, typography, shared utilities
│       ├── components.css         Buttons, header, dialogs, accordion, forms
│       ├── hero.css               Hero layout, illustration scene, phone mockup
│       ├── sections.css           All other page sections and the footer
│       ├── motion.css             Keyframes, reveal, reduced-motion rules
│       └── legal.css              Legal page layout
├── index.html                     The landing page
├── features.html                  Feature explorer (all 19 features)
├── pricing.html                   Pricing: questionnaire, features panel, plan comparison
├── partials/                      Shared sprite, header and footer (stitched in by vite.config.js)
├── privacy.html                   Privacy Policy placeholder
├── terms.html                     Terms of Service placeholder
└── vite.config.js
```

## Placeholders to replace before launch

- **Privacy Policy / Terms of Service**: `privacy.html` and `terms.html` are clearly marked drafts.
- **Testimonials**: the "What we believe" section stands in for customer stories. Its placeholder box is marked in `index.html`.
- **Pricing**: the cards say "Contact us for pricing". No prices or plan features are invented.
- **What's New**: a short product-updates note in the trust section.
- **Login URL, form endpoint, email, phone, app store links and ratings**: set in `src/config.js`.
- All names and figures in product previews are fictional sample data.

## Accessibility and motion

- Semantic landmarks, a skip link, a logical heading order and visible focus rings.
- Dropdowns, drawer, search and FAQ all work with the keyboard (Arrow keys, Escape, Home/End).
- The form has visible labels, inline error messages linked with `aria-describedby`, and a live status region.
- `prefers-reduced-motion` turns off continuous animation, parallax and reveal effects. Continuous decoration also stops below 640px.
