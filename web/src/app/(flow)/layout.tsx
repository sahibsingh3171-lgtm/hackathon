import type { ReactNode } from "react";

/** Shared wrapper for the linear Clarity flow (URLs unchanged). */
export default function FlowLayout({ children }: { children: ReactNode }) {
  return <div className="flex min-h-0 flex-1 flex-col">{children}</div>;
}
