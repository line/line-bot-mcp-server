import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { Client } from "@modelcontextprotocol/sdk/client/index.js";
import { InMemoryTransport } from "@modelcontextprotocol/sdk/inMemory.js";
import { createMockMessagingApiClient } from "../helpers/mock-line-clients.js";
import GetMessageQuota from "../../src/tools/getMessageQuota.js";

describe("get_message_quota tool", () => {
  let client: Client;
  let server: McpServer;
  let mockLineClient: ReturnType<typeof createMockMessagingApiClient>;

  beforeEach(async () => {
    mockLineClient = createMockMessagingApiClient();
    server = new McpServer({ name: "test", version: "0.0.1" });
    new GetMessageQuota(mockLineClient).register(server);

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

  it("returns quota and consumption data", async () => {
    vi.mocked(mockLineClient.getMessageQuota).mockResolvedValue({
      type: "limited",
      value: 1000,
    } as never);
    vi.mocked(mockLineClient.getMessageQuotaConsumption).mockResolvedValue({
      totalUsage: 250,
    } as never);

    const result = await client.callTool({
      name: "get_message_quota",
      arguments: {},
    });

    expect(mockLineClient.getMessageQuota).toHaveBeenCalled();
    expect(mockLineClient.getMessageQuotaConsumption).toHaveBeenCalled();
    expect(result.isError).toBeFalsy();
    const text = (result.content as Array<{ type: string; text: string }>)[0]
      .text;
    expect(JSON.parse(text)).toEqual({ limited: 1000, totalUsage: 250 });
  });

  it("returns an error when LINE API fails", async () => {
    vi.mocked(mockLineClient.getMessageQuota).mockRejectedValue(
      new Error("API error"),
    );

    const result = await client.callTool({
      name: "get_message_quota",
      arguments: {},
    });

    expect(result.isError).toBe(true);
  });
});
