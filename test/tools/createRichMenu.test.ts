import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { Client } from "@modelcontextprotocol/sdk/client/index.js";
import { InMemoryTransport } from "@modelcontextprotocol/sdk/inMemory.js";
import {
  createMockMessagingApiClient,
  createMockBlobClient,
} from "../helpers/mock-line-clients.js";

// Mock external dependencies before importing the tool.
// vi.mock factories are hoisted, so all values must be created inline.
vi.mock("puppeteer", () => ({
  default: {
    launch: vi.fn().mockResolvedValue({
      newPage: vi.fn().mockResolvedValue({
        setViewport: vi.fn().mockResolvedValue(undefined),
        goto: vi.fn().mockResolvedValue(undefined),
        evaluate: vi.fn().mockResolvedValue(undefined),
        screenshot: vi.fn().mockResolvedValue(undefined),
      }),
      close: vi.fn().mockResolvedValue(undefined),
    }),
  },
}));

vi.mock("@marp-team/marp-core", () => ({
  Marp: class {
    render() {
      return { html: "<div>mock</div>", css: "body{}" };
    }
  },
}));

vi.mock("fs", async importOriginal => {
  const actual: any = await importOriginal();
  return {
    ...actual,
    default: {
      ...actual.default,
      readFileSync: vi.fn().mockReturnValue(Buffer.from("fake-image-data")),
    },
    promises: {
      ...actual.promises,
      readFile: vi
        .fn()
        .mockResolvedValue("# Template\n<h3>item01</h3>\n<h3>item02</h3>"),
      writeFile: vi.fn().mockResolvedValue(undefined),
      copyFile: vi.fn().mockResolvedValue(undefined),
      unlink: vi.fn().mockResolvedValue(undefined),
    },
  };
});

// Import after mocks are set up
import CreateRichMenu from "../../src/tools/createRichMenu.js";

describe("create_rich_menu tool", () => {
  let client: Client;
  let server: McpServer;
  let mockLineClient: ReturnType<typeof createMockMessagingApiClient>;
  let mockBlobClient: ReturnType<typeof createMockBlobClient>;

  beforeEach(async () => {
    mockLineClient = createMockMessagingApiClient();
    mockBlobClient = createMockBlobClient();
    server = new McpServer({ name: "test", version: "0.0.1" });
    new CreateRichMenu(mockLineClient, mockBlobClient).register(server);

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

  it(
    "creates a rich menu, uploads image, and sets as default",
    { timeout: 10000 },
    async () => {
      vi.mocked(mockLineClient.createRichMenu).mockResolvedValue({
        richMenuId: "richmenu-new-123",
      } as never);
      vi.mocked(mockBlobClient.setRichMenuImage).mockResolvedValue({} as never);
      vi.mocked(mockLineClient.setDefaultRichMenu).mockResolvedValue(
        {} as never,
      );

      const result = await client.callTool({
        name: "create_rich_menu",
        arguments: {
          chatBarText: "My Menu",
          actions: [
            { type: "message", label: "Action 1", text: "action1" },
            { type: "message", label: "Action 2", text: "action2" },
          ],
        },
      });

      expect(mockLineClient.createRichMenu).toHaveBeenCalledWith(
        expect.objectContaining({
          name: "My Menu",
          chatBarText: "My Menu",
          selected: true,
          size: { width: 1600, height: 910 },
        }),
      );
      expect(mockBlobClient.setRichMenuImage).toHaveBeenCalledWith(
        "richmenu-new-123",
        expect.any(Blob),
      );
      expect(mockLineClient.setDefaultRichMenu).toHaveBeenCalledWith(
        "richmenu-new-123",
      );
      expect(result.isError).toBeFalsy();
      const text = (result.content as Array<{ type: string; text: string }>)[0]
        .text;
      const parsed = JSON.parse(text);
      expect(parsed.richMenuId).toBe("richmenu-new-123");
      expect(parsed.message).toContain("Rich menu created successfully");
    },
  );

  it.each([
    {
      // +-----------+
      // |           |
      // |     1     |
      // |           |
      // +-----------+
      templateName: "template-01",
      actionCount: 1,
      expectedBounds: [{ x: 0, y: 0, width: 1600, height: 910 }],
    },
    {
      // +-----+-----+
      // |     |     |
      // |  1  |  2  |
      // |     |     |
      // +-----+-----+
      templateName: "template-02",
      actionCount: 2,
      expectedBounds: [
        { x: 0, y: 0, width: 800, height: 910 },
        { x: 800, y: 0, width: 800, height: 910 },
      ],
    },
    {
      // +-------+---+
      // |       | 2 |
      // |   1   +---+
      // |       | 3 |
      // +-------+---+
      templateName: "template-03",
      actionCount: 3,
      expectedBounds: [
        { x: 0, y: 0, width: (1600 / 3) * 2, height: 910 },
        { x: (1600 / 3) * 2, y: 0, width: 1600 / 3, height: 455 },
        { x: (1600 / 3) * 2, y: 455, width: 1600 / 3, height: 455 },
      ],
    },
    {
      // +-----+-----+
      // |  1  |  2  |
      // +-----+-----+
      // |  3  |  4  |
      // +-----+-----+
      templateName: "template-04",
      actionCount: 4,
      expectedBounds: [
        { x: 0, y: 0, width: 800, height: 455 },
        { x: 800, y: 0, width: 800, height: 455 },
        { x: 0, y: 455, width: 800, height: 455 },
        { x: 800, y: 455, width: 800, height: 455 },
      ],
    },
    {
      // +-------+---+
      // |   1   | 2 |
      // +---+---+---+
      // | 3 | 4 | 5 |
      // +---+---+---+
      templateName: "template-05",
      actionCount: 5,
      expectedBounds: [
        { x: 0, y: 0, width: (1600 / 3) * 2, height: 455 },
        { x: (1600 / 3) * 2, y: 0, width: 1600 / 3, height: 455 },
        { x: 0, y: 455, width: 1600 / 3, height: 455 },
        { x: 1600 / 3, y: 455, width: 1600 / 3, height: 455 },
        { x: (1600 / 3) * 2, y: 455, width: 1600 / 3, height: 455 },
      ],
    },
    {
      // +---+---+---+
      // | 1 | 2 | 3 |
      // +---+---+---+
      // | 4 | 5 | 6 |
      // +---+---+---+
      templateName: "template-06",
      actionCount: 6,
      expectedBounds: [
        { x: 0, y: 0, width: 1600 / 3, height: 455 },
        { x: 1600 / 3, y: 0, width: 1600 / 3, height: 455 },
        { x: (1600 / 3) * 2, y: 0, width: 1600 / 3, height: 455 },
        { x: 0, y: 455, width: 1600 / 3, height: 455 },
        { x: 1600 / 3, y: 455, width: 1600 / 3, height: 455 },
        { x: (1600 / 3) * 2, y: 455, width: 1600 / 3, height: 455 },
      ],
    },
  ])(
    "$templateName: creates a rich menu with correct areas for $actionCount actions",
    { timeout: 10000 },
    async ({ actionCount, expectedBounds }) => {
      vi.mocked(mockLineClient.createRichMenu).mockResolvedValue({
        richMenuId: "richmenu-new-123",
      } as never);
      vi.mocked(mockBlobClient.setRichMenuImage).mockResolvedValue({} as never);
      vi.mocked(mockLineClient.setDefaultRichMenu).mockResolvedValue(
        {} as never,
      );

      const actions = Array.from({ length: actionCount }, (_, i) => ({
        type: "message" as const,
        label: `Action ${i + 1}`,
        text: `action${i + 1}`,
      }));

      await client.callTool({
        name: "create_rich_menu",
        arguments: { chatBarText: "My Menu", actions },
      });

      const callArgs = vi.mocked(mockLineClient.createRichMenu).mock
        .calls[0][0];
      const actualBounds = callArgs.areas?.map(area => area.bounds);
      expect(actualBounds).toEqual(expectedBounds);

      // Verify no areas overlap
      for (let i = 0; i < expectedBounds.length; i++) {
        for (let j = i + 1; j < expectedBounds.length; j++) {
          const a = expectedBounds[i];
          const b = expectedBounds[j];
          const overlaps =
            a.x < b.x + b.width &&
            b.x < a.x + a.width &&
            a.y < b.y + b.height &&
            b.y < a.y + a.height;
          expect(overlaps, `areas[${i}] and areas[${j}] overlap`).toBe(false);
        }
      }
    },
  );

  it(
    "returns an error when createRichMenu API fails",
    { timeout: 10000 },
    async () => {
      vi.mocked(mockLineClient.createRichMenu).mockRejectedValue(
        new Error("API error"),
      );

      const result = await client.callTool({
        name: "create_rich_menu",
        arguments: {
          chatBarText: "My Menu",
          actions: [{ type: "message", label: "Action 1", text: "action1" }],
        },
      });

      expect(result.isError).toBe(true);
      const text = (result.content as Array<{ type: string; text: string }>)[0]
        .text;
      expect(text).toContain("API error");
    },
  );
});
