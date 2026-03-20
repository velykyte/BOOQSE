import { startWithCurrentBook, startWithPastBooks } from "@/app/actions/onboarding";

export default function OnboardingPage() {
  return (
    <main className="mx-auto max-w-[640px]">
      <h1 className="font-serif text-3xl leading-tight md:text-4xl">How do you want to begin?</h1>
      <p className="mt-3 text-sm text-[var(--text-secondary)]">You can do the other later.</p>

      <div className="mt-10 flex flex-col gap-6">
        <form action={startWithCurrentBook}>
          <button
            type="submit"
            className="w-full rounded-xl border border-[var(--border-subtle)] bg-[var(--surface)] p-8 text-left transition-colors hover:border-[var(--brand-burgundy)] hover:bg-[var(--brand-burgundy-soft)]"
          >
            <span className="block text-lg font-medium text-[var(--text-primary)]">
              I&apos;m reading a book now
            </span>
            <span className="mt-2 block text-sm text-[var(--text-secondary)]">
              Add what you&apos;re reading and log your first session.
            </span>
          </button>
        </form>

        <form action={startWithPastBooks}>
          <button
            type="submit"
            className="w-full rounded-xl border border-[var(--border-subtle)] bg-[var(--surface)] p-8 text-left transition-colors hover:border-[var(--brand-blue)] hover:bg-[var(--brand-blue-soft)]"
          >
            <span className="block text-lg font-medium text-[var(--text-primary)]">
              I want to add books I&apos;ve already read
            </span>
            <span className="mt-2 block text-sm text-[var(--text-secondary)]">
              Rate past reads to unlock recommendations faster.
            </span>
          </button>
        </form>
      </div>
    </main>
  );
}
