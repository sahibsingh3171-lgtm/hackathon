import Image from "next/image";

import { cn } from "@/lib/utils";

const SIZES = {
  sm: 40,
  md: 52,
  lg: 112,
} as const;

type Size = keyof typeof SIZES;

/**
 * Brand mark: brain + growth leaves with central light (see `/public/clarity-logo.png`).
 * Default presentation is frameless — no ring, card radius, or fill behind the asset.
 */
export function ClarityLogo({
  size = "sm",
  className,
  priority,
}: {
  size?: Size;
  className?: string;
  /** Set true above the fold (e.g. site header). */
  priority?: boolean;
}) {
  const px = SIZES[size];
  return (
    <Image
      src="/clarity-logo.png"
      alt=""
      width={px}
      height={px}
      priority={priority}
      className={cn(
        "shrink-0 object-contain [filter:drop-shadow(0_2px_14px_rgb(15_23_42_/_0.06))]",
        className
      )}
    />
  );
}
