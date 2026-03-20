"use client";

import { deleteReflection, type DeleteReflectionResult } from "@/app/actions/reflections";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";

export function DeleteReflectionButton({
  reflectionId,
  userBookId,
}: {
  reflectionId: string;
  userBookId: string;
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  const onDelete = () => {
    setError(null);
    startTransition(async () => {
      const result: DeleteReflectionResult = await deleteReflection({
        reflectionId,
        userBookId,
      });
      if (result.ok) {
        router.refresh();
      } else {
        setError(result.error);
      }
    });
  };

  return (
    <div className="mt-2 flex flex-col gap-1">
      <button
        type="button"
        disabled={pending}
        onClick={onDelete}
        className="inline-flex text-sm text-[var(--error)] underline-offset-2 hover:underline disabled:opacity-50"
      >
        {pending ? "Deleting…" : "Delete reflection"}
      </button>
      {error ? <p className="text-xs text-[var(--error)]">{error}</p> : null}
    </div>
  );
}

