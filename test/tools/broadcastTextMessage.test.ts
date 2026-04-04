import { describe, it, expect, afterEach, vi } from "vitest";
import { createToolHarness } from "../helpers/createToolHarness.js";
import broadcastTextMessageTool from "../../src/tools/broadcastTextMessage.js";

describe("broadcast_text_message tool", () => {
  const resources: Array<{ close(): Promise<void> }> = [];

  afterEach(async () => {
    await Promise.all(resources.splice(0).map(resource => resource.close()));
  });

  it("calls broadcast with the correct arguments", async () => {
    const h = await createToolHarness(broadcastTextMessageTool);
    resources.push(h);

    vi.mocked(h.mocks.messaging.broadcast).mockResolvedValue({} as never);

    const result = await h.client.callTool({
      name: "broadcast_text_message",
      arguments: {
        message: { type: "text", text: "hello everyone" },
      },
    });

    expect(h.mocks.messaging.broadcast).toHaveBeenCalledWith({
      messages: [{ type: "text", text: "hello everyone" }],
    });
    expect(result.isError).toBeFalsy();
  });

  it("returns an error response when LINE API fails", async () => {
    const h = await createToolHarness(broadcastTextMessageTool);
    resources.push(h);

    vi.mocked(h.mocks.messaging.broadcast).mockRejectedValue(
      new Error("API error"),
    );

    const result = await h.client.callTool({
      name: "broadcast_text_message",
      arguments: {
        message: { type: "text", text: "hello" },
      },
    });

    expect(result.isError).toBe(true);
    const text = (result.content as Array<{ type: string; text: string }>)[0]
      .text;
    expect(text).toContain("Failed to broadcast message");
  });
});
