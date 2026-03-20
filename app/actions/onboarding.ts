"use server";

import { authOptions } from "@/auth";
import { getInstantAdminDb } from "@/lib/db/instant-admin";
import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";

async function completeOnboardingAndRedirect(intent: "current" | "past") {
  const session = await getServerSession(authOptions);
  if (!session?.user?.email) {
    redirect("/auth");
  }

  try {
    const db = getInstantAdminDb();
    const result = await db.query({
      users: {
        $: {
          where: { email: session.user.email },
        },
      },
    });
    const user = result.users?.[0] as { id?: string } | undefined;
    if (!user?.id) {
      redirect("/auth");
    }

    const now = new Date();
    await db.transact(
      db.tx.users[user.id].update({
        onboarding_completed: true,
        updated_at: now,
      }),
    );
  } catch (e) {
    console.error("[onboarding] failed to complete onboarding (continuing):", e);
    // If InstantDB is temporarily unreachable, avoid a hard failure screen.
    // Still let the user proceed to the add-book flow (the onboarding gate
    // allows `/add-book` even when `onboarding_completed` isn't persisted).
    redirect(`/add-book?intent=${intent}`);
  }

  redirect(`/add-book?intent=${intent}`);
}

export async function startWithCurrentBook() {
  await completeOnboardingAndRedirect("current");
}

export async function startWithPastBooks() {
  await completeOnboardingAndRedirect("past");
}
