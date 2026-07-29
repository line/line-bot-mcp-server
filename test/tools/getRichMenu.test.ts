import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { Client } from "@modelcontextprotocol/sdk/client/index.js";
import { InMemoryTransport } from "@modelcontextprotocol/sdk/inMemory.js";
import { createMockLineBotClient } from "../helpers/mock-line-clients.js";
import GetRichMenu from "../../src/tools/getRichMenu.js";

describe("get_rich_menu tool", () => {
  let client: Client;
  let server: McpServer;
  let mockLineClient: ReturnType<typeof createMockLineBotClient>;

  beforeEach(async () => {
    mockLineClient = createMockLineBotClient();
    server = new McpServer({ name: "test", version: "0.0.1" });
    new GetRichMenu(mockLineClient).register(server);

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

  it("calls getRichMenu with the correct richMenuId and returns the rich menu", async () => {
    const richMenu = {
      richMenuId: "richmenu-123",
      size: { width: 2500, height: 1686 },
      chatBarText: "Menu",
      areas: [],
    };
    vi.mocked(mockLineClient.getRichMenu).mockResolvedValue(richMenu as never);

    const result = await client.callTool({
      name: "get_rich_menu",
      arguments: { richMenuId: "richmenu-123" },
    });

    expect(mockLineClient.getRichMenu).toHaveBeenCalledWith("richmenu-123");
    expect(result.isError).toBeFalsy();
    const text = (result.content as Array<{ type: string; text: string }>)[0]
      .text;
    expect(JSON.parse(text)).toEqual(richMenu);
  });

  it("returns an error response when LINE API fails", async () => {
    vi.mocked(mockLineClient.getRichMenu).mockRejectedValue(
      new Error("Not found"),
    );

    const result = await client.callTool({
      name: "get_rich_menu",
      arguments: { richMenuId: "richmenu-unknown" },
    });

    expect(result.isError).toBe(true);
    const text = (result.content as Array<{ type: string; text: string }>)[0]
      .text;
    expect(text).toContain("Failed to get rich menu");
  });
});
