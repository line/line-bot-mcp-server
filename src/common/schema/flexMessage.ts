import { z } from "zod";

const flexActionSchema = z.discriminatedUnion("type", [
  z.object({
    type: z.literal("postback"),
    data: z.string(),
    label: z.string(),
    displayText: z.string().optional(),
    inputOption: z
      .enum(["closeRichMenu", "openRichMenu", "openKeyboard", "openVoice"])
      .optional(),
    fillInText: z.string().optional(),
  }),
  z.object({
    type: z.literal("message"),
    label: z.string(),
    text: z.string(),
  }),
  z.object({
    type: z.literal("uri"),
    label: z.string(),
    uri: z.string(),
    altUri: z
      .object({
        desktop: z.string(),
      })
      .optional(),
  }),
  z.object({
    type: z.literal("datetimepicker"),
    label: z.string(),
    data: z.string(),
    mode: z.enum(["date", "time", "datetime"]),
    initial: z.string().optional(),
    max: z.string().optional(),
    min: z.string().optional(),
  }),
  z.object({
    type: z.literal("camera"),
    label: z.string(),
  }),
  z.object({
    type: z.literal("cameraRoll"),
    label: z.string(),
  }),
  z.object({
    type: z.literal("location"),
    label: z.string(),
  }),
  z.object({
    type: z.literal("richmenuswitch"),
    label: z.string(),
    richMenuAliasId: z.string(),
    data: z.string(),
  }),
  z.object({
    type: z.literal("clipboard"),
    label: z.string(),
    clipboardText: z.string(),
  }),
]);

const flexSpanSchema = z.object({
  type: z.literal("span"),
  text: z.string(),
  color: z.string().optional(),
  size: z
    .enum(["xxs", "xs", "sm", "md", "lg", "xl", "xxl", "3xl", "4xl", "5xl"])
    .optional(),
  weight: z.enum(["regular", "bold"]).optional(),
  style: z.enum(["normal", "italic"]).optional(),
  decoration: z.enum(["none", "underline", "line-through"]).optional(),
});

const flexComponentSchema: z.ZodType<any> = z.lazy(() =>
  z.discriminatedUnion("type", [
    z.object({
      type: z.literal("box"),
      layout: z.enum(["horizontal", "vertical", "baseline"]),
      contents: z.array(flexComponentSchema),
      backgroundColor: z.string().optional(),
      borderColor: z.string().optional(),
      borderWidth: z.string().optional(),
      cornerRadius: z.string().optional(),
      margin: z.enum(["none", "xs", "sm", "md", "lg", "xl", "xxl"]).optional(),
      paddingAll: z.string().optional(),
      paddingTop: z.string().optional(),
      paddingBottom: z.string().optional(),
      paddingStart: z.string().optional(),
      paddingEnd: z.string().optional(),
      spacing: z.enum(["none", "xs", "sm", "md", "lg", "xl", "xxl"]).optional(),
      width: z.string().optional(),
      height: z.string().optional(),
      flex: z.number().optional(),
      justifyContent: z
        .enum([
          "flex-start",
          "center",
          "flex-end",
          "space-between",
          "space-around",
          "space-evenly",
        ])
        .optional(),
      alignItems: z.enum(["flex-start", "center", "flex-end"]).optional(),
      background: z
        .object({
          type: z.literal("linearGradient"),
          angle: z.string(),
          startColor: z.string(),
          endColor: z.string(),
        })
        .optional(),
      action: flexActionSchema.optional(),
      offsetTop: z.string().optional(),
      offsetBottom: z.string().optional(),
      offsetStart: z.string().optional(),
      offsetEnd: z.string().optional(),
      position: z.enum(["relative", "absolute"]).optional(),
    }),
    z.object({
      type: z.literal("button"),
      action: flexActionSchema,
      flex: z.number().optional(),
      margin: z.enum(["none", "xs", "sm", "md", "lg", "xl", "xxl"]).optional(),
      position: z.enum(["relative", "absolute"]).optional(),
      offsetTop: z.string().optional(),
      offsetBottom: z.string().optional(),
      offsetStart: z.string().optional(),
      offsetEnd: z.string().optional(),
      height: z.enum(["sm", "md"]).optional(),
      style: z.enum(["link", "primary", "secondary"]).optional(),
      color: z.string().optional(),
      gravity: z.enum(["top", "bottom", "center"]).optional(),
      adjustMode: z.enum(["shrink-to-fit"]).optional(),
      scaling: z.boolean().optional(),
    }),
    z.object({
      type: z.literal("filler"),
      flex: z.number().optional(),
    }),
    z.object({
      type: z.literal("icon"),
      url: z.string(),
      margin: z.enum(["none", "xs", "sm", "md", "lg", "xl", "xxl"]).optional(),
      position: z.enum(["relative", "absolute"]).optional(),
      offsetTop: z.string().optional(),
      offsetBottom: z.string().optional(),
      offsetStart: z.string().optional(),
      offsetEnd: z.string().optional(),
      size: z
        .enum(["xxs", "xs", "sm", "md", "lg", "xl", "xxl", "3xl", "4xl", "5xl"])
        .optional(),
      aspectRatio: z.string().optional(),
      scaling: z.boolean().optional(),
    }),
    z.object({
      type: z.literal("image"),
      url: z.string(),
      flex: z.number().optional(),
      margin: z.enum(["none", "xs", "sm", "md", "lg", "xl", "xxl"]).optional(),
      position: z.enum(["relative", "absolute"]).optional(),
      offsetTop: z.string().optional(),
      offsetBottom: z.string().optional(),
      offsetStart: z.string().optional(),
      offsetEnd: z.string().optional(),
      align: z.enum(["start", "end", "center"]).optional(),
      gravity: z.enum(["top", "bottom", "center"]).optional(),
      size: z
        .enum([
          "xxs",
          "xs",
          "sm",
          "md",
          "lg",
          "xl",
          "xxl",
          "3xl",
          "4xl",
          "5xl",
          "full",
        ])
        .optional(),
      aspectRatio: z.string().optional(),
      aspectMode: z.enum(["cover", "fit"]).optional(),
      backgroundColor: z.string().optional(),
      action: flexActionSchema.optional(),
      animated: z.boolean().optional(),
      scaling: z.boolean().optional(),
    }),
    z.object({
      type: z.literal("separator"),
      margin: z.enum(["none", "xs", "sm", "md", "lg", "xl", "xxl"]).optional(),
      color: z.string().optional(),
    }),
    z.object({
      type: z.literal("spacer"),
      size: z.enum(["xs", "sm", "md", "lg", "xl", "xxl"]).optional(),
    }),
    z.object({
      type: z.literal("text"),
      text: z.string(),
      contents: z.array(flexSpanSchema).optional(),
      adjustMode: z.enum(["shrink-to-fit"]).optional(),
      flex: z.number().optional(),
      margin: z.enum(["none", "xs", "sm", "md", "lg", "xl", "xxl"]).optional(),
      position: z.enum(["relative", "absolute"]).optional(),
      offsetTop: z.string().optional(),
      offsetBottom: z.string().optional(),
      offsetStart: z.string().optional(),
      offsetEnd: z.string().optional(),
      size: z
        .enum(["xxs", "xs", "sm", "md", "lg", "xl", "xxl", "3xl", "4xl", "5xl"])
        .optional(),
      align: z.enum(["start", "end", "center"]).optional(),
      gravity: z.enum(["top", "bottom", "center"]).optional(),
      wrap: z.boolean().optional(),
      lineSpacing: z.enum(["xs", "sm", "md", "lg", "xl", "xxl"]).optional(),
      weight: z.enum(["regular", "bold"]).optional(),
      color: z.string().optional(),
      action: flexActionSchema.optional(),
      style: z.enum(["normal", "italic"]).optional(),
      decoration: z.enum(["none", "underline", "line-through"]).optional(),
      maxLines: z.number().optional(),
      scaling: z.boolean().optional(),
    }),
    z.object({
      type: z.literal("video"),
      url: z.string(),
      previewUrl: z.string(),
      altContent: flexComponentSchema,
      flex: z.number().optional(),
      margin: z.enum(["none", "xs", "sm", "md", "lg", "xl", "xxl"]).optional(),
      position: z.enum(["relative", "absolute"]).optional(),
      offsetTop: z.string().optional(),
      offsetBottom: z.string().optional(),
      offsetStart: z.string().optional(),
      offsetEnd: z.string().optional(),
      align: z.enum(["start", "end", "center"]).optional(),
      gravity: z.enum(["top", "bottom", "center"]).optional(),
      size: z
        .enum([
          "xxs",
          "xs",
          "sm",
          "md",
          "lg",
          "xl",
          "xxl",
          "3xl",
          "4xl",
          "5xl",
          "full",
        ])
        .optional(),
      aspectRatio: z.string().optional(),
      action: flexActionSchema.optional(),
      scaling: z.boolean().optional(),
    }),
  ]),
);

const flexBubbleStylesSchema = z.object({
  header: z
    .object({
      backgroundColor: z.string().optional(),
      separator: z.boolean().optional(),
      separatorColor: z.string().optional(),
    })
    .optional(),
  hero: z
    .object({
      backgroundColor: z.string().optional(),
      separator: z.boolean().optional(),
      separatorColor: z.string().optional(),
    })
    .optional(),
  body: z
    .object({
      backgroundColor: z.string().optional(),
      separator: z.boolean().optional(),
      separatorColor: z.string().optional(),
    })
    .optional(),
  footer: z
    .object({
      backgroundColor: z.string().optional(),
      separator: z.boolean().optional(),
      separatorColor: z.string().optional(),
    })
    .optional(),
});

const flexBubbleSchema = z.object({
  type: z.literal("bubble"),
  size: z
    .enum(["nano", "micro", "deca", "hecto", "kilo", "mega", "giga"])
    .optional(),
  direction: z.enum(["ltr", "rtl"]).optional(),
  header: flexComponentSchema.optional(),
  hero: flexComponentSchema.optional(),
  body: flexComponentSchema.optional(),
  footer: flexComponentSchema.optional(),
  styles: flexBubbleStylesSchema.optional(),
  action: flexActionSchema.optional(),
});

const flexCarouselSchema = z.object({
  type: z.literal("carousel"),
  contents: z.array(flexBubbleSchema),
});

const flexContainerSchema = z.discriminatedUnion("type", [
  flexBubbleSchema,
  flexCarouselSchema,
]);

export const flexMessageSchema = z.object({
  type: z.literal("flex").default("flex"),
  altText: z
    .string()
    .describe("Alternative text shown when flex message cannot be displayed."),
  contents: flexContainerSchema.describe(
    "Flexible container structure following LINE Flex Message format. For 'bubble' type, can include header, " +
      "hero, body, footer, and styles sections. For 'carousel' type, includes an array of bubble containers in " +
      "the 'contents' property.",
  ),
});
