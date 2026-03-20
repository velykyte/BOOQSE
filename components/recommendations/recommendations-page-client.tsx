"use client";

import { useMemo, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { addPastFinishedBook, addWantToReadBook } from "@/app/actions/books";
import { generateRecommendations } from "@/app/actions/recommendations";
import asset5 from "@/ASSETS/Asset 5.webp";

type LatestItem = {
  position: 1 | 2 | 3;
  title: string;
  authorsCsv: string;
  googleBooksId: string;
  thumbnailUrl: string | null;
  publishedDate: string | null;
  explanation: string;
};

export function RecommendationsPageClient({
  ratedBooksCount,
  eligible,
  refreshRemaining,
  latestItems,
}: {
  ratedBooksCount: number;
  eligible: boolean;
  refreshRemaining: number;
  latestItems: LatestItem[];
}) {
  const router = useRouter();
  const [busy, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  const [modal, setModal] = useState<null | { item: LatestItem }>(null);
  const [modalDraft, setModalDraft] = useState<string>("");
  const modalValueId = "recs-rating";
  const [addedGoogleBooksIds, setAddedGoogleBooksIds] = useState<string[]>([]);

  const authorsByPos = useMemo(() => {
    const m: Record<number, string[]> = {};
    for (const it of latestItems) {
      const authors = it.authorsCsv
        .split(",")
        .map((a) => a.trim())
        .filter(Boolean);
      m[it.position] = authors.length ? authors : ["Unknown author"];
    }
    return m;
  }, [latestItems]);

  const itemsCount = latestItems.length;

  async function onGenerate() {
    setError(null);
    startTransition(async () => {
      const result = await generateRecommendations();
      if (!result.ok) {
        // If it's already saved, just go to profile so the user can see it.
        if (result.error.includes("already in your library")) {
          router.push("/profile");
          return;
        }
        setError(result.error);
        return;
      }
      router.refresh();
    });
  }

  const DEFAULT_USER_DEFINED_TOTAL_PAGES = 320;

  async function onWantToRead(item: LatestItem) {
    setError(null);

    const pages = DEFAULT_USER_DEFINED_TOTAL_PAGES;
    if (!Number.isFinite(pages) || pages < 1 || pages > 20000) {
      setError("Something went wrong. Try again.");
      return;
    }

    const authors = authorsByPos[item.position] ?? ["Unknown author"];
    startTransition(async () => {
      const result = await addWantToReadBook({
        googleBooksId: item.googleBooksId,
        title: item.title,
        authors,
        thumbnailUrl: item.thumbnailUrl,
        publishedDate: item.publishedDate,
        userDefinedTotalPages: pages,
      });
      if (!result.ok) {
        setError(result.error);
        return;
      }
      setAddedGoogleBooksIds((prev) =>
        prev.includes(item.googleBooksId) ? prev : [...prev, item.googleBooksId],
      );
    });
  }

  function openMarkFinishedModal(item: LatestItem) {
    setError(null);
    setModal({ item });
    setModalDraft("8");
  }

  async function confirmModal() {
    if (!modal) return;
    const item = modal.item;
    const authors = authorsByPos[item.position] ?? ["Unknown author"];

    const raw = modalDraft ?? "";
    const r = Number.parseInt(raw, 10);
    if (!Number.isFinite(r) || r < 1 || r > 10) {
      setError("Choose a rating from 1 to 10.");
      return;
    }

    startTransition(async () => {
      const result = await addPastFinishedBook({
        googleBooksId: item.googleBooksId,
        title: item.title,
        authors,
        thumbnailUrl: item.thumbnailUrl,
        publishedDate: item.publishedDate,
        rating: r,
      });
      if (!result.ok) {
        setError(result.error);
        return;
      }
      setModal(null);
      router.push(`/book/${result.userBookId}`);
    });
  }

  return (
    <main className="flex flex-col gap-10">
      <section className="rounded-xl border border-[var(--border-subtle)] bg-[var(--surface)] p-8 md:p-12">
        <div className="flex flex-col gap-4">
          <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
            <div className="min-w-0 md:max-w-[50%]">
              <h1 className="font-serif text-3xl leading-tight md:text-4xl">Recommendations</h1>
              <p className="mt-4 max-w-xl text-base text-[var(--text-secondary)]">
                Booqse recommendations get better by learning from how you actually respond to books.
                Your ratings (1–10), reflections, and reviews capture what resonates with you, so we rank suggestions more accurately and keep improving as you read.
              </p>
            </div>
            <div className="flex justify-end md:flex-shrink-0">
              <Image
                src={asset5}
                alt=""
                className="h-56 w-auto object-contain md:h-72"
                priority
              />
            </div>
          </div>

          <div className="mt-8 flex flex-col gap-4">
            {!eligible ? (
              <div className="flex flex-col gap-2">
                <p className="text-sm text-[var(--text-secondary)]">
                  You need at least 3 rated books to generate recommendations.
                </p>
                <p className="text-sm text-[var(--text-primary)]">
                  Progress: {ratedBooksCount} of 3 rated books
                </p>
              </div>
            ) : null}

            {eligible ? (
              <div className="flex flex-col gap-3">
                {itemsCount === 0 ? (
                  <button
                    type="button"
                    disabled={busy}
                    onClick={onGenerate}
                    className="inline-flex h-11 max-w-xs items-center justify-center rounded-lg bg-[var(--brand-burgundy)] px-5 text-sm text-white transition-colors hover:bg-[var(--brand-burgundy-hover)] disabled:opacity-50"
                  >
                    {busy ? "Generating…" : "Get recommendations"}
                  </button>
                ) : null}

                {itemsCount > 0 ? (
                  <div className="flex flex-col gap-3">
                    {refreshRemaining > 0 ? (
                      <button
                        type="button"
                        disabled={busy}
                        onClick={onGenerate}
                        className="inline-flex h-10 max-w-xs items-center justify-center rounded-lg bg-[var(--brand-burgundy)] px-4 text-sm text-white transition-colors hover:bg-[var(--brand-burgundy-hover)] disabled:opacity-50"
                      >
                        Refresh recommendations ({refreshRemaining} left)
                      </button>
                    ) : (
                      <p className="text-sm text-[var(--text-secondary)]">No refreshes left today.</p>
                    )}
                  </div>
                ) : null}

                {error ? <p className="text-sm text-[var(--error)]">{error}</p> : null}
              </div>
            ) : null}
          </div>
        </div>
      </section>

      {latestItems.length > 0 ? (
        <section className="rounded-xl border border-[var(--border-subtle)] bg-[var(--surface)] p-6 md:p-8">
          <div className="flex items-end justify-between gap-4">
            <h2 className="font-serif text-2xl leading-tight">Your 3 matches</h2>
          </div>
          <ul className="mt-5 grid grid-cols-1 gap-4 md:grid-cols-3">
            {latestItems.map((item) => (
              <li
                key={item.position}
                className="rounded-xl border border-[var(--border-subtle)] bg-[var(--surface)] p-4"
              >
                <div className="flex items-start gap-4">
                  {item.thumbnailUrl ? (
                    // eslint-disable-next-line @next/next/no-img-element -- external Google Books URLs
                    <img
                      src={item.thumbnailUrl}
                      alt=""
                      className="h-36 w-24 shrink-0 rounded-md border border-[var(--border-subtle)] object-cover"
                    />
                  ) : (
                    <div className="flex h-36 w-24 shrink-0 items-center justify-center rounded-md border border-[var(--border-subtle)] bg-[var(--surface-subtle)] text-xs text-[var(--text-secondary)]">
                      —
                    </div>
                  )}

                  <div className="flex flex-1 flex-col gap-2">
                    <p className="font-medium text-[var(--text-primary)]">{item.title}</p>
                    <p className="text-sm text-[var(--text-secondary)]">
                      {(authorsByPos[item.position] ?? []).join(", ") || "Unknown author"}
                    </p>
                    <p className="text-sm text-[var(--text-secondary)]">{item.explanation}</p>
                  </div>
                </div>

                <div className="mt-4 flex flex-col gap-2">
                  {(() => {
                    const alreadyAdded = addedGoogleBooksIds.includes(item.googleBooksId);
                    return (
                      <button
                        type="button"
                        disabled={busy}
                        onClick={() => {
                          if (!alreadyAdded) onWantToRead(item);
                        }}
                        className={
                          alreadyAdded
                            ? "inline-flex h-10 items-center justify-center rounded-lg bg-[var(--brand-blue)] px-4 text-sm text-white transition-colors hover:bg-[var(--brand-blue-hover)]"
                            : "inline-flex h-10 items-center justify-center rounded-lg bg-[var(--brand-burgundy)] px-4 text-sm text-white transition-colors hover:bg-[var(--brand-burgundy-hover)] disabled:opacity-50"
                        }
                      >
                        {alreadyAdded ? "Added to the list" : "Want to Read"}
                      </button>
                    );
                  })()}
                  <button
                    type="button"
                    disabled={busy}
                    onClick={() => openMarkFinishedModal(item)}
                    className="inline-flex h-10 items-center justify-center rounded-lg border border-[var(--border-subtle)] bg-[var(--surface-subtle)] px-4 text-sm text-[var(--brand-burgundy)] transition-colors hover:bg-[var(--surface)] disabled:opacity-50"
                  >
                    Mark as Finished
                  </button>
                </div>
              </li>
            ))}
          </ul>
        </section>
      ) : null}

      {modal ? (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4"
          role="dialog"
          aria-modal="true"
        >
          <div className="w-full max-w-md rounded-xl border border-[var(--border-subtle)] bg-[var(--surface)] p-5">
            <div className="flex items-start justify-between gap-4">
              <div className="flex flex-col">
                <p className="text-sm font-medium text-[var(--text-primary)]">Your rating</p>
                <p className="mt-1 text-xs text-[var(--text-secondary)]">{modal.item.title}</p>
              </div>
              <button
                type="button"
                disabled={busy}
                onClick={() => setModal(null)}
                className="text-sm text-[var(--text-secondary)] underline-offset-2 hover:underline disabled:opacity-50"
              >
                Close
              </button>
            </div>

            <div className="mt-4 flex flex-col gap-2">
              <label className="text-xs text-[var(--text-secondary)]" htmlFor={modalValueId}>
                Rating from 1 to 10
              </label>
              <input
                id={modalValueId}
                type="number"
                min={1}
                max={10}
                inputMode="numeric"
                value={modalDraft}
                onChange={(e) => setModalDraft(e.target.value)}
                className="w-full rounded-lg border border-[var(--border-subtle)] bg-[var(--surface-subtle)] px-3 py-2 text-sm outline-none"
              />
            </div>

            {error ? <p className="mt-3 text-sm text-[var(--error)]">{error}</p> : null}

            <div className="mt-5 flex items-center justify-end gap-3">
              <button
                type="button"
                disabled={busy}
                onClick={() => setModal(null)}
                className="inline-flex h-10 items-center justify-center rounded-lg border border-[var(--border-subtle)] bg-[var(--surface-subtle)] px-4 text-sm text-[var(--text-primary)] transition-colors hover:bg-[var(--surface-subtle)] disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={busy}
                onClick={confirmModal}
                className="inline-flex h-10 items-center justify-center rounded-lg bg-[var(--brand-burgundy)] px-4 text-sm text-white transition-colors hover:bg-[var(--brand-burgundy-hover)] disabled:opacity-50"
              >
                {busy ? "Saving…" : "Mark as Finished"}
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </main>
  );
}

