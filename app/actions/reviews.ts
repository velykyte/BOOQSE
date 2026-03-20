"use server";

import { requireInstantUser } from "@/lib/server/session-user";
import { getUserBookForOwner } from "@/lib/server/get-user-book-detail";
import {
  deleteReviewForUserBook,
  getReviewForUserBookText,
  upsertReviewForUserBook,
} from "@/lib/server/reviews";
import { deleteReviewSchema, saveReviewSchema } from "@/lib/validation/reviews";

export type SaveReviewResult =
  | { ok: true; userBookId: string }
  | { ok: false; error: string };

export async function saveReview(input: unknown): Promise<SaveReviewResult> {
  const auth = await requireInstantUser();
  if (!auth) {
    return { ok: false, error: "You need to sign in again." };
  }

  const parsed = saveReviewSchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, error: "Write a review before saving." };
  }

  const detail = await getUserBookForOwner(parsed.data.userBookId, auth.user.id);
  if (!detail) {
    return { ok: false, error: "Book not found." };
  }

  const allowed = detail.isPastBook || detail.status === "finished";
  if (!allowed) {
    return { ok: false, error: "You can only review finished or past books." };
  }

  try {
    await upsertReviewForUserBook(auth.user.id, parsed.data.userBookId, parsed.data.reviewText);
    return { ok: true, userBookId: parsed.data.userBookId };
  } catch (e) {
    console.error("[saveReview] upsert failed", {
      userId: auth.user.id,
      userBookId: parsed.data.userBookId,
      error: e instanceof Error ? e.message : e,
    });

    // InstantDB/schema drift can occasionally throw after persisting writes.
    // If the review is now present, treat it as success so the UI doesn't
    // show a false negative.
    const saved = await getReviewForUserBookText(auth.user.id, parsed.data.userBookId);
    if (saved && saved.trim().length > 0) {
      return { ok: true, userBookId: parsed.data.userBookId };
    }

    return { ok: false, error: "Something went wrong. Try again." };
  }
}

export type DeleteReviewResult =
  | { ok: true; userBookId: string }
  | { ok: false; error: string };

export async function deleteReview(input: unknown): Promise<DeleteReviewResult> {
  const auth = await requireInstantUser();
  if (!auth) {
    return { ok: false, error: "You need to sign in again." };
  }

  const parsed = deleteReviewSchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, error: "Book not found." };
  }

  const detail = await getUserBookForOwner(parsed.data.userBookId, auth.user.id);
  if (!detail) {
    return { ok: false, error: "Book not found." };
  }

  const allowed = detail.isPastBook || detail.status === "finished";
  if (!allowed) {
    return { ok: false, error: "You can only review finished or past books." };
  }

  try {
    const r = await deleteReviewForUserBook(auth.user.id, parsed.data.userBookId);
    if (!r.deleted) {
      // Idempotent: already deleted.
      return { ok: true, userBookId: parsed.data.userBookId };
    }
    return { ok: true, userBookId: parsed.data.userBookId };
  } catch {
    return { ok: false, error: "Something went wrong. Try again." };
  }
}

