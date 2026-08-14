import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { LineBotClient } from "@line/bot-sdk";
import {
  createErrorResponse,
  createSuccessResponse,
} from "../common/response.js";
import { AbstractTool } from "./AbstractTool.js";
import { z } from "zod";

export default class GetRichMenu extends AbstractTool {
  private client: LineBotClient;

  constructor(client: LineBotClient) {
    super();
    this.client = client;
  }

  register(server: McpServer) {
    server.registerTool(
      "get_rich_menu",
      {
        title: "Get Rich Menu",
        description:
          "Get a rich menu by ID, including its size, chat bar text, and tap areas.",
        inputSchema: {
          richMenuId: z.string().describe("The ID of the rich menu to get."),
        },
        annotations: {
          readOnlyHint: true,
        },
      },
      async ({ richMenuId }) => {
        try {
          const response = await this.client.getRichMenu(richMenuId);
          return createSuccessResponse(response);
        } catch (error: unknown) {
          return createErrorResponse(
            `Failed to get rich menu: ${error instanceof Error ? error.message : String(error)}`,
          );
        }
      },
    );
  }
}
