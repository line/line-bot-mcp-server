import type { messagingApi } from "@line/bot-sdk";
import { z } from "zod";
import {
  createErrorResponse,
  createSuccessResponse,
} from "../common/response.js";
import { defineLineTool } from "../tooling/lineTool.js";

export default defineLineTool({
  kind: "line-tool",
  name: "get_rich_menu_list",
  order: 7,
  title: "Get Rich Menu List",
  summary: {
    en: "Get the list of rich menus associated with your LINE Official Account.",
    ja: "LINE公式アカウントに登録されているリッチメニューの一覧を取得する。",
  },
  annotations: {
    readOnlyHint: true,
  },
  input: () => z.object({}),
  run: async ctx => {
    try {
      const response = await ctx.clients.messaging.getRichMenuList();
      return createSuccessResponse(response);
    } catch (error: unknown) {
      return createErrorResponse(
        `Failed to get rich menu list: ${error instanceof Error ? error.message : String(error)}`,
      );
    }
  },
});
