import type { messagingApi } from "@line/bot-sdk";
import { z } from "zod";
import {
  createErrorResponse,
  createSuccessResponse,
} from "../common/response.js";
import { defineLineTool } from "../tooling/lineTool.js";

export default defineLineTool({
  kind: "line-tool",
  name: "get_follower_ids",
  order: 12,
  summary: {
    en: "Get a list of user IDs of users who have added the LINE Official Account as a friend. This allows you to obtain user IDs for sending messages without manually preparing them.",
    ja: "LINE公式アカウントを友だち追加しているユーザーのユーザーIDリストを取得する。ユーザーIDを手動で準備せずにメッセージ送信用のIDを取得できる。",
  },
  annotations: {
    readOnlyHint: true,
  },
  input: () =>
    z.object({
      start: z
        .string()
        .optional()
        .describe(
          "Continuation token to get the next array of user IDs. Returned in the 'next' property of a previous response.",
        ),
      limit: z
        .number()
        .optional()
        .describe(
          "The maximum number of user IDs to retrieve in a single request.",
        ),
    }),
  docs: {
    fields: [
      {
        path: "start",
        type: "string?",
        description: {
          en: "Continuation token to get the next array of user IDs. Returned in the `next` property of a previous response.",
          ja: "次のユーザーID配列を取得するための継続トークン。前回のレスポンスの`next`プロパティから取得できる。",
        },
      },
      {
        path: "limit",
        type: "number?",
        description: {
          en: "The maximum number of user IDs to retrieve in a single request.",
          ja: "1回のリクエストで取得するユーザーIDの最大数。",
        },
      },
    ],
  },
  run: async (ctx, { start, limit }) => {
    try {
      const response = await ctx.clients.messaging.getFollowers(start, limit);
      return createSuccessResponse(response);
    } catch (error: unknown) {
      return createErrorResponse(
        `Failed to get follower IDs: ${error instanceof Error ? error.message : String(error)}`,
      );
    }
  },
});
