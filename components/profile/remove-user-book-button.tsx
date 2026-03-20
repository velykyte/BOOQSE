"use client";

import { deleteUserBook, type DeleteUserBookResult } from "@/app/actions/books";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";

export function RemoveUserBookButton({ userBookId }: { userBookId: string }) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  return (
    <div className="relative z-30 flex flex-col items-end gap-2">
      <button
        type="button"
        disabled={pending}
        onPointerDown={(e) => {
          e.preventDefault();
          e.stopPropagation();
        }}
        onClick={(e) => {
          e.preventDefault();
          e.stopPropagation();
          setError(null);
          startTransition(async () => {
            try {
              const result: DeleteUserBookResult = await deleteUserBook({ userBookId });
              if (!result.ok) {
                setError(result.error);
                return;
              }
              router.refresh();
            } catch (e) {
              console.error("[RemoveUserBookButton] failed", { userBookId, error: e });
              setError("Something went wrong. Try again.");
            }
          });
        }}
        className="relative z-50 inline-flex h-9 items-center justify-center rounded-lg border border-[var(--border-subtle)] bg-[var(--surface-subtle)] px-3 text-xs text-[var(--text-primary)] transition-colors hover:bg-[var(--surface)] disabled:opacity-50"
      >
        Remove
      </button>
      {error ? <p className="max-w-[180px] text-right text-[11px] text-[var(--error)]">{error}</p> : null}
    </div>
  );
}

