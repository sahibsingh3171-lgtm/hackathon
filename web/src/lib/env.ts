/**
 * Central place for environment reads. No Supabase client here — add
 * `@supabase/supabase-js` only when you wire auth or queries.
 *
 * - Public vars (`NEXT_PUBLIC_*`) are safe in client components.
 * - `SUPABASE_SERVICE_ROLE_KEY` must only be used on the server.
 */

function trimOrUndefined(value: string | undefined): string | undefined {
  if (value === undefined) return undefined;
  const t = value.trim();
  return t.length > 0 ? t : undefined;
}

export type SupabasePublicConfig = {
  url: string;
  anonKey: string;
};

/** Safe for Client Components: returns `null` when vars are missing (no throw). */
export function getSupabasePublicConfig(): SupabasePublicConfig | null {
  const url = trimOrUndefined(process.env.NEXT_PUBLIC_SUPABASE_URL);
  const anonKey = trimOrUndefined(process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY);
  if (!url || !anonKey) return null;
  return { url, anonKey };
}

/**
 * Call when Supabase is required for this code path (e.g. before creating a client).
 * Throws a clear error — avoids silent failures during demos.
 */
export function assertSupabasePublicConfig(context: string): SupabasePublicConfig {
  const cfg = getSupabasePublicConfig();
  if (!cfg) {
    throw new Error(
      `[env] Supabase is not configured. Set NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY (${context}).`
    );
  }
  return cfg;
}

/**
 * Server-only. Returns `null` if unset. Never send this value to the client.
 */
export function getSupabaseServiceRoleKey(): string | null {
  if (typeof window !== "undefined") {
    throw new Error(
      "getSupabaseServiceRoleKey() is server-only (Route Handlers, Server Actions, server-only modules)."
    );
  }
  return trimOrUndefined(process.env.SUPABASE_SERVICE_ROLE_KEY) ?? null;
}

/** Public site URL for redirects and absolute links. */
export function getPublicAppUrl(): string {
  return trimOrUndefined(process.env.NEXT_PUBLIC_APP_URL) ?? "http://localhost:3000";
}

/** Server-only: OpenAI key for Clarity summary route. */
export function getOpenAiApiKey(): string | null {
  if (typeof window !== "undefined") {
    throw new Error("getOpenAiApiKey() is server-only.");
  }
  return trimOrUndefined(process.env.OPENAI_API_KEY) ?? null;
}
