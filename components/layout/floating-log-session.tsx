"use client";

import Link from "next/link";

export function FloatingLogSession() {
  return (
    <Link
      href="/log-session"
      className="fixed bottom-[calc(4.25rem+env(safe-area-inset-bottom))] left-1/2 z-20 inline-flex h-12 -translate-x-1/2 items-center justify-center rounded-full bg-[var(--brand-burgundy)] px-6 text-sm font-medium text-white transition-colors hover:bg-[var(--brand-burgundy-hover)] md:hidden"
    >
      Log reading
    </Link>
  );
}
