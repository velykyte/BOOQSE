import "server-only";
import { id } from "@instantdb/admin";
import { getInstantAdminDb } from "@/lib/db/instant-admin";

type BootstrapUserInput = {
  email: string;
  name: string;
};

export async function bootstrapInstantUser(input: BootstrapUserInput): Promise<void> {
  const db = getInstantAdminDb();
  const now = new Date();

  const result = await db.query({
    users: {
      $: {
        where: {
          email: input.email,
        },
      },
    },
  });

  const existing = result.users?.[0];

  if (existing) {
    await db.transact(
      db.tx.users[existing.id].update({
        name: input.name,
        updated_at: now,
      }),
    );
    return;
  }

  await db.transact(
    db.tx.users[id()].update({
      email: input.email,
      name: input.name,
      timezone: "UTC",
      profile_visibility: "private",
      stats_visibility: true,
      book_titles_visibility: true,
      onboarding_completed: false,
      created_at: now,
      updated_at: now,
    }),
  );
}
