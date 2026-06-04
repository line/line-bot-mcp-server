import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { LineBotClient } from "@line/bot-sdk";
import {
  createErrorResponse,
  createSuccessResponse,
} from "../common/response.js";
import { AbstractTool } from "./AbstractTool.js";

export default class GetRichMenuList extends AbstractTool {
  private client: LineBotClient;

  constructor(client: LineBotClient) {
    super();
    this.client = client;
  }

  register(server: McpServer) {
    server.registerTool(
      "get_rich_menu_list",
      {
        title: "Get Rich Menu List",
        description:
          "Get the list of rich menus associated with your LINE Official Account.",
        annotations: {
          readOnlyHint: true,
        },
      },
      async () => {
        try {
          const response = await this.client.getRichMenuList();
          return createSuccessResponse(response);
        } catch (error: unknown) {
          return createErrorResponse(
            `Failed to get rich menu list: ${error instanceof Error ? error.message : String(error)}`,
          );
        }
      },
    );
  }
}
