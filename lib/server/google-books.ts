import "server-only";

const VOLUMES_URL = "https://www.googleapis.com/books/v1/volumes";

export type GoogleBookVolumeSummary = {
  googleBooksId: string;
  title: string;
  authors: string[];
  thumbnailUrl: string | null;
  publishedDate: string | null;
};

type GoogleVolumesResponse = {
  items?: Array<{
    id: string;
    volumeInfo?: {
      title?: string;
      authors?: string[];
      imageLinks?: { thumbnail?: string; smallThumbnail?: string };
      publishedDate?: string;
    };
  }>;
};

function toHttps(url: string): string {
  if (url.startsWith("http://")) {
    return `https://${url.slice("http://".length)}`;
  }
  return url;
}

export async function searchGoogleBooksVolumes(
  query: string,
  apiKey: string,
): Promise<GoogleBookVolumeSummary[]> {
  const trimmed = query.trim();
  if (trimmed.length < 2) {
    return [];
  }

  const url = new URL(VOLUMES_URL);
  url.searchParams.set("q", trimmed);
  url.searchParams.set("maxResults", "20");
  url.searchParams.set("key", apiKey);

  const res = await fetch(url.toString(), { cache: "no-store" });
  if (!res.ok) {
    // Include status only; never include API keys or response bodies.
    throw new Error(`Google Books request failed (${res.status} ${res.statusText})`);
  }

  const data = (await res.json()) as GoogleVolumesResponse;
  const items = data.items ?? [];

  return items.map((item) => {
    const vi = item.volumeInfo ?? {};
    const rawThumb = vi.imageLinks?.thumbnail ?? vi.imageLinks?.smallThumbnail ?? null;
    const thumbnailUrl = rawThumb ? toHttps(rawThumb) : null;
    return {
      googleBooksId: item.id,
      title: (vi.title ?? "Untitled").slice(0, 500),
      authors: Array.isArray(vi.authors) ? vi.authors.map((a) => a.slice(0, 200)) : [],
      thumbnailUrl,
      publishedDate: vi.publishedDate?.slice(0, 32) ?? null,
    };
  });
}

export async function getGoogleBooksVolumeById(
  googleBooksId: string,
  apiKey: string,
): Promise<Pick<GoogleBookVolumeSummary, "thumbnailUrl" | "publishedDate" | "title" | "authors">> {
  const id = googleBooksId.trim();
  if (!id) {
    return { title: "Untitled", authors: [], thumbnailUrl: null, publishedDate: null };
  }

  const url = new URL(`${VOLUMES_URL}/${encodeURIComponent(id)}`);
  url.searchParams.set("key", apiKey);

  const res = await fetch(url.toString(), { cache: "no-store" });
  if (!res.ok) {
    throw new Error(`Google Books request failed (${res.status} ${res.statusText})`);
  }

  const data = (await res.json()) as {
    volumeInfo?: {
      title?: string;
      authors?: string[];
      imageLinks?: { thumbnail?: string; smallThumbnail?: string };
      publishedDate?: string;
    };
  };

  const vi = data.volumeInfo ?? {};
  const rawThumb = vi.imageLinks?.thumbnail ?? vi.imageLinks?.smallThumbnail ?? null;
  const thumbnailUrl = rawThumb ? toHttps(rawThumb) : null;

  return {
    title: (vi.title ?? "Untitled").slice(0, 500),
    authors: Array.isArray(vi.authors) ? vi.authors.map((a) => a.slice(0, 200)) : [],
    thumbnailUrl,
    publishedDate: vi.publishedDate?.slice(0, 32) ?? null,
  };
}
