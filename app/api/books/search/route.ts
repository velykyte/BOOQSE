import { authOptions } from "@/auth";
import { searchGoogleBooksVolumes } from "@/lib/server/google-books";
import { bookSearchQuerySchema } from "@/lib/validation/books";
import { getServerSession } from "next-auth";
import { NextResponse } from "next/server";

export async function GET(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.email) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(req.url);
  const qRaw = searchParams.get("q") ?? "";
  const parsedQ = bookSearchQuerySchema.safeParse(qRaw);
  if (!parsedQ.success) {
    return NextResponse.json({ items: [] });
  }

  // .env parsers can leave surrounding quotes; normalize them away.
  const rawKey = process.env.GOOGLE_BOOKS_API_KEY;
  const key = rawKey?.trim().replace(/^['"]|['"]$/g, "");
  if (!key) {
    return NextResponse.json(
      {
        error: "Book search is not configured.",
        hint: "Set GOOGLE_BOOKS_API_KEY in .env.local and restart the dev server.",
      },
      { status: 503 },
    );
  }

  try {
    const items = await searchGoogleBooksVolumes(parsedQ.data, key);
    return NextResponse.json({ items });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Something went wrong. Try again.";
    // Helpful server-side log for debugging API failures.
    console.error("Google Books search failed:", message);
    return NextResponse.json({ error: message }, { status: 502 });
  }
}
