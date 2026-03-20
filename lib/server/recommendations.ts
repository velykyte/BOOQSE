import "server-only";
import { z } from "zod";
import { id } from "@instantdb/admin";
import { getInstantAdminDb } from "@/lib/db/instant-admin";
import { getGoogleBooksVolumeById, searchGoogleBooksVolumes } from "@/lib/server/google-books";
import { listReflectionsForUserBook } from "@/lib/server/reflections";
import { getReviewForUserBookText } from "@/lib/server/reviews";
import { listLibraryBooksForUser } from "@/lib/server/library-books";
import { unstable_cache as cache } from "next/cache";

type InstantValue = string | number | boolean | null | undefined;

function toYmdUtc(d: Date): string {
  return d.toISOString().slice(0, 10);
}

function truncate(value: string, maxChars: number): string {
  const trimmed = value.trim();
  if (trimmed.length <= maxChars) return trimmed;
  return trimmed.slice(0, maxChars);
}

function extractFirstJsonObject(text: string): unknown {
  const start = text.indexOf("{");
  if (start === -1) return null;
  const end = text.lastIndexOf("}");
  if (end === -1 || end <= start) return null;
  const json = text.slice(start, end + 1);
  try {
    return JSON.parse(json);
  } catch {
    return null;
  }
}

const tasteProfileOutputSchema = z.object({
  taste_profile_summary: z.string().min(1).max(2000),
  taste_profile_genres: z
    .array(z.string().min(1).max(40))
    .length(5),
});

const recommendationsOutputSchema = z.object({
  recommendations: z
    .array(
      z.object({
        title: z.string().min(1).max(500),
        author: z.string().min(1).max(300),
        explanation: z.string().min(1).max(600),
        searchQuery: z.string().min(1).max(300),
      }),
    )
    .length(3),
});

export type RecommendationItemView = {
  position: 1 | 2 | 3;
  title: string;
  authorsCsv: string;
  googleBooksId: string;
  thumbnailUrl: string | null;
  publishedDate: string | null;
  explanation: string;
};

export type RecommendationsPageView = {
  ratedBooksCount: number;
  refreshRemaining: number;
  latestRecommendationId: string | null;
  latestItems: RecommendationItemView[];
};

type RatedBookInput = {
  userBookId: string;
  title: string;
  authorsCsv: string;
  rating: number;
};

async function getUserRatedBooks(userId: string): Promise<RatedBookInput[]> {
  const db = getInstantAdminDb();
  const result = await (db as any).query({
    user_books: {
      $: { where: { owner_user_id: userId } },
    },
  } as any);

  const rows = Array.isArray(result.user_books) ? result.user_books : [];
  const out: RatedBookInput[] = [];

  const toIsPastBook = (value: unknown): boolean => {
    if (typeof value === "boolean") return value;
    if (typeof value === "string") {
      const v = value.trim().toLowerCase();
      if (v === "true" || v === "1" || v === "yes") return true;
      if (v === "false" || v === "0" || v === "no" || v === "") return false;
      return Boolean(v);
    }
    if (typeof value === "number") return value === 1;
    return Boolean(value);
  };

  for (const r of rows) {
    if (!r || typeof r !== "object") continue;
    const row = r as Record<string, InstantValue>;
    const rating = typeof row.rating === "number" ? row.rating : null;
    const status = typeof row.status === "string" ? row.status : null;
    const isPastBook = toIsPastBook(row.is_past_book);
    const title = typeof row.book_title === "string" ? row.book_title : "Untitled";

    if (rating == null) continue;
    // Taste profile should include past books as long as they're rated.
    if (status !== "finished" && !isPastBook) continue;

    const authors = typeof row.book_authors === "string" ? row.book_authors : null;
    // We store book_authors as either array-ish or CSV depending on schema drift;
    // normalize into CSV so the prompt is stable.
    const authorsCsv =
      Array.isArray((row as any).book_authors) && (row as any).book_authors
        ? ((row as any).book_authors as unknown[])
            .filter((a) => typeof a === "string")
            .join(", ")
        : typeof authors === "string"
          ? authors
          : "";

    out.push({
      userBookId: String(row.id),
      title,
      authorsCsv: authorsCsv,
      rating,
    });
  }

  // Keep the prompt size bounded.
  out.sort((a, b) => b.rating - a.rating);
  return out.slice(0, 6);
}

async function getUserRefreshCountsToday(userId: string): Promise<number> {
  const db = getInstantAdminDb();
  const all = await (db as any).query({
    ai_recommendations: {
      $: { where: { owner_user_id: userId } },
    },
  } as any);

  const rows = Array.isArray(all.ai_recommendations) ? all.ai_recommendations : [];
  const todayYmd = toYmdUtc(new Date());
  let used = 0;
  for (const r of rows) {
    const row = r as Record<string, InstantValue> | undefined;
    if (!row) continue;
    const genAt = row.generated_at;
    const d = (genAt as any) instanceof Date ? (genAt as any) : genAt ? new Date(String(genAt)) : null;
    if (!d || Number.isNaN(d.getTime())) continue;
    if (toYmdUtc(d) === todayYmd) used += 1;
  }
  return used;
}

async function getLatestRecommendationsForUser(userId: string) {
  const db = getInstantAdminDb();
  const googleBooksApiKey = process.env.GOOGLE_BOOKS_API_KEY
    ?.trim()
    .replace(/^\"|\"$/g, "");

  async function maybeFillThumbnails(items: RecommendationItemView[]) {
    if (!googleBooksApiKey) return items;
    const needsFill = items.filter((x) => !x.thumbnailUrl);
    if (needsFill.length === 0) return items;

    // Thumbnails are fetched from Google Books. Cache each `googleBooksId`
    // lookup so `/recommendations` doesn't re-call the API on every refresh.
    const getVolumeCached = cache(
      async (googleBooksId: string) => getGoogleBooksVolumeById(googleBooksId, googleBooksApiKey),
      ["googleBooksVolumeById", googleBooksApiKey, "v1"],
      { revalidate: 60 * 60 * 24 }, // 24h
    );

    return Promise.all(
      items.map(async (it) => {
        if (it.thumbnailUrl) return it;
        try {
          const vol = await getVolumeCached(it.googleBooksId);
          return { ...it, thumbnailUrl: vol.thumbnailUrl };
        } catch {
          // Best-effort: if Google Books fails, we still render cards with placeholder.
          return it;
        }
      }),
    );
  }

  const aiRes = await (db as any).query({
    ai_recommendations: {
      $: { where: { owner_user_id: userId } },
    },
  } as any);

  const rows = Array.isArray(aiRes.ai_recommendations) ? aiRes.ai_recommendations : [];
  const normalized = rows
    .map((r: unknown) => {
      const row = r as Record<string, InstantValue>;
      return {
        id: row.id ? String(row.id) : null,
        createdAt: row.created_at ? new Date(String(row.created_at)) : null,
      };
    })
    .filter(
      (x: { id: string | null; createdAt: Date | null }) =>
        Boolean(x.id) &&
        Boolean(x.createdAt) &&
        !Number.isNaN((x.createdAt as Date).getTime()),
    ) as Array<{
    id: string;
    createdAt: Date;
  }>;

  normalized.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
  const latest = normalized[0];
  if (!latest) {
    return { latestRecommendationId: null as string | null, latestItems: [] as RecommendationItemView[] };
  }

  const buildItems = (itemRows: Array<unknown>): RecommendationItemView[] => {
    type ItemDraft = Omit<RecommendationItemView, "position"> & { position?: 1 | 2 | 3 };

    const items: ItemDraft[] = itemRows
      .map((it) => {
        const row = it as Record<string, InstantValue> | undefined;
        if (!row) return null;

        const title = typeof row.book_title === "string" ? row.book_title : null;
        const authorsCsv =
          typeof row.book_authors_csv === "string" ? row.book_authors_csv : "";
        const explanation = typeof row.explanation === "string" ? row.explanation : null;
        const googleBooksId =
          typeof row.google_books_id === "string" ? row.google_books_id : null;
        if (!title || !explanation || !googleBooksId) return null;

        const positionRaw = row.position;
        const positionNum = typeof positionRaw === "number" ? positionRaw : null;
        const position =
          positionNum === 1 || positionNum === 2 || positionNum === 3 ? positionNum : undefined;

        const thumbnailUrl =
          typeof row.thumbnail_url === "string" ? row.thumbnail_url : null;
        const publishedDate =
          typeof row.published_date === "string" ? row.published_date : null;

        return {
          position,
          title,
          authorsCsv,
          googleBooksId,
          thumbnailUrl,
          publishedDate,
          explanation,
        } satisfies ItemDraft;
      })
      .filter(Boolean) as RecommendationItemView[];

    // Some remote schemas may not have `position`, so we derive it from order.
    const hasAllPositions = items.every((x) => typeof (x as any).position === "number");
    const withPositions = hasAllPositions
      ? (items as RecommendationItemView[])
      : (items.map((x, idx) => {
          const it = x as unknown as Omit<RecommendationItemView, "position"> & {
            position?: 1 | 2 | 3;
          };
          return {
            ...it,
            position: (idx + 1) as 1 | 2 | 3,
          } satisfies RecommendationItemView;
        }) as RecommendationItemView[]);

    withPositions.sort((a, b) => a.position - b.position);
    return withPositions.slice(0, 3);
  };

  // Prefer querying by the stable custom field. The remote schema might not have
  // InstantDB link attributes enabled, so `.link()` can fail even if fields exist.
  const itemsRes = await (db as any).query({
    ai_recommendation_items: {
      $: { where: { recommendation_id: latest.id } },
    },
  } as any);
  const primaryRows = Array.isArray(itemsRes.ai_recommendation_items)
    ? itemsRes.ai_recommendation_items
    : [];
  const primaryItems = buildItems(primaryRows);
  if (primaryItems.length > 0) {
    const filled = await maybeFillThumbnails(primaryItems);
    return { latestRecommendationId: latest.id, latestItems: filled };
  }

  // Expand linked items (works even if some custom fields are missing).
  try {
    const linked = await (db as any).query({
      ai_recommendations: {
        $: { where: { id: latest.id } },
        items: {},
      },
    } as any);

    const rec = Array.isArray(linked.ai_recommendations) ? linked.ai_recommendations[0] : null;
    const linkedItems = (rec as any)?.items;
    const linkedItemRows = Array.isArray(linkedItems)
      ? linkedItems
      : linkedItems
        ? [linkedItems]
        : [];

    const linkedBuilt = buildItems(linkedItemRows);
    const filled = await maybeFillThumbnails(linkedBuilt);
    return { latestRecommendationId: latest.id, latestItems: filled };
  } catch {
    // If the remote schema doesn't have link attributes enabled,
    // we still prefer returning whatever we had from the custom-field query.
    return { latestRecommendationId: latest.id, latestItems: [] as RecommendationItemView[] };
  }
}

export async function getRecommendationsPageView(userId: string): Promise<RecommendationsPageView> {
  const ratedBooks = await getUserRatedBooks(userId);
  const ratedBooksCount = ratedBooks.length;
  const used = await getUserRefreshCountsToday(userId);
  const refreshRemaining = Math.max(0, 6 - used);

  const latest = await getLatestRecommendationsForUser(userId);
  return {
    ratedBooksCount,
    refreshRemaining,
    latestRecommendationId: latest.latestRecommendationId,
    latestItems: latest.latestItems,
  };
}

export async function generateRecommendationsForUser(userId: string): Promise<void> {
  const googleBooksApiKey = process.env.GOOGLE_BOOKS_API_KEY?.trim().replace(/^\"|\"$/g, "");
  const openaiKey = process.env.OPENAI_API_KEY?.trim().replace(/^\"|\"$/g, "");
  if (!googleBooksApiKey) throw new Error("Missing GOOGLE_BOOKS_API_KEY.");
  if (!openaiKey) throw new Error("Missing OPENAI_API_KEY.");

  const ratedBooks = await getUserRatedBooks(userId);
  const ratedBooksCount = ratedBooks.length;
  if (ratedBooksCount < 3) throw new Error("NOT_ALLOWED");

  const used = await getUserRefreshCountsToday(userId);
  if (used >= 6) throw new Error("DAILY_LIMIT_REACHED");

  const libraryBooks = await listLibraryBooksForUser(userId);
  const ownedGoogleBooksIds = new Set(
    libraryBooks.map((b) => b.googleBooksId).filter((x): x is string => typeof x === "string" && x.trim().length > 0),
  );
  const ownedTitles = new Set(
    libraryBooks.map((b) => b.title.trim().toLowerCase()).filter((t) => t.length > 0),
  );

  // Build compact input for the model.
  const booksForPrompt = [];
  for (const rb of ratedBooks) {
    const [reviewText, reflections] = await Promise.all([
      getReviewForUserBookText(userId, rb.userBookId),
      listReflectionsForUserBook(userId, rb.userBookId).catch(() => []),
    ]);

    const recentReflections = reflections.slice(0, 3).map((r) => ({
      sessionDateYmd: r.sessionDateYmd,
      q1: truncate(r.question1, 220),
      q2: truncate(r.question2, 220),
      q3: truncate(r.question3, 220),
      q4: truncate(r.question4, 220),
      q5: truncate(r.question5, 220),
    }));

    booksForPrompt.push({
      title: rb.title,
      authorsCsv: rb.authorsCsv,
      rating: rb.rating,
      review: reviewText ? truncate(reviewText, 300) : null,
      reflections: recentReflections,
    });
  }

  const model = process.env.OPENAI_MODEL?.trim() || "gpt-4o-mini";

  // 1) Taste profile must be based ONLY on the user's rated books (rating + review + reflections).
  // We do this in a separate call so the model can’t “bleed” info from the recommendation outputs.
  const tastePrompt = [
    "You are generating a reading taste profile for a user.",
    "Use ONLY the rated books data below to infer recurring preferences (tone, themes, pacing, what they liked/disliked).",
    "Inputs are below and include: rating, public review text, and private reflection answers.",
    "Summarize in 2-4 sentences.",
    "Also extract exactly 5 book genre labels that best match the summary (broad genres are fine).",
    "",
    "Output JSON schema:",
    '{ "taste_profile_summary": string, "taste_profile_genres": string[] }',
    "",
    `User rated books (JSON): ${JSON.stringify(booksForPrompt)}`,
  ].join("\n");

  const tasteRes = await fetch("https://api.openai.com/v1/chat/completions", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${openaiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model,
      temperature: 0.7,
      messages: [
        {
          role: "system",
          content: "Return JSON only. No Markdown. Do not include any extra keys.",
        },
        { role: "user", content: tastePrompt },
      ],
      max_tokens: 600,
    }),
  });

  if (!tasteRes.ok) {
    const txt = await tasteRes.text().catch(() => "");
    throw new Error(`OpenAI request failed (${tasteRes.status} ${tasteRes.statusText}). ${txt}`);
  }

  const tasteBody = (await tasteRes.json()) as {
    choices?: Array<{ message?: { content?: string } }>;
  };
  const tasteContent = tasteBody.choices?.[0]?.message?.content;
  if (!tasteContent) throw new Error("OpenAI returned empty taste profile content.");

  const tasteExtracted = extractFirstJsonObject(tasteContent);
  const tasteParsed = tasteProfileOutputSchema.safeParse(tasteExtracted);
  if (!tasteParsed.success) {
    throw new Error("OpenAI returned invalid taste profile output.");
  }

  const tasteSummary = tasteParsed.data.taste_profile_summary;
  const tasteGenres = tasteParsed.data.taste_profile_genres;
  const genresPart = `\n\nGenres: ${tasteGenres.join(", ")}`;
  // Keep stored value within our expected field size to avoid UI overflow.
  const maxStoredLen = 2000;
  const allowedSummaryLen = Math.max(0, maxStoredLen - genresPart.length);
  const storedTasteSummary = `${tasteSummary.slice(0, allowedSummaryLen)}${genresPart}`;

  // 2) Recommendations are also based on the same rated books inputs, but separate from taste profile.
  const recommendationsPrompt = [
    "You are helping a user choose books that match their current taste.",
    "Inputs (rated books with private reflections and public reviews) are below. Use them to infer themes, tone, and preferences.",
    "Return exactly 3 distinct recommendations, each with a short explanation.",
    "The searchQuery should be a good Google Books search string for that title.",
    "",
    "Output JSON schema:",
    '{ "recommendations": [ { "title": string, "author": string, "explanation": string, "searchQuery": string } x3 ] }',
    "",
    `User rated books (JSON): ${JSON.stringify(booksForPrompt)}`,
  ].join("\n");

  const recRes = await fetch("https://api.openai.com/v1/chat/completions", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${openaiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model,
      temperature: 0.7,
      messages: [
        {
          role: "system",
          content: "Return JSON only. No Markdown. Do not include any extra keys.",
        },
        { role: "user", content: recommendationsPrompt },
      ],
      max_tokens: 900,
    }),
  });

  if (!recRes.ok) {
    const txt = await recRes.text().catch(() => "");
    throw new Error(`OpenAI request failed (${recRes.status} ${recRes.statusText}). ${txt}`);
  }

  const recBody = (await recRes.json()) as {
    choices?: Array<{ message?: { content?: string } }>;
  };
  const recContent = recBody.choices?.[0]?.message?.content;
  if (!recContent) throw new Error("OpenAI returned empty recommendations content.");

  const recExtracted = extractFirstJsonObject(recContent);
  const recParsed = recommendationsOutputSchema.safeParse(recExtracted);
  if (!recParsed.success) {
    throw new Error("OpenAI returned invalid recommendations output.");
  }

  const openaiRecommendations = recParsed.data.recommendations;

  // Enrich recommendations using Google Books so we can render covers and support actions.
  const recommendedItems: Array<{
    position: 1 | 2 | 3;
    title: string;
    authorsCsv: string;
    explanation: string;
    googleBooksId: string;
    thumbnailUrl: string | null;
    publishedDate: string | null;
  }> = [];

  const isOwnedGoogleBook = (v: { googleBooksId: string; title: string }) =>
    ownedGoogleBooksIds.has(v.googleBooksId) || ownedTitles.has(v.title.trim().toLowerCase());
  const chosenGoogleBooksIds = new Set<string>();

  for (let i = 0; i < 3; i++) {
    const raw = openaiRecommendations[i];
    const position = (i + 1) as 1 | 2 | 3;
    const searchQuery = raw.searchQuery || `${raw.title} ${raw.author}`;

    const volumes = await searchGoogleBooksVolumes(searchQuery, googleBooksApiKey);

    // Prefer a volume that isn't already in the user's library and isn't already chosen.
    const picked =
      volumes.find(
        (v) =>
          !isOwnedGoogleBook(v) &&
          !chosenGoogleBooksIds.has(v.googleBooksId),
      ) ??
      // Fallback: any volume not already chosen.
      volumes.find((v) => !chosenGoogleBooksIds.has(v.googleBooksId)) ??
      volumes[0];

    if (!picked) {
      throw new Error("Could not find a Google Books match for recommendations.");
    }

    const authorsCsv = picked.authors.length ? picked.authors.join(", ") : "";
    chosenGoogleBooksIds.add(picked.googleBooksId);
    recommendedItems.push({
      position,
      title: picked.title,
      authorsCsv,
      explanation: raw.explanation,
      googleBooksId: picked.googleBooksId,
      thumbnailUrl: picked.thumbnailUrl,
      publishedDate: picked.publishedDate,
    });
  }

  const db = getInstantAdminDb();
  const now = new Date();

  // InstantDB entity IDs must be UUIDs (or lookups). Use `id()` so writes succeed.
  const aiRecId = id();

  // Best-effort write; InstantDB schema drift is expected in dev.
  await db.transact([
    (db.tx.ai_recommendations[aiRecId] as any)
      .update({
        generated_at: now,
        created_at: now,
        owner_user_id: userId,
        taste_profile_summary: storedTasteSummary,
      } as any),
    ...recommendedItems.map((it) => {
      const itemId = id();
      const firstAuthor = it.authorsCsv.split(",")[0]?.trim();
      return (db.tx.ai_recommendation_items[itemId] as any)
        .update({
          recommendation_id: aiRecId,
          owner_user_id: userId,
          google_books_id: it.googleBooksId,
          book_title: it.title,
          thumbnail_url: it.thumbnailUrl ?? undefined,
          published_date: it.publishedDate ?? undefined,
          position: it.position,
          book_author: firstAuthor || undefined,
          book_authors_csv: it.authorsCsv,
          explanation: it.explanation,
        } as any);
    }),
  ]);

  // Persist the taste profile summary so it can be displayed on `/profile`.
  // This should be best-effort: recommendation generation is MVP-critical,
  // taste-profile persistence is secondary.
  try {
    await db.transact(
      (db.tx.users[userId] as any).update({
        taste_profile_summary: storedTasteSummary,
        taste_profile_updated_at: now,
      } as any),
    );
  } catch (e) {
    console.error("[generateRecommendationsForUser] failed to save taste profile", {
      userId,
      error: e,
    });
  }
}

