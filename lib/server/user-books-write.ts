import "server-only";
import { id } from "@instantdb/admin";
import { getInstantAdminDb } from "@/lib/db/instant-admin";
import { upsertReviewForUserBook } from "@/lib/server/reviews";
import { requireEnv } from "@/lib/db/env";
import { getGoogleBooksVolumeById } from "@/lib/server/google-books";

type BookRow = { id: string; google_books_id?: string };

export type AddCurrentBookInput = {
  googleBooksId: string;
  title: string;
  authors: string[];
  thumbnailUrl?: string | null;
  publishedDate?: string | null;
  userDefinedTotalPages: number;
};

export type AddPastBookInput = {
  googleBooksId: string;
  title: string;
  authors: string[];
  thumbnailUrl?: string | null;
  publishedDate?: string | null;
  rating: number;
};

function normalizeBookFromLink(book: unknown): BookRow | null {
  if (!book) return null;
  if (Array.isArray(book)) {
    const first = book[0];
    return first && typeof first === "object" && "id" in first
      ? (first as BookRow)
      : null;
  }
  if (typeof book === "object" && book !== null && "id" in book) {
    return book as BookRow;
  }
  return null;
}

async function ensureUserBookLinkedToBook(
  userBookId: string,
  bookId: string,
): Promise<void> {
  const db = getInstantAdminDb() as any;
  const check = await db.query({
    user_books: {
      $: { where: { id: userBookId } },
      book: {},
      books: {},
    },
  });

  const row = check.user_books?.[0] as
    | {
        book?: unknown;
        books?: unknown;
      }
    | undefined;

  const linked = normalizeBookFromLink(row?.book) ?? normalizeBookFromLink(row?.books);
  if (linked?.id) return;

  // Dev schema drift can cause link label mismatch. Try both labels.
  try {
    await db.transact(db.tx.user_books[userBookId].link({ book: bookId }));
  } catch {
    // ignore and try alternate label
  }
  try {
    await db.transact(db.tx.user_books[userBookId].link({ books: bookId }));
  } catch {
    // ignore; caller can still proceed with created row
  }
}

export async function findUserBookForGoogleBooksId(
  userId: string,
  googleBooksId: string,
): Promise<string | null> {
  const db = getInstantAdminDb() as any;

  // Prefer stable custom fields (remote schema may not have link expansions enabled).
  const bookId = await findBookIdByGoogleBooksId(googleBooksId);
  if (bookId) {
    try {
      const result = await db.query({
        user_books: {
          $: { where: { owner_user_id: userId, book_id_ref: bookId } },
        },
      } as any);

      const row = Array.isArray(result.user_books) ? result.user_books[0] : null;
      if (row && typeof row.id === "string") return row.id;
    } catch {
      // Fall back to link-expansion method below.
    }
  }

  // Fallback: link expansion via users -> user_books -> book.
  const result = await db.query({
    users: {
      $: { where: { id: userId } },
      user_books: {
        book: {},
      },
    },
  });

  const userRow = result.users?.[0];
  const userBooks = userRow?.user_books;
  const list = Array.isArray(userBooks) ? userBooks : userBooks ? [userBooks] : [];

  for (const ub of list) {
    if (!ub || typeof ub !== "object" || !("id" in ub)) continue;
    const b = normalizeBookFromLink((ub as { book?: unknown }).book);
    const gid = b?.google_books_id;
    if (gid === googleBooksId) {
      return (ub as { id: string }).id;
    }
  }

  return null;
}

export async function findBookIdByGoogleBooksId(googleBooksId: string): Promise<string | null> {
  const db = getInstantAdminDb() as any;
  const result = await db.query({
    books: {
      $: { where: { google_books_id: googleBooksId } },
    },
  });
  const row = result.books?.[0];
  return row?.id ?? null;
}

export async function insertCurrentUserBook(
  userId: string,
  input: AddCurrentBookInput,
): Promise<{ userBookId: string }> {
  const db = getInstantAdminDb() as any;
  const now = new Date();

  const existing = await findBookIdByGoogleBooksId(input.googleBooksId);
  const bookId = existing ?? id();
  const existingUserBookId = await findUserBookForGoogleBooksId(userId, input.googleBooksId);

  // Backfill missing cover / published date using Google Books.
  let thumbnailUrl = input.thumbnailUrl ?? null;
  let publishedDate = input.publishedDate ?? null;
  if (!thumbnailUrl || !publishedDate) {
    try {
      const googleKey = requireEnv("GOOGLE_BOOKS_API_KEY", process.env.GOOGLE_BOOKS_API_KEY);
      const vol = await getGoogleBooksVolumeById(input.googleBooksId, googleKey);
      if (!thumbnailUrl) thumbnailUrl = vol.thumbnailUrl;
      if (!publishedDate) publishedDate = vol.publishedDate;
    } catch {
      // Best-effort: if enrichment fails, keep the input values.
    }
  }

  const userBookId = existingUserBookId ?? id();

  const chunks = [];

  // Always upsert canonical book metadata. This prevents stale/partial existing
  // rows from rendering as "Untitled" when linked from new user_books.
  chunks.push(
    db.tx.books[bookId].update({
      google_books_id: input.googleBooksId,
      title: input.title,
      author: input.authors,
      thumbnail_url: thumbnailUrl ?? undefined,
      published_date: publishedDate ?? undefined,
      ...(existing ? {} : { created_at: now }),
    }),
  );

  const userBooksUpdate = {
    owner_user_id: userId,
    book_id_ref: bookId,
    status: "currently_reading",
    is_past_book: false,
    book_title: input.title,
    book_authors: input.authors,
    book_thumbnail_url: thumbnailUrl ?? undefined,
    user_defined_total_pages: input.userDefinedTotalPages,
    ...(existingUserBookId
      ? { updated_at: now }
      : { created_at: now, updated_at: now }),
  } as any;

  chunks.push(db.tx.user_books[userBookId].update(userBooksUpdate));

  await db.transact(chunks);
  await ensureUserBookLinkedToBook(userBookId, bookId);
  return { userBookId };
}

export async function insertPastUserBook(
  userId: string,
  input: AddPastBookInput,
): Promise<{ userBookId: string }> {
  const db = getInstantAdminDb() as any;
  const now = new Date();

  const existing = await findBookIdByGoogleBooksId(input.googleBooksId);
  const bookId = existing ?? id();
  const existingUserBookId = await findUserBookForGoogleBooksId(userId, input.googleBooksId);

  let thumbnailUrl = input.thumbnailUrl ?? null;
  let publishedDate = input.publishedDate ?? null;
  if (!thumbnailUrl || !publishedDate) {
    try {
      const googleKey = requireEnv("GOOGLE_BOOKS_API_KEY", process.env.GOOGLE_BOOKS_API_KEY);
      const vol = await getGoogleBooksVolumeById(input.googleBooksId, googleKey);
      if (!thumbnailUrl) thumbnailUrl = vol.thumbnailUrl;
      if (!publishedDate) publishedDate = vol.publishedDate;
    } catch {
      // Best-effort: if enrichment fails, keep the input values.
    }
  }

  const userBookId = existingUserBookId ?? id();

  const chunks = [];

  // Always upsert canonical book metadata. This prevents stale/partial existing
  // rows from rendering as "Untitled" when linked from new user_books.
  chunks.push(
    db.tx.books[bookId].update({
      google_books_id: input.googleBooksId,
      title: input.title,
      author: input.authors,
      thumbnail_url: thumbnailUrl ?? undefined,
      published_date: publishedDate ?? undefined,
      ...(existing ? {} : { created_at: now }),
    }),
  );

  const userBooksUpdate = {
    owner_user_id: userId,
    book_id_ref: bookId,
    status: "finished",
    is_past_book: true,
    book_title: input.title,
    book_authors: input.authors,
    book_thumbnail_url: thumbnailUrl ?? undefined,
    rating: input.rating,
    finished_at: now,
    ...(existingUserBookId
      ? { updated_at: now }
      : { created_at: now, updated_at: now }),
  } as any;

  chunks.push(db.tx.user_books[userBookId].update(userBooksUpdate));

  await db.transact(chunks);
  await ensureUserBookLinkedToBook(userBookId, bookId);
  return { userBookId };
}

export async function insertWantToReadUserBook(
  userId: string,
  input: AddCurrentBookInput,
): Promise<{ userBookId: string }> {
  const db = getInstantAdminDb() as any;
  const now = new Date();

  const existing = await findBookIdByGoogleBooksId(input.googleBooksId);
  const bookId = existing ?? id();
  const existingUserBookId = await findUserBookForGoogleBooksId(userId, input.googleBooksId);

  // Backfill missing cover / published date using Google Books.
  let thumbnailUrl = input.thumbnailUrl ?? null;
  let publishedDate = input.publishedDate ?? null;
  if (!thumbnailUrl || !publishedDate) {
    try {
      const googleKey = requireEnv("GOOGLE_BOOKS_API_KEY", process.env.GOOGLE_BOOKS_API_KEY);
      const vol = await getGoogleBooksVolumeById(input.googleBooksId, googleKey);
      if (!thumbnailUrl) thumbnailUrl = vol.thumbnailUrl;
      if (!publishedDate) publishedDate = vol.publishedDate;
    } catch {
      // Best-effort: if enrichment fails, keep the input values.
    }
  }

  const userBookId = existingUserBookId ?? id();

  const chunks = [];

  // Always upsert canonical book metadata.
  chunks.push(
    db.tx.books[bookId].update({
      google_books_id: input.googleBooksId,
      title: input.title,
      author: input.authors,
      thumbnail_url: thumbnailUrl ?? undefined,
      published_date: publishedDate ?? undefined,
      ...(existing ? {} : { created_at: now }),
    }),
  );

  chunks.push(
    db.tx.user_books[userBookId].update({
      owner_user_id: userId,
      book_id_ref: bookId,
      status: "want_to_read",
      is_past_book: false,
      book_title: input.title,
      book_authors: input.authors,
      book_thumbnail_url: thumbnailUrl ?? undefined,
      user_defined_total_pages: input.userDefinedTotalPages,
      ...(existingUserBookId ? { updated_at: now } : { created_at: now, updated_at: now }),
    }),
  );

  await db.transact(chunks);
  await ensureUserBookLinkedToBook(userBookId, bookId);
  return { userBookId };
}

export async function markUserBookFinished(
  userId: string,
  userBookId: string,
  rating: number,
  reviewText?: string,
): Promise<{ userBookId: string }> {
  const db = getInstantAdminDb() as any;
  const result = await db.query({
    user_books: {
      $: { where: { id: userBookId } },
      user: {},
    },
  });

  const ub = result.user_books?.[0] as
    | {
        id: string;
        owner_user_id?: string;
        user?: { id?: string } | { id?: string }[];
        is_past_book?: boolean;
        status?: string;
      }
    | undefined;
  if (!ub) throw new Error("NOT_FOUND");

  const ownerField = typeof ub.owner_user_id === "string" ? ub.owner_user_id : null;
  const linkedUserRaw = (ub as any).user as unknown;
  const linkedUser = Array.isArray(linkedUserRaw)
    ? (linkedUserRaw[0] as any)
    : (linkedUserRaw as any);
  const linkedUserId = typeof linkedUser?.id === "string" ? linkedUser.id : null;
  if (ownerField !== userId && linkedUserId !== userId) throw new Error("NOT_ALLOWED");

  if (ub.is_past_book || ub.status === "finished") {
    // Already finished; keep idempotent behavior.
    return { userBookId };
  }

  const now = new Date();
  await db.transact(
    db.tx.user_books[userBookId].update({
      status: "finished",
      // Finished from active tracking should keep logs/reflections for stats.
      is_past_book: false,
      rating,
      finished_at: now,
      updated_at: now,
    }),
  );

  if (typeof reviewText === "string" && reviewText.trim().length > 0) {
    await upsertReviewForUserBook(userId, userBookId, reviewText.trim());
  }
  return { userBookId };
}
