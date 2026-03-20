import "server-only";
import { init } from "@instantdb/admin";
import { getInstantAdminToken, getInstantAppIdServer } from "@/lib/db/env-server";
import schema from "@/instant.schema";

let adminDb: ReturnType<typeof init<typeof schema>> | null = null;

export function getInstantAdminDb() {
  if (!adminDb) {
    adminDb = init({
      appId: getInstantAppIdServer(),
      adminToken: getInstantAdminToken(),
      schema,
      // Your local code schema and the remote InstantDB schema can be temporarily out of sync
      // during development. We still want schema inference for queries/links, but we
      // don't want strict write validation to break OAuth sign-in.
      disableValidation: true,
    });
  }

  return adminDb;
}
