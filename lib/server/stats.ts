import "server-only";
import { listLibraryBooksForUser } from "@/lib/server/library-books";
import { listReadingSessionsForUserBook } from "@/lib/server/reading-sessions-read";

type DailyTotals = {
  pages: number;
  minutes: number;
};

export type StatsDailyPoint = {
  ymd: string;
  label: string;
  value: number;
};

export type StatsPageView = {
  streakDays: number;
  pagesPerDay: StatsDailyPoint[];
  timePerDay: StatsDailyPoint[];
  avgSpeedPerDay: StatsDailyPoint[];
};

// Kept for backwards compatibility with any older session payloads.
// Prefer reading `sessionDateYmd` from `listReadingSessionsForUserBook()` going forward.
function toYmdUtc(value: unknown): string | null {
  const d =
    value instanceof Date
      ? value
      : value
        ? new Date(String(value))
        : null;
  if (!d || Number.isNaN(d.getTime())) return null;
  return d.toISOString().slice(0, 10);
}

function formatDayLabel(ymd: string): string {
  // Deterministic formatting for SSR/CSR: fixed locale + UTC timezone.
  try {
    const d = new Date(`${ymd}T12:00:00.000Z`);
    return new Intl.DateTimeFormat("en-GB", {
      timeZone: "UTC",
      month: "short",
      day: "numeric",
    }).format(d);
  } catch {
    return ymd;
  }
}

function ymdToDate(ymd: string): Date | null {
  try {
    const d = new Date(`${ymd}T00:00:00.000Z`);
    return Number.isNaN(d.getTime()) ? null : d;
  } catch {
    return null;
  }
}

export async function getStatsPageView(userId: string): Promise<StatsPageView> {
  // Stats are derived from reading_sessions linked to the user's reading books.
  // Important: sessions can be logged while a book is `currently_reading`, then later
  // moved to `finished`. We still want those historical sessions for stats, as long as
  // the book is not a true "past" book created via the past-book flow.
  const libraryBooks = await listLibraryBooksForUser(userId);

  const statsBooks = libraryBooks.filter(
    (b) => b.status === "currently_reading" || (b.status === "finished" && !b.isPastBook),
  );

  const daily: Record<string, DailyTotals> = {};

  for (const b of statsBooks) {
    const sessions = await listReadingSessionsForUserBook(userId, b.userBookId);
    for (const s of sessions) {
      const ymd = s.sessionDateYmd;
      if (!/^\d{4}-\d{2}-\d{2}$/.test(ymd)) continue;

      const pagesRead = s.pagesRead;
      const timeMinutes = s.timeMinutes;
      if (!Number.isFinite(pagesRead) || !Number.isFinite(timeMinutes)) continue;
      if (pagesRead < 0 || timeMinutes < 0) continue;

      const existing = daily[ymd] ?? { pages: 0, minutes: 0 };
      existing.pages += pagesRead;
      existing.minutes += timeMinutes;
      daily[ymd] = existing;
    }
  }

  const allYmds = Object.keys(daily).sort();
  if (allYmds.length === 0) {
    return { streakDays: 0, pagesPerDay: [], timePerDay: [], avgSpeedPerDay: [] };
  }

  // Current streak: consecutive reading days ending at the most recent reading day.
  const readingDaySet = new Set(allYmds);
  let streakDays = 1;
  let cursor = ymdToDate(allYmds[allYmds.length - 1]);
  while (cursor) {
    cursor = new Date(cursor.getTime() - 24 * 60 * 60 * 1000);
    const prevYmd = cursor.toISOString().slice(0, 10);
    if (!readingDaySet.has(prevYmd)) break;
    streakDays += 1;
  }

  // For charts, show the last 14 points to keep the UI minimal.
  const ymdsForChart = allYmds.slice(Math.max(0, allYmds.length - 14));

  const pagesPerDay: StatsDailyPoint[] = ymdsForChart.map((ymd) => ({
    ymd,
    label: formatDayLabel(ymd),
    value: daily[ymd]!.pages,
  }));

  const timePerDay: StatsDailyPoint[] = ymdsForChart.map((ymd) => ({
    ymd,
    label: formatDayLabel(ymd),
    value: daily[ymd]!.minutes,
  }));

  const avgSpeedPerDay: StatsDailyPoint[] = ymdsForChart.map((ymd) => {
    const totals = daily[ymd]!;
    const hours = totals.minutes / 60;
    const speed = hours > 0 ? totals.pages / hours : 0;
    return {
      ymd,
      label: formatDayLabel(ymd),
      value: Math.round(speed * 10) / 10, // 1 decimal, stable display
    };
  });

  return { streakDays, pagesPerDay, timePerDay, avgSpeedPerDay };
}

