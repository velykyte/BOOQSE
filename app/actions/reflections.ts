"use server";

import { deleteReflectionForUserBook, upsertReflectionForSession } from "@/lib/server/reflections";
import { requireInstantUser } from "@/lib/server/session-user";
import { deleteReflectionSchema, saveReflectionSchema } from "@/lib/validation/reflections";

export type SaveReflectionResult =
  | { ok: true; userBookId: string }
  | { ok: false; error: string };

export async function saveReflection(input: unknown): Promise<SaveReflectionResult> {
  const auth = await requireInstantUser();
  if (!auth) return { ok: false, error: "You need to sign in again." };

  const parsed = saveReflectionSchema.safeParse(input);
  if (!parsed.success) return { ok: false, error: "Check your answers and try again." };

  try {
    await upsertReflectionForSession(auth.user.id, parsed.data.userBookId, parsed.data.sessionId, {
      question1: parsed.data.question1,
      question2: parsed.data.question2,
      question3: parsed.data.question3,
      question4: parsed.data.question4,
      question5: parsed.data.question5,
    });
    return { ok: true, userBookId: parsed.data.userBookId };
  } catch (e) {
    const code = e instanceof Error ? e.message : "";
    if (code === "NOT_ALLOWED") {
      return { ok: false, error: "That session is not available for reflection." };
    }
    console.error("[saveReflection] failed", {
      userId: auth.user.id,
      sessionId: parsed.data.sessionId,
      userBookId: parsed.data.userBookId,
      error: e,
    });
    return { ok: false, error: "Something went wrong. Try again." };
  }
}

export type DeleteReflectionResult =
  | { ok: true; reflectionId: string }
  | { ok: false; error: string };

export async function deleteReflection(input: unknown): Promise<DeleteReflectionResult> {
  const auth = await requireInstantUser();
  if (!auth) return { ok: false, error: "You need to sign in again." };

  const parsed = deleteReflectionSchema.safeParse(input);
  if (!parsed.success) return { ok: false, error: "Invalid reflection." };

  try {
    await deleteReflectionForUserBook(auth.user.id, parsed.data.userBookId, parsed.data.reflectionId);
    return { ok: true, reflectionId: parsed.data.reflectionId };
  } catch (e) {
    const code = e instanceof Error ? e.message : "";
    if (code === "NOT_ALLOWED") return { ok: false, error: "Reflection not found." };
    console.error("[deleteReflection] failed", {
      userId: auth.user.id,
      reflectionId: parsed.data.reflectionId,
      userBookId: parsed.data.userBookId,
      error: e,
    });
    return { ok: false, error: "Something went wrong. Try again." };
  }
}

