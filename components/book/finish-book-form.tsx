"use client";

import { markBookFinished, type AddBookActionResult } from "@/app/actions/books";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";

export function FinishBookForm({ userBookId }: { userBookId: string }) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [rating, setRating] = useState("8");
  const [reviewText, setReviewText] = useState("");
  const [error, setError] = useState<string | null>(null);

  const onSubmit = () => {
    setError(null);
    const r = Number.parseInt(rating, 10);
    if (!Number.isFinite(r) || r < 1 || r > 10) {
      setError("Choose a rating from 1 to 10.");
      return;
    }

    startTransition(async () => {
      const result: AddBookActionResult = await markBookFinished({
        userBookId,
        rating: r,
        reviewText: reviewText.trim() || undefined,
      });
      if (!result.ok) {
        setError(result.error);
        return;
      }
      router.refresh();
    });
  };

  return (
    <section className="flex max-w-md flex-col gap-3 rounded-xl border border-[var(--border-subtle)] bg-[var(--surface)] p-4">
      <h3 className="text-sm font-medium text-[var(--text-primary)]">Mark as finished</h3>
      <p className="text-xs text-[var(--text-secondary)]">Set your rating now. You can edit it later.</p>
      <div className="flex items-end gap-3">
        <div className="flex flex-col gap-1">
          <label className="text-xs text-[var(--text-secondary)]" htmlFor="finish-rating">
            Rating (1–10)
          </label>
          <input
            id="finish-rating"
            name="finishRating"
            type="number"
            min={1}
            max={10}
            value={rating}
            onChange={(e) => setRating(e.target.value)}
            className="w-28 rounded-lg border border-[var(--border-subtle)] bg-[var(--surface-subtle)] px-3 py-2 text-base outline-none focus:ring-2 focus:ring-[var(--brand-blue)]"
          />
        </div>
        <button
          type="button"
          disabled={pending}
          onClick={onSubmit}
          className="inline-flex h-10 items-center justify-center rounded-lg bg-[var(--brand-burgundy)] px-4 text-sm text-white transition-colors hover:bg-[var(--brand-burgundy-hover)] disabled:opacity-50"
        >
          {pending ? "Saving…" : "Mark finished"}
        </button>
      </div>
      <div className="flex flex-col gap-1">
        <label className="text-xs text-[var(--text-secondary)]" htmlFor="finish-review">
          Optional review
        </label>
        <textarea
          id="finish-review"
          name="reviewText"
          value={reviewText}
          onChange={(e) => setReviewText(e.target.value)}
          placeholder="What did you learn or feel?"
          className="min-h-20 resize-none rounded-lg border border-[var(--border-subtle)] bg-[var(--surface-subtle)] px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-[var(--brand-blue)]"
        />
      </div>
      {error ? <p className="text-sm text-[var(--error)]">{error}</p> : null}
    </section>
  );
}

