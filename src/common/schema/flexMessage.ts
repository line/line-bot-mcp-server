import { z } from "zod";

export const flexMessageSchema = z.object({
  type: z.literal("flex").default("flex"),
  altText: z
    .string()
    .describe("Alternative text shown when flex message cannot be displayed."),
  contents: z
    .object({
      type: z
        .enum(["bubble", "carousel"])
        .describe(
          "Type of the container. 'bubble' for single container, 'carousel' for multiple swipeable bubbles.",
        ),
    })
    .passthrough()
    .describe(
      "Flexible container structure following LINE Flex Message format. For 'bubble' type, can include header, " +
        "hero, body, footer, and styles sections. For 'carousel' type, includes an array of bubble containers in " +
        "the 'contents' property.",
    ),
});
