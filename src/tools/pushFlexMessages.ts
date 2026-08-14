import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { LineBotClient, messagingApi } from "@line/bot-sdk";
import { z } from "zod";
import {
  createErrorResponse,
  createSuccessResponse,
} from "../common/response.js";
import { AbstractTool } from "./AbstractTool.js";
import { NO_USER_ID_ERROR } from "../common/schema/constants.js";
import { flexMessageSchema } from "../common/schema/flexMessage.js";

export default class PushFlexMessages extends AbstractTool {
  private client: LineBotClient;
  private destinationId: string;

  constructor(client: LineBotClient, destinationId: string) {
    super();
    this.client = client;
    this.destinationId = destinationId;
  }

  register(server: McpServer) {
    const userIdSchema = z
      .string()
      .default(this.destinationId)
      .describe(
        "The user ID to receive messages. Defaults to DESTINATION_USER_ID.",
      );

    server.registerTool(
      "push_flex_messages",
      {
        title: "Push Flex Messages",
        description:
          "Push one to five Flex messages to a user in a single LINE Messaging API request. Each message is displayed separately.",
        inputSchema: {
          userId: userIdSchema,
          messages: z.array(flexMessageSchema).min(1).max(5),
        },
        annotations: {
          destructiveHint: true,
        },
      },
      async ({ userId, messages }) => {
        if (!userId) {
          return createErrorResponse(NO_USER_ID_ERROR);
        }

        try {
          const response = await this.client.pushMessage({
            to: userId,
            messages: messages as unknown as messagingApi.Message[],
          });
          return createSuccessResponse(response);
        } catch (error: unknown) {
          return createErrorResponse(
            `Failed to push flex messages: ${error instanceof Error ? error.message : String(error)}`,
          );
        }
      },
    );
  }
}
