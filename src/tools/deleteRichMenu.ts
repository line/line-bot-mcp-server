import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { messagingApi } from "@line/bot-sdk";
import {
  createErrorResponse,
  createSuccessResponse,
} from "../common/response.js";
import { AbstractTool } from "./AbstractTool.js";
import { z } from "zod";

export default class DeleteRichMenu extends AbstractTool {
  private client: messagingApi.MessagingApiClient;

  constructor(client: messagingApi.MessagingApiClient) {
    super();
    this.client = client;
  }

  register(server: McpServer) {
    const richMenuIdSchema = z
      .string()
      .describe("The ID of the rich menu to delete.");

    server.registerTool(
      "delete_rich_menu",
      {
        title: "Delete Rich Menu",
        description: "Delete a rich menu from your LINE Official Account.",
        inputSchema: {
          richMenuId: richMenuIdSchema.describe(
            "The ID of the rich menu to delete.",
          ),
        },
        annotations: {
          destructiveHint: true,
        },
      },
      async ({ richMenuId }) => {
        try {
          const response = await this.client.deleteRichMenu(richMenuId);
          return createSuccessResponse(response);
        } catch (error: unknown) {
          return createErrorResponse(
            `Failed to delete rich menu: ${error instanceof Error ? error.message : String(error)}`,
          );
        }
      },
    );
  }
}
