import { createServer, type IncomingHttpHeaders, type Server } from "node:http";
import { fileURLToPath } from "node:url";
import { Client } from "@modelcontextprotocol/sdk/client/index.js";
import { StdioClientTransport } from "@modelcontextprotocol/sdk/client/stdio.js";
import { describe, expect, it } from "vitest";
import { USER_AGENT } from "../../src/version.js";

type RecordedRequest = {
  method: string;
  url: string;
  headers: IncomingHttpHeaders;
  body: string;
};

const DIST_SERVER_ENTRY = fileURLToPath(
  new URL("../../dist/index.js", import.meta.url),
);

async function closeServer(server: Server): Promise<void> {
  if (!server.listening) {
    return;
  }

  await new Promise<void>((resolve, reject) => {
    server.close(error => {
      if (error) {
        reject(error);
        return;
      }
      resolve();
    });
  });
}

async function startMockLineApiServer(): Promise<{
  baseUrl: string;
  recordedRequests: RecordedRequest[];
  close: () => Promise<void>;
}> {
  const recordedRequests: RecordedRequest[] = [];

  const server = createServer((request, response) => {
    const chunks: Buffer[] = [];

    request.on("data", chunk => {
      chunks.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk));
    });

    request.on("end", () => {
      const body = Buffer.concat(chunks).toString("utf8");

      recordedRequests.push({
        method: request.method ?? "",
        url: request.url ?? "",
        headers: request.headers,
        body,
      });

      if (request.method === "POST" && request.url === "/v2/bot/message/push") {
        response.writeHead(200, { "content-type": "application/json" });
        response.end(JSON.stringify({}));
        return;
      }

      response.writeHead(404, { "content-type": "application/json" });
      response.end(JSON.stringify({ message: "Not found" }));
    });
  });

  await new Promise<void>((resolve, reject) => {
    server.once("error", reject);
    server.listen(0, "127.0.0.1", () => {
      server.off("error", reject);
      resolve();
    });
  });

  const address = server.address();
  if (!address || typeof address === "string") {
    await closeServer(server);
    throw new Error("Failed to determine mock LINE API server address");
  }

  return {
    baseUrl: `http://127.0.0.1:${address.port}`,
    recordedRequests,
    close: () => closeServer(server),
  };
}

describe("push_text_message E2E with localhost mock LINE API", () => {
  it(
    "routes the tool call through MCP stdio and sends the HTTP request to the mock server",
    { timeout: 30_000 },
    async () => {
      const mockApi = await startMockLineApiServer();
      const client = new Client({ name: "test-client", version: "0.0.1" });

      try {
        const transport = new StdioClientTransport({
          command: process.execPath,
          args: [DIST_SERVER_ENTRY],
          env: {
            CHANNEL_ACCESS_TOKEN: "test-channel-access-token",
            DESTINATION_USER_ID: "U_TEST_DESTINATION",
            LINE_MESSAGING_API_BASE_URL: mockApi.baseUrl,
          },
        });

        await client.connect(transport);

        const result = await client.callTool({
          name: "push_text_message",
          arguments: {
            message: { type: "text", text: "hello from e2e" },
          },
        });

        expect(result.isError).toBeFalsy();

        const text = (
          result.content as Array<{ type: string; text: string }>
        )[0].text;
        expect(JSON.parse(text)).toEqual({});

        expect(mockApi.recordedRequests).toHaveLength(1);
        expect(mockApi.recordedRequests[0]).toMatchObject({
          method: "POST",
          url: "/v2/bot/message/push",
        });
        expect(mockApi.recordedRequests[0].headers.authorization).toBe(
          "Bearer test-channel-access-token",
        );
        expect(mockApi.recordedRequests[0].headers["user-agent"]).toBe(
          USER_AGENT,
        );
        expect(JSON.parse(mockApi.recordedRequests[0].body)).toEqual({
          to: "U_TEST_DESTINATION",
          messages: [{ type: "text", text: "hello from e2e" }],
        });
      } finally {
        await client.close().catch(() => undefined);
        await mockApi.close();
      }
    },
  );
});
