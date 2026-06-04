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
