import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { Client } from "@modelcontextprotocol/sdk/client/index.js";
import { InMemoryTransport } from "@modelcontextprotocol/sdk/inMemory.js";
import { createMockMessagingApiClient } from "../helpers/mock-line-clients.js";
import BroadcastFlexMessage from "../../src/tools/broadcastFlexMessage.js";

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

describe("broadcast_flex_message tool", () => {
  let client: Client;
  let server: McpServer;
  let mockLineClient: ReturnType<typeof createMockMessagingApiClient>;

  beforeEach(async () => {
    mockLineClient = createMockMessagingApiClient();
    server = new McpServer({ name: "test", version: "0.0.1" });
    new BroadcastFlexMessage(mockLineClient).register(server);

    const [clientTransport, serverTransport] =
      InMemoryTransport.createLinkedPair();
    client = new Client({ name: "test-client", version: "0.0.1" });
    await Promise.all([
      client.connect(clientTransport),
      server.connect(serverTransport),
    ]);
  });

  afterEach(async () => {
    await client?.close();
    await server?.close();
  });

  it("calls broadcast with the correct arguments", async () => {
    vi.mocked(mockLineClient.broadcast).mockResolvedValue({} as never);

    const result = await client.callTool({
      name: "broadcast_flex_message",
      arguments: {
        message: SAMPLE_FLEX_MESSAGE,
      },
    });

    expect(mockLineClient.broadcast).toHaveBeenCalledWith(
      expect.objectContaining({
        messages: expect.arrayContaining([
          expect.objectContaining({
            type: "flex",
            altText: "Test flex message",
          }),
        ]),
      }),
    );
    expect(result.isError).toBeFalsy();
  });

  it("returns an error response when LINE API fails", async () => {
    vi.mocked(mockLineClient.broadcast).mockRejectedValue(
      new Error("API error"),
    );

    const result = await client.callTool({
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
