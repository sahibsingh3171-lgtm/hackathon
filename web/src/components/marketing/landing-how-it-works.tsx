"use client";

import { useEffect, useRef, useState, useSyncExternalStore } from "react";

import { cn } from "@/lib/utils";

const STEPS = [
  {
    step: "01",
    title: "Put it into words",
    body: "Start with an open space for your words — messy is fine. Prefer structure first? The same thoughtful check-in is there when you choose it.",
  },
  {
    step: "02",
    title: "Check in at your pace",
    body: "We only ask what is still missing after your words — mood, stress, sleep, and practical details, one screen at a time.",
  },
  {
    step: "03",
    title: "Carry something forward",
    body: "A readable summary, optional match ideas, and a prep sheet you can print or bring to a first conversation.",
  },
] as const;

/** Each step begins its fade 1.25s after the previous one. */
const STAGGER_MS = 1250;
/** Per-card motion length — matches the stagger rhythm. */
const CARD_DURATION_MS = 1250;
/** Gentle ease: slow in, soft landing (not snappy). */
const EASE = "cubic-bezier(0.22, 0.58, 0.28, 1)";
/** Do not run the entrance until the user has scrolled at least this far (px). */
const SCROLL_REVEAL_MIN_PX = 32;

function subscribeReducedMotion(callback: () => void): () => void {
  const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
  mq.addEventListener("change", callback);
  return () => mq.removeEventListener("change", callback);
}

function reducedMotionSnapshot(): boolean {
  return window.matchMedia("(prefers-reduced-motion: reduce)").matches;
}

function reducedMotionServerSnapshot(): boolean {
  return false;
}

export function LandingHowItWorks() {
  const sectionRef = useRef<HTMLElement>(null);
  const [revealed, setRevealed] = useState(false);
  const prefersReducedMotion = useSyncExternalStore(
    subscribeReducedMotion,
    reducedMotionSnapshot,
    reducedMotionServerSnapshot
  );

  useEffect(() => {
    const root = sectionRef.current;
    if (!root) return;

    let done = false;
    let io: IntersectionObserver | null = null;

    const onScroll = () => {
      tryReveal();
    };

    const commit = () => {
      if (done) return;
      done = true;
      setRevealed(true);
      io?.disconnect();
      io = null;
      window.removeEventListener("scroll", onScroll);
    };

    const sectionIsInRevealZone = () => {
      const rect = root.getBoundingClientRect();
      const vh = window.innerHeight;
      // Section has entered the viewport enough to count as "scrolled to"
      return rect.top < vh * 0.9 && rect.bottom > vh * 0.1;
    };

    const tryReveal = () => {
      if (done) return;
      if (!sectionIsInRevealZone()) return;

      if (prefersReducedMotion) {
        commit();
        return;
      }

      if (window.scrollY < SCROLL_REVEAL_MIN_PX) return;
      commit();
    };

    io = new IntersectionObserver(
      (entries) => {
        const entry = entries[0];
        if (!entry?.isIntersecting) return;
        tryReveal();
      },
      { threshold: 0.08, rootMargin: "0px 0px -20% 0px" }
    );

    io.observe(root);
    window.addEventListener("scroll", onScroll, { passive: true });

    return () => {
      io?.disconnect();
      window.removeEventListener("scroll", onScroll);
    };
  }, [prefersReducedMotion]);

  return (
    <section
      ref={sectionRef}
      id="how-it-works"
      aria-labelledby="how-heading"
      className="relative border-b border-border/40 bg-[linear-gradient(180deg,rgb(246_243_237)_0%,rgb(252_251_249)_52%,rgb(255_255_255_/0.96)_100%)] py-24 sm:py-28 lg:py-36"
    >
      <div
        className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-border/55 to-transparent"
        aria-hidden
      />

      <div className="clarity-container">
        <div className="mx-auto max-w-3xl text-center lg:mx-0 lg:max-w-none lg:text-left">
          <p className="text-[0.6875rem] font-semibold uppercase tracking-[0.24em] text-muted-foreground/90">
            Flow
          </p>
          <h2
            id="how-heading"
            className="mt-4 font-heading text-[2rem] font-semibold leading-[1.12] tracking-[-0.03em] text-foreground sm:text-4xl sm:leading-[1.1] lg:text-[2.5rem]"
          >
            How it works
          </h2>
          <p className="mx-auto mt-6 max-w-2xl text-pretty text-lg leading-[1.65] text-muted-foreground sm:text-xl sm:leading-[1.65] lg:mx-0">
            Three steps you can move through slowly. Stop whenever you need to — nothing here is
            meant to rush you.
          </p>
        </div>

        <ol
          className="mx-auto mt-16 grid max-w-6xl list-none gap-5 sm:mt-20 sm:gap-6 lg:mx-0 lg:mt-24 lg:max-w-none lg:grid-cols-3 lg:gap-7"
          aria-label="Three steps in the Clarity flow"
        >
          {STEPS.map((item, index) => (
            <li
              key={item.step}
              className={cn(
                "group relative flex flex-col overflow-hidden rounded-[1.85rem] border border-border/55 bg-card/95 p-9 shadow-[0_1px_0_rgb(255_255_255_/0.65)_inset,0_1px_2px_rgb(15_23_42_/0.045),0_22px_56px_rgb(15_23_42_/0.055)] ring-1 ring-foreground/[0.04] transition-[border-color,box-shadow,transform] duration-500 ease-out",
                "hover:border-primary/22 hover:shadow-[0_1px_0_rgb(255_255_255_/0.72)_inset,0_1px_2px_rgb(15_23_42_/0.05),0_28px_64px_rgb(111_143_120_/0.09)]",
                !prefersReducedMotion && "hover:-translate-y-0.5",
                revealed || prefersReducedMotion
                  ? "translate-x-0 translate-y-0 opacity-100"
                  : "translate-x-[-1.125rem] translate-y-5 opacity-0 sm:translate-x-[-1.25rem] sm:translate-y-6",
                "motion-reduce:translate-x-0 motion-reduce:translate-y-0 motion-reduce:opacity-100 motion-reduce:transition-none"
              )}
              style={
                prefersReducedMotion
                  ? undefined
                  : {
                      transitionProperty: "opacity, transform, box-shadow, border-color",
                      transitionDuration: `${CARD_DURATION_MS}ms`,
                      transitionTimingFunction: EASE,
                      transitionDelay: revealed ? `${index * STAGGER_MS}ms` : "0ms",
                    }
              }
            >
              <div
                className="pointer-events-none absolute -right-10 -top-10 h-36 w-36 rounded-full bg-primary/[0.06] blur-3xl transition-opacity duration-500 group-hover:opacity-100 sm:h-40 sm:w-40"
                aria-hidden
              />
              <div className="relative flex min-h-0 flex-1 flex-col">
                <span className="inline-flex w-fit items-center rounded-full border border-primary/15 bg-primary/[0.07] px-3 py-1 font-mono text-[0.625rem] font-semibold uppercase tracking-[0.2em] text-primary/95">
                  {item.step}
                </span>
                <h3 className="mt-7 font-heading text-xl font-semibold tracking-[-0.02em] text-foreground sm:text-[1.35rem] sm:leading-snug">
                  {item.title}
                </h3>
                <p className="mt-4 flex-1 text-[0.9375rem] leading-relaxed text-muted-foreground sm:text-base sm:leading-relaxed">
                  {item.body}
                </p>
              </div>
            </li>
          ))}
        </ol>
      </div>
    </section>
  );
}
