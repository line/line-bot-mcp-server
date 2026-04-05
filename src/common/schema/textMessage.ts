import { z } from "zod";
import { documented } from "../../tooling/schemaDocs.js";

export const textMessageSchema = z.object({
  type: z.literal("text").default("text"),
  text: documented(z.string().max(5000), {
    description: {
      en: "The plain text content to send to the user.",
      ja: "ユーザーに送信するテキスト。",
    },
    typeLabel: "string",
  }),
});
