import "server-only";
import { getInstantAdminDb } from "@/lib/db/instant-admin";

export type AppUserRow = {
  id: string;
  email: string;
  name: string;
  timezone?: string | null;
  onboarding_completed?: boolean | null;
};

export async function getAppUserByEmail(email: string): Promise<AppUserRow | null> {
  try {
    const db = getInstantAdminDb();
    const result = await db.query({
      users: {
        $: {
          where: { email },
        },
      },
    });
    const row = (result as any)?.users?.[0];
    if (!row) return null;
    return row as AppUserRow;
  } catch (e) {
    console.error("[getAppUserByEmail] db.query failed:", e);
    return null;
  }
}
