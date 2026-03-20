import Link from "next/link";

type AuthErrorPageProps = {
  searchParams: Promise<{ error?: string }>;
};

function decodeErrorParam(raw: string | undefined): string {
  if (!raw) return "";
  try {
    return decodeURIComponent(raw);
  } catch {
    return raw;
  }
}

export default async function AuthErrorPage({ searchParams }: AuthErrorPageProps) {
  const { error: raw } = await searchParams;
  const decoded = decodeErrorParam(raw);

  let title = "Couldn’t finish signing in";
  let body = decoded || "Something went wrong during Google sign-in.";
  let hint: string | null = null;

  if (decoded.includes("Missing required environment variable") && decoded.includes("INSTANT")) {
    title = "Server configuration incomplete";
    hint =
      "Booqse needs InstantDB admin credentials to create your user. Add INSTANT_APP_ID and INSTANT_APP_ADMIN_TOKEN to .env.local (see .env.example), then restart the dev server.";
  } else if (decoded === "AccessDenied" || decoded.toLowerCase() === "accessdenied") {
    title = "Access denied";
    body = "This account can’t be used to sign in (for example, Google didn’t provide an email or name).";
  }

  return (
    <main className="mx-auto flex min-h-screen w-full max-w-[720px] items-center px-6 py-16">
      <section className="w-full rounded-xl border border-[var(--border-subtle)] bg-[var(--surface)] p-8 md:p-12">
        <h1 className="text-4xl leading-tight tracking-tight">{title}</h1>
        <p className="mt-4 text-base text-[var(--text-secondary)] whitespace-pre-wrap">{body}</p>
        {hint ? (
          <p className="mt-4 text-sm text-[var(--text-secondary)] border-t border-[var(--border-subtle)] pt-4">
            {hint}
          </p>
        ) : null}
        <div className="mt-8">
          <Link
            href="/auth"
            className="inline-flex h-11 items-center justify-center rounded-lg bg-[var(--brand-burgundy)] px-5 text-sm text-white transition-colors hover:bg-[var(--brand-burgundy-hover)]"
          >
            Back to sign in
          </Link>
        </div>
      </section>
    </main>
  );
}
