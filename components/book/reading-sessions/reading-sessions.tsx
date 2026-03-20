"use client";

import {
  deleteReadingSession,
  editReadingSession,
  type DeleteReadingSessionResult,
  type EditReadingSessionResult,
} from "@/app/actions/sessions";
import { SESSION_LIMITS } from "@/lib/domain/constants";
import { useRouter } from "next/navigation";
import { useMemo, useState, useTransition } from "react";

type ReadingSessionSummary = {
  sessionId: string;
  sessionDateYmd: string;
  pagesRead: number;
  timeMinutes: number;
};

function formatYmd(ymd: string) {
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
    return ymd;
  }
}

export function ReadingSessions({
  sessions,
  userBookId,
}: {
  sessions: ReadingSessionSummary[];
  userBookId: string;
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [editingId, setEditingId] = useState<string | null>(null);
  const [pagesRead, setPagesRead] = useState<string>("");
  const [timeMinutes, setTimeMinutes] = useState<string>("");
  const [error, setError] = useState<string | null>(null);

  const editingSession = useMemo(
    () => sessions.find((s) => s.sessionId === editingId) ?? null,
    [sessions, editingId],
  );

  const startEditing = (s: ReadingSessionSummary) => {
    setError(null);
    setEditingId(s.sessionId);
    setPagesRead(String(s.pagesRead));
    setTimeMinutes(String(s.timeMinutes));
  };

  const cancelEditing = () => {
    setError(null);
    setEditingId(null);
  };

  const onSave = () => {
    if (!editingSession) return;
    setError(null);

    const pages = Number.parseInt(pagesRead, 10);
    const minutes = Number.parseInt(timeMinutes, 10);
    if (!Number.isFinite(pages) || !Number.isFinite(minutes)) {
      setError("Check pages and time, then try again.");
      return;
    }

    startTransition(async () => {
      const result: EditReadingSessionResult = await editReadingSession({
        sessionId: editingSession.sessionId,
        userBookId,
        pagesRead: pages,
        timeMinutes: minutes,
      });

      if (result.ok) {
        cancelEditing();
        router.refresh();
      } else {
        setError(result.error);
      }
    });
  };

  const onDelete = (sessionId: string) => {
    setError(null);
    startTransition(async () => {
      const result: DeleteReadingSessionResult = await deleteReadingSession({
        sessionId,
        userBookId,
      });
      if (result.ok) {
        if (editingId === sessionId) cancelEditing();
        router.refresh();
      } else {
        setError(result.error);
      }
    });
  };

  return (
    <section className="flex w-full flex-col gap-4 md:w-1/2 md:flex-none md:min-w-0">
      <div className="flex items-end justify-between gap-4">
        <h2 className="font-serif text-2xl leading-tight">Sessions</h2>
        {sessions.length > 0 ? (
          <p className="text-sm text-[var(--text-secondary)]">
            {sessions.length} logged {sessions.length === 1 ? "session" : "sessions"}
          </p>
        ) : null}
      </div>

      {sessions.length === 0 ? (
        <p className="text-sm text-[var(--text-secondary)]">
          No sessions logged yet. Use “Log reading session” to get started.
        </p>
      ) : (
        <ul className="flex flex-col gap-3">
          {sessions.map((s) => {
            const isEditing = s.sessionId === editingId;
            return (
              <li
                key={s.sessionId}
                className="rounded-xl border border-[var(--border-subtle)] bg-[var(--surface)] p-4"
              >
                {isEditing ? (
                  <div className="flex flex-col gap-4">
                    <div className="text-sm text-[var(--text-secondary)]">
                      {formatYmd(s.sessionDateYmd)}
                    </div>

                    <div className="flex flex-wrap gap-4">
                      <div className="flex flex-col gap-2">
                        <label className="text-sm font-medium" htmlFor={`pages-${s.sessionId}`}>
                          Pages read
                        </label>
                        <input
                          id={`pages-${s.sessionId}`}
                          type="number"
                          min={SESSION_LIMITS.pagesReadMin}
                          max={SESSION_LIMITS.pagesReadMax}
                          value={pagesRead}
                          onChange={(e) => setPagesRead(e.target.value)}
                          className="w-36 rounded-lg border border-[var(--border-subtle)] bg-[var(--surface-subtle)] px-3 py-2 text-base outline-none"
                        />
                      </div>

                      <div className="flex flex-col gap-2">
                        <label
                          className="text-sm font-medium"
                          htmlFor={`minutes-${s.sessionId}`}
                        >
                          Minutes read
                        </label>
                        <input
                          id={`minutes-${s.sessionId}`}
                          type="number"
                          min={SESSION_LIMITS.timeMinutesMin}
                          max={SESSION_LIMITS.timeMinutesMax}
                          value={timeMinutes}
                          onChange={(e) => setTimeMinutes(e.target.value)}
                          className="w-36 rounded-lg border border-[var(--border-subtle)] bg-[var(--surface-subtle)] px-3 py-2 text-base outline-none"
                        />
                      </div>
                    </div>

                    {error ? <p className="text-sm text-[var(--error)]">{error}</p> : null}

                    <div className="flex flex-wrap gap-3">
                      <button
                        type="button"
                        disabled={pending}
                        onClick={onSave}
                        className="inline-flex h-10 items-center justify-center rounded-lg bg-[var(--brand-burgundy)] px-4 text-sm text-white transition-colors hover:bg-[var(--brand-burgundy-hover)] disabled:opacity-50"
                      >
                        {pending ? "Saving…" : "Save"}
                      </button>
                      <button
                        type="button"
                        disabled={pending}
                        onClick={cancelEditing}
                        className="inline-flex h-10 items-center justify-center rounded-lg border border-[var(--border-subtle)] px-4 text-sm text-[var(--text-secondary)] transition-colors hover:border-[var(--brand-burgundy)] hover:text-[var(--brand-burgundy)] disabled:opacity-50"
                      >
                        Cancel
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="flex flex-col gap-3">
                    <div className="flex items-start justify-between gap-4">
                      <div>
                        <div className="text-sm font-medium">{formatYmd(s.sessionDateYmd)}</div>
                        <div className="mt-1 text-sm text-[var(--text-secondary)]">
                          {s.pagesRead} pages · {s.timeMinutes} minutes
                        </div>
                      </div>
                      <div className="flex flex-col items-end gap-1">
                        <button
                          type="button"
                          disabled={pending}
                          onClick={() => {
                            router.push(`/reflect?sessionId=${s.sessionId}&userBookId=${userBookId}`);
                          }}
                          className="text-sm text-[var(--brand-blue)] underline-offset-2 hover:underline disabled:opacity-50"
                        >
                          Add reflection
                        </button>
                        <button
                          type="button"
                          disabled={pending}
                          onClick={() => onDelete(s.sessionId)}
                          className="text-sm text-[var(--error)] underline-offset-2 hover:underline disabled:opacity-50"
                        >
                          Delete
                        </button>
                        <button
                          type="button"
                          onClick={() => startEditing(s)}
                          className="text-sm text-[var(--brand-burgundy)] underline-offset-2 hover:underline"
                        >
                          Edit
                        </button>
                      </div>
                    </div>
                  </div>
                )}
              </li>
            );
          })}
        </ul>
      )}
    </section>
  );
}

