import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { Client } from "@modelcontextprotocol/sdk/client/index.js";
import { InMemoryTransport } from "@modelcontextprotocol/sdk/inMemory.js";
import { createMockMessagingApiClient } from "../helpers/mock-line-clients.js";
import GetFollowerIds from "../../src/tools/getFollowerIds.js";

describe("get_follower_ids tool", () => {
  let client: Client;
  let server: McpServer;
  let mockLineClient: ReturnType<typeof createMockMessagingApiClient>;

  beforeEach(async () => {
    mockLineClient = createMockMessagingApiClient();
    server = new McpServer({ name: "test", version: "0.0.1" });
    new GetFollowerIds(mockLineClient).register(server);

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

  it("calls getFollowers with the correct arguments", async () => {
    const followerData = {
      userIds: ["U_USER_1", "U_USER_2"],
      next: "continuation_token",
    };
    vi.mocked(mockLineClient.getFollowers).mockResolvedValue(
      followerData as never,
    );

    const result = await client.callTool({
      name: "get_follower_ids",
      arguments: { start: "token_abc", limit: 100 },
    });

    expect(mockLineClient.getFollowers).toHaveBeenCalledWith("token_abc", 100);
    expect(result.isError).toBeFalsy();
    const text = (result.content as Array<{ type: string; text: string }>)[0]
      .text;
    expect(JSON.parse(text)).toEqual(followerData);
  });

  it("calls getFollowers without optional parameters", async () => {
    vi.mocked(mockLineClient.getFollowers).mockResolvedValue({
      userIds: [],
    } as never);

    const result = await client.callTool({
      name: "get_follower_ids",
      arguments: {},
    });

    expect(mockLineClient.getFollowers).toHaveBeenCalledWith(
      undefined,
      undefined,
    );
    expect(result.isError).toBeFalsy();
  });

  it("returns an error response when LINE API fails", async () => {
    vi.mocked(mockLineClient.getFollowers).mockRejectedValue(
      new Error("Forbidden"),
    );

    const result = await client.callTool({
      name: "get_follower_ids",
      arguments: {},
    });

    expect(result.isError).toBe(true);
    const text = (result.content as Array<{ type: string; text: string }>)[0]
      .text;
    expect(text).toContain("Failed to get follower IDs");
  });
});
