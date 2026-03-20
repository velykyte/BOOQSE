"use client";

import { signOut } from "next-auth/react";

export function SignOutButton() {
  return (
    <button
      type="button"
      onClick={() => signOut({ callbackUrl: "/auth" })}
      className="inline-flex h-11 items-center justify-center rounded-lg border border-[var(--brand-blue)] bg-[var(--surface-subtle)] px-5 text-sm text-[var(--text-primary)] transition-colors hover:bg-[var(--brand-blue-soft)]"
    >
      Sign out
    </button>
  );
}
