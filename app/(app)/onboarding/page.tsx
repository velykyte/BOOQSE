import { startWithCurrentBook, startWithPastBooks } from "@/app/actions/onboarding";
import Image from "next/image";
import asset3 from "@/ASSETS/Asset 3.webp";

export default function OnboardingPage() {
  return (
    <main className="mx-auto max-w-[960px]">
      <div className="flex flex-col gap-8 md:flex-row md:items-start md:justify-between">
        <div className="min-w-0">
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
        </div>

        <div className="flex justify-end md:flex-shrink-0">
          <Image
            src={asset3}
            alt=""
            className="h-56 w-auto object-contain md:h-72"
            priority
          />
        </div>
      </div>
    </main>
  );
}
