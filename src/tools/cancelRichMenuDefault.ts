import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { messagingApi } from "@line/bot-sdk";
import { createSuccessResponse } from "../common/response.js";
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
      async () => {
        const response = await this.client.cancelDefaultRichMenu();
        return createSuccessResponse(response);
      },
    );
  }
}
