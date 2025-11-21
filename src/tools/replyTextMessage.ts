import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { messagingApi } from "@line/bot-sdk";
import { z } from "zod";
import {
  createErrorResponse,
  createSuccessResponse,
} from "../common/response.js";
import { AbstractTool } from "./AbstractTool.js";
import { NO_REPLY_TOKEN_ERROR } from "../common/schema/constants.js";
import { textMessageSchema } from "../common/schema/textMessage.js";

export default class PushTextMessage extends AbstractTool {
  private client: messagingApi.MessagingApiClient;

  constructor(client: messagingApi.MessagingApiClient) {
    super();
    this.client = client;
  }

  register(server: McpServer) {
    server.tool(
      "reply_text_message",
      "Push a simple text message to a user via LINE. Use this for sending plain text messages without formatting.",
      {
        message: textMessageSchema,
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
            `Failed to reply message: ${error.message}`,
          );
        }
      },
    );
  }
}
