"use server";

import {
  deleteReadingSessionSchema,
  editReadingSessionSchema,
  createReadingSessionSchema,
} from "@/lib/validation/sessions";
import { getAppUserByEmail } from "@/lib/server/get-app-user";
import { insertReadingSession } from "@/lib/server/reading-sessions-write";
import { requireInstantUser } from "@/lib/server/session-user";
import { getInstantAdminDb } from "@/lib/db/instant-admin";

export type LogSessionResult =
  | { ok: true; userBookId: string; sessionId: string }
  | { ok: false; error: string };

export async function logReadingSession(input: unknown): Promise<LogSessionResult> {
  const auth = await requireInstantUser();
  if (!auth || !auth.session.user?.email) {
    return { ok: false, error: "You need to sign in again." };
  }

  const parsed = createReadingSessionSchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, error: "Check pages, time, and date, then try again." };
  }

  const profile = await getAppUserByEmail(auth.session.user.email);
  const tz = profile?.timezone?.trim() || "UTC";

  try {
    const { sessionId } = await insertReadingSession(auth.user.id, tz, parsed.data);
    return { ok: true, userBookId: parsed.data.userBookId, sessionId };
  } catch (e) {
    const code = e instanceof Error ? e.message : "";
    if (code === "INVALID_DATE") {
      return { ok: false, error: "You can only log sessions for today or yesterday." };
    }
    if (code === "NOT_ALLOWED") {
      return { ok: false, error: "You can only log sessions for books you’re currently reading." };
    }
    console.error("[logReadingSession] unexpected error", {
      code,
      userId: auth.user.id,
      userBookId: parsed.data.userBookId,
      sessionDate: parsed.data.sessionDate,
      pagesRead: parsed.data.pagesRead,
      timeMinutes: parsed.data.timeMinutes,
    });
    return { ok: false, error: "Something went wrong. Try again." };
  }
}

export type EditReadingSessionResult =
  | { ok: true; sessionId: string }
  | { ok: false; error: string };

export type DeleteReadingSessionResult =
  | { ok: true; sessionId: string }
  | { ok: false; error: string };

function first<T>(value: T | T[] | undefined | null): T | undefined {
  if (value === undefined || value === null) return undefined;
  return Array.isArray(value) ? value[0] : value;
}

export async function editReadingSession(
  input: unknown,
): Promise<EditReadingSessionResult> {
  const auth = await requireInstantUser();
  if (!auth) {
    return { ok: false, error: "You need to sign in again." };
  }

  const parsed = editReadingSessionSchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, error: "Check pages and time, then try again." };
  }

  const db = getInstantAdminDb();
  // Hardening: authorize through user_books -> reading_sessions membership
  // instead of relying on expanded reading_sessions links in dev.
  const result = await db.query({
    user_books: {
      $: { where: { id: parsed.data.userBookId } },
      user: {},
      reading_sessions: {
        $: { where: { id: parsed.data.sessionId } },
      },
    },
  });

  const ub = result.user_books?.[0] as
    | {
        id: string;
        owner_user_id?: string;
        user?: { id?: string } | { id?: string }[];
        reading_sessions?: unknown;
      }
    | undefined;
  if (!ub) return { ok: false, error: "Session not found." };

  const ownerField = typeof ub.owner_user_id === "string" ? ub.owner_user_id : null;
  const linkedUser = first(ub.user as any);
  const linkedUserId = typeof linkedUser?.id === "string" ? linkedUser.id : null;
  if (ownerField !== auth.user.id && linkedUserId !== auth.user.id) {
    return { ok: false, error: "Not allowed." };
  }

  const sessionsRaw = ub.reading_sessions as unknown;
  const list = Array.isArray(sessionsRaw) ? sessionsRaw : sessionsRaw ? [sessionsRaw] : [];
  const sessionRow = list[0] as
    | {
        id?: string;
        date?: Date | string;
      }
    | undefined;

  if (!sessionRow?.id) return { ok: false, error: "Session not found." };

  const sessionDate =
    sessionRow.date instanceof Date ? sessionRow.date : new Date(sessionRow.date as any);
  if (Number.isNaN(sessionDate.getTime())) {
    return { ok: false, error: "Session date is invalid." };
  }

  try {
    const now = new Date();
    await db.transact(
      db.tx.reading_sessions[parsed.data.sessionId].update({
        date: sessionDate,
        pages_read: parsed.data.pagesRead,
        time_minutes: parsed.data.timeMinutes,
        updated_at: now,
      }),
    );

    return { ok: true, sessionId: parsed.data.sessionId };
  } catch {
    return { ok: false, error: "Something went wrong. Try again." };
  }
}

export async function deleteReadingSession(
  input: unknown,
): Promise<DeleteReadingSessionResult> {
  const auth = await requireInstantUser();
  if (!auth) {
    return { ok: false, error: "You need to sign in again." };
  }

  const parsed = deleteReadingSessionSchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, error: "Session not found." };
  }

  const db = getInstantAdminDb();
  const result = await db.query({
    user_books: {
      $: { where: { id: parsed.data.userBookId } },
      user: {},
      reading_sessions: {
        $: { where: { id: parsed.data.sessionId } },
      },
    },
  });

  const ub = result.user_books?.[0] as
    | {
        owner_user_id?: string;
        user?: { id?: string } | { id?: string }[];
        reading_sessions?: unknown;
      }
    | undefined;
  if (!ub) return { ok: false, error: "Session not found." };

  const ownerField = typeof ub.owner_user_id === "string" ? ub.owner_user_id : null;
  const linkedUser = first(ub.user);
  const linkedUserId = typeof linkedUser?.id === "string" ? linkedUser.id : null;
  if (ownerField !== auth.user.id && linkedUserId !== auth.user.id) {
    return { ok: false, error: "Not allowed." };
  }

  const linkedSession = first(ub.reading_sessions as any) as { id?: string } | undefined;
  if (!linkedSession?.id || linkedSession.id !== parsed.data.sessionId) {
    return { ok: false, error: "Session not found." };
  }

  try {
    await db.transact(db.tx.reading_sessions[parsed.data.sessionId].delete());
    return { ok: true, sessionId: parsed.data.sessionId };
  } catch {
    return { ok: false, error: "Something went wrong. Try again." };
  }
}
