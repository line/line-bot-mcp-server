import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { messagingApi } from "@line/bot-sdk";
import { z } from "zod";
import {
  createErrorResponse,
  createSuccessResponse,
} from "../common/response.js";
import { AbstractTool } from "./AbstractTool.js";
import { NO_REPLY_TOKEN_ERROR } from "../common/schema/constants.js";
import { flexMessageSchema } from "../common/schema/flexMessage.js";

export default class PushFlexMessage extends AbstractTool {
  private client: messagingApi.MessagingApiClient;

  constructor(client: messagingApi.MessagingApiClient) {
    super();
    this.client = client;
  }

  register(server: McpServer) {
    server.tool(
      "reply_flex_message",
      "Push a highly customizable flex message to a user via LINE. Supports both bubble (single container) and carousel " +
        "(multiple swipeable bubbles) layouts.",
      {
        message: flexMessageSchema,
        replyToken: z.string().describe("Reply token."),
      },
      async ({ message, replyToken }) => {
        if (!replyToken) {
          return createErrorResponse(NO_REPLY_TOKEN_ERROR);
        }

        try {
          const response = await this.client.replyMessage({
            messages: [message as unknown as messagingApi.Message],
            replyToken: replyToken,
          });
          return createSuccessResponse(response);
        } catch (error) {
          return createErrorResponse(
            `Failed to reply flex message: ${error.message}`,
          );
        }
      },
    );
  }
}
