import { messagingApi } from "@line/bot-sdk";
import { z } from "zod";
import {
  createErrorResponse,
  createSuccessResponse,
} from "../common/response.js";
import { flexMessageSchema } from "../common/schema/flexMessage.js";
import { flexMessageFields } from "../tooling/docFields.js";
import { defineLineTool } from "../tooling/lineTool.js";

export default defineLineTool({
  kind: "line-tool",
  name: "broadcast_flex_message",
  order: 4,
  title: "Broadcast Flex Message",
  summary: {
    en: "Broadcast a highly customizable flex message via LINE to all users who have added your LINE Official Account. Supports both bubble (single container) and carousel (multiple swipeable bubbles) layouts. Please be aware that this message will be sent to all users.",
    ja: "LINE公式アカウントと友だちになっているすべてのユーザーに、LINEで高度にカスタマイズ可能なフレックスメッセージを送信する。バブル（単一コンテナ）とカルーセル（複数のスワイプ可能なバブル）レイアウトに対応。このメッセージはすべてのユーザーに送信されます。",
  },
  annotations: {
    destructiveHint: true,
  },
  input: () =>
    z.object({
      message: flexMessageSchema,
    }),
  docs: {
    fields: [...flexMessageFields("message")],
  },
  run: async (ctx, { message }) => {
    try {
      const response = await ctx.clients.messaging.broadcast({
        messages: [message as unknown as messagingApi.Message],
      });
      return createSuccessResponse(response);
    } catch (error: unknown) {
      return createErrorResponse(
        `Failed to broadcast message: ${error instanceof Error ? error.message : String(error)}`,
      );
    }
  },
});
