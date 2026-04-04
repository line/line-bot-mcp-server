import type { messagingApi } from "@line/bot-sdk";
import { z } from "zod";
import {
  createErrorResponse,
  createSuccessResponse,
} from "../common/response.js";
import { defineLineTool } from "../tooling/lineTool.js";

export default defineLineTool({
  kind: "line-tool",
  name: "set_rich_menu_default",
  order: 9,
  title: "Set Rich Menu Default",
  summary: {
    en: "Set a rich menu as the default rich menu.",
    ja: "リッチメニューをデフォルトとして設定する。",
  },
  annotations: {
    destructiveHint: true,
  },
  input: () =>
    z.object({
      richMenuId: z
        .string()
        .describe("The ID of the rich menu to set as default."),
    }),
  docs: {
    fields: [
      {
        path: "richMenuId",
        type: "string",
        description: {
          en: "The ID of the rich menu to set as default.",
          ja: "デフォルトとして設定するリッチメニューのID。",
        },
      },
    ],
  },
  run: async (ctx, { richMenuId }) => {
    try {
      const response =
        await ctx.clients.messaging.setDefaultRichMenu(richMenuId);
      return createSuccessResponse(response);
    } catch (error: unknown) {
      return createErrorResponse(
        `Failed to set default rich menu: ${error instanceof Error ? error.message : String(error)}`,
      );
    }
  },
});
