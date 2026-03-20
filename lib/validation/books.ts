import { z } from "zod";

export const googleBookSelectionSchema = z.object({
  googleBooksId: z.string().min(1).max(64),
  title: z.string().min(1).max(500),
  authors: z.array(z.string().max(200)).max(30),
  thumbnailUrl: z.union([z.string().max(2048), z.null()]).optional(),
  publishedDate: z.union([z.string().max(32), z.null()]).optional(),
});

export const addCurrentBookSchema = googleBookSelectionSchema.extend({
  userDefinedTotalPages: z.number().int().min(1).max(20_000),
});

export const addPastBookSchema = googleBookSelectionSchema.extend({
  rating: z.number().int().min(1).max(10),
});

export const markBookFinishedSchema = z.object({
  userBookId: z.string().min(1),
  rating: z.number().int().min(1).max(10),
  reviewText: z
    .string()
    .trim()
    .max(2000)
    .optional(),
});

export const deleteUserBookSchema = z.object({
  userBookId: z.string().min(1),
});

export const moveUserBookToWantToReadSchema = z.object({
  userBookId: z.string().min(1),
});

export const bookSearchQuerySchema = z.string().trim().min(2).max(120);
