import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { messagingApi } from "@line/bot-sdk";
import { createSuccessResponse } from "../common/response.js";
import { AbstractTool } from "./AbstractTool.js";
import { z } from "zod";

export default class SetRichMenuDefault extends AbstractTool {
  private client: messagingApi.MessagingApiClient;

  constructor(client: messagingApi.MessagingApiClient) {
    super();
    this.client = client;
  }

  register(server: McpServer) {
    const richMenuIdSchema = z
      .string()
      .describe("The ID of the rich menu to set as default.");

    server.tool(
      "set_rich_menu_default",
      "Set a rich menu as the default rich menu.",
      {
        richMenuId: richMenuIdSchema.describe(
          "The ID of the rich menu to set as default.",
        ),
      },
      async ({ richMenuId }) => {
        const response = await this.client.setDefaultRichMenu(richMenuId);
        return createSuccessResponse(response);
      },
    );
  }
}
