import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import { Client } from "@modelcontextprotocol/client";
import { McpServer, InMemoryTransport } from "@modelcontextprotocol/server";
import { createMockLineBotClient } from "../helpers/mock-line-clients.js";
import GetGroupSummary from "../../src/tools/getGroupSummary.js";

describe("get_group_summary tool", () => {
  let client: Client;
  let server: McpServer;
  let mockLineClient: ReturnType<typeof createMockLineBotClient>;

  beforeEach(async () => {
    mockLineClient = createMockLineBotClient();
    server = new McpServer({ name: "test", version: "0.0.1" });
    new GetGroupSummary(mockLineClient).register(server);

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

  it("calls getGroupSummary with the correct groupId", async () => {
    const summaryData = {
      groupId: "G_TEST_GROUP",
      groupName: "Test Group",
      pictureUrl: "https://example.com/group.jpg",
    };
    vi.mocked(mockLineClient.getGroupSummary).mockResolvedValue(
      summaryData as never,
    );

    const result = await client.callTool({
      name: "get_group_summary",
      arguments: { groupId: "G_TEST_GROUP" },
    });

    expect(mockLineClient.getGroupSummary).toHaveBeenCalledWith("G_TEST_GROUP");
    expect(result.isError).toBeFalsy();
    const text = (result.content as Array<{ type: string; text: string }>)[0]
      .text;
    expect(JSON.parse(text)).toEqual(summaryData);
  });

  it("returns an error response when LINE API fails", async () => {
    vi.mocked(mockLineClient.getGroupSummary).mockRejectedValue(
      new Error("Not found"),
    );

    const result = await client.callTool({
      name: "get_group_summary",
      arguments: { groupId: "G_UNKNOWN" },
    });

    expect(result.isError).toBe(true);
    const text = (result.content as Array<{ type: string; text: string }>)[0]
      .text;
    expect(text).toContain("Failed to get group summary");
  });
});
