import { z } from "zod";

export const createNoteSchema = z.object({
  content: z.string().max(10000).optional(),
  expirationHours: z.number().min(1).max(168),
  burnAfterRead: z.boolean(),
});