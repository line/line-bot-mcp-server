import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { messagingApi } from "@line/bot-sdk";
import { z } from "zod";
import {
  createErrorResponse,
  createSuccessResponse,
} from "../common/response.js";
import { AbstractTool } from "./AbstractTool.js";
import { NO_USER_ID_ERROR } from "../common/schema/constants.js";
import { flexMessageSchema } from "../common/schema/flexMessage.js";

export default class PushFlexMessage extends AbstractTool {
  private client: messagingApi.MessagingApiClient;
  private destinationId: string;

  constructor(client: messagingApi.MessagingApiClient, destinationId: string) {
    super();
    this.client = client;
    this.destinationId = destinationId;
  }

  register(server: McpServer) {
    const userIdSchema = z
      .string()
      .default(this.destinationId)
      .describe(
        "The user ID to receive a message. Defaults to DESTINATION_USER_ID.",
      );

    server.tool(
      "push_flex_message",
      "Push a highly customizable flex message to a user via LINE. Supports both bubble (single container) and carousel " +
        "(multiple swipeable bubbles) layouts.",
      {
        userId: userIdSchema,
        message: flexMessageSchema,
      },
      async ({ userId, message }) => {
        if (!userId) {
          return createErrorResponse(NO_USER_ID_ERROR);
        }

        try {
          const response = await this.client.pushMessage({
            to: userId,
            messages: [message as unknown as messagingApi.Message],
          });
          return createSuccessResponse(response);
        } catch (error) {
          return createErrorResponse(
            `Failed to push flex message: ${error.message}`,
          );
        }
      },
    );
  }
}
