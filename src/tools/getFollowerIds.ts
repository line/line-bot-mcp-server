import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { messagingApi } from "@line/bot-sdk";
import { z } from "zod";
import {
  createErrorResponse,
  createSuccessResponse,
} from "../common/response.js";
import { AbstractTool } from "./AbstractTool.js";

export default class GetFollowerIds extends AbstractTool {
  private client: messagingApi.MessagingApiClient;

  constructor(client: messagingApi.MessagingApiClient) {
    super();
    this.client = client;
  }

  register(server: McpServer) {
    server.registerTool(
      "get_follower_ids",
      {
        description:
          "Get a list of user IDs of users who have added the LINE Official Account as a friend. This allows you to obtain user IDs for sending messages without manually preparing them.",
        inputSchema: {
          start: z
            .string()
            .optional()
            .describe(
              "Continuation token to get the next array of user IDs. Returned in the 'next' property of a previous response.",
            ),
          limit: z
            .number()
            .optional()
            .describe(
              "The maximum number of user IDs to retrieve in a single request.",
            ),
        },
        annotations: {
          readOnlyHint: true,
        },
      },
      async ({ start, limit }) => {
        try {
          const response = await this.client.getFollowers(start, limit);
          return createSuccessResponse(response);
        } catch (error: unknown) {
          return createErrorResponse(
            `Failed to get follower IDs: ${error instanceof Error ? error.message : String(error)}`,
          );
        }
      },
    );
  }
}
