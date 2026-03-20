import { AppNav } from "@/components/layout/app-nav";
import { FloatingLogSession } from "@/components/layout/floating-log-session";
import { OnboardingGate } from "@/components/layout/onboarding-gate";
import { authOptions } from "@/auth";
import { countActiveCurrentBooks } from "@/lib/server/current-reading";
import { getAppUserByEmail } from "@/lib/server/get-app-user";
import { getServerSession } from "next-auth";
import { unstable_cache as cache } from "next/cache";

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const session = await getServerSession(authOptions);
  const email = session?.user?.email;
  let appUser = null as Awaited<ReturnType<typeof getAppUserByEmail>> | null;
  try {
    appUser = email ? await getAppUserByEmail(email) : null;
  } catch {
    appUser = null;
  }
  const onboardingCompleted = Boolean(appUser?.onboarding_completed);

  // Avoid repeating the same InstantDB query on every route transition.
  // If InstantDB is temporarily unreachable, we must not crash the page.
  let activeCount = 0;
  if (appUser) {
    try {
      activeCount = await cache(
        async () => countActiveCurrentBooks(appUser.id),
        ["countActiveCurrentBooks", appUser.id],
        { revalidate: 10 },
      )();
    } catch {
      activeCount = 0;
    }
  }
  const showLogCta = activeCount > 0;
  const mobileBottomPad = showLogCta ? "pb-32" : "pb-28";

  return (
    <>
      <OnboardingGate onboardingCompleted={onboardingCompleted} />
      <div className={`flex min-h-screen flex-col md:pb-0 ${mobileBottomPad}`}>
        <AppNav />
        <div className="mx-auto w-full max-w-[1200px] flex-1 px-6 py-8 md:px-10 md:py-10">
          {children}
        </div>
        {showLogCta ? <FloatingLogSession /> : null}
      </div>
    </>
  );
}
