import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { messagingApi } from "@line/bot-sdk";
import { AbstractTool } from "./AbstractTool.js";
import { z } from "zod";
import { promises as fs } from "fs";
import path from "path";
import os from "os";

import { buffer } from "stream/consumers";

export default class DownloadRichMenuImage extends AbstractTool {
  private lineBlobClient: messagingApi.MessagingApiBlobClient;

  constructor(lineBlobClient: messagingApi.MessagingApiBlobClient) {
    super();
    this.lineBlobClient = lineBlobClient;
  }

  register(server: McpServer) {
    server.tool(
      "download_rich_menu_image",
      "Download the image of a rich menu.",
      {
        richMenuId: z.string().describe("The ID of the rich menu to download."),
      },
      async ({ richMenuId }) => {
        const response = await this.lineBlobClient.getRichMenuImage(richMenuId);
        const imageBuffer = await buffer(response);
        const imageType = "image/png";
        const imageBlob = new Blob([imageBuffer], { type: imageType });
        const imagePath = path.join(os.tmpdir(), `${richMenuId}.png`);
        await fs.writeFile(imagePath, imageBuffer);

        return { imagePath };
      },
    );
  }
}
