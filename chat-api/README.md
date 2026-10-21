# THINKBIG AI — chat API

The serverless backend behind the **THINKBIG AI** assistant on the website. GitHub Pages only serves static files and cannot keep a secret, so the AI provider key lives here, in a Cloudflare Worker, never in the website code.

```
Website chat panel (src/js/chat.js)
   │  POST /chat  { messages: [...] }        ← plain question text only
   ▼
Cloudflare Worker (this folder)
   ├─ checks origin, size, shape and rate limit
   ├─ removes emails and phone numbers
   ├─ retrieves the most relevant website content (src/knowledge.json)
   └─ asks Claude (claude-opus-5-5) to answer from that content, streaming the reply
   ▼
Server-sent events back to the panel: sources → text… → done | error
```

## What it does

| Concern | How |
| --- | --- |
| Model | Anthropic **Claude Opus 5.5** (`claude-opus-5-5`) through the official `@anthropic-ai/sdk`, streaming, effort `low` (fast, short answers), max 6,000 output tokens per reply. Server-side refusal fallback (`fallbacks: "default"`) is enabled: if the model declines, Anthropic retries on its recommended fallback model and the panel discards the declined partial text. |
| Grounding | `src/retrieve.js` ranks the website content (BM25 with a small synonym list) and sends the top 6 excerpts, plus a pinned "site facts" excerpt, inside the visitor's latest message. `src/prompt.js` tells the model to answer only from those excerpts, say when it doesn't know, and never invent prices, integrations, certifications or testimonials. |
| Knowledge | `src/knowledge.json` is generated from the website pages and `src/config.js` by `npm run knowledge` (in the site root). Product mock-ups with sample data are excluded. Re-run it and redeploy whenever the site content changes. |
| Secrets | `ANTHROPIC_API_KEY` is a Worker secret. It is never in the repository, the website bundle or any response. |
| Origins | Only origins listed in `ALLOWED_ORIGINS` (`wrangler.toml`) may call `/chat`; others get 403 and no CORS headers. |
| Limits | Body ≤ 32 KB, ≤ 20 messages, visitor messages ≤ 1,500 characters, total ≤ 30,000 characters, strictly alternating user/assistant turns. |
| Rate limiting | Cloudflare rate-limiting binding: 12 requests per minute per visitor IP (falls back to a best-effort in-memory limit if the binding is missing). |
| Privacy | Only the conversation text is sent to Anthropic: no IP address, cookies or identifiers. Emails and phone numbers are replaced before sending. Logs contain timings, token counts and error types, never message text. Nothing is stored server-side. |
| Errors | Provider timeouts (45 s), overload, rate limits and outages become friendly `error` events with a code (`timeout`, `busy`, `unavailable`, `refusal`) that the panel shows with a **Try again** button. |

### Endpoints

- `POST /chat`: body `{ "messages": [{ "role": "user", "content": "…" }, …] }`. Responds with `text/event-stream`, one JSON object per `data:` line:
  - `{ "type": "sources", "items": [{ "title", "url" }] }`
  - `{ "type": "text", "text": "…" }` (repeated)
  - `{ "type": "reset" }`: discard text so far (a fallback model took over)
  - `{ "type": "done", "stop": "end_turn" }` or `{ "type": "error", "code", "message" }`
  - Requests rejected before streaming get JSON: `{ "error": { "code", "message" } }` with 400, 403, 405, 413, 429 or 503.
- `GET /health`: `{ ok, configured, chunks, knowledge }` (no secrets).

## Environment

| Name | Where | Required | Purpose |
| --- | --- | --- | --- |
| `ANTHROPIC_API_KEY` | Worker **secret** | Yes | Anthropic API key (console.anthropic.com → API keys). |
| `ALLOWED_ORIGINS` | `wrangler.toml` `[vars]` | Yes | Comma-separated site origins allowed to call the API. Includes the GitHub Pages origin and local dev by default; add a custom domain if you use one. |
| `RATE_LIMITER` | `wrangler.toml` binding | Recommended | Cloudflare rate limit (12/min per IP). |
| `ANTHROPIC_BASE_URL` | Worker var | No | Only for routing through a proxy or gateway. Leave unset in production. |

## Deploy (first time)

You need a free Cloudflare account and an Anthropic API key.

```powershell
cd chat-api
npm install
npx wrangler login                       # opens the browser once
npx wrangler secret put ANTHROPIC_API_KEY # paste the key when asked
cd ..; npm run knowledge; cd chat-api     # refresh the website content
npx wrangler deploy
```

Wrangler prints the Worker address, for example `https://thinkbig-chat-api.<your-subdomain>.workers.dev`. Check it:

```powershell
curl https://thinkbig-chat-api.<your-subdomain>.workers.dev/health
# {"ok":true,"configured":true,...}
```

Then connect the website (either option):

1. **GitHub variable (recommended):** in the website repository, open **Settings → Secrets and variables → Actions → Variables** and add `CHAT_API_URL` = `https://thinkbig-chat-api.<your-subdomain>.workers.dev/chat`. Re-run the **Deploy to GitHub Pages** workflow.
2. **Or** set `CHAT_API_URL` in `src/config.js` and push.

The chat panel switches from "Not connected yet" to live answers.

### Optional: deploy from GitHub Actions

`.github/workflows/deploy-chat-api.yml` deploys the Worker when run manually (**Actions → Deploy chat API → Run workflow**). Add these repository secrets first: `CLOUDFLARE_API_TOKEN` (template "Edit Cloudflare Workers"), `CLOUDFLARE_ACCOUNT_ID`, and `ANTHROPIC_API_KEY`.

## Develop and test

```powershell
npm test          # unit and streaming tests; uses a local stand-in for the Anthropic API, no key needed
npx wrangler dev  # runs the Worker at http://127.0.0.1:8787 using chat-api/.dev.vars
```

For local development, create `chat-api/.dev.vars` (git-ignored) with `ANTHROPIC_API_KEY=...`, then run the site with `VITE_CHAT_API_URL=http://127.0.0.1:8787/chat npm run dev`.

## Cost and tuning

Every answer is one Claude request: the system prompt (~600 tokens), up to 7 excerpts (~2,000–3,000 tokens), the conversation, and a short reply. To change the model, effort or limits, edit the constants at the top of `src/index.js`. Opus 5.5 is the default for answer quality; a cheaper model is a one-line change if traffic grows, and worth measuring against real questions first.
