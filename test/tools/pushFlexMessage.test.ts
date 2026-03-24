import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { Client } from "@modelcontextprotocol/sdk/client/index.js";
import { InMemoryTransport } from "@modelcontextprotocol/sdk/inMemory.js";
import { createMockMessagingApiClient } from "../helpers/mock-line-clients.js";
import PushFlexMessage from "../../src/tools/pushFlexMessage.js";

const DESTINATION_ID = "U_DEFAULT_USER";

const SAMPLE_FLEX_MESSAGE = {
  type: "flex",
  altText: "Test flex message",
  contents: {
    type: "bubble",
    body: {
      type: "box",
      layout: "vertical",
      contents: [{ type: "text", text: "Hello" }],
    },
  },
};

// Zod schema applies default values (e.g. wrap: true for text elements)
const EXPECTED_FLEX_MESSAGE = {
  type: "flex",
  altText: "Test flex message",
  contents: {
    type: "bubble",
    body: {
      type: "box",
      layout: "vertical",
      contents: [{ type: "text", text: "Hello", wrap: true }],
    },
  },
};

describe("push_flex_message tool", () => {
  let client: Client;
  let server: McpServer;
  let mockLineClient: ReturnType<typeof createMockMessagingApiClient>;

  beforeEach(async () => {
    mockLineClient = createMockMessagingApiClient();
    server = new McpServer({ name: "test", version: "0.0.1" });
    new PushFlexMessage(mockLineClient, DESTINATION_ID).register(server);

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

  it("calls pushMessage with the correct arguments", async () => {
    vi.mocked(mockLineClient.pushMessage).mockResolvedValue({} as never);

    const result = await client.callTool({
      name: "push_flex_message",
      arguments: {
        userId: "U_EXPLICIT_USER",
        message: SAMPLE_FLEX_MESSAGE,
      },
    });

    expect(mockLineClient.pushMessage).toHaveBeenCalledWith({
      to: "U_EXPLICIT_USER",
      messages: [EXPECTED_FLEX_MESSAGE],
    });
    expect(result.isError).toBeFalsy();
  });

  it("uses default destinationId when userId is omitted", async () => {
    vi.mocked(mockLineClient.pushMessage).mockResolvedValue({} as never);

    await client.callTool({
      name: "push_flex_message",
      arguments: {
        message: SAMPLE_FLEX_MESSAGE,
      },
    });

    expect(mockLineClient.pushMessage).toHaveBeenCalledWith({
      to: DESTINATION_ID,
      messages: [EXPECTED_FLEX_MESSAGE],
    });
  });

  it("returns an error response when LINE API fails", async () => {
    vi.mocked(mockLineClient.pushMessage).mockRejectedValue(
      new Error("API error"),
    );

    const result = await client.callTool({
      name: "push_flex_message",
      arguments: {
        userId: "U_USER",
        message: SAMPLE_FLEX_MESSAGE,
      },
    });

    expect(result.isError).toBe(true);
    const text = (result.content as Array<{ type: string; text: string }>)[0]
      .text;
    expect(text).toContain("Failed to push flex message");
  });

  it("returns an error when userId is empty and no default is set", async () => {
    const emptyServer = new McpServer({ name: "test", version: "0.0.1" });
    new PushFlexMessage(mockLineClient, "").register(emptyServer);

    const [ct, st] = InMemoryTransport.createLinkedPair();
    const emptyClient = new Client({ name: "test-client", version: "0.0.1" });
    await Promise.all([emptyClient.connect(ct), emptyServer.connect(st)]);

    const result = await emptyClient.callTool({
      name: "push_flex_message",
      arguments: {
        message: SAMPLE_FLEX_MESSAGE,
      },
    });

    expect(result.isError).toBe(true);
    const text = (result.content as Array<{ type: string; text: string }>)[0]
      .text;
    expect(text).toContain("userId");

    await emptyClient.close();
    await emptyServer.close();
  });
});
