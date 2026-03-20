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

  const db = getInstantAdminDb();
  const result = await db.query({
    users: {
      $: {
        where: { email: session.user.email },
      },
    },
  });
  const user = result.users?.[0];
  if (!user) {
    redirect("/auth");
  }

  const now = new Date();
  await db.transact(
    db.tx.users[user.id].update({
      onboarding_completed: true,
      updated_at: now,
    }),
  );

  redirect(`/add-book?intent=${intent}`);
}

export async function startWithCurrentBook() {
  await completeOnboardingAndRedirect("current");
}

export async function startWithPastBooks() {
  await completeOnboardingAndRedirect("past");
}
