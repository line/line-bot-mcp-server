import { z } from "zod";

const sizeSchema = z.enum(["xxs", "xs", "sm", "md", "lg", "xl", "xxl", "3xl", "4xl", "5xl"]);
const imageSizeSchema = z.enum(["xxs", "xs", "sm", "md", "lg", "xl", "xxl", "3xl", "4xl", "5xl", "full"]);
const spacerSizeSchema = z.enum(["xs", "sm", "md", "lg", "xl", "xxl"]);
const marginSchema = z.enum(["none", "xs", "sm", "md", "lg", "xl", "xxl"]);
const spacingSchema = z.enum(["none", "xs", "sm", "md", "lg", "xl", "xxl"]);
const positionSchema = z.enum(["relative", "absolute"]);
const alignSchema = z.enum(["start", "end", "center"]);
const gravitySchema = z.enum(["top", "bottom", "center"]);
const offsetSchema = z.string().regex(/^\d+px$/, "Format: '10px', '5%', '1em'");
const colorSchema = z.string().regex(/^#[0-9A-Fa-f]{6}$/, "Hex format: '#FF0000'");
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
  text: z.string(),
  color: colorSchema.optional(),
  size: sizeSchema.optional(),
  weight: z.enum(["regular", "bold"]).optional(),
  style: z.enum(["normal", "italic"]).optional(),
  decoration: z.enum(["none", "underline", "line-through"]).optional(),
};

const paddingFields = {
  paddingAll: z.string().regex(/^\d+px$/).optional(),
  paddingTop: z.string().regex(/^\d+px$/).optional(),
  paddingBottom: z.string().regex(/^\d+px$/).optional(),
  paddingStart: z.string().regex(/^\d+px$/).optional(),
  paddingEnd: z.string().regex(/^\d+px$/).optional(),
};

const flexActionSchema = z.discriminatedUnion("type", [
  z.object({
    type: z.literal("postback"),
    data: z.string(),
    label: z.string(),
    displayText: z.string().optional(),
    inputOption: z.enum(["closeRichMenu", "openRichMenu", "openKeyboard", "openVoice"]).optional(),
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
    uri: z.string().url(),
    altUri: z.object({
      desktop: z.string().url(),
    }).optional(),
  }),
  z.object({
    type: z.literal("datetimepicker"),
    label: z.string(),
    data: z.string(),
    mode: z.enum(["date", "time", "datetime"]),
    initial: z.string().datetime().optional(),
    max: z.string().datetime().optional(),
    min: z.string().datetime().optional(),
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
  ...textStyleFields,
});

const flexComponentSchema: z.ZodType<any> = z.lazy(() =>
  z.discriminatedUnion("type", [
    z.object({
      type: z.literal("filler"),
      flex: flexWeightSchema.optional(),
    }),
    z.object({
      type: z.literal("spacer"),
      size: spacerSizeSchema.optional(),
    }),
    z.object({
      type: z.literal("separator"),
      margin: marginSchema.optional(),
      color: colorSchema.optional(),
    }),
    z.object({
      type: z.literal("text"),
      contents: z.array(flexSpanSchema).optional(),
      adjustMode: z.enum(["shrink-to-fit"]).optional(),
      wrap: z.boolean().optional(),
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
      url: z.string().url(),
      size: sizeSchema.optional(),
      aspectRatio: z.string().regex(/^\d+:\d+$/, "Format: '1:1', '16:9'").optional(),
      scaling: scalingSchema.optional(),
      ...layoutFields,
    }),
    z.object({
      type: z.literal("image"),
      url: z.string().url(),
      size: imageSizeSchema.optional(),
      aspectRatio: z.string().regex(/^\d+:\d+$/, "Format: '1:1', '16:9'").optional(),
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
      url: z.string().url(),
      previewUrl: z.string().url(),
      altContent: flexComponentSchema,
      size: imageSizeSchema.optional(),
      aspectRatio: z.string().regex(/^\d+:\d+$/, "Format: '1:1', '16:9'").optional(),
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
      borderWidth: z.string().regex(/^\d+px$/).optional(),
      cornerRadius: z.string().regex(/^\d+px$/).optional(),
      spacing: spacingSchema.optional(),
      width: z.string().regex(/^\d+px$/).optional(),
      height: z.string().regex(/^\d+px$/).optional(),
      justifyContent: z.enum(["flex-start", "center", "flex-end", "space-between", "space-around", "space-evenly"]).optional(),
      alignItems: z.enum(["flex-start", "center", "flex-end"]).optional(),
      background: z.object({
        type: z.literal("linearGradient"),
        angle: z.string().regex(/^\d+(deg|rad|turn)$/, "Format: '90deg'"),
        startColor: colorSchema,
        endColor: colorSchema,
      }).optional(),
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

const flexBubbleSchema = z.object({
  type: z.literal("bubble"),
  size: z.enum(["nano", "micro", "deca", "hecto", "kilo", "mega", "giga"]).optional(),
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
  altText: z.string(),
  contents: flexContainerSchema,
});
