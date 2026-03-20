"use client";

import { signIn } from "next-auth/react";

export function GoogleSignInButton() {
  return (
    <button
      type="button"
      onClick={() => signIn("google", { callbackUrl: "/" })}
      className="inline-flex h-11 items-center justify-center rounded-lg bg-[var(--brand-burgundy)] px-5 text-sm text-white transition-colors hover:bg-[var(--brand-burgundy-hover)]"
    >
      Continue with Google
    </button>
  );
}
