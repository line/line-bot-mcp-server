import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { messagingApi } from "@line/bot-sdk";
import { z } from "zod";
import {
  createErrorResponse,
  createSuccessResponse,
} from "../common/response.js";
import { AbstractTool } from "./AbstractTool.js";
import { NO_USER_ID_ERROR } from "../common/schema/constants.js";

export default class GetProfile extends AbstractTool {
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
        "The user ID to get a profile. Defaults to DESTINATION_USER_ID.",
      );

    server.tool(
      "get_profile",
      "Get detailed profile information of a LINE user including display name, profile picture URL, status message and language.",
      {
        userId: userIdSchema,
      },
      async ({ userId }) => {
        if (!userId) {
          return createErrorResponse(NO_USER_ID_ERROR);
        }

        try {
          const response = await this.client.getProfile(userId);
          return createSuccessResponse(response);
        } catch (error) {
          return createErrorResponse(`Failed to get profile: ${error.message}`);
        }
      },
    );
  }
}
