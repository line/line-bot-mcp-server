import type { messagingApi } from "@line/bot-sdk";
import { Client } from "@modelcontextprotocol/sdk/client/index.js";
import { InMemoryTransport } from "@modelcontextprotocol/sdk/inMemory.js";
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import {
  createMockMessagingApiClient,
  createMockBlobClient,
} from "./mock-line-clients.js";
import {
  registerLineTool,
  type LineTool,
  type LineToolContext,
} from "../../src/tooling/lineTool.js";

export async function createToolHarness(
  tool: LineTool,
  envOverrides: Partial<LineToolContext["env"]> = {},
) {
  const messaging = createMockMessagingApiClient();
  const blob = createMockBlobClient();

  const ctx: LineToolContext = {
    clients: {
      messaging,
      blob,
    },
    env: {
      channelAccessToken: "",
      destinationUserId: "U_DEFAULT_USER",
      serverRootDir: "/tmp",
      puppeteerExecutablePath: undefined,
      ...envOverrides,
    },
  };

  const server = new McpServer({
    name: "test",
    version: "0.0.1",
  });

  registerLineTool(server, ctx, tool);

  const [clientTransport, serverTransport] =
    InMemoryTransport.createLinkedPair();
  const client = new Client({
    name: "test-client",
    version: "0.0.1",
  });

  await Promise.all([
    client.connect(clientTransport),
    server.connect(serverTransport),
  ]);

  return {
    client,
    server,
    ctx,
    mocks: {
      messaging,
      blob,
    },
    async close() {
      await client.close();
      await server.close();
    },
  };
}
