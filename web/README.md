# Clarity (`web/`)

Next.js App Router, TypeScript, Tailwind v4, and shadcn-style UI. Clarity is a therapy **readiness** flow (brain dump → intake → lifestyle → reflection → matches → practice → prep → next steps). It’s a demo build: mock therapist data, no real bookings, no auth.

**Where things live:** [`docs/CODEMAP.md`](docs/CODEMAP.md). For a quicker file list by feature, see [`src/features/`](src/features/) — each subfolder has a short README.

## Run locally

Need Node 18+ and npm.

```bash
cd web
cp .env.example .env.local
npm install
npm run dev
```

App: [http://localhost:3000](http://localhost:3000).

Copy `.env.example` to `.env.local` and fill in what you use. Anything named `NEXT_PUBLIC_*` is visible in the browser; API keys (e.g. OpenAI) stay server-side and are read from Route Handlers under `src/app/api/clarity/` — see `src/lib/env.ts`.

## Useful paths

- **Pages:** `src/app/(marketing)/` (landing), `src/app/(flow)/` (wizard routes)  
- **API routes:** `src/app/api/clarity/` — server-only; call OpenAI from here  
- **Prompts & parsers:** `src/lib/ai/`  
- **Matching (heuristic):** `src/lib/therapist/`  
- **Session + domain logic:** `src/lib/clarity/`, `src/contexts/`, `src/types/`  
- **Mock therapists:** `src/data/`  

Path alias: `@/*` → `src/*` (`tsconfig.json`).

## Scripts

- `npm run dev` — dev server  
- `npm run build` / `npm run start` — production build and run  
- `npm run lint` — ESLint  

## Deploy (Vercel)

Set the project **Root Directory** to **`web`**. Add the same env vars you use locally. You usually don’t need a custom `vercel.json` for a standard Next deploy.
