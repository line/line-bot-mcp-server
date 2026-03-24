import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { Client } from "@modelcontextprotocol/sdk/client/index.js";
import { InMemoryTransport } from "@modelcontextprotocol/sdk/inMemory.js";
import { createMockMessagingApiClient } from "../helpers/mock-line-clients.js";
import BroadcastTextMessage from "../../src/tools/broadcastTextMessage.js";

describe("broadcast_text_message tool", () => {
  let client: Client;
  let server: McpServer;
  let mockLineClient: ReturnType<typeof createMockMessagingApiClient>;

  beforeEach(async () => {
    mockLineClient = createMockMessagingApiClient();
    server = new McpServer({ name: "test", version: "0.0.1" });
    new BroadcastTextMessage(mockLineClient).register(server);

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
      name: "broadcast_text_message",
      arguments: {
        message: { type: "text", text: "hello everyone" },
      },
    });

    expect(mockLineClient.broadcast).toHaveBeenCalledWith({
      messages: [{ type: "text", text: "hello everyone" }],
    });
    expect(result.isError).toBeFalsy();
  });

  it("returns an error response when LINE API fails", async () => {
    vi.mocked(mockLineClient.broadcast).mockRejectedValue(
      new Error("API error"),
    );

    const result = await client.callTool({
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
