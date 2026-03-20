import "server-only";
import { getInstantAdminDb } from "@/lib/db/instant-admin";

type LinkedUser = { id?: string };

function first<T>(value: T | T[] | undefined | null): T | undefined {
  if (value === undefined || value === null) return undefined;
  return Array.isArray(value) ? value[0] : value;
}

export type UserBookDetail = {
  userBookId: string;
  status: string;
  isPastBook: boolean;
  /** Only `currently_reading` non-past rows may log sessions (MVP). */
  canLogSessions: boolean;
  userDefinedTotalPages: number | null;
  rating: number | null;
  book: {
    title: string;
    author: unknown;
    thumbnailUrl: string | null;
  };
};

export async function getUserBookForOwner(
  userBookId: string,
  ownerUserId: string,
): Promise<UserBookDetail | null> {
  const db = getInstantAdminDb();
  // Important: do not start from `users` for ownership because the `users -> user_books`
  // expansion appears unreliable in dev (we can get `usersReturned: 0`).
  // Instead, fetch `user_books` by id and verify ownership via its linked `user`.
  let result: unknown;
  try {
    result = await db.query({
      user_books: {
        $: { where: { id: userBookId } },
        user: {},
        book: {},
      },
    });
  } catch (e) {
    console.error("[getUserBookForOwner] db.query failed:", e);
    return null;
  }

  const ub = ((result as any)?.user_books?.[0] ?? null) as
    | {
        id: string;
        status?: string;
        is_past_book?: boolean;
        user_defined_total_pages?: number | null;
        rating?: number | null;
        owner_user_id?: string;
        book_title?: string;
        book_authors?: unknown;
        book_thumbnail_url?: string | null;
        user?: unknown | unknown[];
        book?: unknown | unknown[];
      }
    | null;

  if (!ub) {
    return null;
  }

  const linkedUserRaw = first(ub.user as any);
  const linkedUserId =
    linkedUserRaw && typeof linkedUserRaw === "object" && "id" in (linkedUserRaw as any)
      ? String((linkedUserRaw as any).id)
      : null;
  const ownerField = typeof ub.owner_user_id === "string" ? ub.owner_user_id : null;
  if (ownerField !== ownerUserId && linkedUserId !== ownerUserId) {
    return null;
  }

  const bookRaw = first(ub.book as Record<string, unknown> | Record<string, unknown>[] | undefined);
  const book = (bookRaw && typeof bookRaw === "object"
    ? bookRaw
    : {}) as {
    title?: string;
    author?: unknown;
    thumbnail_url?: string | null;
  };

  const status = ub.status ?? "";
  const isPastBook = Boolean(ub.is_past_book);

  return {
    userBookId: ub.id,
    status,
    isPastBook,
    canLogSessions: !isPastBook && status === "currently_reading",
    userDefinedTotalPages:
      typeof ub.user_defined_total_pages === "number" ? ub.user_defined_total_pages : null,
    rating: typeof ub.rating === "number" ? ub.rating : null,
    book: {
      title:
        typeof book.title === "string"
          ? book.title
          : typeof ub.book_title === "string"
            ? ub.book_title
            : "Untitled",
      author: book.author ?? ub.book_authors ?? [],
      thumbnailUrl:
        typeof book.thumbnail_url === "string"
          ? book.thumbnail_url
          : typeof ub.book_thumbnail_url === "string"
            ? ub.book_thumbnail_url
            : null,
    },
  };
}
