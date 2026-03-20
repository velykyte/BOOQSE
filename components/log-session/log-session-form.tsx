"use client";

import { logReadingSession, type LogSessionResult } from "@/app/actions/sessions";
import type { ActiveCurrentBook } from "@/lib/types/active-reading";
import { useRouter } from "next/navigation";
import { useMemo, useState, useTransition } from "react";

type LogSessionFormProps = {
  books: ActiveCurrentBook[];
  todayYmd: string;
  yesterdayYmd: string;
  initialUserBookId: string | null;
};

function formatDayLabel(ymd: string, fallback: string) {
  try {
    const d = new Date(`${ymd}T12:00:00.000Z`);
    // Use fixed locale/timezone for deterministic SSR/CSR output.
    return new Intl.DateTimeFormat("en-GB", {
      timeZone: "UTC",
      weekday: "short",
      month: "short",
      day: "numeric",
    })
      .format(d)
      .replace(",", "");
  } catch {
    return fallback;
  }
}

export function LogSessionForm({
  books,
  todayYmd,
  yesterdayYmd,
  initialUserBookId,
}: LogSessionFormProps) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();

  const defaultBookId = useMemo(() => {
    if (initialUserBookId && books.some((b) => b.userBookId === initialUserBookId)) {
      return initialUserBookId;
    }
    return books[0]?.userBookId ?? "";
  }, [books, initialUserBookId]);

  const [userBookId, setUserBookId] = useState(defaultBookId);
  const [sessionDate, setSessionDate] = useState(todayYmd);
  const [pagesRead, setPagesRead] = useState("");
  const [timeMinutes, setTimeMinutes] = useState("");
  const [error, setError] = useState<string | null>(null);
  const selectedBook = books.find((b) => b.userBookId === userBookId) ?? books[0];

  const onSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    const pages = Number.parseInt(pagesRead, 10);
    const minutes = Number.parseInt(timeMinutes, 10);

    startTransition(async () => {
      const result: LogSessionResult = await logReadingSession({
        userBookId,
        sessionDate,
        pagesRead: pages,
        timeMinutes: minutes,
      });

      if (result.ok) {
        router.push(`/reflect?sessionId=${result.sessionId}&userBookId=${result.userBookId}`);
      } else {
        setError(result.error);
      }
    });
  };

  return (
    <form onSubmit={onSubmit} className="flex max-w-md flex-col gap-6">
      {books.length === 1 && selectedBook ? (
        <div className="flex flex-col gap-2">
          <span className="text-sm font-medium text-[var(--text-primary)]">Book</span>
          <div className="flex gap-3 rounded-xl border border-[var(--border-subtle)] bg-[var(--surface)] p-4">
            {selectedBook.thumbnailUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={selectedBook.thumbnailUrl}
                alt=""
                className="h-16 w-11 shrink-0 rounded object-cover"
                width={44}
                height={64}
              />
            ) : (
              <div className="flex h-16 w-11 shrink-0 items-center justify-center rounded bg-[var(--surface-subtle)] text-[10px] text-[var(--text-secondary)]">
                —
              </div>
            )}
            <span className="text-sm font-medium text-[var(--text-primary)]">{selectedBook.title}</span>
          </div>
        </div>
      ) : null}

      {books.length > 1 ? (
        <div className="flex flex-col gap-2">
          <span className="text-sm font-medium text-[var(--text-primary)]">Book</span>
          <div className="flex flex-col gap-3">
            {books.map((b) => (
              <button
                key={b.userBookId}
                type="button"
                onClick={() => setUserBookId(b.userBookId)}
                className={`flex gap-3 rounded-xl border p-4 text-left transition-colors ${
                  userBookId === b.userBookId
                    ? "border-[var(--brand-burgundy)] bg-[var(--brand-burgundy-soft)]"
                    : "border-[var(--border-subtle)] bg-[var(--surface)] hover:border-[var(--border-subtle)]"
                }`}
              >
                {b.thumbnailUrl ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={b.thumbnailUrl}
                    alt=""
                    className="h-16 w-11 shrink-0 rounded object-cover"
                    width={44}
                    height={64}
                  />
                ) : (
                  <div className="flex h-16 w-11 shrink-0 items-center justify-center rounded bg-[var(--surface-subtle)] text-[10px] text-[var(--text-secondary)]">
                    —
                  </div>
                )}
                <span className="text-sm font-medium text-[var(--text-primary)]">{b.title}</span>
              </button>
            ))}
          </div>
        </div>
      ) : null}

      <fieldset className="flex flex-col gap-2 border-0 p-0">
        <legend className="mb-2 text-sm font-medium text-[var(--text-primary)]">Day</legend>
        <div className="flex flex-col gap-2">
          <label className="flex cursor-pointer items-center gap-2 text-sm">
            <input
              id="session-date-today"
              type="radio"
              name="sessionDate"
              value={todayYmd}
              checked={sessionDate === todayYmd}
              onChange={() => setSessionDate(todayYmd)}
            />
            Today ({formatDayLabel(todayYmd, "today")})
          </label>
          <label className="flex cursor-pointer items-center gap-2 text-sm">
            <input
              id="session-date-yesterday"
              type="radio"
              name="sessionDate"
              value={yesterdayYmd}
              checked={sessionDate === yesterdayYmd}
              onChange={() => setSessionDate(yesterdayYmd)}
            />
            Yesterday ({formatDayLabel(yesterdayYmd, "yesterday")})
          </label>
        </div>
      </fieldset>

      <div className="flex flex-col gap-2">
        <label className="text-sm font-medium" htmlFor="pages-read">
          Pages read
        </label>
        <p className="text-xs text-[var(--text-secondary)]">Between 1 and 1,000 per session.</p>
        <input
          id="pages-read"
          name="pagesRead"
          type="number"
          min={1}
          max={1000}
          inputMode="numeric"
          required
          value={pagesRead}
          onChange={(e) => setPagesRead(e.target.value)}
          className="rounded-lg border border-[var(--border-subtle)] bg-[var(--surface-subtle)] px-4 py-3 text-base outline-none focus:ring-2 focus:ring-[var(--brand-blue)]"
        />
      </div>

      <div className="flex flex-col gap-2">
        <label className="text-sm font-medium" htmlFor="time-minutes">
          Minutes read
        </label>
        <p className="text-xs text-[var(--text-secondary)]">Between 1 and 720 (12 hours).</p>
        <input
          id="time-minutes"
          name="timeMinutes"
          type="number"
          min={1}
          max={720}
          inputMode="numeric"
          required
          value={timeMinutes}
          onChange={(e) => setTimeMinutes(e.target.value)}
          className="rounded-lg border border-[var(--border-subtle)] bg-[var(--surface-subtle)] px-4 py-3 text-base outline-none focus:ring-2 focus:ring-[var(--brand-blue)]"
        />
      </div>

      {error ? <p className="text-sm text-[var(--error)]">{error}</p> : null}

      <button
        type="submit"
        disabled={pending || !userBookId}
        className="inline-flex h-11 items-center justify-center rounded-lg bg-[var(--brand-burgundy)] px-5 text-sm text-white transition-colors hover:bg-[var(--brand-burgundy-hover)] disabled:opacity-50"
      >
        {pending ? "Saving…" : "Save session"}
      </button>
    </form>
  );
}
