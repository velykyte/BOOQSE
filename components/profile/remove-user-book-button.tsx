"use client";

import { deleteUserBook, type DeleteUserBookResult } from "@/app/actions/books";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";

export function RemoveUserBookButton({
  userBookId,
  className,
}: {
  userBookId: string;
  className?: string;
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  return (
    <div className={["z-30", className].filter(Boolean).join(" ")}>
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
        aria-label="Remove"
        className="relative z-50 inline-flex h-8 w-8 items-center justify-center rounded-md bg-transparent text-base leading-none text-[var(--text-secondary)] transition-colors hover:text-[var(--brand-burgundy)] disabled:opacity-50 focus:outline-none"
      >
        ×
      </button>
      {error ? (
        <p className="mt-1 max-w-[140px] text-right text-[11px] text-[var(--error)]">{error}</p>
      ) : null}
    </div>
  );
}

