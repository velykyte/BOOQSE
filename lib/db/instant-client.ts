"use client";

import { init } from "@instantdb/react";
import schema from "@/instant.schema";
import { getInstantAppIdClient } from "@/lib/db/env-client";

let clientDb: ReturnType<typeof init<typeof schema>> | null = null;

export function getInstantClientDb() {
  if (!clientDb) {
    clientDb = init({
      appId: getInstantAppIdClient(),
      schema,
    });
  }

  return clientDb;
}
