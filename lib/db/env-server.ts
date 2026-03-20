import "server-only";
import { requireEnv } from "@/lib/db/env";

export function getInstantAppIdServer(): string {
  return requireEnv("INSTANT_APP_ID", process.env.INSTANT_APP_ID);
}

export function getInstantAdminToken(): string {
  return requireEnv("INSTANT_APP_ADMIN_TOKEN", process.env.INSTANT_APP_ADMIN_TOKEN);
}
