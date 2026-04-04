import { describe, it, expect, afterEach, vi } from "vitest";
import { createToolHarness } from "../helpers/createToolHarness.js";
import pushFlexMessageTool from "../../src/tools/pushFlexMessage.js";

const SAMPLE_FLEX_MESSAGE = {
  type: "flex",
  altText: "Test flex message",
  contents: {
    type: "bubble",
    body: {
      type: "box",
      layout: "vertical",
      contents: [{ type: "text", text: "Hello" }],
    },
  },
};

// Zod schema applies default values (e.g. wrap: true for text elements)
const EXPECTED_FLEX_MESSAGE = {
  type: "flex",
  altText: "Test flex message",
  contents: {
    type: "bubble",
    body: {
      type: "box",
      layout: "vertical",
      contents: [{ type: "text", text: "Hello", wrap: true }],
    },
  },
};

describe("push_flex_message tool", () => {
  const resources: Array<{ close(): Promise<void> }> = [];

  afterEach(async () => {
    await Promise.all(resources.splice(0).map(resource => resource.close()));
  });

  it("calls pushMessage with the correct arguments", async () => {
    const h = await createToolHarness(pushFlexMessageTool);
    resources.push(h);

    vi.mocked(h.mocks.messaging.pushMessage).mockResolvedValue({} as never);

    const result = await h.client.callTool({
      name: "push_flex_message",
      arguments: {
        userId: "U_EXPLICIT_USER",
        message: SAMPLE_FLEX_MESSAGE,
      },
    });

    expect(h.mocks.messaging.pushMessage).toHaveBeenCalledWith({
      to: "U_EXPLICIT_USER",
      messages: [EXPECTED_FLEX_MESSAGE],
    });
    expect(result.isError).toBeFalsy();
  });

  it("uses default destinationId when userId is omitted", async () => {
    const h = await createToolHarness(pushFlexMessageTool);
    resources.push(h);

    vi.mocked(h.mocks.messaging.pushMessage).mockResolvedValue({} as never);

    await h.client.callTool({
      name: "push_flex_message",
      arguments: {
        message: SAMPLE_FLEX_MESSAGE,
      },
    });

    expect(h.mocks.messaging.pushMessage).toHaveBeenCalledWith({
      to: "U_DEFAULT_USER",
      messages: [EXPECTED_FLEX_MESSAGE],
    });
  });

  it("returns an error response when LINE API fails", async () => {
    const h = await createToolHarness(pushFlexMessageTool);
    resources.push(h);

    vi.mocked(h.mocks.messaging.pushMessage).mockRejectedValue(
      new Error("API error"),
    );

    const result = await h.client.callTool({
      name: "push_flex_message",
      arguments: {
        userId: "U_USER",
        message: SAMPLE_FLEX_MESSAGE,
      },
    });

    expect(result.isError).toBe(true);
    const text = (result.content as Array<{ type: string; text: string }>)[0]
      .text;
    expect(text).toContain("Failed to push flex message");
  });

  it("returns an error when userId is empty and no default is set", async () => {
    const h = await createToolHarness(pushFlexMessageTool, {
      destinationUserId: "",
    });
    resources.push(h);

    const result = await h.client.callTool({
      name: "push_flex_message",
      arguments: {
        message: SAMPLE_FLEX_MESSAGE,
      },
    });

    expect(result.isError).toBe(true);
    const text = (result.content as Array<{ type: string; text: string }>)[0]
      .text;
    expect(text).toContain("userId");
  });
});
