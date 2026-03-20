import "server-only";
import { getInstantAdminDb } from "@/lib/db/instant-admin";

export type ReadingSessionSummary = {
  sessionId: string;
  sessionDateYmd: string;
  pagesRead: number;
  timeMinutes: number;
};

function first<T>(value: T | T[] | undefined | null): T | undefined {
  if (value === undefined || value === null) return undefined;
  return Array.isArray(value) ? value[0] : value;
}

function toSessionDateYmd(value: unknown): string {
  const d = value instanceof Date ? value : new Date(value as any);
  if (Number.isNaN(d.getTime())) return "unknown";
  return d.toISOString().slice(0, 10);
}

export async function listReadingSessionsForUserBook(
  ownerUserId: string,
  userBookId: string,
): Promise<ReadingSessionSummary[]> {
  const db = getInstantAdminDb();

  const result = await db.query({
    user_books: {
      $: { where: { id: userBookId } },
      user: {},
      reading_sessions: {},
    },
  });

  const ub = result.user_books?.[0] as
    | {
        owner_user_id?: string;
        user?: { id?: string } | { id?: string }[];
        reading_sessions?: unknown;
      }
    | undefined;
  if (!ub) return [];

  const ownerField = typeof ub.owner_user_id === "string" ? ub.owner_user_id : null;
  const linkedUser = first(ub.user);
  const linkedUserId = typeof linkedUser?.id === "string" ? linkedUser.id : null;
  if (ownerField !== ownerUserId && linkedUserId !== ownerUserId) return [];

  const sessionsRaw = ub.reading_sessions as unknown;
  const list = Array.isArray(sessionsRaw) ? sessionsRaw : sessionsRaw ? [sessionsRaw] : [];

  const sessions: ReadingSessionSummary[] = list
    .map((s) => {
      if (!s || typeof s !== "object" || !("id" in s)) return null;
      const row = s as Record<string, unknown>;
      const sessionId = String(row.id);
      const pagesRead =
        typeof row.pages_read === "number"
          ? row.pages_read
          : typeof row.pages_read === "string"
            ? Number.parseInt(row.pages_read, 10)
            : null;
      const timeMinutes =
        typeof row.time_minutes === "number"
          ? row.time_minutes
          : typeof row.time_minutes === "string"
            ? Number.parseInt(row.time_minutes, 10)
            : null;
      const sessionDateYmd = toSessionDateYmd(row.date);
      if (!sessionId || pagesRead == null || timeMinutes == null) return null;
      return { sessionId, sessionDateYmd, pagesRead, timeMinutes };
    })
    .filter(Boolean) as ReadingSessionSummary[];

  sessions.sort((a, b) => b.sessionDateYmd.localeCompare(a.sessionDateYmd));
  return sessions;
}

