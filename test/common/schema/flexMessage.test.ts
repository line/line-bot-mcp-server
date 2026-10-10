import { describe, expect, it } from "vitest";
import { flexMessageSchema } from "../../../src/common/schema/flexMessage.js";

const toFlexMessage = (component: unknown) => ({
  type: "flex" as const,
  altText: "Test message",
  contents: {
    type: "bubble" as const,
    body: {
      type: "box" as const,
      layout: "vertical" as const,
      contents: [component],
    },
  },
});

describe("flexMessageSchema URL validation", () => {
  it("accepts valid URL values for image and altUri.desktop", () => {
    const imageResult = flexMessageSchema.safeParse(
      toFlexMessage({
        type: "image",
        url: "https://example.com/image.png",
      }),
    );
    expect(imageResult.success).toBe(true);

    const altUriResult = flexMessageSchema.safeParse(
      toFlexMessage({
        type: "button",
        action: {
          type: "uri",
          label: "Open",
          uri: "https://example.com/page",
          altUri: {
            desktop: "https://example.com/desktop",
          },
        },
      }),
    );
    expect(altUriResult.success).toBe(true);
  });

  it("rejects malformed URL in image.url", () => {
    const result = flexMessageSchema.safeParse(
      toFlexMessage({
        type: "image",
        url: "not-a-url",
      }),
    );

    expect(result.success).toBe(false);
    if (!result.success) {
      expect(
        result.error.issues.some(issue => issue.path.includes("url")),
      ).toBe(true);
    }
  });

  it("rejects non-https URL in icon.url", () => {
    const result = flexMessageSchema.safeParse(
      toFlexMessage({
        type: "icon",
        url: "http://example.com/icon.png",
      }),
    );

    expect(result.success).toBe(false);
    if (!result.success) {
      expect(
        result.error.issues.some(
          issue =>
            issue.path.includes("url") &&
            issue.message.includes("Must use HTTPS protocol"),
        ),
      ).toBe(true);
    }
  });

  it("rejects malformed URL in uri action altUri.desktop", () => {
    const result = flexMessageSchema.safeParse(
      toFlexMessage({
        type: "button",
        action: {
          type: "uri",
          label: "Open",
          uri: "https://example.com/page",
          altUri: {
            desktop: "invalid-desktop-url",
          },
        },
      }),
    );

    expect(result.success).toBe(false);
    if (!result.success) {
      expect(
        result.error.issues.some(issue => issue.path.includes("desktop")),
      ).toBe(true);
    }
  });
});

describe("flexMessageSchema size values", () => {
  const box = (props: object) => ({
    type: "box",
    layout: "vertical",
    contents: [{ type: "text", text: "hi" }],
    ...props,
  });

  it.each([
    { width: "50%" },
    { width: "23.5px" },
    { height: "30%" },
    { paddingAll: "md" },
    { paddingTop: "5%" },
    { paddingStart: "12.5px" },
    { spacing: "10px" },
    { margin: "8px" },
    { offsetTop: "md" },
    { offsetStart: "10%" },
    { cornerRadius: "lg" },
    { cornerRadius: "8px" },
    { borderWidth: "semi-bold" },
    { borderWidth: "2px" },
  ])("accepts documented box value %o", props => {
    expect(flexMessageSchema.safeParse(toFlexMessage(box(props))).success).toBe(
      true,
    );
  });

  it.each([
    { type: "text", text: "hi", size: "18px" },
    { type: "icon", url: "https://example.com/i.png", size: "20.5px" },
    { type: "image", url: "https://example.com/i.png", size: "50%" },
    { type: "image", url: "https://example.com/i.png", size: "120px" },
  ])("accepts documented component size %o", component => {
    expect(flexMessageSchema.safeParse(toFlexMessage(component)).success).toBe(
      true,
    );
  });

  it.each([
    { width: "md" },
    { spacing: "10%" },
    { margin: "5%" },
    { cornerRadius: "10%" },
    { borderWidth: "thick" },
    { paddingAll: "10" },
  ])("rejects undocumented box value %o", props => {
    expect(flexMessageSchema.safeParse(toFlexMessage(box(props))).success).toBe(
      false,
    );
  });

  it("rejects percentage for text size", () => {
    expect(
      flexMessageSchema.safeParse(
        toFlexMessage({ type: "text", text: "hi", size: "50%" }),
      ).success,
    ).toBe(false);
  });
});
