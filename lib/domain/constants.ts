export const SESSION_LIMITS = {
  pagesReadMin: 1,
  pagesReadMax: 1000,
  timeMinutesMin: 1,
  timeMinutesMax: 720,
} as const;

export const RATING_LIMITS = {
  min: 1,
  max: 10,
} as const;

export const RECOMMENDATION_LIMITS = {
  minRatedBooksRequired: 3,
  refreshesPerDay: 3,
  itemsPerResponse: 3,
} as const;

export const BOOK_STATUSES = ["want_to_read", "currently_reading", "finished"] as const;

export type BookStatus = (typeof BOOK_STATUSES)[number];
