# `(flow)/` — Clarity wizard routes

URLs are the folder names below this group (the `(flow)` segment does **not** appear in the path).

| Path | `page.tsx` folder | Purpose |
|------|-------------------|---------|
| `/brain-dump` | `brain-dump/` | Free-text (+ optional voice) capture |
| `/intake` | `intake/` | Adaptive questionnaire wizard |
| `/lifestyle` | `lifestyle/` | Lifestyle check-in |
| `/summary` | `summary/` | AI summary step |
| `/matches` | `matches/` | Filters + ranked mock therapists |
| `/practice-session` | `practice-session/` | Practice chat turns |
| `/prep-sheet` | `prep-sheet/` | Printable prep content |
| `/next-steps` | `next-steps/` | Closing step |

Shared chrome: `layout.tsx` in this folder. Logic is mostly in `components/`, `contexts/`, and `lib/`.

Full map: [`../../../docs/CODEMAP.md`](../../../docs/CODEMAP.md).
