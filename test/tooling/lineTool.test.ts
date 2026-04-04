import { describe, it, expect } from "vitest";
import { Client } from "@modelcontextprotocol/sdk/client/index.js";
import { InMemoryTransport } from "@modelcontextprotocol/sdk/inMemory.js";
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import {
  defineLineTool,
  registerLineTool,
  registerAllLineTools,
  type LineToolContext,
} from "../../src/tooling/lineTool.js";

function createDummyCtx(): LineToolContext {
  return {
    clients: { messaging: {} as any, blob: {} as any },
    env: {
      channelAccessToken: "",
      destinationUserId: "U_DEFAULT",
      serverRootDir: "/tmp",
    },
  };
}

async function createTestServer(setup: (server: McpServer) => void) {
  const server = new McpServer({ name: "test", version: "0.0.1" });
  setup(server);
  const [clientTransport, serverTransport] =
    InMemoryTransport.createLinkedPair();
  const client = new Client({ name: "test-client", version: "0.0.1" });
  await Promise.all([
    client.connect(clientTransport),
    server.connect(serverTransport),
  ]);
  return { client, server };
}

describe("defineLineTool", () => {
  it("returns the tool definition as-is", () => {
    const tool = defineLineTool({
      kind: "line-tool",
      name: "test_tool",
      order: 1,
      summary: { en: "Test", ja: "テスト" },
      input: () => z.object({}),
      docs: { fields: [] },
      run: async () => ({ content: [] }),
    });

    expect(tool.kind).toBe("line-tool");
    expect(tool.name).toBe("test_tool");
  });
});

describe("registerLineTool", () => {
  it("registers a tool that can be called via MCP", async () => {
    const tool = defineLineTool({
      kind: "line-tool",
      name: "echo_tool",
      order: 1,
      summary: { en: "Echo", ja: "エコー" },
      input: () => z.object({ text: z.string() }),
      docs: { fields: [] },
      run: async (_ctx, { text }) => ({
        content: [{ type: "text" as const, text }],
      }),
    });

    const ctx = createDummyCtx();
    const { client, server } = await createTestServer(s =>
      registerLineTool(s, ctx, tool),
    );

    const result = await client.callTool({
      name: "echo_tool",
      arguments: { text: "hello" },
    });

    expect(result.content).toEqual([{ type: "text", text: "hello" }]);

    await client.close();
    await server.close();
  });

  it("uses summary.en as MCP description by default", async () => {
    const tool = defineLineTool({
      kind: "line-tool",
      name: "desc_tool",
      order: 1,
      summary: { en: "English summary", ja: "日本語サマリー" },
      input: () => z.object({}),
      docs: { fields: [] },
      run: async () => ({ content: [] }),
    });

    const ctx = createDummyCtx();
    const { client, server } = await createTestServer(s =>
      registerLineTool(s, ctx, tool),
    );

    const { tools } = await client.listTools();
    expect(tools[0].description).toBe("English summary");

    await client.close();
    await server.close();
  });

  it("input(ctx) can use context for defaults", async () => {
    const tool = defineLineTool({
      kind: "line-tool",
      name: "ctx_tool",
      order: 1,
      summary: { en: "Ctx", ja: "コンテキスト" },
      input: ctx =>
        z.object({
          userId: z.string().default(ctx.env.destinationUserId),
        }),
      docs: { fields: [] },
      run: async (_ctx, { userId }) => ({
        content: [{ type: "text" as const, text: userId }],
      }),
    });

    const ctx = createDummyCtx();
    const { client, server } = await createTestServer(s =>
      registerLineTool(s, ctx, tool),
    );

    const result = await client.callTool({
      name: "ctx_tool",
      arguments: {},
    });

    expect(result.content).toEqual([{ type: "text", text: "U_DEFAULT" }]);

    await client.close();
    await server.close();
  });
});

describe("registerAllLineTools", () => {
  it("registers multiple tools", async () => {
    const tool1 = defineLineTool({
      kind: "line-tool",
      name: "tool_a",
      order: 1,
      summary: { en: "A", ja: "A" },
      input: () => z.object({}),
      docs: { fields: [] },
      run: async () => ({ content: [] }),
    });

    const tool2 = defineLineTool({
      kind: "line-tool",
      name: "tool_b",
      order: 2,
      summary: { en: "B", ja: "B" },
      input: () => z.object({}),
      docs: { fields: [] },
      run: async () => ({ content: [] }),
    });

    const ctx = createDummyCtx();
    const { client, server } = await createTestServer(s =>
      registerAllLineTools(s, ctx, [tool1, tool2]),
    );

    const { tools } = await client.listTools();
    const names = tools.map(t => t.name);
    expect(names).toContain("tool_a");
    expect(names).toContain("tool_b");

    await client.close();
    await server.close();
  });
});
