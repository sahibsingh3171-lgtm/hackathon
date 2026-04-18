# `src/` — application source

**Start here for navigation:** [`docs/CODEMAP.md`](../docs/CODEMAP.md).

| Folder | Role |
|--------|------|
| `features/` | **Judge-friendly bundles** — one folder per product area (`README.md` + thin `index.ts` re-exports); see `features/README.md` |
| `app/` | Next.js App Router: **pages**, **layouts**, and **Route Handlers** (`api/`) — server + client entry points |
| `components/` | React UI (product, marketing, layout shell, shadcn primitives) |
| `contexts/` | Client-side global state (Clarity session) |
| `data/` | Mock / demo **datasets** (not runtime config) |
| `hooks/` | Reusable client hooks (e.g. voice dictation) |
| `lib/` | **Feature logic**, AI helpers, env, validation — importable from server or client as appropriate |
| `types/` | Shared TypeScript types |
| `schemas/` | JSON Schema artifacts (e.g. contract documentation) |

Subfolders include their own `README.md` with a one-line “what lives here.”
