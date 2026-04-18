/**
 * **Practice rehearsal** — prompts and in-memory conversation helpers.
 */
export {
  PRACTICE_SESSION_SYSTEM,
  type PracticeTurnUserPayload,
  buildPracticeTurnUserPayload,
} from "@/lib/ai/practice-session-prompts";
export {
  buildPracticeContext,
  createMessage,
  createPracticeConversation,
  DEFAULT_PRACTICE_MAX_USER_TURNS,
  PRACTICE_MESSAGE_SOFT_LIMIT,
} from "@/lib/clarity/practice-conversation";
