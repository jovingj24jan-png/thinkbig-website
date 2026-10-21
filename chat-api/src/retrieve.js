// Keyword retrieval (BM25) over the approved website content in knowledge.json.
// The corpus is small, so an in-memory index built once per Worker isolate is enough.

const STOP = new Set(('a an and are as at be but by can do does for from has have how i if in into is it its me my of on or our so ' +
  'that the their them there these they this to was we what when where which who why will with you your about any also ' +
  'get just like more most need some than then very want would could should tell know please').split(' '));

// Visitors' words mapped to the words the website uses
const SYNONYMS = {
  fee: ['billing', 'invoice', 'payment'], fees: ['billing', 'invoice', 'payment'], pay: ['payment', 'billing'],
  tuition: ['fee', 'billing'], price: ['pricing', 'quote'], cost: ['pricing', 'quote'], plan: ['pricing'],
  parent: ['family', 'families'], parents: ['family', 'families'], guardian: ['family'],
  attendance: ['check', 'headcount'], checkin: ['attendance', 'check'], register: ['attendance'],
  branch: ['multi', 'location', 'center'], branches: ['multi', 'location', 'center'], locations: ['location', 'multi', 'multisite'],
  campus: ['location', 'center'], multisite: ['multi', 'location'], centre: ['center'], centres: ['center'],
  demo: ['tour', 'demo'], tour: ['demo'], contact: ['address', 'demo', 'team'],
  admission: ['enrollment', 'enquiry', 'waitlist'], admissions: ['enrollment', 'enquiry', 'waitlist'], enrol: ['enrollment'],
  diary: ['daily', 'update'], updates: ['update', 'daily'], photos: ['photo', 'update'],
  teacher: ['staff', 'teachers'], teachers: ['staff'], rota: ['staff', 'schedule'], schedule: ['staff', 'rota'],
  observation: ['montessori', 'observations'], progress: ['report', 'reports'], report: ['reports'],
  safety: ['health', 'allergy', 'pickup'], allergy: ['health', 'safety'], secure: ['privacy', 'information'],
  security: ['privacy', 'information', 'health', 'safety'], app: ['mobile', 'parent'],
};

const stem = (w) => w.replace(/(ies)$/, 'y').replace(/(ing|ed|es|s)$/, '');

export function tokenize(text) {
  const words = text.toLowerCase().replace(/check[\s-]?in/g, 'checkin').split(/[^a-z0-9]+/);
  return words.filter((w) => w.length > 1 && !STOP.has(w)).map(stem);
}

function expand(tokens, raw) {
  const extra = [];
  raw.toLowerCase().split(/[^a-z0-9]+/).forEach((w) => (SYNONYMS[w] ?? []).forEach((s) => extra.push(stem(s))));
  return [...tokens, ...extra];
}

export function createIndex(chunks) {
  // Headings are short and precise, so they count twice
  const docs = chunks.map((c) => tokenize(`${c.heading} ${c.heading} ${c.page} ${c.text}`));
  const df = new Map();
  docs.forEach((d) => new Set(d).forEach((t) => df.set(t, (df.get(t) ?? 0) + 1)));
  const avg = docs.reduce((n, d) => n + d.length, 0) / docs.length;
  const tf = docs.map((d) => d.reduce((m, t) => m.set(t, (m.get(t) ?? 0) + 1), new Map()));
  return { chunks, docs, df, avg, tf, n: docs.length };
}

export function search(index, query, { k = 6 } = {}) {
  const terms = [...new Set(expand(tokenize(query), query))];
  const K1 = 1.4;
  const B = 0.75;
  const scored = index.chunks.map((chunk, i) => {
    let score = 0;
    for (const t of terms) {
      const f = index.tf[i].get(t);
      if (!f) continue;
      const idf = Math.log(1 + (index.n - index.df.get(t) + 0.5) / (index.df.get(t) + 0.5));
      score += idf * ((f * (K1 + 1)) / (f + K1 * (1 - B + (B * index.docs[i].length) / index.avg)));
    }
    return { chunk, score };
  });
  const hits = scored.filter((s) => s.score > 0 && !s.chunk.pinned).sort((a, b) => b.score - a.score).slice(0, k);
  // Site facts (pricing status, demo form, contact) apply to every answer
  return [...index.chunks.filter((c) => c.pinned), ...hits.map((h) => h.chunk)];
}
