const BASE = import.meta.env.BASE_URL;

export const escapeHtml = (s) => s.replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]);

// Only links to this website's own pages are rendered as links
export function safeHref(href) {
  if (/^#[\w-]+$/.test(href)) return href;
  const m = href.match(/^(?:\.\/|\/)?([a-z-]+\.html)(#[\w-]+)?$/);
  return m ? `${BASE}${m[1]}${m[2] ?? ''}` : null;
}

function inline(text) {
  return escapeHtml(text)
    .replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>')
    .replace(/\[([^\]]+)\]\(([^)\s]+)\)/g, (all, label, href) => {
      const url = safeHref(href.replace(/&amp;/g, '&'));
      return url ? `<a href="${url}">${label}</a>` : label;
    });
}

// A small Markdown subset: paragraphs, bullet lists, bold and site links
export function renderMarkdown(text) {
  const blocks = [];
  let list = null;
  text.split('\n').forEach((line) => {
    const item = line.match(/^\s*(?:[-*•]|\d+\.)\s+(.*)/);
    if (item) {
      list ??= [];
      list.push(`<li>${inline(item[1])}</li>`);
      return;
    }
    if (list) { blocks.push(`<ul>${list.join('')}</ul>`); list = null; }
    if (line.trim()) blocks.push(`<p>${inline(line.trim())}</p>`);
  });
  if (list) blocks.push(`<ul>${list.join('')}</ul>`);
  return blocks.join('');
}
