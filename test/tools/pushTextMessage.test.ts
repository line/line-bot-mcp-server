import { describe, it, expect, afterEach, vi } from "vitest";
import { createToolHarness } from "../helpers/createToolHarness.js";
import pushTextMessageTool from "../../src/tools/pushTextMessage.js";

describe("push_text_message tool", () => {
  const resources: Array<{ close(): Promise<void> }> = [];

  afterEach(async () => {
    await Promise.all(resources.splice(0).map(resource => resource.close()));
  });

  it("calls pushMessage with the correct arguments", async () => {
    const h = await createToolHarness(pushTextMessageTool);
    resources.push(h);

    vi.mocked(h.mocks.messaging.pushMessage).mockResolvedValue({} as never);

    const result = await h.client.callTool({
      name: "push_text_message",
      arguments: {
        userId: "U_EXPLICIT_USER",
        message: {
          type: "text",
          text: "hello",
        },
      },
    });

    expect(h.mocks.messaging.pushMessage).toHaveBeenCalledWith({
      to: "U_EXPLICIT_USER",
      messages: [
        {
          type: "text",
          text: "hello",
        },
      ],
    });
    expect(result.isError).toBeFalsy();
  });

  it("uses default destinationUserId when userId is omitted", async () => {
    const h = await createToolHarness(pushTextMessageTool, {
      destinationUserId: "U_DEFAULT_USER",
    });
    resources.push(h);

    vi.mocked(h.mocks.messaging.pushMessage).mockResolvedValue({} as never);

    await h.client.callTool({
      name: "push_text_message",
      arguments: {
        message: {
          type: "text",
          text: "hello",
        },
      },
    });

    expect(h.mocks.messaging.pushMessage).toHaveBeenCalledWith(
      expect.objectContaining({
        to: "U_DEFAULT_USER",
      }),
    );
  });

  it("returns an error response when LINE API fails", async () => {
    const h = await createToolHarness(pushTextMessageTool);
    resources.push(h);

    vi.mocked(h.mocks.messaging.pushMessage).mockRejectedValue(
      new Error("API error"),
    );

    const result = await h.client.callTool({
      name: "push_text_message",
      arguments: {
        userId: "U_USER",
        message: {
          type: "text",
          text: "hello",
        },
      },
    });

    expect(result.isError).toBe(true);
    const text = (result.content as Array<{ type: string; text: string }>)[0]
      .text;
    expect(text).toContain("Failed to push message");
  });

  it("returns an error when userId is empty and no default is set", async () => {
    const h = await createToolHarness(pushTextMessageTool, {
      destinationUserId: "",
    });
    resources.push(h);

    const result = await h.client.callTool({
      name: "push_text_message",
      arguments: {
        message: {
          type: "text",
          text: "hello",
        },
      },
    });

    expect(result.isError).toBe(true);
    const text = (result.content as Array<{ type: string; text: string }>)[0]
      .text;
    expect(text).toContain("userId");
  });
});
