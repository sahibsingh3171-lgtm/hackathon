# Practice session (rehearsal chat) — file map

| Role | Path |
|------|------|
| **API route (one turn)** | `src/app/api/clarity/practice-turn/route.ts` |
| **System prompt + user payload** | `src/lib/ai/practice-session-prompts.ts` |
| **Mock / fixtures** | `src/lib/ai/practice-session-mock.ts` |
| **Conversation helpers** | `src/lib/clarity/practice-conversation.ts`, `practice-session.ts` |
| **Page + chat UI** | `src/app/(flow)/practice-session/page.tsx`, `PracticeChat.tsx`, `PracticeSessionPanel.tsx` |

**Single import surface (prompts + conversation helpers):** `./index.ts`.
