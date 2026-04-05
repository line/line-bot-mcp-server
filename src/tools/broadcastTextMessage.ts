import { messagingApi } from "@line/bot-sdk";
import { z } from "zod";
import {
  createErrorResponse,
  createSuccessResponse,
} from "../common/response.js";
import { textMessageSchema } from "../common/schema/textMessage.js";
import { defineLineTool } from "../tooling/lineTool.js";

export default defineLineTool({
  kind: "line-tool",
  name: "broadcast_text_message",
  order: 3,
  title: "Broadcast Text Message",
  summary: {
    en: "Broadcast a simple text message via LINE to all users who have followed your LINE Official Account. Use this for sending plain text messages without formatting. Please be aware that this message will be sent to all users.",
    ja: "LINE公式アカウントと友だちになっているすべてのユーザーに、LINEでシンプルなテキストメッセージを送信する。書式設定なしのプレーンテキストメッセージの送信に使用。このメッセージはすべてのユーザーに送信されます。",
  },
  annotations: {
    destructiveHint: true,
  },
  input: () =>
    z.object({
      message: textMessageSchema,
    }),
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
