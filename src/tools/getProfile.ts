import type { messagingApi } from "@line/bot-sdk";
import { z } from "zod";
import {
  createErrorResponse,
  createSuccessResponse,
} from "../common/response.js";
import { NO_USER_ID_ERROR } from "../common/schema/constants.js";
import { defineLineTool } from "../tooling/lineTool.js";
import { documented } from "../tooling/schemaDocs.js";

export default defineLineTool({
  kind: "line-tool",
  name: "get_profile",
  order: 5,
  title: "Get Profile",
  summary: {
    en: "Get detailed profile information of a LINE user including display name, profile picture URL, status message and language.",
    ja: "LINEユーザーの詳細なプロフィール情報を取得する。表示名、プロフィール画像URL、ステータスメッセージ、言語を取得できる。",
  },
  annotations: {
    readOnlyHint: true,
  },
  input: ctx =>
    z.object({
      userId: documented(z.string().default(ctx.env.destinationUserId), {
        description: {
          en: "The ID of the user whose profile you want to retrieve. Defaults to DESTINATION_USER_ID.",
          ja: "プロフィールを取得したいユーザーのユーザーID。デフォルトは DESTINATION_USER_ID。",
        },
        typeLabel: "string?",
      }),
    }),
  run: async (ctx, { userId }) => {
    if (!userId) {
      return createErrorResponse(NO_USER_ID_ERROR);
    }

    try {
      const response = await ctx.clients.messaging.getProfile(userId);
      return createSuccessResponse(response);
    } catch (error: unknown) {
      return createErrorResponse(
        `Failed to get profile: ${error instanceof Error ? error.message : String(error)}`,
      );
    }
  },
});
