import "server-only";
import { id } from "@instantdb/admin";
import { getInstantAdminDb } from "@/lib/db/instant-admin";

function first<T>(value: T | T[] | undefined | null): T | undefined {
  if (value === undefined || value === null) return undefined;
  return Array.isArray(value) ? value[0] : value;
}

export type ReflectionDraft = {
  reflectionId: string | null;
  question1: string;
  question2: string;
  question3: string;
  question4: string;
  question5: string;
};

export type ReflectionSummary = {
  reflectionId: string;
  sessionId: string;
  sessionDateYmd: string;
  question1: string;
  question2: string;
  question3: string;
  question4: string;
  question5: string;
};

function toSessionDateYmd(value: unknown): string {
  const d = value instanceof Date ? value : new Date(value as any);
  if (Number.isNaN(d.getTime())) return "unknown";
  return d.toISOString().slice(0, 10);
}

export async function getReflectionDraftForSession(
  ownerUserId: string,
  userBookId: string,
  sessionId: string,
): Promise<ReflectionDraft | null> {
  const db = getInstantAdminDb() as any;
  const direct = await db.query({
    reflections: {
      $: {
        where: {
          owner_user_id: ownerUserId,
          user_book_id_ref: userBookId,
          reading_session_id_ref: sessionId,
        },
      },
    },
  });
  const directRow = direct.reflections?.[0] as
    | {
        id?: string;
        question_1?: string;
        question_2?: string;
        question_3?: string;
        question_4?: string;
        question_5?: string;
      }
    | undefined;
  if (directRow?.id) {
    return {
      reflectionId: directRow.id,
      question1: typeof directRow.question_1 === "string" ? directRow.question_1 : "",
      question2: typeof directRow.question_2 === "string" ? directRow.question_2 : "",
      question3: typeof directRow.question_3 === "string" ? directRow.question_3 : "",
      question4: typeof directRow.question_4 === "string" ? directRow.question_4 : "",
      question5: typeof directRow.question_5 === "string" ? directRow.question_5 : "",
    };
  }

  const result = await db.query({
    user_books: {
      $: { where: { id: userBookId } },
      user: {},
      reading_sessions: {
        $: { where: { id: sessionId } },
        reflection: {},
      },
    },
  });

  const ub = result.user_books?.[0] as
    | {
        owner_user_id?: string;
        user?: { id?: string } | { id?: string }[];
        reading_sessions?: unknown;
      }
    | undefined;
  if (!ub) return null;

  const ownerField = typeof ub.owner_user_id === "string" ? ub.owner_user_id : null;
  const linkedUser = first(ub.user);
  const linkedUserId = typeof linkedUser?.id === "string" ? linkedUser.id : null;
  if (ownerField !== ownerUserId && linkedUserId !== ownerUserId) return null;

  const session = first(ub.reading_sessions as any) as
    | {
        id?: string;
        reflection?: unknown;
      }
    | undefined;
  if (!session?.id) return null;

  const reflection = first(session.reflection as any) as
    | {
        id?: string;
        question_1?: string;
        question_2?: string;
        question_3?: string;
        question_4?: string;
        question_5?: string;
      }
    | undefined;

  return {
    reflectionId: typeof reflection?.id === "string" ? reflection.id : null,
    question1: typeof reflection?.question_1 === "string" ? reflection.question_1 : "",
    question2: typeof reflection?.question_2 === "string" ? reflection.question_2 : "",
    question3: typeof reflection?.question_3 === "string" ? reflection.question_3 : "",
    question4: typeof reflection?.question_4 === "string" ? reflection.question_4 : "",
    question5: typeof reflection?.question_5 === "string" ? reflection.question_5 : "",
  };
}

export async function upsertReflectionForSession(
  ownerUserId: string,
  userBookId: string,
  sessionId: string,
  input: {
    question1: string | null;
    question2: string | null;
    question3: string | null;
    question4: string | null;
    question5: string | null;
  },
): Promise<{ reflectionId: string }> {
  const draft = await getReflectionDraftForSession(ownerUserId, userBookId, sessionId);
  if (!draft) throw new Error("NOT_ALLOWED");

  const db = getInstantAdminDb() as any;
  const now = new Date();
  const reflectionId = draft.reflectionId ?? id();

  await db.transact(
    db.tx.reflections[reflectionId].update({
      owner_user_id: ownerUserId,
      user_book_id_ref: userBookId,
      reading_session_id_ref: sessionId,
      question_1: input.question1 ?? undefined,
      question_2: input.question2 ?? undefined,
      question_3: input.question3 ?? undefined,
      question_4: input.question4 ?? undefined,
      question_5: input.question5 ?? undefined,
      ...(draft.reflectionId ? {} : { created_at: now }),
      updated_at: now,
    }),
  );

  try {
    await db.transact(db.tx.reflections[reflectionId].link({ user: ownerUserId }));
  } catch {}
  try {
    await db.transact(db.tx.reflections[reflectionId].link({ reading_session: sessionId }));
  } catch {
    try {
      await db.transact(db.tx.reflections[reflectionId].link({ reading_sessions: sessionId }));
    } catch {}
  }

  return { reflectionId };
}

export async function listReflectionsForUserBook(
  ownerUserId: string,
  userBookId: string,
): Promise<ReflectionSummary[]> {
  const db = getInstantAdminDb() as any;
  const direct = await db.query({
    reflections: {
      $: {
        where: {
          owner_user_id: ownerUserId,
          user_book_id_ref: userBookId,
        },
      },
    },
  });
  const directRows = Array.isArray(direct.reflections) ? direct.reflections : [];
  const directOut: ReflectionSummary[] = directRows
    .map((r: unknown) => {
      if (!r || typeof r !== "object" || !("id" in r)) return null;
      const row = r as Record<string, unknown>;
      const sessionId =
        typeof row.reading_session_id_ref === "string" ? row.reading_session_id_ref : "unknown";
      const q1 = typeof row.question_1 === "string" ? row.question_1 : "";
      const q2 = typeof row.question_2 === "string" ? row.question_2 : "";
      const q3 = typeof row.question_3 === "string" ? row.question_3 : "";
      const q4 = typeof row.question_4 === "string" ? row.question_4 : "";
      const q5 = typeof row.question_5 === "string" ? row.question_5 : "";
      if (!q1 && !q2 && !q3 && !q4 && !q5) return null;
      const updatedAt = row.updated_at;
      const sessionDateYmd = toSessionDateYmd(updatedAt);
      return {
        reflectionId: String(row.id),
        sessionId,
        sessionDateYmd,
        question1: q1,
        question2: q2,
        question3: q3,
        question4: q4,
        question5: q5,
      };
    })
    .filter(Boolean) as ReflectionSummary[];
  if (directOut.length > 0) {
    directOut.sort((a, b) => b.sessionDateYmd.localeCompare(a.sessionDateYmd));
    return directOut;
  }

  const result = await db.query({
    user_books: {
      $: { where: { id: userBookId } },
      user: {},
      reading_sessions: {
        reflection: {},
      },
    },
  });

  const ub = result.user_books?.[0] as
    | {
        owner_user_id?: string;
        user?: { id?: string } | { id?: string }[];
        reading_sessions?: unknown;
      }
    | undefined;
  if (!ub) return [];

  const ownerField = typeof ub.owner_user_id === "string" ? ub.owner_user_id : null;
  const linkedUser = first(ub.user);
  const linkedUserId = typeof linkedUser?.id === "string" ? linkedUser.id : null;
  if (ownerField !== ownerUserId && linkedUserId !== ownerUserId) return [];

  const sessions = Array.isArray(ub.reading_sessions)
    ? ub.reading_sessions
    : ub.reading_sessions
      ? [ub.reading_sessions]
      : [];

  const out: ReflectionSummary[] = [];
  for (const rawSession of sessions) {
    if (!rawSession || typeof rawSession !== "object") continue;
    const session = rawSession as { id?: string; date?: string | Date; reflection?: unknown };
    if (!session.id) continue;
    const reflection = first(session.reflection as any) as
      | {
          id?: string;
          question_1?: string;
          question_2?: string;
          question_3?: string;
          question_4?: string;
          question_5?: string;
        }
      | undefined;
    if (!reflection?.id) continue;

    const q1 = typeof reflection.question_1 === "string" ? reflection.question_1 : "";
    const q2 = typeof reflection.question_2 === "string" ? reflection.question_2 : "";
    const q3 = typeof reflection.question_3 === "string" ? reflection.question_3 : "";
    const q4 = typeof reflection.question_4 === "string" ? reflection.question_4 : "";
    const q5 = typeof reflection.question_5 === "string" ? reflection.question_5 : "";
    if (!q1 && !q2 && !q3 && !q4 && !q5) continue;

    out.push({
      reflectionId: reflection.id,
      sessionId: session.id,
      sessionDateYmd: toSessionDateYmd(session.date),
      question1: q1,
      question2: q2,
      question3: q3,
      question4: q4,
      question5: q5,
    });
  }

  out.sort((a, b) => b.sessionDateYmd.localeCompare(a.sessionDateYmd));
  return out;
}

export async function deleteReflectionForUserBook(
  ownerUserId: string,
  userBookId: string,
  reflectionId: string,
): Promise<void> {
  const db = getInstantAdminDb() as any;

  const direct = await db.query({
    reflections: {
      $: { where: { id: reflectionId } },
    },
  });
  const row = direct.reflections?.[0] as
    | {
        id?: string;
        owner_user_id?: string;
        user_book_id_ref?: string;
      }
    | undefined;

  const directOwner = typeof row?.owner_user_id === "string" ? row.owner_user_id : null;
  const directUserBook = typeof row?.user_book_id_ref === "string" ? row.user_book_id_ref : null;
  if (row?.id && directOwner === ownerUserId && directUserBook === userBookId) {
    await db.transact(db.tx.reflections[reflectionId].delete());
    return;
  }

  const list = await listReflectionsForUserBook(ownerUserId, userBookId);
  const allowed = list.some((r) => r.reflectionId === reflectionId);
  if (!allowed) throw new Error("NOT_ALLOWED");

  await db.transact(db.tx.reflections[reflectionId].delete());
}

