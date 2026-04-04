import { describe, it, expect, afterEach, vi } from "vitest";
import { createToolHarness } from "../helpers/createToolHarness.js";
import broadcastFlexMessageTool from "../../src/tools/broadcastFlexMessage.js";

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

describe("broadcast_flex_message tool", () => {
  const resources: Array<{ close(): Promise<void> }> = [];

  afterEach(async () => {
    await Promise.all(resources.splice(0).map(resource => resource.close()));
  });

  it("calls broadcast with the correct arguments", async () => {
    const h = await createToolHarness(broadcastFlexMessageTool);
    resources.push(h);

    vi.mocked(h.mocks.messaging.broadcast).mockResolvedValue({} as never);

    const result = await h.client.callTool({
      name: "broadcast_flex_message",
      arguments: {
        message: SAMPLE_FLEX_MESSAGE,
      },
    });

    expect(h.mocks.messaging.broadcast).toHaveBeenCalledWith({
      messages: [EXPECTED_FLEX_MESSAGE],
    });
    expect(result.isError).toBeFalsy();
  });

  it("returns an error response when LINE API fails", async () => {
    const h = await createToolHarness(broadcastFlexMessageTool);
    resources.push(h);

    vi.mocked(h.mocks.messaging.broadcast).mockRejectedValue(
      new Error("API error"),
    );

    const result = await h.client.callTool({
      name: "broadcast_flex_message",
      arguments: {
        message: SAMPLE_FLEX_MESSAGE,
      },
    });

    expect(result.isError).toBe(true);
    const text = (result.content as Array<{ type: string; text: string }>)[0]
      .text;
    expect(text).toContain("Failed to broadcast message");
  });
});
