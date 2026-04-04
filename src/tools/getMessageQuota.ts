import type { messagingApi } from "@line/bot-sdk";
import { z } from "zod";
import {
  createErrorResponse,
  createSuccessResponse,
} from "../common/response.js";
import { defineLineTool } from "../tooling/lineTool.js";

export default defineLineTool({
  kind: "line-tool",
  name: "get_message_quota",
  order: 6,
  title: "Get Message Quota",
  summary: {
    en: "Get the message quota and consumption of the LINE Official Account. This shows the monthly message limit and current usage.",
    ja: "LINE公式アカウントのメッセージ容量と消費量を取得します。月間メッセージ制限と現在の使用量が表示されます。",
  },
  annotations: {
    readOnlyHint: true,
  },
  input: () => z.object({}),
  docs: {
    fields: [],
  },
  run: async ctx => {
    try {
      const messageQuotaResponse =
        await ctx.clients.messaging.getMessageQuota();
      const messageQuotaConsumptionResponse =
        await ctx.clients.messaging.getMessageQuotaConsumption();
      const response = {
        limited: messageQuotaResponse.value,
        totalUsage: messageQuotaConsumptionResponse.totalUsage,
      };
      return createSuccessResponse(response);
    } catch (error: unknown) {
      return createErrorResponse(
        `Failed to get message quota: ${error instanceof Error ? error.message : String(error)}`,
      );
    }
  },
});
