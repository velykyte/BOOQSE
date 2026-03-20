import { z } from "zod";

const optionalAnswer = z
  .string()
  .trim()
  .max(4000)
  .optional()
  .transform((v) => {
    if (!v) return null;
    const t = v.trim();
    return t.length ? t : null;
  });

export const saveReflectionSchema = z.object({
  sessionId: z.string().min(1),
  userBookId: z.string().min(1),
  question1: optionalAnswer,
  question2: optionalAnswer,
  question3: optionalAnswer,
  question4: optionalAnswer,
  question5: optionalAnswer,
});

export const deleteReflectionSchema = z.object({
  reflectionId: z.string().min(1),
  userBookId: z.string().min(1),
});

