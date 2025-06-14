import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { messagingApi } from "@line/bot-sdk";
import {
  createErrorResponse,
  createSuccessResponse,
} from "../common/response.js";
import { AbstractTool } from "./AbstractTool.js";
import { z } from "zod";
import { Marp } from "@marp-team/marp-core";
import puppeteer from "puppeteer";
import fs from "fs";
import path from "path";
import os from "os";
import { fileURLToPath } from "url";
import { actionSchema } from "../common/schema/actionSchema.js";
import { promises as fsp } from "fs";

export default class CreateRichMenu extends AbstractTool {
  private client: messagingApi.MessagingApiClient;
  private lineBlobClient: messagingApi.MessagingApiBlobClient;

  constructor(
    client: messagingApi.MessagingApiClient,
    lineBlobClient: messagingApi.MessagingApiBlobClient,
  ) {
    super();
    this.client = client;
    this.lineBlobClient = lineBlobClient;
  }

  register(server: McpServer) {
    server.tool(
      "create_rich_menu",
      "Create a rich menu associated with your LINE Official Account.",
      {
        chatBarText: z.string().describe("The ID of the rich menu to create."),
        actions: z
          .array(actionSchema)
          .describe("The actions of the rich menu."),
      },
      async ({ chatBarText, actions }) => {
        let createRichMenuResponse: any = null;
        let setImageResponse: any = null;
        let setDefaultResponse: any = null;
        const templeteNo = actions.length;
        const lineActions = actions as messagingApi.Action[];
        try {
          const error = validateRichMenuImage(templeteNo);
          if (error) {
            return createErrorResponse(error);
          }

          // create rich menu
          const areas: Array<messagingApi.RichMenuArea> = richmenuAreas(
            templeteNo,
            lineActions,
          );
          const createRichMenuParams = {
            name: chatBarText,
            chatBarText: chatBarText,
            selected: false,
            size: {
              width: 1600,
              height: 910,
            },
          };
          createRichMenuResponse =
            await this.client.createRichMenu(createRichMenuParams);
          const richMenuId = createRichMenuResponse.richMenuId;

          // generate rich menu image
          const richMenuImagePath = await generateRichMenuImage(
            templeteNo,
            lineActions,
          );

          // upload rich menu image
          const imageBuffer = fs.readFileSync(richMenuImagePath);
          const imageType = "image/png";
          const imageBlob = new Blob([imageBuffer], { type: imageType });
          setImageResponse = await this.lineBlobClient.setRichMenuImage(
            richMenuId,
            imageBlob,
          );

          // set default rich menu
          setDefaultResponse = await this.client.setDefaultRichMenu(richMenuId);

          return createSuccessResponse({
            richMenuId,
            createRichMenuParams,
            createRichMenuResponse,
            setImageResponse,
            setDefaultResponse,
            richMenuImagePath,
          });
        } catch (error) {
          return createErrorResponse(
            `createRichMenuResponse: ${JSON.stringify(createRichMenuResponse, null, 2)}\n` +
              `setImageResponse: ${JSON.stringify(setImageResponse, null, 2)}\n` +
              `setDefaultResponse: ${JSON.stringify(setDefaultResponse, null, 2)}\n`,
          );
        }
      },
    );
  }
}

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Function to generate a rich menu image from a Markdown template
async function generateRichMenuImage(
  templeteNo: number,
  actions: messagingApi.Action[],
): Promise<string> {
  const richMenuImagePath = path.join(
    os.tmpdir(),
    `templete-0${templeteNo}-${Date.now()}.png`,
  );
  const serverPath =
    process.env.SERVER_PATH || path.resolve(__dirname, "..", "..");
  // 1. Read the Markdown template
  const srcPath = path.join(
    serverPath,
    `richmenu-templetes/templete-0${templeteNo}.md`,
  );
  let content = await fsp.readFile(srcPath, "utf8");
  for (let index = 0; index < actions.length; index++) {
    const pattern = new RegExp(`<h3>item0${index + 1}</h3>`, "g");
    content = content.replace(pattern, `<h3>${actions[index].label}</h3>`);
  }

  // 2. Convert Markdown to HTML using Marp
  const marp = new Marp();
  const { html, css } = marp.render(content);

  // 3. Save the HTML as a temporary file
  const htmlContent = `
    <html>
      <head>
        <style>${css}</style>
      </head>
      <body>${html}</body>
    </html>
  `;
  const tempHtmlPath = path.join(
    os.tmpdir(),
    `temp_marp_slide_${Date.now()}.html`,
  );
  await fsp.writeFile(tempHtmlPath, htmlContent, "utf8");

  // 4. Use puppeteer to convert HTML to PNG
  const browser = await puppeteer.launch();
  const page = await browser.newPage();
  await page.setViewport({ width: 1600, height: 910 });
  await page.goto(`file://${tempHtmlPath}`, {
    waitUntil: "networkidle0",
  });
  await page.screenshot({
    path: richMenuImagePath as `${string}.png`,
    clip: { x: 0, y: 0, width: 1600, height: 910 },
  });
  await browser.close();

  // 5. Delete the temporary HTML file
  await fsp.unlink(tempHtmlPath);

  return richMenuImagePath;
}

const validateRichMenuImage = (len: number): string | null => {
  if (len < 1 || len > 6) {
    return "Invalid texts length";
  }
  return null;
};

const richmenuAreas = (
  templeteNo: number,
  actions: messagingApi.Action[],
): messagingApi.RichMenuArea[] => {
  const bounds = richmenuBounds(templeteNo);
  return actions.map((action, index) => {
    return {
      bounds: bounds[index],
      action: action as messagingApi.Action,
    };
  });
};

const richmenuBounds = (templeteNo: number) => {
  const boundsMap: { x: number; y: number; width: number; height: number }[][] =
    [
      [],
      // templete-01
      [
        {
          x: 0,
          y: 0,
          width: 1600,
          height: 910,
        },
      ],
      // templete-02
      [0, 1].map(i => ({
        x: 455 * i,
        y: 0,
        width: 455,
        height: 910,
      })),
      // templete-03
      [
        {
          x: 0,
          y: 0,
          width: 800,
          height: 910,
        },
        ...[0, 1].map(i => ({
          x: 800 * i,
          y: 455,
          width: 800,
          height: 455,
        })),
      ],
      // templete-04
      [0, 1]
        .map(i =>
          [0, 1].map(j => ({
            x: 800 * i,
            y: 455 * j,
            width: 800,
            height: 455,
          })),
        )
        .flat(),
      // templete-05
      [
        {
          x: 0,
          y: 0,
          width: 1066,
          height: 910,
        },
        {
          x: 1066,
          y: 0,
          width: 533,
          height: 910,
        },
        ...[0, 1, 2].map(i => ({
          x: 533 * i,
          y: 455,
          width: 533,
          height: 455,
        })),
      ],
      // templete-06
      [0, 1]
        .map(i =>
          [0, 1, 2].map(j => ({
            x: 533 * j,
            y: 455 * i,
            width: 533,
            height: 455,
          })),
        )
        .flat(),
    ];

  return boundsMap[templeteNo];
};
