"use client";

import { moveUserBookToWantToRead, type MoveUserBookToWantToReadResult } from "@/app/actions/books";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";

export function MoveUserBookToWantToReadButton({ userBookId }: { userBookId: string }) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  return (
    <div className="flex flex-col items-end gap-2">
      <button
        type="button"
        disabled={pending}
        onClick={() => {
          setError(null);
          startTransition(async () => {
            const result: MoveUserBookToWantToReadResult = await moveUserBookToWantToRead({ userBookId });
            if (!result.ok) {
              setError(result.error);
              return;
            }
            router.refresh();
          });
        }}
        className="inline-flex h-9 items-center justify-center rounded-lg border border-[var(--border-subtle)] bg-[var(--surface-subtle)] px-3 text-xs text-[var(--text-primary)] transition-colors hover:bg-[var(--surface)] disabled:opacity-50"
      >
        Move to Want to Read
      </button>
      {error ? <p className="max-w-[220px] text-right text-[11px] text-[var(--error)]">{error}</p> : null}
    </div>
  );
}

