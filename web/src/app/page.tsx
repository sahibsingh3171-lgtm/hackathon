export default function Home() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-zinc-50 px-6 font-sans dark:bg-zinc-950">
      <main className="w-full max-w-lg text-center sm:text-left">
        <p className="text-sm font-medium uppercase tracking-wide text-zinc-500 dark:text-zinc-400">
          Hackathon starter
        </p>
        <h1 className="mt-2 text-3xl font-semibold tracking-tight text-zinc-900 dark:text-zinc-50">
          Theme TBD — you&apos;re set up for React + Next.js
        </h1>
        <p className="mt-4 text-lg leading-relaxed text-zinc-600 dark:text-zinc-400">
          Edit{" "}
          <code className="rounded bg-zinc-200/80 px-1.5 py-0.5 text-sm dark:bg-zinc-800">
            web/src/app/page.tsx
          </code>{" "}
          when you know the idea. Put API keys in{" "}
          <code className="rounded bg-zinc-200/80 px-1.5 py-0.5 text-sm dark:bg-zinc-800">
            web/.env.local
          </code>
          .
        </p>
        <p className="mt-6 text-sm text-zinc-500 dark:text-zinc-500">
          Run <code className="font-mono">cd web && npm run dev</code>
        </p>
      </main>
    </div>
  );
}
