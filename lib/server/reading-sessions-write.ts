import "server-only";
import { id } from "@instantdb/admin";
import { getInstantAdminDb } from "@/lib/db/instant-admin";
import { isAllowedSessionDate } from "@/lib/server/civil-date";
import { createReadingSessionSchema } from "@/lib/validation/sessions";
import type { z } from "zod";

type CreateSessionInput = z.infer<typeof createReadingSessionSchema>;

function first<T>(value: T | T[] | undefined | null): T | undefined {
  if (value === undefined || value === null) return undefined;
  return Array.isArray(value) ? value[0] : value;
}

export async function assertUserBookAllowsSessions(
  userBookId: string,
  ownerUserId: string,
): Promise<{ bookId: string } | null> {
  const db = getInstantAdminDb();
  // Match the same ownership query pattern used by getUserBookForOwner().
  const result = await db.query({
    user_books: {
      $: { where: { id: userBookId } },
      user: {},
      book: {},
    },
  });

  const ub = result.user_books?.[0] as
    | {
        id: string;
        is_past_book?: boolean;
        status?: string;
        owner_user_id?: string;
        book_id_ref?: string;
        user?: { id?: string } | { id?: string }[];
        book?: { id?: string } | { id?: string }[];
      }
    | undefined;

  if (!ub) return null;
  const ownerField = typeof ub.owner_user_id === "string" ? ub.owner_user_id : null;
  const linkedUser = first(ub.user);
  const linkedUserId = typeof linkedUser?.id === "string" ? linkedUser.id : null;
  if (ownerField !== ownerUserId && linkedUserId !== ownerUserId) return null;
  if (ub.is_past_book || ub.status !== "currently_reading") return null;

  const book = first(ub.book);
  const bookId =
    (book?.id && typeof book.id === "string" ? book.id : null) ??
    (typeof ub.book_id_ref === "string" ? ub.book_id_ref : null);
  if (!bookId) return null;

  return { bookId };
}

export async function insertReadingSession(
  ownerUserId: string,
  userTimezone: string,
  input: CreateSessionInput,
): Promise<{ sessionId: string }> {
  const allowed = isAllowedSessionDate(userTimezone, input.sessionDate);
  if (!allowed) {
    throw new Error("INVALID_DATE");
  }

  const scope = await assertUserBookAllowsSessions(input.userBookId, ownerUserId);
  if (!scope) {
    throw new Error("NOT_ALLOWED");
  }

  const db = getInstantAdminDb();
  const now = new Date();
  const sessionDate = new Date(`${input.sessionDate}T12:00:00.000Z`);
  const sessionId = id();

  const payloads = [
    {
      date: sessionDate,
      pages_read: input.pagesRead,
      time_minutes: input.timeMinutes,
      created_at: now,
      updated_at: now,
    },
    {
      date: sessionDate,
      pages_read: input.pagesRead,
      time_minutes: input.timeMinutes,
      updated_at: now,
    },
    {
      date: sessionDate,
      pages_read: input.pagesRead,
      time_minutes: input.timeMinutes,
    },
  ] as const;

  let wrote = false;
  let lastError: unknown = null;
  for (const payload of payloads) {
    try {
      await db.transact(db.tx.reading_sessions[sessionId].update(payload));
      wrote = true;
      break;
    } catch (e) {
      lastError = e;
    }
  }
  if (!wrote) {
    console.error("[insertReadingSession] update failed", { ownerUserId, input, error: lastError });
    throw new Error("WRITE_FAILED");
  }

  // Link to user_book first using the label that works in this environment.
  let linkedToUserBook = false;
  try {
    // InstantDB dev schema drift can make link labels vary; `as any` avoids
    // TypeScript rejecting a label that isn't in our local schema typings.
    await db.transact(
      db.tx.reading_sessions[sessionId].link({ user_books: input.userBookId } as any),
    );
    linkedToUserBook = true;
  } catch {
    try {
      await db.transact(db.tx.reading_sessions[sessionId].link({ user_book: input.userBookId }));
      linkedToUserBook = true;
    } catch {
      // handled below
    }
  }
  if (!linkedToUserBook) {
    throw new Error("WRITE_FAILED");
  }

  // Optional links.
  try {
    await db.transact(db.tx.reading_sessions[sessionId].link({ user: ownerUserId }));
  } catch {}
  try {
    await db.transact(db.tx.reading_sessions[sessionId].link({ book: scope.bookId }));
  } catch {}

  return { sessionId };
}
