import { z } from "zod";

// Common enums and utility types (based on LINE API specification)
const flexSizeEnum = z
  .enum(["xxs", "xs", "sm", "md", "lg", "xl", "xxl"])
  .describe("Text size for flex components");
const flexWeightEnum = z.enum(["regular", "bold"]).describe("Font weight");
const flexAlignEnum = z
  .enum(["start", "end", "center"])
  .describe("Text alignment");
const flexGravityEnum = z
  .enum(["top", "bottom", "center"])
  .describe("Vertical alignment (gravity)");
const flexMarginEnum = z
  .enum(["none", "xs", "sm", "md", "lg", "xl", "xxl"])
  .describe("Margin size");
const flexSpacingEnum = z
  .enum(["none", "xs", "sm", "md", "lg", "xl", "xxl"])
  .describe("Spacing between components");
const flexLayoutEnum = z
  .enum(["horizontal", "vertical", "baseline"])
  .describe("Box layout direction. REQUIRED for all box components");
const flexButtonStyleEnum = z
  .enum(["primary", "secondary", "link"])
  .describe("Button style");
const flexButtonHeightEnum = z.enum(["sm", "md"]).describe("Button height");
const flexImageAspectModeEnum = z.enum(["fit", "cover"]);
const flexDecorationEnum = z.enum(["none", "underline", "line-through"]);
const flexStyleEnum = z.enum(["normal", "italic"]);
const flexPositionEnum = z.enum(["relative", "absolute"]);
const flexJustifyContentEnum = z.enum([
  "center",
  "flex-start",
  "flex-end",
  "space-between",
  "space-around",
  "space-evenly",
]);
const flexAlignItemsEnum = z.enum(["center", "flex-start", "flex-end"]);

// Action type definitions (discriminated union) - compliant with LINE API specification
const postbackActionSchema = z.object({
  type: z.literal("postback").default("postback"),
  label: z.string().default("Button").describe("Button label text"),
  data: z
    .string()
    .min(0)
    .max(300)
    .default("")
    .describe("Data to send in postback event (max 300 characters)"), // maxLength: 300, minLength: 0
  displayText: z.string().optional(),
  text: z.string().optional(), // Property mentioned in API specification
  inputOption: z
    .enum(["closeRichMenu", "openRichMenu", "openKeyboard", "openVoice"])
    .optional(),
  fillInText: z.string().optional(),
});

const messageActionSchema = z.object({
  type: z.literal("message").default("message"),
  label: z.string().default("Send").describe("Button label text"),
  text: z.string().default("Hello").describe("Message text to send"), // Required, no maxLength limit
});

const uriActionSchema = z.object({
  type: z.literal("uri").default("uri"),
  label: z.string().default("Open Link").describe("Button label text"),
  uri: z
    .string()
    .url()
    .default("https://example.com")
    .describe("URL to open (max 2000 characters)"),
  altUri: z
    .object({
      desktop: z.string().min(0).max(1000).optional(), // maxLength: 1000, minLength: 0
    })
    .optional(),
});

const datetimePickerActionSchema = z.object({
  type: z.literal("datetimepicker"),
  label: z.string(),
  data: z.string().min(0).max(300), // maxLength: 300, minLength: 0
  mode: z.enum(["date", "time", "datetime"]),
  initial: z.string().optional(),
  max: z.string().optional(),
  min: z.string().optional(),
});

const cameraActionSchema = z.object({
  type: z.literal("camera"),
  label: z.string(),
});

const cameraRollActionSchema = z.object({
  type: z.literal("cameraRoll"),
  label: z.string(),
});

const locationActionSchema = z.object({
  type: z.literal("location"),
  label: z.string(),
});

const richMenuSwitchActionSchema = z.object({
  type: z.literal("richmenuswitch"),
  label: z.string(),
  richMenuAliasId: z.string().min(0).max(32), // maxLength: 32, minLength: 0
  data: z.string().min(0).max(300), // maxLength: 300, minLength: 0
});

const clipboardActionSchema = z.object({
  type: z.literal("clipboard"),
  label: z.string(),
  clipboardText: z.string().min(1).max(1000), // maxLength: 1000, minLength: 1
});

// Unified action schema
export const flexActionSchema = z.discriminatedUnion("type", [
  postbackActionSchema,
  messageActionSchema,
  uriActionSchema,
  datetimePickerActionSchema,
  cameraActionSchema,
  cameraRollActionSchema,
  locationActionSchema,
  richMenuSwitchActionSchema,
  clipboardActionSchema,
]);

// Basic style properties
const flexStylePropsSchema = z.object({
  backgroundColor: z.string().optional(),
  separator: z.boolean().optional(),
  separatorColor: z.string().optional(),
});

// Text component - compliant with LINE API specification
// Note: Either 'text' or 'contents' property is required, but both are optional in schema due to mutual exclusivity
const flexTextComponentSchema = z.object({
  type: z.literal("text").default("text"),
  text: z.string().default("Text").optional(), // Either text or contents property is required
  flex: z.number().int().min(0).optional(), // format: int32
  size: flexSizeEnum.optional(),
  align: flexAlignEnum.optional(),
  gravity: flexGravityEnum.optional(),
  color: z.string().optional(), // Color code in #RRGGBB format
  weight: flexWeightEnum.optional(),
  style: flexStyleEnum.optional(),
  decoration: flexDecorationEnum.optional(),
  wrap: z.boolean().optional().default(true),
  lineSpacing: flexMarginEnum.optional(),
  margin: flexMarginEnum.optional(),
  position: flexPositionEnum.optional(),
  offsetTop: z.string().optional(),
  offsetBottom: z.string().optional(),
  offsetStart: z.string().optional(),
  offsetEnd: z.string().optional(),
  action: flexActionSchema.optional(),
  maxLines: z.number().int().optional(), // format: int32, no limit
  contents: z
    .array(
      z.object({
        type: z.literal("span"),
        text: z.string(), // Required for span components
        size: flexSizeEnum.optional(),
        color: z.string().optional(), // Color code in #RRGGBB format
        weight: flexWeightEnum.optional(),
        style: flexStyleEnum.optional(),
        decoration: flexDecorationEnum.optional(),
      }),
    )
    .optional(), // Array of FlexSpan components
  adjustMode: z.enum(["shrink-to-fit"]).optional(),
  scaling: z.boolean().optional(),
});

// Image component - compliant with LINE API specification
const flexImageComponentSchema = z.object({
  type: z.literal("image").default("image"),
  url: z
    .string()
    .url()
    .max(2000)
    .default("https://via.placeholder.com/300x200")
    .describe("Image URL (max 2000 characters)"), // Required - Maximum 2000 characters
  flex: z.number().int().min(0).optional(), // format: int32
  margin: flexMarginEnum.optional(),
  position: flexPositionEnum.optional(),
  offsetTop: z.string().optional(),
  offsetBottom: z.string().optional(),
  offsetStart: z.string().optional(),
  offsetEnd: z.string().optional(),
  align: flexAlignEnum.optional(),
  gravity: flexGravityEnum.optional(),
  size: z.string().default("md").optional(), // Default is md
  aspectRatio: z.string().optional(), // {width}:{height} format, range 1-100000
  aspectMode: flexImageAspectModeEnum.optional(),
  backgroundColor: z.string().optional(),
  action: flexActionSchema.optional(),
  animated: z.boolean().default(false).optional(), // Default is false
  scaling: z.boolean().optional(),
});

// Button component - compliant with LINE API specification
const flexButtonComponentSchema = z.object({
  type: z.literal("button").default("button"),
  action: flexActionSchema.describe("Action to perform when button is tapped"), // Required
  flex: z.number().int().min(0).optional(), // format: int32
  color: z.string().optional(),
  style: flexButtonStyleEnum.optional(),
  gravity: flexGravityEnum.optional(),
  margin: flexMarginEnum.optional(),
  position: flexPositionEnum.optional(),
  offsetTop: z.string().optional(),
  offsetBottom: z.string().optional(),
  offsetStart: z.string().optional(),
  offsetEnd: z.string().optional(),
  height: flexButtonHeightEnum.optional(), // sm, md
  adjustMode: z.enum(["shrink-to-fit"]).optional(),
  scaling: z.boolean().optional(),
});

// Separator component - compliant with LINE API specification
const flexSeparatorComponentSchema = z.object({
  type: z.literal("separator"),
  margin: flexMarginEnum.optional(),
  color: z.string().optional(),
});

// Spacer component - compliant with LINE API specification
const flexSpacerComponentSchema = z.object({
  type: z.literal("spacer"),
  size: z.string().optional(), // keyword or pixel value
});

// Filler component - compliant with LINE API specification
const flexFillerComponentSchema = z.object({
  type: z.literal("filler"),
  flex: z.number().int().min(0).optional(), // format: int32
});

// Icon component - compliant with LINE API specification
const flexIconComponentSchema = z.object({
  type: z.literal("icon"),
  url: z.string().url().max(2000), // Required - Maximum 2000 characters
  size: z.string().optional(),
  aspectRatio: z.string().optional(),
  margin: flexMarginEnum.optional(),
  position: flexPositionEnum.optional(),
  offsetTop: z.string().optional(),
  offsetBottom: z.string().optional(),
  offsetStart: z.string().optional(),
  offsetEnd: z.string().optional(),
  scaling: z.boolean().optional(),
});

// Span component - compliant with LINE API specification
const flexSpanComponentSchema = z.object({
  type: z.literal("span"),
  text: z.string(), // Required
  size: flexSizeEnum.optional(),
  color: z.string().optional(),
  weight: flexWeightEnum.optional(),
  style: flexStyleEnum.optional(),
  decoration: flexDecorationEnum.optional(),
});

// Box component (recursive definition)
export const flexComponentSchema: z.ZodType<any> = z.lazy(() =>
  z.discriminatedUnion("type", [
    flexTextComponentSchema,
    flexImageComponentSchema,
    flexButtonComponentSchema,
    flexSeparatorComponentSchema,
    flexSpacerComponentSchema,
    flexFillerComponentSchema,
    flexIconComponentSchema,
    flexSpanComponentSchema,
    z.object({
      type: z.literal("box").default("box"),
      layout: flexLayoutEnum
        .default("vertical")
        .describe("Box layout direction"), // Required - horizontal, vertical, or baseline
      contents: z
        .array(flexComponentSchema)
        .max(13)
        .default([])
        .describe("Array of child components (max 13)"), // Required, maximum 13 components per box (based on button limit)
      flex: z.number().int().min(0).optional(), // format: int32
      spacing: flexSpacingEnum.optional(),
      margin: flexMarginEnum.optional(),
      position: flexPositionEnum.optional(),
      offsetTop: z.string().optional(),
      offsetBottom: z.string().optional(),
      offsetStart: z.string().optional(),
      offsetEnd: z.string().optional(),
      backgroundColor: z.string().optional(),
      borderColor: z.string().optional(),
      borderWidth: z.string().optional(),
      cornerRadius: z.string().optional(),
      width: z.string().optional(),
      maxWidth: z.string().optional(),
      height: z.string().optional(),
      maxHeight: z.string().optional(),
      paddingAll: z.string().optional(),
      paddingTop: z.string().optional(),
      paddingBottom: z.string().optional(),
      paddingStart: z.string().optional(),
      paddingEnd: z.string().optional(),
      action: flexActionSchema.optional(),
      justifyContent: flexJustifyContentEnum.optional(),
      alignItems: flexAlignItemsEnum.optional(),
      background: z
        .object({
          type: z.string(),
          angle: z.string().optional(),
          startColor: z.string().optional(),
          endColor: z.string().optional(),
          centerColor: z.string().optional(),
          centerPosition: z.string().optional(),
        })
        .optional(), // FlexBoxLinearGradient
    }),
  ]),
);

// Style object
const flexBubbleStyleSchema = z.object({
  header: flexStylePropsSchema.optional(),
  hero: flexStylePropsSchema.optional(),
  body: flexStylePropsSchema.optional(),
  footer: flexStylePropsSchema.optional(),
});

// Bubble container - compliant with LINE API specification
const flexBubbleSchema = z.object({
  type: z.literal("bubble").default("bubble"),
  size: z
    .enum(["nano", "micro", "deca", "hecto", "kilo", "mega", "giga"])
    .optional(),
  direction: z.enum(["ltr", "rtl"]).optional(),
  styles: flexBubbleStyleSchema.optional(),
  header: flexComponentSchema.optional(), // FlexBox
  hero: flexComponentSchema.optional(), // FlexComponent
  body: flexComponentSchema.optional(), // FlexBox
  footer: flexComponentSchema.optional(), // FlexBox
  action: flexActionSchema.optional(),
});

// Carousel container - compliant with LINE API specification
const flexCarouselSchema = z.object({
  type: z.literal("carousel").default("carousel"),
  contents: z
    .array(flexBubbleSchema)
    .min(1)
    .max(12)
    .default([])
    .describe("Array of bubble containers (1-12 bubbles)"), // Required, LINE API supports 1-12 bubbles
});

// Unified container type
const flexContainerSchema = z.discriminatedUnion("type", [
  flexBubbleSchema,
  flexCarouselSchema,
]);

// Quick reply schema - compliant with LINE API specification
const quickReplyItemSchema = z.object({
  type: z.literal("action").default("action"),
  imageUrl: z.string().url().max(2000).optional(), // maxLength: 2000
  action: flexActionSchema,
});

const quickReplySchema = z.object({
  items: z
    .array(quickReplyItemSchema)
    .max(13)
    .describe("Quick reply items (max 13)"), // maxItems: 13
});

// Sender schema - compliant with LINE API specification
const senderSchema = z.object({
  name: z.string().max(20).optional(), // maxLength: 20
  iconUrl: z.string().url().max(2000).optional(), // maxLength: 2000
});

// Main FlexMessage schema - compliant with LINE API specification
export const flexMessageSchema = z.object({
  type: z.literal("flex").default("flex"),
  altText: z
    .string()
    .default("Flex Message")
    .describe("Alternative text shown when flex message cannot be displayed"), // Required - No maxLength limit in API specification
  contents: flexContainerSchema.describe(
    "Flexible container - either 'bubble' (single container) or 'carousel' (multiple swipeable bubbles, max 12). " +
      "Common constraints: Max 13 buttons per bubble, Max 13 components per box. " +
      "All buttons require 'action' property, all boxes require 'layout' property.",
  ),
  quickReply: quickReplySchema.optional(),
  sender: senderSchema.optional(),
});

// Helper functions for commonly used patterns
export const createSimpleTextBubble = (text: string, color?: string) => ({
  type: "bubble" as const,
  body: {
    type: "box" as const,
    layout: "vertical" as const,
    contents: [
      {
        type: "text" as const,
        text,
        color,
        wrap: true,
      },
    ],
  },
});

export const createButtonBubble = (
  title: string,
  description: string,
  buttonAction: z.infer<typeof flexActionSchema>,
) => ({
  type: "bubble" as const,
  body: {
    type: "box" as const,
    layout: "vertical" as const,
    contents: [
      {
        type: "text" as const,
        text: title,
        weight: "bold" as const,
        size: "xl" as const,
      },
      {
        type: "text" as const,
        text: description,
        margin: "md" as const,
        wrap: true,
      },
    ],
  },
  footer: {
    type: "box" as const,
    layout: "vertical" as const,
    contents: [
      {
        type: "button" as const,
        style: "primary" as const,
        action: buttonAction,
      },
    ],
  },
});

// Type exports
export type FlexMessage = z.infer<typeof flexMessageSchema>;
export type FlexContainer = z.infer<typeof flexContainerSchema>;
export type FlexComponent = z.infer<typeof flexComponentSchema>;
export type FlexAction = z.infer<typeof flexActionSchema>;
