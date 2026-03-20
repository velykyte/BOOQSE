"use client";

import { requireEnv } from "@/lib/db/env";

export function getInstantAppIdClient(): string {
  return requireEnv("NEXT_PUBLIC_INSTANT_APP_ID", process.env.NEXT_PUBLIC_INSTANT_APP_ID);
}
