"use client";

import { usePathname, useRouter } from "next/navigation";
import { useEffect } from "react";

const ALLOWED_WHEN_INCOMPLETE = ["/onboarding", "/add-book", "/log-session"];

export function OnboardingGate({
  onboardingCompleted,
}: {
  onboardingCompleted: boolean;
}) {
  const pathname = usePathname();
  const router = useRouter();

  useEffect(() => {
    if (onboardingCompleted) {
      if (pathname === "/onboarding") {
        router.replace("/");
      }
      return;
    }

    const allowed = ALLOWED_WHEN_INCOMPLETE.some(
      (prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`),
    );
    if (!allowed) {
      router.replace("/onboarding");
    }
  }, [onboardingCompleted, pathname, router]);

  return null;
}
