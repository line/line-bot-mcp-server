import { z } from "zod";

// 1. Postback action
const postbackActionSchema = z.object({
  type: z.literal("postback"),
  label: z.string().optional(),
  data: z.string(),
  displayText: z.string().optional(),
  inputOption: z.enum(["closeRichMenu", "openRichMenu"]).optional(),
  fillInText: z.string().optional(),
});
// 2. Message action
const messageActionSchema = z.object({
  type: z.literal("message"),
  label: z.string().optional(),
  text: z.string(),
});
// 3. URI action
const uriActionSchema = z.object({
  type: z.literal("uri"),
  label: z.string().optional(),
  uri: z.string(),
  altUri: z
    .object({
      desktop: z.string().optional(),
    })
    .optional(),
});
// 4. Datetime picker action
const datetimePickerActionSchema = z.object({
  type: z.literal("datetimepicker"),
  label: z.string().optional(),
  data: z.string(),
  mode: z.enum(["date", "time", "datetime"]),
  initial: z.string().optional(),
  max: z.string().optional(),
  min: z.string().optional(),
});
// 5. Camera action
const cameraActionSchema = z.object({
  type: z.literal("camera"),
  label: z.string().optional(),
});
// 6. Camera roll action
const cameraRollActionSchema = z.object({
  type: z.literal("cameraRoll"),
  label: z.string().optional(),
});
// 7. Location action
const locationActionSchema = z.object({
  type: z.literal("location"),
  label: z.string().optional(),
});
// 8. Rich menu switch action
const richMenuSwitchActionSchema = z.object({
  type: z.literal("richmenuswitch"),
  label: z.string().optional(),
  richMenuAliasId: z.string(),
  data: z.string(),
});
// 9. Clipboard action
const clipboardActionSchema = z.object({
  type: z.literal("clipboard"),
  label: z.string().optional(),
  clipboardText: z.string(),
});

// actions
export const actionSchema = z.union([
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
