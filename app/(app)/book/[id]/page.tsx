import { requireInstantUser } from "@/lib/server/session-user";
import { getUserBookForOwner } from "@/lib/server/get-user-book-detail";
import { listReadingSessionsForUserBook } from "@/lib/server/reading-sessions-read";
import { listReflectionsForUserBook } from "@/lib/server/reflections";
import { getReviewForUserBookText } from "@/lib/server/reviews";
import { ReadingSessions } from "@/components/book/reading-sessions/reading-sessions";
import { FinishBookForm } from "@/components/book/finish-book-form";
import { ReviewEditor } from "@/components/book/review-editor";
import { DeleteReflectionButton } from "@/components/reflections/delete-reflection-button";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";

type BookPageProps = {
  params: Promise<{ id: string }>;
};

function formatAuthors(author: unknown): string {
  if (Array.isArray(author)) {
    return author.filter((a) => typeof a === "string").join(", ");
  }
  if (typeof author === "string") return author;
  return "";
}

export default async function BookDetailPage({ params }: BookPageProps) {
  const { id } = await params;
  const auth = await requireInstantUser();
  if (!auth) {
    redirect("/auth");
  }

  const detail = await getUserBookForOwner(id, auth.user.id);
  if (!detail) {
    notFound();
  }

  const isFinishedBook = detail.status === "finished";
  const sessions = detail.isPastBook
    ? []
    : await (async () => {
        try {
          return await listReadingSessionsForUserBook(auth.user.id, detail.userBookId);
        } catch (e) {
          console.error("[BookDetailPage] listReadingSessionsForUserBook failed:", e);
          return [];
        }
      })();
  const totalTimeMinutes = sessions.reduce((acc, s) => acc + (typeof s.timeMinutes === "number" ? s.timeMinutes : 0), 0);
  const reflections = detail.isPastBook
    ? []
    : await (async () => {
        try {
          return await listReflectionsForUserBook(auth.user.id, detail.userBookId);
        } catch (e) {
          console.error("[BookDetailPage] listReflectionsForUserBook failed:", e);
          return [];
        }
      })();

  const reviewText = isFinishedBook
    ? await getReviewForUserBookText(auth.user.id, detail.userBookId)
    : null;

  const authors = formatAuthors(detail.book.author);

  return (
    <main className="flex flex-col gap-8">
      <div className="flex flex-col gap-6 md:flex-row md:items-start">
        {detail.book.thumbnailUrl ? (
          // eslint-disable-next-line @next/next/no-img-element -- external Google Books URLs
          <img
            src={detail.book.thumbnailUrl}
            alt=""
            className="h-40 w-[107px] shrink-0 rounded-md border border-[var(--border-subtle)] object-cover"
            width={107}
            height={160}
          />
        ) : (
          <div className="flex h-40 w-[107px] shrink-0 items-center justify-center rounded-md border border-[var(--border-subtle)] bg-[var(--surface-subtle)] text-xs text-[var(--text-secondary)]">
            No cover
          </div>
        )}
        <div>
          <p className="text-sm text-[var(--text-secondary)]">
            {detail.isPastBook ? "Past read" : detail.status.replace(/_/g, " ")}
          </p>
          <h1 className="mt-2 font-serif text-3xl leading-tight md:text-4xl">{detail.book.title}</h1>
          {authors ? (
            <p className="mt-2 text-base text-[var(--text-secondary)]">{authors}</p>
          ) : null}
          {!detail.isPastBook && detail.userDefinedTotalPages ? (
            <p className="mt-4 text-sm text-[var(--text-secondary)]">
              Total pages for tracking: {detail.userDefinedTotalPages}
            </p>
          ) : null}
          {(detail.isPastBook || detail.status === "finished") && detail.rating != null ? (
            <p className="mt-4 text-sm text-[var(--text-secondary)]">Your rating: {detail.rating}/10</p>
          ) : null}
        </div>
      </div>

      {isFinishedBook ? (
        <section className="flex flex-col gap-3 rounded-xl border border-[var(--border-subtle)] bg-[var(--surface)] p-6 md:p-8">
          <div className="flex items-start justify-between gap-4">
            <div>
              <p className="text-sm text-[var(--text-secondary)]">You finished this book</p>
              <h2 className="mt-2 font-serif text-2xl leading-tight">Total reading time</h2>
              <p className="mt-1 text-sm text-[var(--text-secondary)]">{totalTimeMinutes} minutes</p>
            </div>

            <Link
              href="/recommendations"
              className="inline-flex h-11 max-w-xs items-center justify-center rounded-lg bg-[var(--brand-burgundy)] px-5 text-sm text-white transition-colors hover:bg-[var(--brand-burgundy-hover)]"
            >
              Get recommendations
            </Link>
          </div>

          <ReviewEditor
            key={`review-${detail.userBookId}-${reviewText ? "has" : "none"}`}
            userBookId={detail.userBookId}
            initialText={reviewText}
          />
        </section>
      ) : null}

      {detail.isPastBook ? null : (
        <div className="flex flex-col gap-8 md:flex-row md:items-start">
          <ReadingSessions sessions={sessions} userBookId={detail.userBookId} />

          <section className="flex w-full flex-col gap-4 md:w-1/2">
            <div className="flex items-end justify-between gap-4">
              <h2 className="font-serif text-2xl leading-tight">Reflections</h2>
              {reflections.length > 0 ? (
                <p className="text-sm text-[var(--text-secondary)]">
                  {reflections.length} saved {reflections.length === 1 ? "reflection" : "reflections"}
                </p>
              ) : null}
            </div>
            {reflections.length === 0 ? (
              <p className="text-sm text-[var(--text-secondary)]">
                No reflections saved yet. After logging a session, use the reflection flow to save one.
              </p>
            ) : (
              <ul className="flex flex-col gap-3">
                {reflections.map((r) => {
                  const answers = [r.question1, r.question2, r.question3, r.question4, r.question5].filter(
                    (x) => x.trim().length > 0,
                  );
                  return (
                    <li
                      key={r.reflectionId}
                      className="rounded-xl border border-[var(--border-subtle)] bg-[var(--surface)] p-4"
                    >
                      <div className="flex items-start justify-between gap-4">
                        <p className="text-sm font-medium text-[var(--text-primary)]">
                          Session {r.sessionDateYmd}
                        </p>
                        <div className="flex flex-col items-end gap-1">
                          <Link
                            href={`/reflect?sessionId=${r.sessionId}&userBookId=${detail.userBookId}`}
                            className="inline-flex text-sm text-[var(--brand-burgundy)] underline-offset-2 hover:underline"
                          >
                            Edit reflection
                          </Link>
                          <DeleteReflectionButton
                            reflectionId={r.reflectionId}
                            userBookId={detail.userBookId}
                          />
                        </div>
                      </div>
                      <div className="mt-2 flex flex-col gap-2">
                        {answers.map((a, idx) => (
                          <p key={`${r.reflectionId}-${idx}`} className="text-sm text-[var(--text-secondary)]">
                            {a}
                          </p>
                        ))}
                      </div>
                    </li>
                  );
                })}
              </ul>
            )}
          </section>
        </div>
      )}

      {detail.canLogSessions ? <FinishBookForm userBookId={detail.userBookId} /> : null}

      {detail.canLogSessions ? (
        <Link
          href={`/log-session?userBookId=${detail.userBookId}`}
          className="inline-flex h-11 max-w-xs items-center justify-center rounded-lg bg-[var(--brand-burgundy)] px-5 text-sm text-white transition-colors hover:bg-[var(--brand-burgundy-hover)]"
        >
          Log reading session
        </Link>
      ) : null}

      <Link
        href="/"
        className="text-sm text-[var(--brand-burgundy)] hover:text-[var(--brand-burgundy-hover)]"
      >
        ← Back to Home
      </Link>
    </main>
  );
}
