# `app/` — Next.js App Router

- **File-system routing:** folders define URLs.
- **`(marketing)`** — route **group** (parentheses = not in URL): public landing at `/`.
- **`(flow)`** — route group: authenticated-style **wizard** pages at `/brain-dump`, `/intake`, etc.
- **`api/`** — **server-only** Route Handlers (`route.ts`). These run on the Node server (or edge if configured), can read **secret** env vars, and call OpenAI — the browser never sees `OPENAI_API_KEY`.

See [`docs/CODEMAP.md`](../../docs/CODEMAP.md) for a full route → feature table.
