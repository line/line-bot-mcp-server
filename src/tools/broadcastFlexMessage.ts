import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { messagingApi } from "@line/bot-sdk";
import {
  createErrorResponse,
  createSuccessResponse,
} from "../common/response.js";
import { AbstractTool } from "./AbstractTool.js";
import { flexMessageSchema } from "../common/schema/flexMessage.js";

export default class BroadcastFlexMessage extends AbstractTool {
  private client: messagingApi.MessagingApiClient;

  constructor(client: messagingApi.MessagingApiClient) {
    super();
    this.client = client;
  }

  register(server: McpServer) {
    server.tool(
      "broadcast_flex_message",
      "Broadcast a highly customizable flex message via LINE to all users who have added your LINE Official Account. " +
        "Supports both bubble (single container) and carousel (multiple swipeable bubbles) layouts. Please be aware that " +
        "this message will be sent to all users.",
      {
        message: flexMessageSchema,
      },
      async ({ message }) => {
        try {
          const response = await this.client.broadcast({
            messages: [message as unknown as messagingApi.Message],
          });
          return createSuccessResponse(response);
        } catch (error) {
          return createErrorResponse(
            `Failed to broadcast message: ${error.message}`,
          );
        }
      },
    );
  }
}
