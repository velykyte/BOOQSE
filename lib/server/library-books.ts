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
  author: string | null;
  thumbnailUrl: string | null;
  status: string;
  isPastBook: boolean;
  createdAt: string | null;
  googleBooksId: string | null;
  userDefinedTotalPages: number | null;
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
      user_defined_total_pages?: number | string | null;
      book_title?: string;
      book_authors?: unknown;
      book_thumbnail_url?: string | null;
      created_at?: string | Date;
      book?: unknown;
    };

    const ownerField = typeof ub.owner_user_id === "string" ? ub.owner_user_id : null;
    const linkedUser = first(ub.user as any) as { id?: string } | undefined;
    const linkedUserId = typeof linkedUser?.id === "string" ? linkedUser.id : null;
    if (ownerField !== userId && linkedUserId !== userId) continue;

    const linkedBook = first(ub.book as any) as
      | { title?: string; author?: unknown; thumbnail_url?: string | null }
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

    const author = (() => {
      // Prefer `user_books.book_authors` (written during add-book),
      // but fall back to canonical `books.author` if needed.
      const v = (ub as any)?.book_authors ?? (linkedBook as any)?.author;
      if (v == null) return null;
      if (typeof v === "string") {
        const t = v.trim();
        return t.length ? t : null;
      }
      if (Array.isArray(v)) {
        const parts = v.filter((x) => typeof x === "string" && x.trim().length > 0) as string[];
        return parts.length ? parts.map((p) => p.trim()).join(", ") : null;
      }
      // Handle JSON objects that come back from InstantDB with numeric keys (array-ish objects).
      if (typeof v === "object") {
        const keys = Object.keys(v).filter((k) => /^\d+$/.test(k)).sort((a, b) => Number(a) - Number(b));
        const parts = keys
          .map((k) => (v as any)[k])
          .filter((x) => typeof x === "string" && x.trim().length > 0) as string[];
        return parts.length ? parts.map((p) => p.trim()).join(", ") : null;
      }
      return null;
    })();
    const thumbnailUrl =
      (typeof linkedBook?.thumbnail_url === "string" && linkedBook.thumbnail_url) ||
      (typeof ub.book_thumbnail_url === "string" ? ub.book_thumbnail_url : null);

    out.push({
      userBookId: ub.id,
      title,
      author,
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
      userDefinedTotalPages: (() => {
        if (typeof (ub as any).user_defined_total_pages === "number") {
          const v = (ub as any).user_defined_total_pages;
          return Number.isFinite(v) ? v : null;
        }
        if (typeof (ub as any).user_defined_total_pages === "string") {
          const parsed = Number.parseInt((ub as any).user_defined_total_pages, 10);
          return Number.isFinite(parsed) ? parsed : null;
        }
        return null;
      })(),
    });
  }

  out.sort((a, b) => (b.createdAt ?? "").localeCompare(a.createdAt ?? ""));
  return out;
}

