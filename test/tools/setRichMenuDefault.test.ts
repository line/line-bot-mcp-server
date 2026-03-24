import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { Client } from "@modelcontextprotocol/sdk/client/index.js";
import { InMemoryTransport } from "@modelcontextprotocol/sdk/inMemory.js";
import { createMockMessagingApiClient } from "../helpers/mock-line-clients.js";
import SetRichMenuDefault from "../../src/tools/setRichMenuDefault.js";

describe("set_rich_menu_default tool", () => {
  let client: Client;
  let server: McpServer;
  let mockLineClient: ReturnType<typeof createMockMessagingApiClient>;

  beforeEach(async () => {
    mockLineClient = createMockMessagingApiClient();
    server = new McpServer({ name: "test", version: "0.0.1" });
    new SetRichMenuDefault(mockLineClient).register(server);

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

  it("calls setDefaultRichMenu with the correct richMenuId", async () => {
    vi.mocked(mockLineClient.setDefaultRichMenu).mockResolvedValue({} as never);

    const result = await client.callTool({
      name: "set_rich_menu_default",
      arguments: { richMenuId: "richmenu-123" },
    });

    expect(mockLineClient.setDefaultRichMenu).toHaveBeenCalledWith(
      "richmenu-123",
    );
    expect(result.isError).toBeFalsy();
  });

  it("returns an error when LINE API fails", async () => {
    vi.mocked(mockLineClient.setDefaultRichMenu).mockRejectedValue(
      new Error("API error"),
    );

    const result = await client.callTool({
      name: "set_rich_menu_default",
      arguments: { richMenuId: "richmenu-unknown" },
    });

    expect(result.isError).toBe(true);
  });
});
