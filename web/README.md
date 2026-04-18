# Web app (`web/`)

**→ Codebase map (features, APIs, traceability): [`docs/CODEMAP.md`](docs/CODEMAP.md)**  
Folder labels: each major directory under `src/` has a short `README.md`.

Next.js (App Router) frontend for the hackathon: **TypeScript**, **Tailwind CSS v4**, **shadcn/ui** (base-nova preset), and **Clarity** design tokens (Inter body, Fraunces headings, optional JetBrains Mono).

## Prerequisites

- **Node.js** LTS (18+ or 20+)
- **npm** (this repo uses `package-lock.json` only — do not mix pnpm/yarn/bun for installs)

## Local setup

From the **repository root**:

```bash
cd web
cp .env.example .env.local
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

Edit marketing copy in `src/app/(marketing)/page.tsx`, the Clarity flow under `src/app/(flow)/`, shared chrome in `src/components/layout/`, and root `src/app/layout.tsx`. Design tokens live in `src/app/globals.css`.

### Environment variables

- Copy **`.env.example` → `.env.local`** (never commit secrets).
- **`NEXT_PUBLIC_*`** variables are exposed to the browser; keep service keys server-only.
- For future Supabase wiring, read public config via `src/lib/env.ts` (`getSupabasePublicConfig()` returns `null` if unset; use `assertSupabasePublicConfig()` only when the feature truly requires Supabase).

## Project layout (MVP)

For a **judge-ready walkthrough** (brain dump → API → prompts → matching), see **[`docs/CODEMAP.md`](docs/CODEMAP.md)**.

| Area | Path |
|------|------|
| **Routes** | `src/app/layout.tsx` + `globals.css` · `(marketing)/` landing · `(flow)/` wizard · `api/clarity/summary` |
| **Layout shell** | `src/components/layout/` — `AppShell`, `AppProviders` (session; **no auth**) |
| **Product UI** | `src/components/clarity/` |
| **Primitives** | `src/components/ui/` |
| **Mock data** | `src/data/` |
| **AI** | `src/lib/ai/` |
| **Matching** | `src/lib/therapist/` |
| **Validation** | `src/lib/validation/` |
| **Domain** | `src/lib/clarity/` + `src/contexts/` + `src/types/` |

## Stack (this folder)

| Piece | Location / notes |
|--------|------------------|
| App Router | `src/app/` — route groups `(marketing)`, `(flow)` |
| shadcn/ui | `src/components/ui/`, `components.json`, `@/lib/utils` (`cn`) |
| Tailwind v4 | `postcss.config.mjs`, `src/app/globals.css` (`@import "tailwindcss"`) |
| Path alias | `@/*` → `src/*` (`tsconfig.json`) |

### Add more shadcn components (sparingly)

```bash
cd web
npx shadcn@latest add dialog
```

Install only what you need for the demo; start from **Button** + **Card** (already present).

## Scripts

| Command | Purpose |
|---------|---------|
| `npm run dev` | Dev server |
| `npm run build` | Production build |
| `npm run start` | Run production build locally |
| `npm run lint` | ESLint |

## Deploy on Vercel

1. Import this Git repo into Vercel.
2. Set **Root Directory** to **`web`** (the Next.js app is not at the monorepo root).
3. Add environment variables from `.env.example` in the Vercel project **Settings → Environment Variables** (same names as locally).
4. Deploy. You do **not** need a `vercel.json` for a standard Next.js app unless you add redirects, headers, or custom routing.

### Vercel checklist

- **Root Directory = `web`** — required if the repo stays structured with the app in a subfolder.
- **Install command**: default `npm install` at `web/` is correct.
- **Build command**: default `next build` is correct.
- **Output**: Next.js is handled by Vercel’s Next integration — no manual `output` directory.

## CI / quality (optional for hackathon)

Skipping GitHub Actions, Prettier, and extra scripts is fine for a short event. Run `npm run build` before you push if you want a safety check.
