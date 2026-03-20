import { LogSessionForm } from "@/components/log-session/log-session-form";
import { allowedSessionCalendarDates } from "@/lib/server/civil-date";
import { listActiveCurrentBooks } from "@/lib/server/current-reading";
import { requireInstantUser } from "@/lib/server/session-user";
import Link from "next/link";
import { redirect } from "next/navigation";

type LogSessionPageProps = {
  searchParams: Promise<{ userBookId?: string }>;
};

export default async function LogSessionPage({ searchParams }: LogSessionPageProps) {
  const auth = await requireInstantUser();
  if (!auth) {
    redirect("/auth");
  }

  const books = await listActiveCurrentBooks(auth.user.id);
  const tz = auth.user.timezone?.trim() || "UTC";
  const { today, yesterday } = allowedSessionCalendarDates(tz);
  const sp = await searchParams;
  const initialUserBookId = sp.userBookId ?? null;

  return (
    <main className="flex flex-col gap-8">
      <div>
        <h1 className="font-serif text-3xl leading-tight md:text-4xl">Log reading</h1>
        <p className="mt-2 max-w-xl text-sm text-[var(--text-secondary)]">
          Pages and time are both required. You can log for today or yesterday only.
        </p>
      </div>

      {books.length === 0 ? (
        <section className="rounded-xl border border-[var(--border-subtle)] bg-[var(--surface)] p-8">
          <p className="text-base text-[var(--text-secondary)]">
            Add a book you’re currently reading to start logging sessions.
          </p>
          <Link
            href="/add-book?intent=current"
            className="mt-6 inline-flex h-11 items-center justify-center rounded-lg bg-[var(--brand-burgundy)] px-5 text-sm text-white transition-colors hover:bg-[var(--brand-burgundy-hover)]"
          >
            Add a current book
          </Link>
        </section>
      ) : (
        <LogSessionForm
          books={books}
          todayYmd={today}
          yesterdayYmd={yesterday}
          initialUserBookId={initialUserBookId}
        />
      )}
    </main>
  );
}
