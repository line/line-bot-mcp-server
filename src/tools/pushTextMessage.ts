import { messagingApi } from "@line/bot-sdk";
import { z } from "zod";
import {
  createErrorResponse,
  createSuccessResponse,
} from "../common/response.js";
import { NO_USER_ID_ERROR } from "../common/schema/constants.js";
import { textMessageSchema } from "../common/schema/textMessage.js";
import { defineLineTool } from "../tooling/lineTool.js";
import { documented } from "../tooling/schemaDocs.js";

export default defineLineTool({
  kind: "line-tool",
  name: "push_text_message",
  order: 1,
  title: "Push Text Message",
  summary: {
    en: "Push a simple text message to a user via LINE. Use this for sending plain text messages without formatting.",
    ja: "LINEでユーザーにシンプルなテキストメッセージを送信する。書式設定なしのプレーンテキストメッセージの送信に使用。",
  },
  annotations: {
    destructiveHint: true,
  },
  input: ctx =>
    z.object({
      userId: documented(z.string().default(ctx.env.destinationUserId), {
        description: {
          en: "The user ID to receive a message. Defaults to DESTINATION_USER_ID. Either `userId` or `DESTINATION_USER_ID` must be set.",
          ja: "メッセージ受信者のユーザーID。デフォルトは DESTINATION_USER_ID。`userId` または `DESTINATION_USER_ID` のどちらか一方が必要です。",
        },
        typeLabel: "string?",
      }),
      message: textMessageSchema,
    }),
  run: async (ctx, { userId, message }) => {
    if (!userId) {
      return createErrorResponse(NO_USER_ID_ERROR);
    }

    try {
      const response = await ctx.clients.messaging.pushMessage({
        to: userId,
        messages: [message as unknown as messagingApi.Message],
      });
      return createSuccessResponse(response);
    } catch (error: unknown) {
      return createErrorResponse(
        `Failed to push message: ${error instanceof Error ? error.message : String(error)}`,
      );
    }
  },
});
