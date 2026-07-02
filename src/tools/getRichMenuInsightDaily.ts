import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { LineBotClient } from "@line/bot-sdk";
import {
  createErrorResponse,
  createSuccessResponse,
} from "../common/response.js";
import { AbstractTool } from "./AbstractTool.js";
import { z } from "zod";

export default class GetRichMenuInsightDaily extends AbstractTool {
  private client: LineBotClient;

  constructor(client: LineBotClient) {
    super();
    this.client = client;
  }

  register(server: McpServer) {
    server.registerTool(
      "get_rich_menu_insight_daily",
      {
        title: "Get Rich Menu Insight Daily",
        description:
          "Get rich menu statistics broken down by day for the specified period, for a rich menu created via the Messaging API. " +
          "Returns the daily impression count for the whole rich menu and the daily click count for each tappable area. " +
          "When the total number of unique clicks during the period is below the privacy threshold, " +
          "only richMenuId is returned and the other fields are omitted.",
        inputSchema: {
          richMenuId: z
            .string()
            .describe("ID of the rich menu created via the Messaging API."),
          from: z
            .string()
            .regex(/^[0-9]{8}$/)
            .describe(
              "Start date of the aggregation period (inclusive). Must be within the most recent 3 years. " +
                "Format: yyyyMMdd (e.g. 20260213). Time zone: UTC+9",
            ),
          to: z
            .string()
            .regex(/^[0-9]{8}$/)
            .describe(
              "End date of the aggregation period (inclusive). The end date can be specified for up to 99 days after the start date. " +
                "Format: yyyyMMdd (e.g. 20260215). Time zone: UTC+9",
            ),
        },
        annotations: {
          readOnlyHint: true,
        },
      },
      async ({ richMenuId, from, to }) => {
        try {
          const response = await this.client.getRichMenuInsightDaily(
            richMenuId,
            from,
            to,
          );
          return createSuccessResponse(response);
        } catch (error: unknown) {
          return createErrorResponse(
            `Failed to get rich menu insight daily: ${error instanceof Error ? error.message : String(error)}`,
          );
        }
      },
    );
  }
}
