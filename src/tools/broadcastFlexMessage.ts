import { McpServer } from "@modelcontextprotocol/server";
import { LineBotClient, messagingApi } from "@line/bot-sdk";
import {
  createErrorResponse,
  createSuccessResponse,
} from "../common/response.js";
import { AbstractTool } from "./AbstractTool.js";
import { flexMessageSchema } from "../common/schema/flexMessage.js";
import { z } from "zod";

export default class BroadcastFlexMessage extends AbstractTool {
  private client: LineBotClient;

  constructor(client: LineBotClient) {
    super();
    this.client = client;
  }

  register(server: McpServer) {
    server.registerTool(
      "broadcast_flex_message",
      {
        title: "Broadcast Flex Message",
        description:
          "Broadcast a highly customizable flex message via LINE to all users who have added your LINE Official Account. " +
          "Supports both bubble (single container) and carousel (multiple swipeable bubbles) layouts. Please be aware that " +
          "this message will be sent to all users.",
        inputSchema: z.object({
          message: flexMessageSchema,
        }),
        annotations: {
          destructiveHint: true,
        },
      },
      async ({ message }) => {
        try {
          const response = await this.client.broadcast({
            messages: [message as unknown as messagingApi.Message],
          });
          return createSuccessResponse(response);
        } catch (error: unknown) {
          return createErrorResponse(
            `Failed to broadcast message: ${error instanceof Error ? error.message : String(error)}`,
          );
        }
      },
    );
  }
}
