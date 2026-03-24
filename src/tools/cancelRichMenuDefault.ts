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
    server.registerTool(
      "cancel_rich_menu_default",
      {
        title: "Cancel Rich Menu Default",
        description: "Cancel the default rich menu.",
        annotations: {
          destructiveHint: true,
        },
      },
      async () => {
        const response = await this.client.cancelDefaultRichMenu();
        return createSuccessResponse(response);
      },
    );
  }
}
