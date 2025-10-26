import { z } from "zod";

// Common field schemas
const sizeSchema = z
  .enum(["xxs", "xs", "sm", "md", "lg", "xl", "xxl", "3xl", "4xl", "5xl"])
  .describe("Size specification");

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
  .describe("Image size specification including full width");

const marginSchema = z
  .enum(["none", "xs", "sm", "md", "lg", "xl", "xxl"])
  .describe("Margin around the component");

const positionSchema = z
  .enum(["relative", "absolute"])
  .describe("CSS position type");

const offsetSchema = z
  .string()
  .describe("Offset from position (e.g., '10px', '5%')");

const alignSchema = z
  .enum(["start", "end", "center"])
  .describe("Horizontal alignment");

const gravitySchema = z
  .enum(["top", "bottom", "center"])
  .describe("Vertical alignment");

const spacingSchema = z
  .enum(["none", "xs", "sm", "md", "lg", "xl", "xxl"])
  .describe("Spacing between components");

const flexWeightSchema = z.number().describe("Flex weight for flexible layout");

const colorSchema = z
  .string()
  .describe("Color in hex format (e.g., '#FF0000', '#00FF00')");

const scalingSchema = z.boolean().describe("Whether to enable scaling");

// Common field groups
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

const labelFields = z
  .string()
  .describe("Label displayed on the action (e.g., 'Tap me')");
const dataFields = z
  .string()
  .describe("Data sent when action is triggered (e.g., 'action_data')");

const flexActionSchema = z.discriminatedUnion("type", [
  z.object({
    type: z.literal("postback").default("postback"),
    data: dataFields,
    label: labelFields,
    displayText: z
      .string()
      .optional()
      .describe(
        "Text displayed in chat when action is tapped (e.g., 'Action selected')",
      ),
    inputOption: z
      .enum(["closeRichMenu", "openRichMenu", "openKeyboard", "openVoice"])
      .optional()
      .describe("Option to control input method when action is tapped"),
    fillInText: z
      .string()
      .optional()
      .describe(
        "String to be pre-filled in the input field (e.g., 'Type here...')",
      ),
  }),
  z.object({
    type: z.literal("message").default("message"),
    label: labelFields,
    text: z
      .string()
      .describe(
        "Message text to send when action is tapped (e.g., 'Hello world!')",
      ),
  }),
  z.object({
    type: z.literal("uri").default("uri"),
    label: labelFields,
    uri: z
      .string()
      .describe(
        "URI to open when action is tapped (e.g., 'https://example.com')",
      ),
    altUri: z
      .object({
        desktop: z
          .string()
          .describe(
            "Alternative URI for desktop users (e.g., 'https://desktop.example.com')",
          ),
      })
      .optional()
      .describe("Alternative URI settings for different platforms"),
  }),
  z.object({
    type: z.literal("datetimepicker").default("datetimepicker"),
    label: labelFields,
    data: dataFields,
    mode: z.enum(["date", "time", "datetime"]).describe("Date picker mode"),
    initial: z
      .string()
      .optional()
      .describe(
        "Initial date/time value in ISO format (e.g., '2023-12-25T10:00:00')",
      ),
    max: z
      .string()
      .optional()
      .describe(
        "Maximum selectable date/time in ISO format (e.g., '2024-12-31T23:59:59')",
      ),
    min: z
      .string()
      .optional()
      .describe(
        "Minimum selectable date/time in ISO format (e.g., '2023-01-01T00:00:00')",
      ),
  }),
  z.object({
    type: z.literal("camera").default("camera"),
    label: labelFields,
  }),
  z.object({
    type: z.literal("cameraRoll").default("cameraRoll"),
    label: labelFields,
  }),
  z.object({
    type: z.literal("location").default("location"),
    label: labelFields,
  }),
  z.object({
    type: z.literal("richmenuswitch").default("richmenuswitch"),
    label: labelFields,
    richMenuAliasId: z
      .string()
      .describe("Rich menu alias ID to switch to (e.g., 'richmenu-alias-a')"),
    data: dataFields,
  }),
  z.object({
    type: z.literal("clipboard").default("clipboard"),
    label: labelFields,
    clipboardText: z
      .string()
      .describe(
        "Text to copy to clipboard when action is tapped (e.g., 'Copied to clipboard!')",
      ),
  }),
]);

const textStyleSets = {
  text: z.string().describe("Text content of the span (e.g., 'Sample text')"),
  color: colorSchema.optional(),
  size: sizeSchema.optional().describe("Font size of the text"),
  weight: z
    .enum(["regular", "bold"])
    .optional()
    .describe("Font weight of the text"),
  style: z
    .enum(["normal", "italic"])
    .optional()
    .describe("Font style of the text"),
  decoration: z
    .enum(["none", "underline", "line-through"])
    .optional()
    .describe("Text decoration style"),
};

const flexSpanSchema = z.object({
  type: z.literal("span").default("span"),
  ...textStyleSets,
});

const flexComponentSchema: z.ZodType<any> = z.lazy(() =>
  z.discriminatedUnion("type", [
    z.object({
      type: z.literal("box"),
      layout: z
        .enum(["horizontal", "vertical", "baseline"])
        .describe("Layout direction of child components"),
      contents: z
        .array(flexComponentSchema)
        .describe("Array of child components"),
      backgroundColor: colorSchema
        .optional()
        .describe("Background color in hex format"),
      borderColor: colorSchema
        .optional()
        .describe("Border color in hex format"),
      borderWidth: z
        .string()
        .optional()
        .describe("Border width (e.g., '1px', '2px')"),
      cornerRadius: z
        .string()
        .optional()
        .describe("Corner radius (e.g., '4px', '8px')"),
      paddingAll: z
        .string()
        .optional()
        .describe("Padding on all sides (e.g., '8px')"),
      paddingTop: z
        .string()
        .optional()
        .describe("Padding on top side (e.g., '4px')"),
      paddingBottom: z
        .string()
        .optional()
        .describe("Padding on bottom side (e.g., '4px')"),
      paddingStart: z
        .string()
        .optional()
        .describe(
          "Padding on start side (left in LTR, right in RTL) (e.g., '8px')",
        ),
      paddingEnd: z
        .string()
        .optional()
        .describe(
          "Padding on end side (right in LTR, left in RTL) (e.g., '8px')",
        ),
      spacing: spacingSchema
        .optional()
        .describe("Spacing between child components"),
      width: z
        .string()
        .optional()
        .describe("Width of the box (e.g., '100px', '50%')"),
      height: z
        .string()
        .optional()
        .describe("Height of the box (e.g., '50px', '100%')"),
      justifyContent: z
        .enum([
          "flex-start",
          "center",
          "flex-end",
          "space-between",
          "space-around",
          "space-evenly",
        ])
        .optional()
        .describe("Alignment of child components along main axis"),
      alignItems: z
        .enum(["flex-start", "center", "flex-end"])
        .optional()
        .describe("Alignment of child components along cross axis"),
      background: z
        .object({
          type: z.literal("linearGradient"),
          angle: z.string().describe("Gradient angle (e.g., '0deg', '90deg')"),
          startColor: colorSchema.describe(
            "Starting color of gradient in hex format",
          ),
          endColor: colorSchema.describe(
            "Ending color of gradient in hex format",
          ),
        })
        .optional()
        .describe("Linear gradient background"),
      action: flexActionSchema
        .optional()
        .describe("Action triggered when box is tapped"),
      ...layoutFields,
    }),
    z.object({
      type: z.literal("button"),
      action: flexActionSchema.describe(
        "Action triggered when button is tapped",
      ),
      height: z.enum(["sm", "md"]).optional().describe("Height of the button"),
      style: z
        .enum(["link", "primary", "secondary"])
        .optional()
        .describe("Visual style of the button"),
      color: colorSchema.optional().describe("Text color in hex format"),
      gravity: gravitySchema
        .optional()
        .describe("Vertical alignment of button content"),
      adjustMode: z
        .enum(["shrink-to-fit"])
        .optional()
        .describe("Text adjustment mode"),
      scaling: scalingSchema.optional(),
      ...layoutFields,
    }),
    z.object({
      type: z.literal("filler"),
      flex: flexWeightSchema.optional(),
    }),
    z.object({
      type: z.literal("icon"),
      url: z
        .string()
        .describe(
          "URL of the icon image (e.g., 'https://example.com/icon.png')",
        ),
      size: sizeSchema.optional().describe("Size of the icon"),
      aspectRatio: z
        .string()
        .optional()
        .describe("Aspect ratio of the icon (e.g., '1:1', '16:9')"),
      scaling: scalingSchema.optional(),
      ...layoutFields,
    }),
    z.object({
      type: z.literal("image"),
      url: z
        .string()
        .describe("URL of the image (e.g., 'https://example.com/image.jpg')"),
      size: imageSizeSchema.optional().describe("Size of the image"),
      aspectRatio: z
        .string()
        .optional()
        .describe("Aspect ratio of the image (e.g., '1:1', '16:9')"),
      aspectMode: z
        .enum(["cover", "fit"])
        .optional()
        .describe("How the image should fit within its container"),
      backgroundColor: colorSchema
        .optional()
        .describe("Background color in hex format"),
      action: flexActionSchema
        .optional()
        .describe("Action triggered when image is tapped"),
      animated: z
        .boolean()
        .optional()
        .describe("Whether to enable animated GIF playback"),
      scaling: scalingSchema.optional(),
      ...layoutFields,
      ...alignmentFields,
    }),
    z.object({
      type: z.literal("separator"),
      margin: marginSchema.optional(),
      color: colorSchema
        .optional()
        .describe("Color of the separator line in hex format"),
    }),
    z.object({
      type: z.literal("spacer"),
      size: z
        .enum(["xs", "sm", "md", "lg", "xl", "xxl"])
        .optional()
        .describe("Size of the spacing"),
    }),
    z.object({
      type: z.literal("text").default("text"),
      contents: z
        .array(flexSpanSchema)
        .optional()
        .describe("Array of span elements for rich text formatting"),
      adjustMode: z
        .enum(["shrink-to-fit"])
        .optional()
        .describe("Text adjustment mode when text doesn't fit"),
      wrap: z
        .boolean()
        .optional()
        .describe("Whether to wrap text to multiple lines"),
      lineSpacing: z
        .enum(["xs", "sm", "md", "lg", "xl", "xxl"])
        .optional()
        .describe("Spacing between lines"),
      action: flexActionSchema
        .optional()
        .describe("Action triggered when text is tapped"),
      ...textStyleSets,
      maxLines: z
        .number()
        .optional()
        .describe("Maximum number of lines to display (e.g., 3)"),
      scaling: scalingSchema.optional(),
      ...layoutFields,
      ...alignmentFields,
    }),
    z.object({
      type: z.literal("video"),
      url: z
        .string()
        .describe(
          "URL of the video file (e.g., 'https://example.com/video.mp4')",
        ),
      previewUrl: z
        .string()
        .describe(
          "URL of the preview image shown before video plays (e.g., 'https://example.com/preview.jpg')",
        ),
      altContent: flexComponentSchema.describe(
        "Alternative content to display if video cannot be played",
      ),
      size: imageSizeSchema.optional().describe("Size of the video player"),
      aspectRatio: z
        .string()
        .optional()
        .describe("Aspect ratio of the video (e.g., '1:1', '16:9')"),
      action: flexActionSchema
        .optional()
        .describe("Action triggered when video is tapped"),
      scaling: scalingSchema.optional(),
      ...layoutFields,
      ...alignmentFields,
    }),
  ]),
);

// Common section style schema
const sectionStyleSchema = z.object({
  backgroundColor: colorSchema
    .optional()
    .describe("Background color of section in hex format"),
  separator: z
    .boolean()
    .optional()
    .describe("Whether to show separator line below section"),
  separatorColor: colorSchema
    .optional()
    .describe("Color of separator line in hex format"),
});

const flexBubbleStylesSchema = z.object({
  header: sectionStyleSchema
    .optional()
    .describe("Style settings for header section"),
  hero: sectionStyleSchema
    .optional()
    .describe("Style settings for hero section"),
  body: sectionStyleSchema
    .optional()
    .describe("Style settings for body section"),
  footer: sectionStyleSchema
    .optional()
    .describe("Style settings for footer section"),
});

const flexBubbleSchema = z.object({
  type: z.literal("bubble"),
  size: z
    .enum(["nano", "micro", "deca", "hecto", "kilo", "mega", "giga"])
    .optional()
    .describe("Size of the bubble container"),
  direction: z
    .enum(["ltr", "rtl"])
    .optional()
    .describe("Text direction (left-to-right or right-to-left)"),
  header: flexComponentSchema.optional().describe("Header section content"),
  hero: flexComponentSchema
    .optional()
    .describe("Hero section content (typically for images)"),
  body: flexComponentSchema
    .optional()
    .describe("Body section content (main content area)"),
  footer: flexComponentSchema
    .optional()
    .describe("Footer section content (typically for actions)"),
  styles: flexBubbleStylesSchema
    .optional()
    .describe("Style settings for each section"),
  action: flexActionSchema
    .optional()
    .describe("Action triggered when bubble is tapped"),
});

const flexCarouselSchema = z.object({
  type: z.literal("carousel"),
  contents: z
    .array(flexBubbleSchema)
    .describe("Array of bubble containers to display in carousel"),
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
