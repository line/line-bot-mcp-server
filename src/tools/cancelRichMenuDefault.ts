import type { messagingApi } from "@line/bot-sdk";
import { z } from "zod";
import {
  createErrorResponse,
  createSuccessResponse,
} from "../common/response.js";
import { defineLineTool } from "../tooling/lineTool.js";

export default defineLineTool({
  kind: "line-tool",
  name: "cancel_rich_menu_default",
  order: 10,
  title: "Cancel Rich Menu Default",
  summary: {
    en: "Cancel the default rich menu.",
    ja: "デフォルトのリッチメニューを解除する。",
  },
  annotations: {
    destructiveHint: true,
  },
  input: () => z.object({}),
  docs: {
    fields: [],
  },
  run: async ctx => {
    try {
      const response = await ctx.clients.messaging.cancelDefaultRichMenu();
      return createSuccessResponse(response);
    } catch (error: unknown) {
      return createErrorResponse(
        `Failed to cancel default rich menu: ${error instanceof Error ? error.message : String(error)}`,
      );
    }
  },
});
