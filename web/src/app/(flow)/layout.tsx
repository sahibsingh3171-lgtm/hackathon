import type { ReactNode } from "react";

/**
 * Next.js route-group layout for every in-app step under `(flow)/…`.
 * Judges: marketing landing uses `(marketing)`; this layout only wraps the wizard URLs.
 */
export default function FlowLayout({ children }: { children: ReactNode }) {
  return <div className="flex min-h-0 flex-1 flex-col">{children}</div>;
}
