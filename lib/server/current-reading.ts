import "server-only";
import { getInstantAdminDb } from "@/lib/db/instant-admin";
import type { ActiveCurrentBook } from "@/lib/types/active-reading";

export type { ActiveCurrentBook };

function first<T>(value: T | T[] | undefined | null): T | undefined {
  if (value === undefined || value === null) return undefined;
  return Array.isArray(value) ? value[0] : value;
}

function toIsPastBook(value: unknown): boolean {
  if (typeof value === "boolean") return value;
  if (typeof value === "string") {
    const v = value.trim().toLowerCase();
    if (v === "true" || v === "1" || v === "yes") return true;
    if (v === "false" || v === "0" || v === "no" || v === "") return false;
    return Boolean(v);
  }
  if (typeof value === "number") return value === 1;
  return Boolean(value);
}

export async function listActiveCurrentBooks(userId: string): Promise<ActiveCurrentBook[]> {
  const db = getInstantAdminDb();
  // Avoid relying on `users -> user_books` expansion in dev (it can come back empty/`{}`).
  // Query `user_books` directly, and filter ownership + current status in the DB query.
  const result = await db.query({
    user_books: {
      $: { where: { status: "currently_reading" } },
      user: {},
      book: {},
    },
  });

  const raw = (result as any)?.user_books;
  const list = Array.isArray(raw) ? raw : raw ? [raw] : [];

  const out: ActiveCurrentBook[] = [];

  for (const ub of list) {
    if (!ub || typeof ub !== "object" || !("id" in ub)) continue;
    const ubTyped = ub as {
      id: string;
      is_past_book?: boolean;
      status?: string;
      user_defined_total_pages?: number | null;
      book_title?: string;
      book_thumbnail_url?: string | null;
      owner_user_id?: string;
      user?: unknown;
      book?: unknown;
    };

    const ownerField = typeof ubTyped.owner_user_id === "string" ? ubTyped.owner_user_id : null;
    const linkedUser = first(ubTyped.user as any) as { id?: string } | undefined;
    const linkedUserId = typeof linkedUser?.id === "string" ? linkedUser.id : null;
    if (ownerField !== userId && linkedUserId !== userId) continue;

    const isPast = toIsPastBook(ubTyped.is_past_book);
    if (isPast || ubTyped.status !== "currently_reading") {
      continue;
    }

    const book = first(ubTyped.book) as
      | { title?: string; thumbnail_url?: string | null }
      | undefined;
    const linkedTitle = typeof book?.title === "string" ? book.title : null;
    const fallbackTitle = typeof ubTyped.book_title === "string" ? ubTyped.book_title : null;
    const linkedThumb = typeof book?.thumbnail_url === "string" ? book.thumbnail_url : null;
    const fallbackThumb =
      typeof ubTyped.book_thumbnail_url === "string" ? ubTyped.book_thumbnail_url : null;

    out.push({
      userBookId: ubTyped.id,
      title: linkedTitle ?? fallbackTitle ?? "Untitled",
      thumbnailUrl: linkedThumb ?? fallbackThumb,
      userDefinedTotalPages:
        typeof ubTyped.user_defined_total_pages === "number"
          ? ubTyped.user_defined_total_pages
          : null,
    });
  }

  return out;
}

export async function countActiveCurrentBooks(userId: string): Promise<number> {
  const books = await listActiveCurrentBooks(userId);
  return books.length;
}
