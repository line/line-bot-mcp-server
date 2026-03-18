import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { messagingApi } from "@line/bot-sdk";
import {
  createErrorResponse,
  createSuccessResponse,
} from "../common/response.js";
import { AbstractTool } from "./AbstractTool.js";

export default class GetMessageQuota extends AbstractTool {
  private client: messagingApi.MessagingApiClient;

  constructor(client: messagingApi.MessagingApiClient) {
    super();
    this.client = client;
  }

  register(server: McpServer) {
    server.tool(
      "get_message_quota",
      "Get the message quota and consumption of the LINE Official Account. This shows the monthly message limit and current usage.",
      {},
      {
        title: "Get Message Quota",
        readOnlyHint: true,
      },
      async () => {
        try {
          const messageQuotaResponse = await this.client.getMessageQuota();
          const messageQuotaConsumptionResponse =
            await this.client.getMessageQuotaConsumption();
          const response = {
            limited: messageQuotaResponse.value,
            totalUsage: messageQuotaConsumptionResponse.totalUsage,
          };
          return createSuccessResponse(response);
        } catch (error) {
          return createErrorResponse(
            `Failed to get message quota: ${error.message}`,
          );
        }
      },
    );
  }
}
