import "server-only";
import { getInstantAdminDb } from "@/lib/db/instant-admin";

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

export type LibraryBookItem = {
  userBookId: string;
  title: string;
  thumbnailUrl: string | null;
  status: string;
  isPastBook: boolean;
  createdAt: string | null;
  googleBooksId: string | null;
};

export async function listLibraryBooksForUser(userId: string): Promise<LibraryBookItem[]> {
  const db = getInstantAdminDb();
  const result = await db.query({
    user_books: {
      user: {},
      book: {},
    },
  });

  const rows = Array.isArray((result as any)?.user_books) ? (result as any).user_books : [];
  const out: LibraryBookItem[] = [];

  for (const raw of rows) {
    if (!raw || typeof raw !== "object" || !("id" in raw)) continue;
    const ub = raw as {
      id: string;
      owner_user_id?: string;
      user?: unknown;
      status?: string;
      is_past_book?: boolean;
      book_title?: string;
      book_thumbnail_url?: string | null;
      created_at?: string | Date;
      book?: unknown;
    };

    const ownerField = typeof ub.owner_user_id === "string" ? ub.owner_user_id : null;
    const linkedUser = first(ub.user as any) as { id?: string } | undefined;
    const linkedUserId = typeof linkedUser?.id === "string" ? linkedUser.id : null;
    if (ownerField !== userId && linkedUserId !== userId) continue;

    const linkedBook = first(ub.book as any) as
      | { title?: string; thumbnail_url?: string | null }
      | undefined;

    const googleBooksId =
      (typeof (linkedBook as any)?.google_books_id === "string"
        ? (linkedBook as any).google_books_id
        : typeof (ub as any).google_books_id === "string"
          ? (ub as any).google_books_id
          : null) ?? null;

    const title =
      (typeof linkedBook?.title === "string" && linkedBook.title) ||
      (typeof ub.book_title === "string" && ub.book_title) ||
      "Untitled";
    const thumbnailUrl =
      (typeof linkedBook?.thumbnail_url === "string" && linkedBook.thumbnail_url) ||
      (typeof ub.book_thumbnail_url === "string" ? ub.book_thumbnail_url : null);

    out.push({
      userBookId: ub.id,
      title,
      thumbnailUrl,
      status: typeof ub.status === "string" ? ub.status : "",
      isPastBook: toIsPastBook(ub.is_past_book),
      createdAt:
        typeof ub.created_at === "string"
          ? ub.created_at
          : ub.created_at instanceof Date
            ? ub.created_at.toISOString()
            : null,
      googleBooksId,
    });
  }

  out.sort((a, b) => (b.createdAt ?? "").localeCompare(a.createdAt ?? ""));
  return out;
}

