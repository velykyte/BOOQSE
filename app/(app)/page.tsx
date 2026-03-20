import { SignOutButton } from "@/components/auth/sign-out-button";
import { authOptions } from "@/auth";
import { listActiveCurrentBooks } from "@/lib/server/current-reading";
import { listLibraryBooksForUser } from "@/lib/server/library-books";
import { getAppUserByEmail } from "@/lib/server/get-app-user";
import Link from "next/link";
import { getServerSession } from "next-auth";
import Image from "next/image";
import asset5 from "@/ASSETS/Asset 5.webp";

export default async function HomePage() {
  const session = await getServerSession(authOptions);
  const email = session?.user?.email;
  const appUser = email ? await getAppUserByEmail(email) : null;
  const activeBooks = appUser ? await listActiveCurrentBooks(appUser.id) : [];
  const libraryBooks = appUser ? await listLibraryBooksForUser(appUser.id) : [];
  const hasCurrent = activeBooks.length > 0;
  const topBook = activeBooks[0];

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
              {session?.user?.email
                ? `Signed in as ${session.user.email}.`
                : "You are signed in."}{" "}
              {hasCurrent
                ? "Log a session when you read, or open a book below."
                : "Add what you’re reading to start tracking sessions."}
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
        <div className="mt-8 flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
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

          <SignOutButton />
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
                <Link
                  href={`/book/${b.userBookId}`}
                  className="flex items-center gap-3 rounded-xl border border-[var(--border-subtle)] bg-[var(--surface-subtle)] p-3 transition-colors hover:border-[var(--brand-blue)]"
                >
                  {b.thumbnailUrl ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={b.thumbnailUrl}
                      alt=""
                      className="h-14 w-10 shrink-0 rounded object-cover"
                      width={40}
                      height={56}
                    />
                  ) : (
                    <div className="flex h-14 w-10 shrink-0 items-center justify-center rounded bg-[var(--surface)] text-[10px] text-[var(--text-secondary)]">
                      —
                    </div>
                  )}
                  <div className="min-w-0">
                    <p className="truncate text-sm font-medium text-[var(--text-primary)]">{b.title}</p>
                    <p className="mt-1 text-xs text-[var(--text-secondary)]">
                      {b.isPastBook ? "Past read" : b.status.replace(/_/g, " ")}
                    </p>
                  </div>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </section>
    </main>
  );
}
