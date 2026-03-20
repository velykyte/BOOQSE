import { SESSION_LIMITS } from "@/lib/domain/constants";
import { z } from "zod";

const ymd = /^\d{4}-\d{2}-\d{2}$/;

export const createReadingSessionSchema = z.object({
  userBookId: z.string().min(1),
  sessionDate: z.string().regex(ymd, "Use YYYY-MM-DD"),
  pagesRead: z
    .number()
    .int()
    .min(SESSION_LIMITS.pagesReadMin)
    .max(SESSION_LIMITS.pagesReadMax),
  timeMinutes: z
    .number()
    .int()
    .min(SESSION_LIMITS.timeMinutesMin)
    .max(SESSION_LIMITS.timeMinutesMax),
});

export const editReadingSessionSchema = z.object({
  sessionId: z.string().min(1),
  userBookId: z.string().min(1),
  pagesRead: z
    .number()
    .int()
    .min(SESSION_LIMITS.pagesReadMin)
    .max(SESSION_LIMITS.pagesReadMax),
  timeMinutes: z
    .number()
    .int()
    .min(SESSION_LIMITS.timeMinutesMin)
    .max(SESSION_LIMITS.timeMinutesMax),
});

export const deleteReadingSessionSchema = z.object({
  sessionId: z.string().min(1),
  userBookId: z.string().min(1),
});
