import { GoogleSignInButton } from "@/components/auth/google-sign-in-button";

export default function AuthPage() {
  return (
    <main className="mx-auto flex min-h-screen w-full max-w-[720px] items-center px-6 py-16">
      <section className="w-full rounded-xl border border-[var(--border-subtle)] bg-[var(--surface)] p-8 md:p-12">
        <h1 className="text-4xl leading-tight tracking-tight">Welcome to Booqse</h1>
        <p className="mt-4 text-base text-[var(--text-secondary)]">
          Track your reading, reflect on what you read, and get better recommendations.
        </p>
        <div className="mt-8">
          <GoogleSignInButton />
        </div>
      </section>
    </main>
  );
}
