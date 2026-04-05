import type { messagingApi } from "@line/bot-sdk";
import { z } from "zod";
import {
  createErrorResponse,
  createSuccessResponse,
} from "../common/response.js";
import { defineLineTool } from "../tooling/lineTool.js";
import { documented } from "../tooling/schemaDocs.js";

export default defineLineTool({
  kind: "line-tool",
  name: "delete_rich_menu",
  order: 8,
  title: "Delete Rich Menu",
  summary: {
    en: "Delete a rich menu from your LINE Official Account.",
    ja: "LINE公式アカウントからリッチメニューを削除する。",
  },
  annotations: {
    destructiveHint: true,
  },
  input: () =>
    z.object({
      richMenuId: documented(z.string(), {
        description: {
          en: "The ID of the rich menu to delete.",
          ja: "削除するリッチメニューのID。",
        },
        typeLabel: "string",
      }),
    }),
  run: async (ctx, { richMenuId }) => {
    try {
      const response = await ctx.clients.messaging.deleteRichMenu(richMenuId);
      return createSuccessResponse(response);
    } catch (error: unknown) {
      return createErrorResponse(
        `Failed to delete rich menu: ${error instanceof Error ? error.message : String(error)}`,
      );
    }
  },
});
