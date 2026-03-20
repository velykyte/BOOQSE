"use client";

import { deleteReview, saveReview, type DeleteReviewResult, type SaveReviewResult } from "@/app/actions/reviews";
import { useTransition, useState } from "react";
import { useRouter } from "next/navigation";

export function ReviewEditor({
  userBookId,
  initialText,
}: {
  userBookId: string;
  initialText: string | null;
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [deletePending, startDeleteTransition] = useTransition();

  const hasSavedInitial =
    typeof initialText === "string" && initialText.trim().length > 0;
  const [saved, setSaved] = useState(() => hasSavedInitial);
  const [mode, setMode] = useState<"view" | "edit">(() =>
    hasSavedInitial ? "view" : "edit",
  );
  const [text, setText] = useState(() => initialText ?? "");
  const [error, setError] = useState<string | null>(null);

  const onSubmit = () => {
    setError(null);
    startTransition(async () => {
      const result: SaveReviewResult = await saveReview({
        userBookId,
        reviewText: text,
      });
      if (!result.ok) {
        setError(result.error);
        return;
      }
      setError(null);
      // Keep the editor visible so the user can immediately make further edits,
      // while still showing the saved log with edit/delete controls.
      setSaved(true);
      setMode("edit");
      router.refresh();
    });
  };

  const onDelete = () => {
    setError(null);
    startDeleteTransition(async () => {
      const result: DeleteReviewResult = await deleteReview({ userBookId });
      if (!result.ok) {
        setError(result.error);
        return;
      }
      setError(null);
      setSaved(false);
      setMode("edit");
      setText("");
      router.refresh();
    });
  };

  return (
    <div className="flex flex-col gap-2">
      <div className="flex items-start justify-between gap-4">
        <p className="text-sm font-medium text-[var(--text-primary)]">Your review</p>
        {saved ? (
          <div className="flex flex-col items-end gap-1">
            <button
              type="button"
              disabled={pending}
              onClick={() => {
                setError(null);
                setMode(mode === "view" ? "edit" : "view");
              }}
              className="inline-flex text-sm text-[var(--brand-burgundy)] underline-offset-2 hover:underline disabled:opacity-50"
            >
              Edit
            </button>
            <button
              type="button"
              disabled={deletePending}
              onClick={onDelete}
              className="inline-flex text-sm text-[var(--error)] underline-offset-2 hover:underline disabled:opacity-50"
            >
              Delete
            </button>
          </div>
        ) : null}
      </div>

      {saved ? (
        <div className="rounded-lg border border-[var(--border-subtle)] bg-[var(--surface-subtle)] p-3">
          <p className="whitespace-pre-wrap text-sm text-[var(--text-secondary)]">
            {text.trim().length > 0 ? text : "—"}
          </p>
        </div>
      ) : (
        null
      )}

      {mode === "edit" ? (
        <>
          <textarea
            id="finish-review"
            name="reviewText"
            value={text}
            onChange={(e) => setText(e.target.value)}
            placeholder="Write a short review (what you learned or felt)."
            className="min-h-20 w-full resize-none rounded-lg border border-[var(--border-subtle)] bg-[var(--surface-subtle)] px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-[var(--brand-blue)]"
          />
          <div className="flex items-center justify-between gap-3">
            {error ? <p className="text-sm text-[var(--error)]">{error}</p> : <span />}
            <button
              type="button"
              disabled={pending}
              onClick={onSubmit}
              className="inline-flex h-10 items-center justify-center rounded-lg bg-[var(--brand-burgundy)] px-4 text-sm text-white transition-colors hover:bg-[var(--brand-burgundy-hover)] disabled:opacity-50"
            >
              {pending ? "Saving…" : "Save review"}
            </button>
          </div>
        </>
      ) : null}
    </div>
  );
}

