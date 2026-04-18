"use client";

import type { CSSProperties } from "react";
import { useCallback, useEffect, useRef, useState } from "react";
import { Mic, Sparkles } from "lucide-react";

/** Delay between each mockup card starting its pop (ms). */
const CARD_STAGGER_MS = 500;
/** Duration of each card’s own pop-in (ms). */
const CARD_POP_MS = 480;
/** Stop RAF after all cards have settled (ms). */
const POP_SEQUENCE_TOTAL_MS = CARD_STAGGER_MS * 2 + CARD_POP_MS + 80;

function buildCardStyle(
  index: number,
  elapsedMs: number,
  scrollP: number,
  reducedMotion: boolean
): CSSProperties {
  if (reducedMotion) {
    return { opacity: 1, transform: "none", filter: "none" };
  }

  const start = index * CARD_STAGGER_MS;
  const raw = Math.max(0, Math.min(1, (elapsedMs - start) / CARD_POP_MS));
  const easedStagger = 1 - Math.pow(1 - raw, 2.85);

  /* Restrained parallax — premium depth without aggressive tilt */
  const rise = (1 - easedStagger) * (72 + index * 22);
  const scrollLift = scrollP * (-18 + index * 9);
  const translateY = rise + scrollLift;

  const rotateX = (1 - easedStagger) * (14 - index * 3) + scrollP * (4.5 - index * 1.2);
  const rotateY = scrollP * (index - 1) * 5.5;
  const rotateZ = (1 - easedStagger) * (index === 1 ? -2.2 : index === 0 ? 0.8 : -0.5);

  const translateZ = index * -38 + easedStagger * 22 + scrollP * 56;

  const scale = 0.86 + easedStagger * 0.14 + scrollP * 0.032 * (index + 1);

  const blur = Math.max(0, (1 - easedStagger) * (10 - index * 1.6));

  const opacity = Math.min(1, easedStagger * 1.12 + 0.04);

  const sageLift = 0.04 + scrollP * 0.11;
  const inkLift = 0.03 + easedStagger * 0.06;

  return {
    opacity,
    transform: `translate3d(0, ${translateY}px, ${translateZ}px) rotateX(${rotateX}deg) rotateY(${rotateY}deg) rotateZ(${rotateZ}deg) scale3d(${scale}, ${scale}, 1)`,
    filter: blur > 0.35 ? `blur(${blur}px)` : blur > 0.1 ? `blur(${blur}px)` : "none",
    boxShadow: `${[
      `0 1px 2px rgb(15 23 42 / ${inkLift})`,
      `0 ${14 + scrollP * 28}px ${44 + scrollP * 32}px rgb(111 143 120 / ${sageLift})`,
      "inset 0 1px 0 rgb(255 255 255 / 0.78)",
    ].join(", ")}`,
    willChange: raw < 1 || scrollP > 0.01 ? "transform, opacity, filter" : "auto",
  };
}

/**
 * Scroll-sculpted 3D product stack: cards pop in one after another (500ms apart), parallax on scroll.
 */
function readReduceMotionPreference(): boolean {
  if (typeof window === "undefined") return false;
  return window.matchMedia("(prefers-reduced-motion: reduce)").matches;
}

export function LandingProductMockup() {
  const rootRef = useRef<HTMLDivElement>(null);
  const ticking = useRef(false);
  const popRaf = useRef<number | null>(null);

  const [revealed, setRevealed] = useState(false);
  /** Elapsed ms since pop sequence started (0 → POP_SEQUENCE_TOTAL_MS). */
  const [popElapsedMs, setPopElapsedMs] = useState(0);
  const [scrollP, setScrollP] = useState(0);
  const [reduceMotion, setReduceMotion] = useState(readReduceMotionPreference);

  useEffect(() => {
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
    const onChange = () => setReduceMotion(mq.matches);
    mq.addEventListener("change", onChange);
    return () => mq.removeEventListener("change", onChange);
  }, []);

  useEffect(() => {
    const root = rootRef.current;
    if (!root) return;
    const io = new IntersectionObserver(
      ([entry]) => {
        if (entry?.isIntersecting) setRevealed(true);
      },
      { threshold: 0.05, rootMargin: "0px 0px -12% 0px" }
    );
    io.observe(root);
    return () => io.disconnect();
  }, []);

  useEffect(() => {
    if (!revealed || reduceMotion) return;

    const t0 = performance.now();
    const frame = (now: number) => {
      const elapsed = Math.min(POP_SEQUENCE_TOTAL_MS, now - t0);
      setPopElapsedMs(elapsed);
      if (elapsed < POP_SEQUENCE_TOTAL_MS) {
        popRaf.current = requestAnimationFrame(frame);
      }
    };
    popRaf.current = requestAnimationFrame(frame);
    return () => {
      if (popRaf.current != null) cancelAnimationFrame(popRaf.current);
    };
  }, [revealed, reduceMotion]);

  const measureScroll = useCallback(() => {
    const el = rootRef.current;
    if (!el || reduceMotion) return;
    const rect = el.getBoundingClientRect();
    const vh = window.innerHeight;
    if (rect.bottom < -80 || rect.top > vh + 80) {
      setScrollP(0);
      return;
    }
    const range = vh + rect.height * 0.45;
    const raw = (vh * 0.72 - rect.top) / range;
    setScrollP(Math.min(1, Math.max(0, raw)));
  }, [reduceMotion]);

  useEffect(() => {
    if (reduceMotion) return;

    const onScrollOrResize = () => {
      if (ticking.current) return;
      ticking.current = true;
      requestAnimationFrame(() => {
        ticking.current = false;
        measureScroll();
      });
    };

    window.addEventListener("scroll", onScrollOrResize, { passive: true });
    window.addEventListener("resize", onScrollOrResize);
    requestAnimationFrame(() => {
      measureScroll();
    });
    return () => {
      window.removeEventListener("scroll", onScrollOrResize);
      window.removeEventListener("resize", onScrollOrResize);
    };
  }, [measureScroll, reduceMotion]);

  const motionProgress = reduceMotion ? 1 : revealed ? Math.min(1, popElapsedMs / POP_SEQUENCE_TOTAL_MS) : 0;

  const orbScale = 1 + scrollP * 0.09;
  const orbOpacity = 0.26 + scrollP * 0.18 + motionProgress * 0.07;

  return (
    <div ref={rootRef} className="relative mx-auto w-full max-w-lg lg:max-w-none" aria-hidden>
      <div
        className="pointer-events-none absolute -inset-8 rounded-[2.25rem] bg-gradient-to-br from-primary/20 via-primary/8 to-transparent blur-3xl transition-[opacity,transform] duration-500 sm:-inset-12"
        style={{
          opacity: orbOpacity,
          transform: `scale(${orbScale}) translateY(${scrollP * -14}px)`,
        }}
      />

      {/* Stage: editorial product frame — calm depth, not a device chrome */}
      <div className="relative rounded-[2rem] border border-border/45 bg-gradient-to-b from-card/95 via-card to-muted/[0.35] p-[1px] shadow-[0_1px_2px_rgb(15_23_42_/0.04),0_24px_80px_rgb(15_23_42_/0.06)] sm:rounded-[2.25rem]">
        <div className="rounded-[1.9375rem] bg-gradient-to-b from-background/55 via-background/35 to-transparent px-4 pb-6 pt-5 sm:px-6 sm:pb-8 sm:pt-6 lg:px-8 lg:pb-10 lg:pt-8 sm:rounded-[2.125rem]">
          <div className="mb-5 flex items-center justify-between gap-3 sm:mb-6">
            <div className="flex items-center gap-2" aria-hidden>
              <span className="size-2 rounded-full bg-border/90" />
              <span className="size-2 rounded-full bg-border/60" />
              <span className="size-2 rounded-full bg-border/40" />
            </div>
            <p className="font-mono text-[0.625rem] font-medium uppercase tracking-[0.2em] text-muted-foreground/80">
              Preview
            </p>
          </div>

          <div
            data-revealed={revealed ? "true" : "false"}
            className="clarity-mockup-stack relative isolate space-y-3.5 sm:space-y-4 [perspective:1600px] [perspective-origin:50%_8%] [transform-style:preserve-3d]"
          >
            {/* Back — Intake */}
            <div
              className="clarity-mockup-card clarity-surface relative z-0 ml-auto w-[88%] rounded-[1.375rem] border border-border/70 bg-card/96 p-5 backdrop-blur-[2px] sm:rounded-3xl sm:p-6"
              style={buildCardStyle(0, popElapsedMs, scrollP, reduceMotion)}
            >
              <p className="text-[0.625rem] font-semibold uppercase tracking-[0.22em] text-muted-foreground">
                Intake
              </p>
              <p className="mt-3 font-heading text-[1.0625rem] font-semibold leading-snug tracking-[-0.02em] text-foreground sm:text-lg">
                How have nights been?
              </p>
              <div className="mt-4 flex flex-wrap gap-2">
                <span className="rounded-xl border border-border/80 bg-muted/40 px-3 py-1.5 text-xs text-muted-foreground">
                  Restless
                </span>
                <span className="rounded-xl border border-primary/30 bg-accent/70 px-3 py-1.5 text-xs text-foreground">
                  Mixed
                </span>
              </div>
            </div>

            {/* Middle — Your words */}
            <div
              className="clarity-mockup-card clarity-surface relative z-10 -mt-7 w-[92%] rounded-[1.375rem] border border-border/70 bg-card/96 p-5 backdrop-blur-[2px] sm:-mt-9 sm:rounded-3xl sm:p-6"
              style={buildCardStyle(1, popElapsedMs, scrollP, reduceMotion)}
            >
              <div className="flex items-center gap-2 text-[0.625rem] font-semibold uppercase tracking-[0.22em] text-muted-foreground">
                <Mic className="size-3.5 text-primary/90" strokeWidth={1.75} />
                Your words
              </div>
              <p className="mt-3.5 text-[0.8125rem] leading-relaxed text-muted-foreground sm:text-sm sm:leading-relaxed">
                “I keep waiting for a pause that does not come. I think I want to talk to someone — I
                just do not know how to start.”
              </p>
            </div>

            {/* Front — Prep sheet */}
            <div
              className="clarity-mockup-card clarity-surface relative z-20 -mt-5 ml-1.5 w-full max-w-md rounded-[1.375rem] border border-border/70 bg-card/96 p-5 backdrop-blur-[2px] sm:-mt-7 sm:ml-3 sm:rounded-3xl sm:p-7"
              style={buildCardStyle(2, popElapsedMs, scrollP, reduceMotion)}
            >
              <div className="flex items-center justify-between gap-3">
                <p className="text-[0.625rem] font-semibold uppercase tracking-[0.22em] text-muted-foreground">
                  Prep sheet
                </p>
                <Sparkles className="size-4 text-primary/85" strokeWidth={1.75} />
              </div>
              <p className="mt-4 font-heading text-lg font-semibold tracking-[-0.02em] text-foreground sm:text-xl">
                Something to bring along
              </p>
              <ul className="mt-4 space-y-2.5 text-[0.8125rem] leading-relaxed text-muted-foreground sm:text-sm sm:leading-relaxed">
                <li className="flex gap-2.5">
                  <span className="mt-2 size-1 shrink-0 rounded-full bg-primary/65" />
                  Threads you named: overload, sleep, hoping to feel less alone with it
                </li>
                <li className="flex gap-2.5">
                  <span className="mt-2 size-1 shrink-0 rounded-full bg-primary/65" />
                  A question you might ask: what could change in a couple of months if this helped?
                </li>
              </ul>
              <div className="mt-6 rounded-2xl border border-border/70 bg-muted/25 px-4 py-3 text-[0.6875rem] leading-relaxed text-muted-foreground sm:text-xs">
                Sample matches only — always check credentials, fees, and fit directly with any
                clinician.
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
