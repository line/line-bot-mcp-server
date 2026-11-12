import { McpServer } from "@modelcontextprotocol/server";
import { LineBotClient } from "@line/bot-sdk";
import { z } from "zod";
import {
  createErrorResponse,
  createSuccessResponse,
} from "../common/response.js";
import { AbstractTool } from "./AbstractTool.js";

export default class GetNumberOfFollowers extends AbstractTool {
  private client: LineBotClient;

  constructor(client: LineBotClient) {
    super();
    this.client = client;
  }

  register(server: McpServer) {
    server.registerTool(
      "get_number_of_followers",
      {
        title: "Get Number of Followers",
        description:
          "Get the number of followers of the LINE Official Account as of a specified date: total friend adds (followers), users reachable by targeted messages (targetedReaches), and users blocking the account (blocks). If status is 'unready', the numbers for that date have not been calculated yet.",
        inputSchema: z.object({
          date: z
            .string()
            .regex(/^\d{8}$/, "date must be in yyyyMMdd format")
            .describe(
              "Date for which to retrieve the number of followers. Format: yyyyMMdd (e.g. 20191231). Timezone: UTC+9.",
            ),
        }),
        annotations: {
          readOnlyHint: true,
        },
      },
      async ({ date }) => {
        try {
          const response = await this.client.getNumberOfFollowers(date);
          return createSuccessResponse(response);
        } catch (error: unknown) {
          return createErrorResponse(
            `Failed to get number of followers: ${error instanceof Error ? error.message : String(error)}`,
          );
        }
      },
    );
  }
}
