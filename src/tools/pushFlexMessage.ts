import { messagingApi } from "@line/bot-sdk";
import { z } from "zod";
import {
  createErrorResponse,
  createSuccessResponse,
} from "../common/response.js";
import { NO_USER_ID_ERROR } from "../common/schema/constants.js";
import { flexMessageSchema } from "../common/schema/flexMessage.js";
import { defineLineTool } from "../tooling/lineTool.js";
import { documented } from "../tooling/schemaDocs.js";

export default defineLineTool({
  kind: "line-tool",
  name: "push_flex_message",
  order: 2,
  title: "Push Flex Message",
  summary: {
    en: "Push a highly customizable flex message to a user via LINE. Supports both bubble (single container) and carousel (multiple swipeable bubbles) layouts.",
    ja: "LINEでユーザーに高度にカスタマイズ可能なフレックスメッセージを送信する。バブル（単一コンテナ）とカルーセル（複数のスワイプ可能なバブル）レイアウトに対応。",
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
      message: flexMessageSchema,
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
        `Failed to push flex message: ${error instanceof Error ? error.message : String(error)}`,
      );
    }
  },
});
