import { z } from "zod";

export const textMessageSchema = z.object({
  type: z.literal("text").default("text"),
  text: z
    .string()
    .max(5000)
    .describe("The plain text content to send to the user."),
});
