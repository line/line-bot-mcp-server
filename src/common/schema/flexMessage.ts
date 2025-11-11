import { z } from "zod";

const sizeSchema = z
  .enum(["xxs", "xs", "sm", "md", "lg", "xl", "xxl", "3xl", "4xl", "5xl"])
  .default("md");
const imageSizeSchema = z
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
  .default("md");
const spacerSizeSchema = z.enum(["xs", "sm", "md", "lg", "xl", "xxl"]);
const marginSchema = z.enum(["none", "xs", "sm", "md", "lg", "xl", "xxl"]);
const spacingSchema = z.enum(["none", "xs", "sm", "md", "lg", "xl", "xxl"]);
const positionSchema = z.enum(["relative", "absolute"]);
const alignSchema = z.enum(["start", "end", "center"]);
const gravitySchema = z.enum(["top", "bottom", "center"]);
const offsetSchema = z.string().regex(/^\d+px$/, "Format: '10px'");
const colorSchema = z
  .string()
  .regex(/^#[0-9A-Fa-f]{6}$/, "Hex format: '#FF0000'");
const flexWeightSchema = z.number();
const scalingSchema = z.boolean();

const positionFields = {
  position: positionSchema.optional(),
  offsetTop: offsetSchema.optional(),
  offsetBottom: offsetSchema.optional(),
  offsetStart: offsetSchema.optional(),
  offsetEnd: offsetSchema.optional(),
};

const layoutFields = {
  flex: flexWeightSchema.optional(),
  margin: marginSchema.optional(),
  ...positionFields,
};

const alignmentFields = {
  align: alignSchema.optional(),
  gravity: gravitySchema.optional(),
};

const textStyleFields = {
  text: z.string().min(1).max(2000),
  color: colorSchema.optional(),
  size: sizeSchema.optional(),
  weight: z.enum(["regular", "bold"]).optional(),
  style: z.enum(["normal", "italic"]).optional(),
  decoration: z.enum(["none", "underline", "line-through"]).optional(),
};

const paddingFields = {
  paddingAll: z
    .string()
    .regex(/^\d+px$/)
    .optional(),
  paddingTop: z
    .string()
    .regex(/^\d+px$/)
    .optional(),
  paddingBottom: z
    .string()
    .regex(/^\d+px$/)
    .optional(),
  paddingStart: z
    .string()
    .regex(/^\d+px$/)
    .optional(),
  paddingEnd: z
    .string()
    .regex(/^\d+px$/)
    .optional(),
};

const flexActionSchema = z.discriminatedUnion("type", [
  z.object({
    type: z.literal("postback"),
    data: z.string().min(1).max(300),
    label: z.string().min(1).max(20),
    displayText: z.string().min(1).max(300).optional(),
    inputOption: z
      .enum(["closeRichMenu", "openRichMenu", "openKeyboard", "openVoice"])
      .optional(),
    fillInText: z.string().min(1).max(160).optional(),
  }),
  z.object({
    type: z.literal("message"),
    label: z.string().min(1).max(20),
    text: z.string().min(1).max(300),
  }),
  z.object({
    type: z.literal("uri"),
    label: z.string().min(1).max(20),
    uri: z
      .string()
      .describe(
        "LINE Custom URI or URI" +
          "LINE Custom URI document: https://developers.line.biz/ja/docs/messaging-api/using-line-url-scheme/",
      ),
    altUri: z
      .object({
        desktop: z.string().url(),
      })
      .optional(),
  }),
  z.object({
    type: z.literal("datetimepicker"),
    label: z.string().min(1).max(20),
    data: z.string().min(1).max(32),
    mode: z.enum(["date", "time", "datetime"]),
    initial: z.string().optional().describe("Format: 2100-12-31, 23:59, 2100-12-31T23:59"),
    max: z.string().optional().describe("Format: 2100-12-31, 23:59, 2100-12-31T23:59"),
    min: z.string().optional().describe("Format: 2100-12-31, 23:59, 2100-12-31T23:59"),
  }),
  z.object({
    type: z.literal("camera"),
    label: z.string().min(1).max(20),
  }),
  z.object({
    type: z.literal("cameraRoll"),
    label: z.string().min(1).max(20),
  }),
  z.object({
    type: z.literal("location"),
    label: z.string().min(1).max(20),
  }),
  z.object({
    type: z.literal("richmenuswitch"),
    label: z.string().min(1).max(20),
    richMenuAliasId: z.string().min(1).max(300),
    data: z.string().min(1).max(300),
  }),
  z.object({
    type: z.literal("clipboard"),
    label: z.string().min(1).max(20),
    clipboardText: z.string().min(1).max(1000),
  }),
]);

const flexSpanSchema = z.object({
  type: z.literal("span"),
  ...textStyleFields,
});

const flexComponentSchema: z.ZodType<any> = z.lazy(() =>
  z.discriminatedUnion("type", [
    z.object({
      type: z.literal("separator"),
      margin: marginSchema.optional(),
      color: colorSchema.optional(),
    }),
    z.object({
      type: z.literal("text"),
      contents: z.array(flexSpanSchema).optional(),
      adjustMode: z.enum(["shrink-to-fit"]).optional(),
      wrap: z.boolean().optional().default(true),
      lineSpacing: z.enum(["xs", "sm", "md", "lg", "xl", "xxl"]).optional(),
      maxLines: z.number().optional(),
      action: flexActionSchema.optional(),
      scaling: scalingSchema.optional(),
      ...textStyleFields,
      ...layoutFields,
      ...alignmentFields,
    }),

    z.object({
      type: z.literal("icon"),
      url: z
        .string()
        .url()
        .min(1)
        .max(2000)
        .refine(url => url.startsWith("https://"), "Must use HTTPS protocol"),
      size: sizeSchema.optional(),
      aspectRatio: z
        .string()
        .regex(/^\d+:\d+$/)
        .describe(
          "Aspect ratio in '{width}:{height}' format (e.g., '1:1', '16:9'). Width and height must be 1-100000, height cannot exceed width × 3",
        )
        .optional(),
      scaling: scalingSchema.optional(),
      ...layoutFields,
    }),
    z.object({
      type: z.literal("image"),
      url: z
        .string()
        .url()
        .min(1)
        .max(2000)
        .default(
          "https://developers-resource.landpress.line.me/fx/img/01_1_cafe.png",
        ),
      size: imageSizeSchema.optional(),
      aspectRatio: z
        .string()
        .regex(/^\d+:\d+$/)
        .describe(
          "Aspect ratio in '{width}:{height}' format (e.g., '1:1', '16:9'). Width and height must be 1-100000, height cannot exceed width × 3",
        )
        .optional(),
      aspectMode: z.enum(["cover", "fit"]).optional(),
      backgroundColor: colorSchema.optional(),
      animated: z.boolean().optional(),
      action: flexActionSchema.optional(),
      scaling: scalingSchema.optional(),
      ...layoutFields,
      ...alignmentFields,
    }),
    z.object({
      type: z.literal("video"),
      url: z
        .string()
        .url()
        .min(1)
        .max(2000)
        .refine(url => url.startsWith("https://"), "Must use HTTPS protocol"),
      previewUrl: z
        .string()
        .url()
        .min(1)
        .max(2000)
        .default(
          "https://developers-resource.landpress.line.me/fx/img/01_1_cafe.png",
        ),
      altContent: flexComponentSchema,
      size: imageSizeSchema.optional(),
      aspectRatio: z
        .string()
        .regex(/^\d+:\d+$/)
        .describe(
          "Aspect ratio in '{width}:{height}' format (e.g., '1:1', '16:9'). Width and height must be 1-100000, height cannot exceed width × 3",
        )
        .optional(),
      action: flexActionSchema.optional(),
      scaling: scalingSchema.optional(),
      ...layoutFields,
      ...alignmentFields,
    }),

    z.object({
      type: z.literal("button"),
      action: flexActionSchema,
      height: z.enum(["sm", "md"]).optional(),
      style: z.enum(["link", "primary", "secondary"]).optional(),
      color: colorSchema.optional(),
      gravity: gravitySchema.optional(),
      adjustMode: z.enum(["shrink-to-fit"]).optional(),
      scaling: scalingSchema.optional(),
      ...layoutFields,
    }),

    z.object({
      type: z.literal("box"),
      layout: z.enum(["horizontal", "vertical", "baseline"]),
      contents: z.array(flexComponentSchema),
      backgroundColor: colorSchema.optional(),
      borderColor: colorSchema.optional(),
      borderWidth: z
        .string()
        .regex(/^\d+px$/)
        .optional(),
      cornerRadius: z
        .string()
        .regex(/^\d+px$/)
        .optional(),
      spacing: spacingSchema.optional(),
      width: z
        .string()
        .regex(/^\d+px$/)
        .optional(),
      height: z
        .string()
        .regex(/^\d+px$/)
        .optional(),
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
          angle: z.string().regex(/^\d+deg$/, "Format: '90deg'"),
          startColor: colorSchema,
          endColor: colorSchema,
        })
        .optional(),
      action: flexActionSchema.optional(),
      ...layoutFields,
      ...paddingFields,
    }),
  ]),
);

const sectionStyleSchema = z.object({
  backgroundColor: colorSchema.optional(),
  separator: z.boolean().optional(),
  separatorColor: colorSchema.optional(),
});

const flexBubbleStylesSchema = z.object({
  header: sectionStyleSchema.optional(),
  hero: sectionStyleSchema.optional(),
  body: sectionStyleSchema.optional(),
  footer: sectionStyleSchema.optional(),
});

export const flexBubbleSchema = z.object({
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
  altText: z.string().min(1).max(400),
  contents: flexContainerSchema,
});
