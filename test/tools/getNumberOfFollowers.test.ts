import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import { Client } from "@modelcontextprotocol/client";
import { McpServer, InMemoryTransport } from "@modelcontextprotocol/server";
import { createMockLineBotClient } from "../helpers/mock-line-clients.js";
import GetNumberOfFollowers from "../../src/tools/getNumberOfFollowers.js";

describe("get_number_of_followers tool", () => {
  let client: Client;
  let server: McpServer;
  let mockLineClient: ReturnType<typeof createMockLineBotClient>;

  beforeEach(async () => {
    mockLineClient = createMockLineBotClient();
    server = new McpServer({ name: "test", version: "0.0.1" });
    new GetNumberOfFollowers(mockLineClient).register(server);

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

  it("calls getNumberOfFollowers with the given date", async () => {
    const followersData = {
      status: "ready",
      followers: 120,
      targetedReaches: 80,
      blocks: 5,
    };
    vi.mocked(mockLineClient.getNumberOfFollowers).mockResolvedValue(
      followersData as never,
    );

    const result = await client.callTool({
      name: "get_number_of_followers",
      arguments: { date: "20261019" },
    });

    expect(mockLineClient.getNumberOfFollowers).toHaveBeenCalledWith(
      "20261019",
    );
    expect(result.isError).toBeFalsy();
    const text = (result.content as Array<{ type: string; text: string }>)[0]
      .text;
    expect(JSON.parse(text)).toEqual(followersData);
  });

  it("returns an error response when LINE API fails", async () => {
    vi.mocked(mockLineClient.getNumberOfFollowers).mockRejectedValue(
      new Error("Bad request"),
    );

    const result = await client.callTool({
      name: "get_number_of_followers",
      arguments: { date: "20261019" },
    });

    expect(result.isError).toBe(true);
    const text = (result.content as Array<{ type: string; text: string }>)[0]
      .text;
    expect(text).toContain("Failed to get number of followers");
  });

  it("rejects a date that is not in yyyyMMdd format", async () => {
    const result = await client.callTool({
      name: "get_number_of_followers",
      arguments: { date: "2026-10-19" },
    });

    expect(result.isError).toBe(true);
    expect(mockLineClient.getNumberOfFollowers).not.toHaveBeenCalled();
  });
});
