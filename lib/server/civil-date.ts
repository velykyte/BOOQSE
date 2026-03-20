import "server-only";

/**
 * Calendar date (YYYY-MM-DD) for `instant` interpreted in `timeZone` (IANA), e.g. "America/New_York".
 */
export function calendarDateInTimeZone(timeZone: string, instant: Date = new Date()): string {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(instant);
}

/**
 * Previous Gregorian calendar day for a YYYY-MM-DD string (no timezone shift; pure civil date).
 */
export function civilDateMinusOneDay(ymd: string): string {
  const parts = ymd.split("-").map((x) => Number.parseInt(x, 10));
  if (parts.length !== 3 || parts.some((n) => Number.isNaN(n))) {
    throw new Error("Invalid date");
  }
  const [y, m, d] = parts;
  const dt = new Date(Date.UTC(y, m - 1, d));
  dt.setUTCDate(dt.getUTCDate() - 1);
  return dt.toISOString().slice(0, 10);
}

export function allowedSessionCalendarDates(timeZone: string, reference: Date = new Date()): {
  today: string;
  yesterday: string;
} {
  const today = calendarDateInTimeZone(timeZone, reference);
  const yesterday = civilDateMinusOneDay(today);
  return { today, yesterday };
}

export function isAllowedSessionDate(
  timeZone: string,
  sessionDateYmd: string,
  reference: Date = new Date(),
): boolean {
  const { today, yesterday } = allowedSessionCalendarDates(timeZone, reference);
  return sessionDateYmd === today || sessionDateYmd === yesterday;
}
