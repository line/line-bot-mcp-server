import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { Client } from "@modelcontextprotocol/sdk/client/index.js";
import { InMemoryTransport } from "@modelcontextprotocol/sdk/inMemory.js";
import { createMockMessagingApiClient } from "../helpers/mock-line-clients.js";
import CancelRichMenuDefault from "../../src/tools/cancelRichMenuDefault.js";

describe("cancel_rich_menu_default tool", () => {
  let client: Client;
  let server: McpServer;
  let mockLineClient: ReturnType<typeof createMockMessagingApiClient>;

  beforeEach(async () => {
    mockLineClient = createMockMessagingApiClient();
    server = new McpServer({ name: "test", version: "0.0.1" });
    new CancelRichMenuDefault(mockLineClient).register(server);

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

  it("calls cancelDefaultRichMenu", async () => {
    vi.mocked(mockLineClient.cancelDefaultRichMenu).mockResolvedValue(
      {} as never,
    );

    const result = await client.callTool({
      name: "cancel_rich_menu_default",
      arguments: {},
    });

    expect(mockLineClient.cancelDefaultRichMenu).toHaveBeenCalled();
    expect(result.isError).toBeFalsy();
  });

  it("returns an error when LINE API fails", async () => {
    vi.mocked(mockLineClient.cancelDefaultRichMenu).mockRejectedValue(
      new Error("API error"),
    );

    const result = await client.callTool({
      name: "cancel_rich_menu_default",
      arguments: {},
    });

    expect(result.isError).toBe(true);
  });
});
