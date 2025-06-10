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

    server.tool(
      "delete_rich_menu",
      "Delete a rich menu from your LINE Official Account.",
      {
        richMenuId: richMenuIdSchema.describe(
          "The ID of the rich menu to delete.",
        ),
      },
      async ({ richMenuId }) => {
        try {
          const response = await this.client.deleteRichMenu(richMenuId);
          return createSuccessResponse(response);
        } catch (error) {
          return createErrorResponse(
            `Failed to delete rich menu: ${error.message}`,
          );
        }
      },
    );
  }
}
