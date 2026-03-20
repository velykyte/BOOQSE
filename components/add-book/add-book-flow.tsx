"use client";

import {
  addCurrentReadingBook,
  addPastFinishedBook,
  type AddBookActionResult,
} from "@/app/actions/books";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useMemo, useRef, useState, useTransition } from "react";

export type SearchVolume = {
  googleBooksId: string;
  title: string;
  authors: string[];
  thumbnailUrl: string | null;
  publishedDate: string | null;
};

type Intent = "current" | "past";

export function AddBookFlow({ intent }: { intent: Intent }) {
  const router = useRouter();
  const [query, setQuery] = useState("");
  const [items, setItems] = useState<SearchVolume[]>([]);
  const [searchError, setSearchError] = useState<string | null>(null);
  const [loadingSearch, setLoadingSearch] = useState(false);
  const [selected, setSelected] = useState<SearchVolume | null>(null);
  const [totalPages, setTotalPages] = useState("");
  const [rating, setRating] = useState("8");
  const [formError, setFormError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();
  const searchDebounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const searchSeqRef = useRef(0);

  useEffect(
    () => () => {
      if (searchDebounceRef.current) clearTimeout(searchDebounceRef.current);
    },
    [],
  );

  const onQueryChange = useCallback((raw: string) => {
    setQuery(raw);
    if (searchDebounceRef.current) clearTimeout(searchDebounceRef.current);

    const trimmed = raw.trim();
    if (trimmed.length < 2) {
      setItems([]);
      setSearchError(null);
      setLoadingSearch(false);
      return;
    }

    searchDebounceRef.current = setTimeout(async () => {
      const seq = ++searchSeqRef.current;
      setLoadingSearch(true);
      setSearchError(null);
      try {
        const res = await fetch(`/api/books/search?q=${encodeURIComponent(trimmed)}`);
        if (seq !== searchSeqRef.current) return;
        if (!res.ok) {
          const body = (await res.json().catch(() => null)) as { error?: string } | null;
          throw new Error(body?.error ?? "Search failed");
        }
        const data = (await res.json()) as { items: SearchVolume[] };
        setItems(data.items ?? []);
      } catch (err) {
        if (seq === searchSeqRef.current) {
          setItems([]);
          const message = err instanceof Error ? err.message : "Something went wrong. Try again.";
          setSearchError(message);
        }
      } finally {
        if (seq === searchSeqRef.current) {
          setLoadingSearch(false);
        }
      }
    }, 350);
  }, []);

  const showResults = query.trim().length >= 2;
  const displayItems = showResults ? items : [];

  const otherIntent = intent === "current" ? "past" : "current";
  const otherLabel =
    intent === "current" ? "Switch to adding books you already read" : "Switch to a book you’re reading";

  const payloadBase = useMemo(() => {
    if (!selected) return null;
    return {
      googleBooksId: selected.googleBooksId,
      title: selected.title,
      authors: selected.authors.length ? selected.authors : ["Unknown author"],
      thumbnailUrl: selected.thumbnailUrl,
      publishedDate: selected.publishedDate,
    };
  }, [selected]);

  const handleSubmit = useCallback(() => {
    setFormError(null);
    if (!payloadBase) return;

    startTransition(async () => {
      let result: AddBookActionResult;
      if (intent === "current") {
        const n = Number.parseInt(totalPages, 10);
        if (!Number.isFinite(n) || n < 1) {
          setFormError("Enter how many pages are in your edition (used for progress).");
          return;
        }
        result = await addCurrentReadingBook({
          ...payloadBase,
          userDefinedTotalPages: n,
        });
      } else {
        const r = Number.parseInt(rating, 10);
        if (!Number.isFinite(r) || r < 1 || r > 10) {
          setFormError("Choose a rating from 1 to 10.");
          return;
        }
        result = await addPastFinishedBook({
          ...payloadBase,
          rating: r,
        });
      }

      if (result.ok) {
        router.push(`/book/${result.userBookId}`);
      } else {
        setFormError(result.error);
      }
    });
  }, [intent, payloadBase, rating, router, totalPages]);

  return (
    <div className="flex flex-col gap-10">
      <div className="flex flex-col gap-2">
        <h1 className="font-serif text-3xl leading-tight md:text-4xl">
          {intent === "current" ? "Add a book you’re reading" : "Add a book you’ve already read"}
        </h1>
        <p className="text-sm text-[var(--text-secondary)]">
          <Link
            href={`/add-book?intent=${otherIntent}`}
            className="text-[var(--brand-burgundy)] underline-offset-2 hover:underline"
          >
            {otherLabel}
          </Link>
        </p>
      </div>

      {!selected ? (
        <section className="flex flex-col gap-4">
          <label className="text-sm font-medium text-[var(--text-primary)]" htmlFor="book-search">
            Search
          </label>
          <input
            id="book-search"
            type="search"
            value={query}
            onChange={(e) => onQueryChange(e.target.value)}
            placeholder="Title or author"
            className="rounded-lg border border-[var(--border-subtle)] bg-[var(--surface)] px-4 py-3 text-base outline-none ring-[var(--brand-burgundy)] focus:ring-2"
            autoComplete="off"
          />
          <p className="text-xs text-[var(--text-secondary)]">Results from Google Books.</p>
          {loadingSearch ? (
            <p className="text-sm text-[var(--text-secondary)]">Searching…</p>
          ) : null}
          {searchError ? <p className="text-sm text-[var(--error)]">{searchError}</p> : null}
          <ul className="flex flex-col gap-3">
            {displayItems.map((item) => (
              <li key={item.googleBooksId}>
                <button
                  type="button"
                  onClick={() => setSelected(item)}
                  className="flex w-full gap-4 rounded-xl border border-[var(--border-subtle)] bg-[var(--surface)] p-4 text-left transition-colors hover:border-[var(--brand-burgundy)] hover:bg-[var(--brand-burgundy-soft)]"
                >
                  {item.thumbnailUrl ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={item.thumbnailUrl}
                      alt=""
                      className="h-20 w-14 shrink-0 rounded object-cover"
                      width={56}
                      height={80}
                    />
                  ) : (
                    <div className="flex h-20 w-14 shrink-0 items-center justify-center rounded bg-[var(--surface-subtle)] text-[10px] text-[var(--text-secondary)]">
                      —
                    </div>
                  )}
                  <span>
                    <span className="block font-medium text-[var(--text-primary)]">{item.title}</span>
                    <span className="mt-1 block text-sm text-[var(--text-secondary)]">
                      {item.authors.length ? item.authors.join(", ") : "Unknown author"}
                    </span>
                  </span>
                </button>
              </li>
            ))}
          </ul>
        </section>
      ) : (
        <section className="flex flex-col gap-6 rounded-xl border border-[var(--border-subtle)] bg-[var(--surface)] p-6 md:p-8">
          <div className="flex gap-4">
            {selected.thumbnailUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={selected.thumbnailUrl}
                alt=""
                className="h-28 w-[75px] shrink-0 rounded object-cover"
                width={75}
                height={112}
              />
            ) : null}
            <div>
              <h2 className="text-lg font-medium">{selected.title}</h2>
              <p className="mt-1 text-sm text-[var(--text-secondary)]">
                {selected.authors.length ? selected.authors.join(", ") : "Unknown author"}
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={() => {
              setSelected(null);
              setFormError(null);
            }}
            className="self-start text-sm text-[var(--text-secondary)] underline-offset-2 hover:underline"
          >
            Choose a different book
          </button>

          {intent === "current" ? (
            <div className="flex flex-col gap-2">
              <label className="text-sm font-medium" htmlFor="total-pages">
                Total pages in your edition
              </label>
              <p className="text-xs text-[var(--text-secondary)]">
                Used for accurate progress tracking. You can use the printed page count from your copy.
              </p>
              <input
                id="total-pages"
                type="number"
                min={1}
                max={20000}
                inputMode="numeric"
                value={totalPages}
                onChange={(e) => setTotalPages(e.target.value)}
                className="max-w-xs rounded-lg border border-[var(--border-subtle)] bg-[var(--surface-subtle)] px-4 py-3 text-base outline-none focus:ring-2 focus:ring-[var(--brand-blue)]"
                placeholder="e.g. 320"
              />
            </div>
          ) : (
            <div className="flex flex-col gap-2">
              <label className="text-sm font-medium" htmlFor="rating">
                Your rating (1–10)
              </label>
              <input
                id="rating"
                type="number"
                min={1}
                max={10}
                inputMode="numeric"
                value={rating}
                onChange={(e) => setRating(e.target.value)}
                className="max-w-xs rounded-lg border border-[var(--border-subtle)] bg-[var(--surface-subtle)] px-4 py-3 text-base outline-none focus:ring-2 focus:ring-[var(--brand-blue)]"
              />
            </div>
          )}

          {formError ? <p className="text-sm text-[var(--error)]">{formError}</p> : null}

          <button
            type="button"
            disabled={pending}
            onClick={handleSubmit}
            className="inline-flex h-11 max-w-xs items-center justify-center rounded-lg bg-[var(--brand-burgundy)] px-5 text-sm text-white transition-colors hover:bg-[var(--brand-burgundy-hover)] disabled:opacity-50"
          >
            {pending ? "Saving…" : "Save to library"}
          </button>
        </section>
      )}
    </div>
  );
}
