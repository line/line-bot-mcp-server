import { McpServer } from "@modelcontextprotocol/server";
import { LineBotClient } from "@line/bot-sdk";
import { z } from "zod";
import {
  createErrorResponse,
  createSuccessResponse,
} from "../common/response.js";
import { AbstractTool } from "./AbstractTool.js";

export default class GetGroupSummary extends AbstractTool {
  private client: LineBotClient;

  constructor(client: LineBotClient) {
    super();
    this.client = client;
  }

  register(server: McpServer) {
    server.registerTool(
      "get_group_summary",
      {
        title: "Get Group Summary",
        description:
          "Get the group chat summary including group ID, group name, and group icon URL, using the group ID.",
        inputSchema: z.object({
          groupId: z
            .string()
            .describe("The group ID of the target group chat."),
        }),
        annotations: {
          readOnlyHint: true,
        },
      },
      async ({ groupId }) => {
        try {
          const response = await this.client.getGroupSummary(groupId);
          return createSuccessResponse(response);
        } catch (error: unknown) {
          return createErrorResponse(
            `Failed to get group summary: ${error instanceof Error ? error.message : String(error)}`,
          );
        }
      },
    );
  }
}
