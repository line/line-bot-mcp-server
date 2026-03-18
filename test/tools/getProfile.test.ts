import { describe, it, expect, beforeEach, afterAll, vi } from "vitest";
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { Client } from "@modelcontextprotocol/sdk/client/index.js";
import { InMemoryTransport } from "@modelcontextprotocol/sdk/inMemory.js";
import { createMockMessagingApiClient } from "../helpers/mock-line-clients.js";
import GetProfile from "../../src/tools/getProfile.js";

const DESTINATION_ID = "U_DEFAULT_USER";

describe("get_profile tool", () => {
  let client: Client;
  let server: McpServer;
  let mockLineClient: ReturnType<typeof createMockMessagingApiClient>;

  beforeEach(async () => {
    mockLineClient = createMockMessagingApiClient();
    server = new McpServer({ name: "test", version: "0.0.1" });
    new GetProfile(mockLineClient, DESTINATION_ID).register(server);

    const [clientTransport, serverTransport] =
      InMemoryTransport.createLinkedPair();
    client = new Client({ name: "test-client", version: "0.0.1" });
    await Promise.all([
      client.connect(clientTransport),
      server.connect(serverTransport),
    ]);
  });

  afterAll(async () => {
    await client?.close();
    await server?.close();
  });

  it("calls getProfile with the correct userId", async () => {
    const profileData = {
      displayName: "Test User",
      userId: "U_EXPLICIT_USER",
      pictureUrl: "https://example.com/pic.jpg",
      statusMessage: "Hello",
    };
    vi.mocked(mockLineClient.getProfile).mockResolvedValue(
      profileData as never,
    );

    const result = await client.callTool({
      name: "get_profile",
      arguments: { userId: "U_EXPLICIT_USER" },
    });

    expect(mockLineClient.getProfile).toHaveBeenCalledWith("U_EXPLICIT_USER");
    expect(result.isError).toBeFalsy();
    const text = (result.content as Array<{ type: string; text: string }>)[0]
      .text;
    expect(JSON.parse(text)).toEqual(profileData);
  });

  it("uses default destinationId when userId is omitted", async () => {
    vi.mocked(mockLineClient.getProfile).mockResolvedValue({} as never);

    await client.callTool({
      name: "get_profile",
      arguments: {},
    });

    expect(mockLineClient.getProfile).toHaveBeenCalledWith(DESTINATION_ID);
  });

  it("returns an error response when LINE API fails", async () => {
    vi.mocked(mockLineClient.getProfile).mockRejectedValue(
      new Error("Not found"),
    );

    const result = await client.callTool({
      name: "get_profile",
      arguments: { userId: "U_UNKNOWN" },
    });

    expect(result.isError).toBe(true);
    const text = (result.content as Array<{ type: string; text: string }>)[0]
      .text;
    expect(text).toContain("Failed to get profile");
  });

  it("returns an error when userId is empty and no default is set", async () => {
    const emptyServer = new McpServer({ name: "test", version: "0.0.1" });
    new GetProfile(mockLineClient, "").register(emptyServer);

    const [ct, st] = InMemoryTransport.createLinkedPair();
    const emptyClient = new Client({ name: "test-client", version: "0.0.1" });
    await Promise.all([emptyClient.connect(ct), emptyServer.connect(st)]);

    const result = await emptyClient.callTool({
      name: "get_profile",
      arguments: {},
    });

    expect(result.isError).toBe(true);
    const text = (result.content as Array<{ type: string; text: string }>)[0]
      .text;
    expect(text).toContain("userId");

    await emptyClient.close();
    await emptyServer.close();
  });
});
