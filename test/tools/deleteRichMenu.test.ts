import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { Client } from "@modelcontextprotocol/sdk/client/index.js";
import { InMemoryTransport } from "@modelcontextprotocol/sdk/inMemory.js";
import { createMockMessagingApiClient } from "../helpers/mock-line-clients.js";
import DeleteRichMenu from "../../src/tools/deleteRichMenu.js";

describe("delete_rich_menu tool", () => {
  let client: Client;
  let server: McpServer;
  let mockLineClient: ReturnType<typeof createMockMessagingApiClient>;

  beforeEach(async () => {
    mockLineClient = createMockMessagingApiClient();
    server = new McpServer({ name: "test", version: "0.0.1" });
    new DeleteRichMenu(mockLineClient).register(server);

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

  it("calls deleteRichMenu with the correct richMenuId", async () => {
    vi.mocked(mockLineClient.deleteRichMenu).mockResolvedValue({} as never);

    const result = await client.callTool({
      name: "delete_rich_menu",
      arguments: { richMenuId: "richmenu-123" },
    });

    expect(mockLineClient.deleteRichMenu).toHaveBeenCalledWith("richmenu-123");
    expect(result.isError).toBeFalsy();
  });

  it("returns an error response when LINE API fails", async () => {
    vi.mocked(mockLineClient.deleteRichMenu).mockRejectedValue(
      new Error("Not found"),
    );

    const result = await client.callTool({
      name: "delete_rich_menu",
      arguments: { richMenuId: "richmenu-unknown" },
    });

    expect(result.isError).toBe(true);
    const text = (result.content as Array<{ type: string; text: string }>)[0]
      .text;
    expect(text).toContain("Failed to delete rich menu");
  });
});
