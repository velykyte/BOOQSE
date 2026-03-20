"use client";

import { saveReflection, type SaveReflectionResult } from "@/app/actions/reflections";
import { useRouter } from "next/navigation";
import { useMemo, useState, useTransition } from "react";

const QUESTIONS = [
  "What stood out to you most from this reading session?",
  "How did this reading connect with something in your life?",
  "What idea do you want to remember tomorrow?",
  "Did anything challenge your thinking today?",
  "How do you feel after this session?",
] as const;

export function ReflectionFlow({
  sessionId,
  userBookId,
  initial,
}: {
  sessionId: string;
  userBookId: string;
  initial: { q1: string; q2: string; q3: string; q4: string; q5: string };
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [step, setStep] = useState(0);
  const [answers, setAnswers] = useState([initial.q1, initial.q2, initial.q3, initial.q4, initial.q5]);
  const [error, setError] = useState<string | null>(null);

  const currentQuestion = useMemo(() => QUESTIONS[step], [step]);
  const isLast = step === QUESTIONS.length - 1;

  const setCurrent = (value: string) => {
    setAnswers((prev) => {
      const next = [...prev];
      next[step] = value;
      return next;
    });
  };

  const submit = () => {
    const answersToSave = answers;
    setError(null);
    startTransition(async () => {
      const result: SaveReflectionResult = await saveReflection({
        sessionId,
        userBookId,
        question1: answers[0],
        question2: answers[1],
        question3: answers[2],
        question4: answers[3],
        question5: answers[4],
      });
      if (result.ok) {
        router.push(`/book/${result.userBookId}`);
      } else {
        setError(result.error);
      }
    });
  };

  const skipAllQuestions = () => {
    // Reflection answers are optional, so skipping means saving nulls.
    // (The schema transforms empty strings into `null`.)
    const skippedAnswers = ["", "", "", "", ""];
    setError(null);
    startTransition(async () => {
      const result: SaveReflectionResult = await saveReflection({
        sessionId,
        userBookId,
        question1: skippedAnswers[0],
        question2: skippedAnswers[1],
        question3: skippedAnswers[2],
        question4: skippedAnswers[3],
        question5: skippedAnswers[4],
      });
      if (result.ok) {
        router.push(`/book/${result.userBookId}`);
      } else {
        setError(result.error);
      }
    });
  };

  return (
    <section className="flex max-w-2xl flex-col gap-6">
      <div>
        <h1 className="font-serif text-3xl leading-tight md:text-4xl">Reflection</h1>
        <p className="mt-2 text-sm text-[var(--text-secondary)]">
          Private to you. You can skip questions and save partial answers.
        </p>
      </div>

      <div className="rounded-xl border border-[var(--border-subtle)] bg-[var(--surface)] p-6 md:p-8">
        <p className="text-sm text-[var(--text-secondary)]">
          Question {step + 1} of {QUESTIONS.length}
        </p>
        <h2 className="mt-2 text-lg font-medium text-[var(--text-primary)]">{currentQuestion}</h2>
        <textarea
          value={answers[step]}
          onChange={(e) => setCurrent(e.target.value)}
          rows={6}
          className="mt-4 w-full rounded-lg border border-[var(--border-subtle)] bg-[var(--surface-subtle)] px-4 py-3 text-base outline-none"
          placeholder="Write your reflection (optional)"
        />
      </div>

      {error ? <p className="text-sm text-[var(--error)]">{error}</p> : null}

      <div className="flex flex-wrap gap-3">
        <button
          type="button"
          disabled={pending || step === 0}
          onClick={() => setStep((s) => Math.max(0, s - 1))}
          className="inline-flex h-11 items-center justify-center rounded-lg border border-[var(--border-subtle)] px-5 text-sm text-[var(--text-secondary)] transition-colors hover:border-[var(--brand-burgundy)] hover:text-[var(--brand-burgundy)] disabled:opacity-50"
        >
          Back
        </button>
        <button
          type="button"
          disabled={pending}
          onClick={skipAllQuestions}
          className="inline-flex h-11 items-center justify-center rounded-lg bg-[var(--brand-blue)] px-5 text-sm text-white transition-colors hover:bg-[var(--brand-blue-hover)] disabled:opacity-50"
        >
          Skip all
        </button>
        {!isLast ? (
          <button
            type="button"
            disabled={pending}
            onClick={() => setStep((s) => Math.min(QUESTIONS.length - 1, s + 1))}
            className="inline-flex h-11 items-center justify-center rounded-lg bg-[var(--brand-burgundy)] px-5 text-sm text-white transition-colors hover:bg-[var(--brand-burgundy-hover)] disabled:opacity-50"
          >
            Save and continue
          </button>
        ) : (
          <button
            type="button"
            disabled={pending}
            onClick={submit}
            className="inline-flex h-11 items-center justify-center rounded-lg bg-[var(--brand-burgundy)] px-5 text-sm text-white transition-colors hover:bg-[var(--brand-burgundy-hover)] disabled:opacity-50"
          >
            {pending ? "Saving…" : "Save reflection"}
          </button>
        )}
      </div>
    </section>
  );
}

