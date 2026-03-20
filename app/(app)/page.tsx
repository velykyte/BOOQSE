import { SignOutButton } from "@/components/auth/sign-out-button";
import { authOptions } from "@/auth";
import { listActiveCurrentBooks } from "@/lib/server/current-reading";
import { listLibraryBooksForUser } from "@/lib/server/library-books";
import { listReadingSessionsForUserBook } from "@/lib/server/reading-sessions-read";
import { getAppUserByEmail } from "@/lib/server/get-app-user";
import Link from "next/link";
import { getServerSession } from "next-auth";
import Image from "next/image";
import asset5 from "@/ASSETS/Asset 5.webp";
import { RemoveUserBookButton } from "@/components/profile/remove-user-book-button";
import { unstable_noStore as noStore } from "next/cache";

export const dynamic = "force-dynamic";

export default async function HomePage() {
  const session = await getServerSession(authOptions);
  const email = session?.user?.email;
  const appUser = email ? await getAppUserByEmail(email) : null;
  const activeBooks = appUser ? await listActiveCurrentBooks(appUser.id) : [];
  const libraryBooks = appUser ? await listLibraryBooksForUser(appUser.id) : [];
  if (appUser) {
    noStore();
  }
  const hasCurrent = activeBooks.length > 0;
  const topBook = activeBooks[0];

  // Used to compute progress bars on the "Your books" cards.
  const pagesReadByUserBookId = new Map<string, number>();
  if (appUser) {
    await Promise.all(
      libraryBooks.map(async (b) => {
        try {
          const sessions = await listReadingSessionsForUserBook(appUser.id, b.userBookId);
          const sum = sessions.reduce(
            (acc, s) => acc + (Number.isFinite(s.pagesRead) ? s.pagesRead : 0),
            0,
          );
          pagesReadByUserBookId.set(b.userBookId, sum);
        } catch {
          pagesReadByUserBookId.set(b.userBookId, 0);
        }
      }),
    );
  }

  function progressRatio(b: (typeof libraryBooks)[number]): number {
    if (b.status === "want_to_read") return 0;
    if (b.status === "currently_reading") {
      const total = b.userDefinedTotalPages;
      if (!Number.isFinite(total) || !total || total <= 0) return 0;
      const read = pagesReadByUserBookId.get(b.userBookId) ?? 0;
      return Math.max(0, Math.min(1, read / total));
    }
    return 1;
  }

  function formatAuthor(author: string | null): string | null {
    if (!author) return null;
    const parts = author
      .split(",")
      .map((p) => p.trim())
      .filter(Boolean);
    if (parts.length <= 1) return author;
    return `${parts[0]}...`;
  }

  function ProgressBar({ ratio, variant }: { ratio: number; variant: "grey" | "primary" }) {
    const percent = Math.round(Math.max(0, Math.min(1, ratio)) * 100);
    const fillBg =
      variant === "grey" ? "bg-[var(--text-secondary)]" : "bg-[var(--brand-burgundy)]";
    return (
      <div className="flex w-full items-center justify-center">
        <div className="h-2 w-full overflow-hidden rounded-full bg-[var(--border-subtle)]">
          <div className={`h-full ${fillBg}`} style={{ width: `${percent}%` }} />
        </div>
      </div>
    );
  }

  return (
    <main className="flex flex-col gap-10">
      <section className="rounded-xl border border-[var(--border-subtle)] bg-[var(--surface)] p-8 md:p-12">
        <p className="text-sm text-[var(--text-secondary)]">Home</p>
        <div className="mt-3 flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
          <div className="min-w-0 md:max-w-[50%]">
            <h1 className="font-serif text-4xl leading-tight tracking-tight md:text-5xl">
              Continue your reading
            </h1>
            <p className="mt-4 break-words text-base text-[var(--text-secondary)]">
              Keep your reading up to date as you go: log your pages and time, then come back here to continue.
              {hasCurrent
                ? " When you log a session, your progress updates immediately."
                : " Add what you’re reading to start tracking sessions (pages + time)."}
            </p>
          </div>
          <div className="flex justify-end md:flex-shrink-0">
            <Image
              src={asset5}
              alt=""
              className="h-56 w-auto object-contain md:h-72"
              priority
            />
          </div>
        </div>
        <div className="mt-8 flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
          <div className="flex flex-wrap items-center gap-4">
          {hasCurrent ? (
            <>
              <Link
                href={topBook ? `/log-session?userBookId=${encodeURIComponent(topBook.userBookId)}` : "/log-session"}
                className="inline-flex h-11 items-center justify-center rounded-lg bg-[var(--brand-burgundy)] px-5 text-sm text-white transition-colors hover:bg-[var(--brand-burgundy-hover)]"
              >
                Log reading
              </Link>
              <Link
                href="/add-book?intent=current"
                className="inline-flex h-11 items-center justify-center rounded-lg bg-[var(--brand-blue-hover)] px-5 text-sm text-white transition-colors hover:bg-[var(--brand-blue-hover)]"
              >
                Add another book
              </Link>
            </>
          ) : (
            <Link
              href="/add-book?intent=current"
              className="inline-flex h-11 items-center justify-center rounded-lg bg-[var(--brand-burgundy)] px-5 text-sm text-white transition-colors hover:bg-[var(--brand-burgundy-hover)]"
            >
              Add a book
            </Link>
          )}
          </div>

          <div className="flex items-center gap-4 md:justify-end">
            {session?.user?.email ? (
              <p className="whitespace-nowrap text-sm text-[var(--brand-burgundy)]">
                Signed in as {session.user.email}
              </p>
            ) : null}
            <SignOutButton />
          </div>
        </div>
      </section>

      <section className="rounded-xl border border-[var(--border-subtle)] bg-[var(--surface)] p-6 md:p-8">
        <div className="flex items-end justify-between gap-4">
          <h2 className="font-serif text-2xl leading-tight">Your books</h2>
          <p className="text-sm text-[var(--text-secondary)]">{libraryBooks.length} total</p>
        </div>

        {libraryBooks.length === 0 ? (
          <p className="mt-4 text-sm text-[var(--text-secondary)]">
            You have not added any books yet.
          </p>
        ) : (
          <ul className="mt-5 grid gap-3 sm:grid-cols-2">
            {libraryBooks.map((b) => (
              <li key={b.userBookId}>
                <div className="relative rounded-xl border border-[var(--border-subtle)] bg-[var(--surface-subtle)] p-3 transition-colors hover:border-[var(--brand-blue)]">
                  <RemoveUserBookButton
                    userBookId={b.userBookId}
                    className="absolute right-3 top-3"
                  />
                  <Link
                    href={`/book/${b.userBookId}`}
                    className="flex min-w-0 items-stretch gap-3 pr-10"
                  >
                    <div className="flex w-[60%] items-stretch gap-3 min-w-0">
                      {b.thumbnailUrl ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <div className="h-[84px] w-[60px] shrink-0 overflow-hidden rounded">
                          <img
                            src={b.thumbnailUrl}
                            alt=""
                            className="h-full w-full object-cover"
                            width={60}
                            height={84}
                          />
                        </div>
                      ) : (
                        <div className="flex h-[84px] w-[60px] shrink-0 items-center justify-center rounded bg-[var(--surface)] text-[10px] text-[var(--text-secondary)]">
                          —
                        </div>
                      )}
                      <div className="min-w-0">
                        <p className="break-words line-clamp-2 text-sm font-medium text-[var(--text-primary)] leading-snug">
                          {b.title}
                        </p>
                        {b.author ? (
                          <p className="mt-1 line-clamp-1 text-xs text-[var(--brand-burgundy)]">
                            {formatAuthor(b.author)}
                          </p>
                        ) : null}
                        <p className="mt-1 line-clamp-1 text-xs text-[var(--text-secondary)]">
                          {b.isPastBook ? "Past read" : b.status.replace(/_/g, " ")}
                        </p>
                      </div>
                    </div>
                    <div className="w-[40%] flex items-center justify-center">
                      <ProgressBar
                        ratio={progressRatio(b)}
                        variant={b.status === "want_to_read" ? "grey" : "primary"}
                      />
                    </div>
                  </Link>
                </div>
              </li>
            ))}
          </ul>
        )}
      </section>
    </main>
  );
}
