import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { messagingApi } from "@line/bot-sdk";
import {
  createErrorResponse,
  createSuccessResponse,
} from "../common/response.js";
import { AbstractTool } from "./AbstractTool.js";

export default class CancelRichMenuDefault extends AbstractTool {
  private client: messagingApi.MessagingApiClient;

  constructor(client: messagingApi.MessagingApiClient) {
    super();
    this.client = client;
  }

  register(server: McpServer) {
    server.tool(
      "cancel_rich_menu_default",
      "Cancel the default rich menu.",
      {},
      {
        title: "Cancel Rich Menu Default",
        destructiveHint: true,
      },
      async () => {
        try {
          const response = await this.client.cancelDefaultRichMenu();
          return createSuccessResponse(response);
        } catch (error) {
          return createErrorResponse(
            `Failed to cancel default rich menu: ${error.message}`,
          );
        }
      },
    );
  }
}
