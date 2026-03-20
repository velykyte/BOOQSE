"use server";

import { requireInstantUser } from "@/lib/server/session-user";
import { generateRecommendationsForUser } from "@/lib/server/recommendations";

export type GenerateRecommendationsResult =
  | { ok: true }
  | { ok: false; error: string };

export async function generateRecommendations(): Promise<GenerateRecommendationsResult> {
  const auth = await requireInstantUser();
  if (!auth) {
    return { ok: false, error: "You need to sign in again." };
  }

  try {
    await generateRecommendationsForUser(auth.user.id);
    return { ok: true };
  } catch (e) {
    const message = e instanceof Error ? e.message : "Something went wrong.";
    if (message === "NOT_ALLOWED") {
      return { ok: false, error: "You can only generate recommendations after rating at least 3 books." };
    }
    if (message === "Missing OPENAI_API_KEY.") {
      return { ok: false, error: "Recommendations are unavailable: OPENAI_API_KEY is not set." };
    }
    if (message === "Missing GOOGLE_BOOKS_API_KEY.") {
      return { ok: false, error: "Recommendations are unavailable: GOOGLE_BOOKS_API_KEY is not set." };
    }
    return { ok: false, error: message || "Something went wrong. Try again." };
  }
}

