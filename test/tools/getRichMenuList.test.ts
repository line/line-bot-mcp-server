import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { Client } from "@modelcontextprotocol/sdk/client/index.js";
import { InMemoryTransport } from "@modelcontextprotocol/sdk/inMemory.js";
import { createMockMessagingApiClient } from "../helpers/mock-line-clients.js";
import GetRichMenuList from "../../src/tools/getRichMenuList.js";

describe("get_rich_menu_list tool", () => {
  let client: Client;
  let server: McpServer;
  let mockLineClient: ReturnType<typeof createMockMessagingApiClient>;

  beforeEach(async () => {
    mockLineClient = createMockMessagingApiClient();
    server = new McpServer({ name: "test", version: "0.0.1" });
    new GetRichMenuList(mockLineClient).register(server);

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

  it("returns the list of rich menus", async () => {
    const richMenus = {
      richmenus: [
        { richMenuId: "rm-1", name: "Menu 1" },
        { richMenuId: "rm-2", name: "Menu 2" },
      ],
    };
    vi.mocked(mockLineClient.getRichMenuList).mockResolvedValue(
      richMenus as never,
    );

    const result = await client.callTool({
      name: "get_rich_menu_list",
      arguments: {},
    });

    expect(mockLineClient.getRichMenuList).toHaveBeenCalled();
    expect(result.isError).toBeFalsy();
    const text = (result.content as Array<{ type: string; text: string }>)[0]
      .text;
    expect(JSON.parse(text)).toEqual(richMenus);
  });

  it("returns an error response when LINE API fails", async () => {
    vi.mocked(mockLineClient.getRichMenuList).mockRejectedValue(
      new Error("API error"),
    );

    const result = await client.callTool({
      name: "get_rich_menu_list",
      arguments: {},
    });

    expect(result.isError).toBe(true);
    const text = (result.content as Array<{ type: string; text: string }>)[0]
      .text;
    expect(text).toContain("Failed to broadcast message");
  });
});
