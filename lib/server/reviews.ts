import "server-only";
import { id } from "@instantdb/admin";
import { getInstantAdminDb } from "@/lib/db/instant-admin";

function first<T>(value: T | T[] | undefined | null): T | undefined {
  if (value === undefined || value === null) return undefined;
  return Array.isArray(value) ? value[0] : value;
}

export async function upsertReviewForUserBook(
  ownerUserId: string,
  userBookId: string,
  text: string,
): Promise<{ reviewId: string }> {
  const db = getInstantAdminDb() as any;
  const now = new Date();

  // Prefer stable direct query fields (they avoid link-expansion flakiness in dev).
  const direct = await db.query({
    reviews: {
      $: {
        where: {
          owner_user_id: ownerUserId,
          user_book_id_ref: userBookId,
        },
      },
    },
  });

  const directRow = direct.reviews?.[0] as
    | {
        id?: string;
        text?: string;
        updated_at?: unknown;
      }
    | undefined;

  let reviewId = directRow?.id ?? null;
  const isNew = !reviewId;

  if (!reviewId) {
    // Fallback: discover review via user_book expansion.
    try {
      const viaLink = await db.query({
        user_books: {
          $: { where: { id: userBookId } },
          review: {},
        },
      });
      const ub = viaLink.user_books?.[0] as unknown as { review?: unknown };
      const linkedReview = first((ub as any)?.review);
      if (linkedReview && typeof linkedReview === "object" && "id" in linkedReview) {
        reviewId = String((linkedReview as any).id);
      }
    } catch {
      // ignore, we'll create a new review record
    }
  }

  reviewId = reviewId ?? id();

  // Best-effort enrichment: also store book_id_ref when available.
  let bookIdRef: string | null = null;
  try {
    const ub = await db.query({
      user_books: {
        $: { where: { id: userBookId } },
      },
    });
    const row = ub.user_books?.[0] as any;
    if (typeof row?.book_id_ref === "string") bookIdRef = row.book_id_ref;
  } catch {
    // ignore; review still stores the text and user linkage
  }

  await db.transact(
    db.tx.reviews[reviewId].update({
      owner_user_id: ownerUserId,
      user_book_id_ref: userBookId,
      ...(bookIdRef ? { book_id_ref: bookIdRef } : {}),
      text,
      ...(isNew ? { created_at: now } : {}),
      updated_at: now,
    }),
  );

  // Best-effort linking for future query paths.
  try {
    await db.transact(db.tx.user_books[userBookId].link({ review: reviewId }));
  } catch {}
  try {
    await db.transact(db.tx.reviews[reviewId].link({ user: ownerUserId }));
  } catch {}

  return { reviewId };
}

export async function getReviewForUserBookText(
  ownerUserId: string,
  userBookId: string,
): Promise<string | null> {
  const db = getInstantAdminDb() as any;

  const direct = await db.query({
    reviews: {
      $: {
        where: {
          owner_user_id: ownerUserId,
          user_book_id_ref: userBookId,
        },
      },
    },
  });

  const row = direct.reviews?.[0] as
    | {
        text?: unknown;
      }
    | undefined;
  const directText = typeof row?.text === "string" ? row.text : null;
  if (directText && directText.trim().length > 0) return directText;

  // Fallback: via user_book expansion.
  try {
    const viaLink = await db.query({
      user_books: {
        $: { where: { id: userBookId } },
        review: {},
      },
    });
    const ub = viaLink.user_books?.[0] as any;
    const linkedReview = first(ub?.review);
    const text = typeof linkedReview?.text === "string" ? linkedReview.text : null;
    return text && text.trim().length > 0 ? text : null;
  } catch {
    return null;
  }
}

export async function deleteReviewForUserBook(
  ownerUserId: string,
  userBookId: string,
): Promise<{ deleted: boolean }> {
  const db = getInstantAdminDb() as any;

  const direct = await db.query({
    reviews: {
      $: {
        where: {
          owner_user_id: ownerUserId,
          user_book_id_ref: userBookId,
        },
      },
    },
  });

  const row = direct.reviews?.[0] as { id?: string } | undefined;
  if (!row?.id) return { deleted: false };

  await db.tx.reviews[row.id].delete();
  return { deleted: true };
}

