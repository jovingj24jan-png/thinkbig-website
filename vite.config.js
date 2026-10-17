import { readFileSync } from 'node:fs';
import { basename, resolve } from 'node:path';
import { defineConfig, loadEnv } from 'vite';

const root = import.meta.dirname;

// Shared page chrome: <!-- include:name --> is replaced with partials/name.html.
// {{home}} becomes '' on the home page (in-page links) and './' on other pages, and
// {{current:page}} marks the nav link for the current page.
function htmlPartials() {
  return {
    name: 'html-partials',
    transformIndexHtml: {
      order: 'pre',
      handler(html, ctx) {
        const page = basename(ctx.filename, '.html');
        return html
          .replace(/<!--\s*include:([\w-]+)\s*-->/g, (_, name) => readFileSync(resolve(root, 'partials', `${name}.html`), 'utf8'))
          .replaceAll('{{home}}', page === 'index' ? '' : './')
          .replace(/\{\{current:([\w-]+)\}\}/g, (_, name) => (name === page ? ' aria-current="page"' : ''));
      },
    },
    handleHotUpdate({ file, server }) {
      if (file.replaceAll('\\', '/').includes('/partials/')) {
        server.ws.send({ type: 'full-reload' });
        return [];
      }
    },
  };
}

// GitHub Pages serves a project repository from /<repo-name>/.
// The deploy workflow sets BASE_PATH from the repository name automatically;
// locally we fall back to VITE_BASE_PATH in .env (or "/").
export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '');
  const base = process.env.BASE_PATH || env.VITE_BASE_PATH || '/';

  return {
    base,
    plugins: [htmlPartials()],
    build: {
      outDir: 'dist',
      assetsInlineLimit: 0,
      rollupOptions: {
        input: {
          main: resolve(root, 'index.html'),
          pricing: resolve(root, 'pricing.html'),
          features: resolve(root, 'features.html'),
          whatsNew: resolve(root, 'whats-new.html'),
          daycare: resolve(root, 'daycare.html'),
          preschools: resolve(root, 'preschools.html'),
          multisite: resolve(root, 'multisite.html'),
          montessori: resolve(root, 'montessori.html'),
          privacy: resolve(root, 'privacy.html'),
          terms: resolve(root, 'terms.html'),
        },
      },
    },
  };
});
