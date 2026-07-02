import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { Client } from "@modelcontextprotocol/sdk/client/index.js";
import { InMemoryTransport } from "@modelcontextprotocol/sdk/inMemory.js";
import { createMockLineBotClient } from "../helpers/mock-line-clients.js";
import GetRichMenuInsightSummary from "../../src/tools/getRichMenuInsightSummary.js";

describe("get_rich_menu_insight_summary tool", () => {
  let client: Client;
  let server: McpServer;
  let mockLineClient: ReturnType<typeof createMockLineBotClient>;

  beforeEach(async () => {
    mockLineClient = createMockLineBotClient();
    server = new McpServer({ name: "test", version: "0.0.1" });
    new GetRichMenuInsightSummary(mockLineClient).register(server);

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

  it("calls getRichMenuInsightSummary with the correct arguments", async () => {
    vi.mocked(mockLineClient.getRichMenuInsightSummary).mockResolvedValue({
      richMenuId: "richmenu-123",
      metricsFrom: "20260213",
      metricsTo: "20260215",
    } as never);

    const result = await client.callTool({
      name: "get_rich_menu_insight_summary",
      arguments: {
        richMenuId: "richmenu-123",
        from: "20260213",
        to: "20260215",
      },
    });

    expect(mockLineClient.getRichMenuInsightSummary).toHaveBeenCalledWith(
      "richmenu-123",
      "20260213",
      "20260215",
    );
    expect(result.isError).toBeFalsy();
  });

  it("returns an error response when LINE API fails", async () => {
    vi.mocked(mockLineClient.getRichMenuInsightSummary).mockRejectedValue(
      new Error("Not found"),
    );

    const result = await client.callTool({
      name: "get_rich_menu_insight_summary",
      arguments: {
        richMenuId: "richmenu-unknown",
        from: "20260213",
        to: "20260215",
      },
    });

    expect(result.isError).toBe(true);
    const text = (result.content as Array<{ type: string; text: string }>)[0]
      .text;
    expect(text).toContain("Failed to get rich menu insight summary");
  });

  it("rejects an invalid date format", async () => {
    const result = await client.callTool({
      name: "get_rich_menu_insight_summary",
      arguments: {
        richMenuId: "richmenu-123",
        from: "2026-02-13",
        to: "20260215",
      },
    });

    expect(result.isError).toBe(true);
    expect(mockLineClient.getRichMenuInsightSummary).not.toHaveBeenCalled();
  });
});
