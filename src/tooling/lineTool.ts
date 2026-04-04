import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import type { CallToolResult } from "@modelcontextprotocol/sdk/types.js";
import type { messagingApi } from "@line/bot-sdk";
import { z } from "zod";

export type LocalizedText = Readonly<{
  en: string;
  ja: string;
}>;

export type ToolAnnotations = Readonly<{
  readOnlyHint?: boolean;
  destructiveHint?: boolean;
  openWorldHint?: boolean;
}>;

export type ToolDocField = Readonly<{
  path: string;
  type: string;
  description: LocalizedText;
}>;

export type ToolDocs = Readonly<{
  fields: readonly ToolDocField[];
}>;

export type LineToolContext = Readonly<{
  clients: {
    messaging: messagingApi.MessagingApiClient;
    blob: messagingApi.MessagingApiBlobClient;
  };
  env: {
    channelAccessToken: string;
    destinationUserId: string;
    serverRootDir: string;
    puppeteerExecutablePath?: string;
  };
}>;

export type LineToolInput = z.ZodObject<z.ZodRawShape>;

export type LineTool<TInput extends LineToolInput = LineToolInput> = Readonly<{
  kind: "line-tool";
  name: string;
  /** Display order in registry / README. Lower numbers come first. */
  order: number;
  title?: string;
  summary: LocalizedText;
  annotations?: ToolAnnotations;
  input: (ctx: LineToolContext) => TInput;
  docs: ToolDocs;
  run: (ctx: LineToolContext, args: z.infer<TInput>) => Promise<CallToolResult>;
}>;

export function defineLineTool<TInput extends LineToolInput>(
  tool: LineTool<TInput>,
): LineTool {
  return tool;
}

export function registerLineTool<TInput extends LineToolInput>(
  server: McpServer,
  ctx: LineToolContext,
  tool: LineTool<TInput>,
): void {
  const schema = tool.input(ctx);

  server.registerTool(
    tool.name,
    {
      title: tool.title,
      description: tool.summary.en,
      inputSchema: schema.shape,
      annotations: tool.annotations,
    },
    async args => {
      const parsed = schema.parse(args);
      return await tool.run(ctx, parsed);
    },
  );
}

export function registerAllLineTools(
  server: McpServer,
  ctx: LineToolContext,
  tools: readonly LineTool[],
): void {
  for (const tool of tools) {
    registerLineTool(server, ctx, tool);
  }
}
