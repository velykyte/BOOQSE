import "server-only";
import { authOptions } from "@/auth";
import { getAppUserByEmail } from "@/lib/server/get-app-user";
import { getServerSession } from "next-auth";

export async function requireInstantUser() {
  const session = await getServerSession(authOptions);
  const email = session?.user?.email;
  if (!email) {
    return null;
  }

  const user = await getAppUserByEmail(email);
  if (!user) {
    return null;
  }

  return { session, user };
}
