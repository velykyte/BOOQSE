import { z } from "zod";

export const saveReviewSchema = z.object({
  userBookId: z.string().min(1),
  reviewText: z.string().trim().min(1).max(2000),
});

export const deleteReviewSchema = z.object({
  userBookId: z.string().min(1),
});

