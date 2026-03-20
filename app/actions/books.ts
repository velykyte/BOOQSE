"use server";

import {
  findUserBookForGoogleBooksId,
  insertCurrentUserBook,
  insertPastUserBook,
  insertWantToReadUserBook,
  markUserBookFinished,
} from "@/lib/server/user-books-write";
import { requireInstantUser } from "@/lib/server/session-user";
import { getInstantAdminDb } from "@/lib/db/instant-admin";
import { listLibraryBooksForUser } from "@/lib/server/library-books";
import {
  addCurrentBookSchema,
  addPastBookSchema,
  markBookFinishedSchema,
  deleteUserBookSchema,
  moveUserBookToWantToReadSchema,
} from "@/lib/validation/books";

export type AddBookActionResult =
  | { ok: true; userBookId: string }
  | { ok: false; error: string };

export async function addCurrentReadingBook(input: unknown): Promise<AddBookActionResult> {
  const auth = await requireInstantUser();
  if (!auth) {
    return { ok: false, error: "You need to sign in again." };
  }

  const parsed = addCurrentBookSchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, error: "Check your input and try again." };
  }

  const duplicateId = await findUserBookForGoogleBooksId(
    auth.user.id,
    parsed.data.googleBooksId,
  );
  if (duplicateId) {
    return { ok: false, error: "This book is already in your library." };
  }

  try {
    const { userBookId } = await insertCurrentUserBook(auth.user.id, parsed.data);
    return { ok: true, userBookId };
  } catch (e) {
    console.error("[addCurrentReadingBook] failed", {
      userId: auth.user.id,
      googleBooksId: parsed.data.googleBooksId,
      error: e,
    });
    return { ok: false, error: "Something went wrong. Try again." };
  }
}

export async function addPastFinishedBook(input: unknown): Promise<AddBookActionResult> {
  const auth = await requireInstantUser();
  if (!auth) {
    return { ok: false, error: "You need to sign in again." };
  }

  const parsed = addPastBookSchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, error: "Check your input and try again." };
  }

  const duplicateId = await findUserBookForGoogleBooksId(
    auth.user.id,
    parsed.data.googleBooksId,
  );
  if (duplicateId) {
    return { ok: false, error: "This book is already in your library." };
  }

  try {
    const { userBookId } = await insertPastUserBook(auth.user.id, parsed.data);
    return { ok: true, userBookId };
  } catch (e) {
    console.error("[addPastFinishedBook] failed", {
      userId: auth.user.id,
      googleBooksId: parsed.data.googleBooksId,
      rating: parsed.data.rating,
      error: e,
    });
    return { ok: false, error: "Something went wrong. Try again." };
  }
}

export async function addWantToReadBook(input: unknown): Promise<AddBookActionResult> {
  const auth = await requireInstantUser();
  if (!auth) {
    return { ok: false, error: "You need to sign in again." };
  }

  const parsed = addCurrentBookSchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, error: "Check your input and try again." };
  }

  try {
    const { userBookId } = await insertWantToReadUserBook(auth.user.id, parsed.data);
    return { ok: true, userBookId };
  } catch (e) {
    console.error("[addWantToReadBook] failed", {
      userId: auth.user.id,
      googleBooksId: parsed.data.googleBooksId,
      error: e,
    });
    return { ok: false, error: "Something went wrong. Try again." };
  }
}

export async function markBookFinished(input: unknown): Promise<AddBookActionResult> {
  const auth = await requireInstantUser();
  if (!auth) {
    return { ok: false, error: "You need to sign in again." };
  }

  const parsed = markBookFinishedSchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, error: "Choose a rating from 1 to 10." };
  }

  try {
    const { userBookId } = await markUserBookFinished(
      auth.user.id,
      parsed.data.userBookId,
      parsed.data.rating,
      parsed.data.reviewText,
    );
    return { ok: true, userBookId };
  } catch (e) {
    const code = e instanceof Error ? e.message : "";
    if (code === "NOT_FOUND" || code === "NOT_ALLOWED") {
      return { ok: false, error: "Book not found." };
    }
    console.error("[markBookFinished] failed", {
      userId: auth.user.id,
      userBookId: parsed.data.userBookId,
      rating: parsed.data.rating,
      error: e,
    });
    return { ok: false, error: "Something went wrong. Try again." };
  }
}

export type DeleteUserBookResult =
  | { ok: true }
  | { ok: false; error: string };

export async function deleteUserBook(input: unknown): Promise<DeleteUserBookResult> {
  const auth = await requireInstantUser();
  if (!auth) {
    return { ok: false, error: "You need to sign in again." };
  }

  const parsed = deleteUserBookSchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, error: "Check your input and try again." };
  }

  const db = getInstantAdminDb();
  const userId = auth.user.id;
  const userBookId = parsed.data.userBookId;

  try {
    // Validate ownership via the same robust listing logic used by Profile.
    // This avoids relying on link expansion attributes that can be missing in dev.
    const books = await listLibraryBooksForUser(userId);
    const ub = books.find((b) => b.userBookId === userBookId) ?? null;
    if (!ub) return { ok: false, error: "Not allowed." };
    if (ub.status === "finished") {
      return { ok: false, error: "You can’t remove a finished book from this list." };
    }

    // InstantDB mutations must run through `db.transact()` to take effect.
    await db.transact((db.tx.user_books[userBookId] as any).delete());
    return { ok: true };
  } catch (e) {
    console.error("[deleteUserBook] failed", { userId, userBookId, error: e });
    return { ok: false, error: "Something went wrong. Try again." };
  }
}

export type MoveUserBookToWantToReadResult = { ok: true } | { ok: false; error: string };

export async function moveUserBookToWantToRead(
  input: unknown,
): Promise<MoveUserBookToWantToReadResult> {
  const auth = await requireInstantUser();
  if (!auth) {
    return { ok: false, error: "You need to sign in again." };
  }

  const parsed = moveUserBookToWantToReadSchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, error: "Check your input and try again." };
  }

  const db = getInstantAdminDb();
  const userId = auth.user.id;
  const userBookId = parsed.data.userBookId;

  try {
    const res = await (db as any).query({
      user_books: {
        $: { where: { id: userBookId } },
        user: {},
      },
    } as any);

    const ub = Array.isArray(res.user_books) ? res.user_books[0] : null;
    if (!ub) return { ok: false, error: "Book not found." };

    const ownerField = typeof ub.owner_user_id === "string" ? ub.owner_user_id : null;
    const linkedUserRaw = ub.user as unknown;
    const linkedUser = Array.isArray(linkedUserRaw) ? linkedUserRaw[0] : linkedUserRaw;
    const linkedUserId =
      linkedUser && typeof (linkedUser as any).id === "string" ? (linkedUser as any).id : null;

    if (ownerField !== userId && linkedUserId !== userId) {
      return { ok: false, error: "Not allowed." };
    }

    // Don't allow moving finished books back into Want to Read.
    const status = typeof ub.status === "string" ? ub.status : "";
    if (status === "finished") {
      return { ok: false, error: "You can’t move a finished book." };
    }

    await (db.tx.user_books[userBookId] as any).update({
      status: "want_to_read",
      is_past_book: false,
      updated_at: new Date(),
    });

    return { ok: true };
  } catch (e) {
    console.error("[moveUserBookToWantToRead] failed", { userId, userBookId, error: e });
    return { ok: false, error: "Something went wrong. Try again." };
  }
}
