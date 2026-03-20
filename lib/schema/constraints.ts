import { BOOK_STATUSES, RATING_LIMITS, RECOMMENDATION_LIMITS, SESSION_LIMITS } from "@/lib/domain/constants";

export const SchemaConstraints = {
  userBook: {
    statuses: BOOK_STATUSES,
    oneRecordPerUserPerBook: true,
    rating: {
      min: RATING_LIMITS.min,
      max: RATING_LIMITS.max,
      allowedWhenFinishedOrPastBook: true,
    },
  },
  readingSession: {
    pagesRead: {
      min: SESSION_LIMITS.pagesReadMin,
      max: SESSION_LIMITS.pagesReadMax,
    },
    timeMinutes: {
      min: SESSION_LIMITS.timeMinutesMin,
      max: SESSION_LIMITS.timeMinutesMax,
    },
    requiresPagesAndTime: true,
    allowsMultiplePerDay: true,
    allowRetroactiveDaysBack: 1,
  },
  reflection: {
    alwaysPrivate: true,
    maxOnePerSession: true,
    allowedForPastBooks: false,
  },
  review: {
    publicByDefault: true,
    onePerUserPerBook: true,
    editable: true,
  },
  recommendations: {
    minRatedBooksRequired: RECOMMENDATION_LIMITS.minRatedBooksRequired,
    refreshesPerDay: RECOMMENDATION_LIMITS.refreshesPerDay,
    itemsPerResponse: RECOMMENDATION_LIMITS.itemsPerResponse,
  },
  stats: {
    includePastBooks: false,
  },
} as const;
