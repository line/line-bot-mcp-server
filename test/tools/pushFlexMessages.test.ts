import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { Client } from "@modelcontextprotocol/sdk/client/index.js";
import { InMemoryTransport } from "@modelcontextprotocol/sdk/inMemory.js";
import { NO_USER_ID_ERROR } from "../../src/common/schema/constants.js";
import PushFlexMessages from "../../src/tools/pushFlexMessages.js";
import { createMockLineBotClient } from "../helpers/mock-line-clients.js";

const DESTINATION_ID = "U_DEFAULT_USER";

const createFlexMessage = (label: string) => ({
  type: "flex",
  altText: `${label} flex message`,
  contents: {
    type: "bubble",
    body: {
      type: "box",
      layout: "vertical",
      contents: [{ type: "text", text: label }],
    },
  },
});

// Zod schema applies default values (e.g. wrap: true for text elements)
const createExpectedFlexMessage = (label: string) => ({
  type: "flex",
  altText: `${label} flex message`,
  contents: {
    type: "bubble",
    body: {
      type: "box",
      layout: "vertical",
      contents: [{ type: "text", text: label, wrap: true }],
    },
  },
});

describe("push_flex_messages tool", () => {
  let client: Client;
  let server: McpServer;
  let mockLineClient: ReturnType<typeof createMockLineBotClient>;

  beforeEach(async () => {
    mockLineClient = createMockLineBotClient();
    server = new McpServer({ name: "test", version: "0.0.1" });
    new PushFlexMessages(mockLineClient, DESTINATION_ID).register(server);

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

  it("pushes three Flex messages in order with one API call", async () => {
    vi.mocked(mockLineClient.pushMessage).mockResolvedValue({} as never);

    const result = await client.callTool({
      name: "push_flex_messages",
      arguments: {
        userId: "U_EXPLICIT_USER",
        messages: [
          createFlexMessage("C"),
          createFlexMessage("A"),
          createFlexMessage("B"),
        ],
      },
    });

    expect(mockLineClient.pushMessage).toHaveBeenCalledTimes(1);
    expect(mockLineClient.pushMessage).toHaveBeenCalledWith({
      to: "U_EXPLICIT_USER",
      messages: [
        createExpectedFlexMessage("C"),
        createExpectedFlexMessage("A"),
        createExpectedFlexMessage("B"),
      ],
    });
    expect(result.isError).toBeFalsy();
  });

  it("pushes one Flex message", async () => {
    vi.mocked(mockLineClient.pushMessage).mockResolvedValue({} as never);

    const result = await client.callTool({
      name: "push_flex_messages",
      arguments: {
        userId: "U_EXPLICIT_USER",
        messages: [createFlexMessage("Only")],
      },
    });

    expect(mockLineClient.pushMessage).toHaveBeenCalledTimes(1);
    expect(mockLineClient.pushMessage).toHaveBeenCalledWith({
      to: "U_EXPLICIT_USER",
      messages: [createExpectedFlexMessage("Only")],
    });
    expect(result.isError).toBeFalsy();
  });

  it("uses default destinationId when userId is omitted", async () => {
    vi.mocked(mockLineClient.pushMessage).mockResolvedValue({} as never);

    await client.callTool({
      name: "push_flex_messages",
      arguments: {
        messages: [createFlexMessage("Default recipient")],
      },
    });

    expect(mockLineClient.pushMessage).toHaveBeenCalledWith(
      expect.objectContaining({ to: DESTINATION_ID }),
    );
  });

  it("rejects an empty messages array before calling LINE", async () => {
    const result = await client.callTool({
      name: "push_flex_messages",
      arguments: {
        userId: "U_USER",
        messages: [],
      },
    });

    expect(result.isError).toBe(true);
    expect(mockLineClient.pushMessage).not.toHaveBeenCalled();
  });

  it("rejects more than five messages before calling LINE", async () => {
    const result = await client.callTool({
      name: "push_flex_messages",
      arguments: {
        userId: "U_USER",
        messages: Array.from({ length: 6 }, (_, index) =>
          createFlexMessage(String(index + 1)),
        ),
      },
    });

    expect(result.isError).toBe(true);
    expect(mockLineClient.pushMessage).not.toHaveBeenCalled();
  });

  it("returns the standard error when no recipient is available", async () => {
    const emptyServer = new McpServer({ name: "test", version: "0.0.1" });
    new PushFlexMessages(mockLineClient, "").register(emptyServer);

    const [clientTransport, serverTransport] =
      InMemoryTransport.createLinkedPair();
    const emptyClient = new Client({ name: "test-client", version: "0.0.1" });
    await Promise.all([
      emptyClient.connect(clientTransport),
      emptyServer.connect(serverTransport),
    ]);

    const result = await emptyClient.callTool({
      name: "push_flex_messages",
      arguments: {
        messages: [createFlexMessage("No recipient")],
      },
    });

    expect(result.isError).toBe(true);
    expect(result.content).toEqual([{ type: "text", text: NO_USER_ID_ERROR }]);
    expect(mockLineClient.pushMessage).not.toHaveBeenCalled();

    await emptyClient.close();
    await emptyServer.close();
  });

  it("returns a readable error when LINE API fails", async () => {
    vi.mocked(mockLineClient.pushMessage).mockRejectedValue(
      new Error("API error"),
    );

    const result = await client.callTool({
      name: "push_flex_messages",
      arguments: {
        userId: "U_USER",
        messages: [createFlexMessage("Failure")],
      },
    });

    expect(result.isError).toBe(true);
    const text = (result.content as Array<{ type: string; text: string }>)[0]
      .text;
    expect(text).toContain("Failed to push flex messages");
    expect(text).toContain("API error");
    expect(text).not.toContain("CHANNEL_ACCESS_TOKEN");
  });

  it("lists a messages array limited to one through five items", async () => {
    const { tools } = await client.listTools();
    const tool = tools.find(({ name }) => name === "push_flex_messages");
    const messagesSchema = tool?.inputSchema.properties?.messages as
      { minItems?: number; maxItems?: number } | undefined;

    expect(tool).toBeDefined();
    expect(messagesSchema).toMatchObject({
      minItems: 1,
      maxItems: 5,
    });
  });
});
