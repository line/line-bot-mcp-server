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

const RICHMENU_HEIGHT = 910;
const RICHMENU_WIDTH = 1600;

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
        // Flow:
        // 1. Validate the rich menu image
        // 2. Create a rich menu
        // 3. Generate a rich menu image
        // 4. Upload the rich menu image
        // 5. Set the rich menu as the default rich menu
        let createRichMenuResponse: any = null;
        let setImageResponse: any = null;
        let setDefaultResponse: any = null;
        const lineActions = actions as messagingApi.Action[];
        const templateNo = lineActions.length;
        try {
          // 1. Validate the rich menu image
          if (templateNo < 1 || templateNo > 6) {
            return createErrorResponse("Invalid texts length");
          }

          // 2. Create a rich menu
          const areas: Array<messagingApi.RichMenuArea> = richmenuAreas(
            templateNo,
            lineActions,
          );
          const createRichMenuParams = {
            name: chatBarText,
            chatBarText,
            selected: true,
            size: {
              width: RICHMENU_WIDTH,
              height: RICHMENU_HEIGHT,
            },
            areas,
          };
          createRichMenuResponse =
            await this.client.createRichMenu(createRichMenuParams);
          const richMenuId = createRichMenuResponse.richMenuId;

          // 3. Generate a rich menu image
          const richMenuImagePath = await generateRichMenuImage(
            templateNo,
            lineActions,
          );

          // 4. Upload the rich menu image
          const imageBuffer = fs.readFileSync(richMenuImagePath);
          const imageType = "image/png";
          const imageBlob = new Blob([imageBuffer], { type: imageType });
          setImageResponse = await this.lineBlobClient.setRichMenuImage(
            richMenuId,
            imageBlob,
          );

          // 5. Set the rich menu as the default rich menu
          setDefaultResponse = await this.client.setDefaultRichMenu(richMenuId);

          return createSuccessResponse({
            message: "Rich menu created successfully and set as default.",
            richMenuId,
            createRichMenuParams,
            createRichMenuResponse,
            setImageResponse,
            setDefaultResponse,
            richMenuImagePath,
          });
        } catch (error) {
          console.error("Rich menu creation error:", error);
          return createErrorResponse(
            JSON.stringify({
              error: error instanceof Error ? error.message : String(error),
              stack: error instanceof Error ? error.stack : undefined,
              createRichMenuResponse,
              setImageResponse,
              setDefaultResponse,
            }),
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
  templateNo: number,
  actions: messagingApi.Action[],
): Promise<string> {
  console.log(
    `Generating rich menu image for template ${templateNo} with ${actions.length} actions`,
  );
  // Flow:
  // 1. Read the Markdown template
  // 2. Convert Markdown to HTML using Marp
  // 3. Save the HTML as a temporary file
  // 4. Use puppeteer to convert HTML to PNG
  // 5. Delete the temporary HTML file
  const richMenuImagePath = path.join(
    os.tmpdir(),
    `template-0${templateNo}-${Date.now()}.png`,
  );
  const serverPath =
    process.env.SERVER_PATH || path.resolve(__dirname, "..", "..");
  // 1. Read the Markdown template
  const srcPath = path.join(
    serverPath,
    `richmenu-template/template-0${templateNo}.md`,
  );
  console.log(`Reading template from: ${srcPath}`);
  console.log(`Server path: ${serverPath}`);
  let content = await fsp.readFile(srcPath, "utf8");
  console.log(`Template content length: ${content.length}`);
  for (let index = 0; index < actions.length; index++) {
    const pattern = new RegExp(`<h3>item0${index + 1}</h3>`, "g");
    content = content.replace(pattern, `<h3>${actions[index].label}</h3>`);
  }

  // 2. Convert Markdown to HTML using Marp
  const marp = new Marp();
  const { html, css } = marp.render(content);

  // 3. Save the HTML as a temporary file with Japanese font support
  const htmlContent = `
    <!doctype html>
    <html lang="ja">
      <head>
        <meta charset="UTF-8">
        <style>
          ${css}
          * {
            font-family: 'IPAexGothic', 'IPAexMincho', 'Noto Sans CJK JP', 'Noto Sans JP', 'Yu Gothic UI', 'Yu Gothic', 'Meiryo UI', 'Meiryo', 'MS UI Gothic', sans-serif !important;
          }
          html, body { margin: 0; padding: 0; }
        </style>
      </head>
      <body>${html}</body>
    </html>
  `;
  const tempHtmlPath = path.join(
    os.tmpdir(),
    `temp_marp_slide_${Date.now()}.html`,
  );
  await fsp.writeFile(tempHtmlPath, htmlContent, "utf8");

  // 4. Use puppeteer to convert HTML to PNG with Docker-compatible settings
  console.log(
    `Launching Puppeteer with executable: ${process.env.PUPPETEER_EXECUTABLE_PATH || "default"}`,
  );
  const browser = await puppeteer.launch({
    headless: true,
    executablePath: process.env.PUPPETEER_EXECUTABLE_PATH || undefined,
    args: [
      "--no-sandbox",
      "--disable-setuid-sandbox",
      "--disable-dev-shm-usage",
      "--disable-gpu",
      "--disable-web-security",
      "--disable-features=VizDisplayCompositor",
      "--no-first-run",
      "--no-default-browser-check",
      "--disable-default-apps",
      "--disable-extensions",
    ],
  });
  console.log("Puppeteer browser launched successfully");
  const page = await browser.newPage();
  await page.setViewport({ width: RICHMENU_WIDTH, height: RICHMENU_HEIGHT });
  await page.goto(`file://${tempHtmlPath}`, {
    waitUntil: "networkidle0",
  });

  // Wait for fonts to load
  await page.evaluate(() => document.fonts.ready);
  await new Promise(resolve => setTimeout(resolve, 2000));

  console.log(`Taking screenshot to: ${richMenuImagePath}`);
  await page.screenshot({
    path: richMenuImagePath as `${string}.png`,
    clip: { x: 0, y: 0, width: RICHMENU_WIDTH, height: RICHMENU_HEIGHT },
  });
  console.log("Screenshot taken successfully");
  await browser.close();

  // Save image to output directory
  const outputPath = path.join("/tmp", path.basename(richMenuImagePath));

  try {
    await fsp.copyFile(richMenuImagePath, outputPath);
    console.log(`Rich menu image saved to: ${outputPath}`);
  } catch (error) {
    console.warn(`Failed to save image to output directory: ${error}`);
  }

  // 5. Delete the temporary HTML file
  await fsp.unlink(tempHtmlPath);

  return richMenuImagePath;
}

const richmenuAreas = (
  templateNo: number,
  actions: messagingApi.Action[],
): messagingApi.RichMenuArea[] => {
  const bounds = richmenuBounds(templateNo);
  return actions.map((action, index) => {
    return {
      bounds: bounds[index],
      action: action,
    };
  });
};

const richmenuBounds = (templateNo: number) => {
  const boundsMap: { x: number; y: number; width: number; height: number }[][] =
    [
      [],
      // template-01
      [
        {
          x: 0,
          y: 0,
          width: RICHMENU_WIDTH,
          height: RICHMENU_HEIGHT,
        },
      ],
      // template-02
      [0, 1].map(i => ({
        x: (RICHMENU_WIDTH / 2) * i,
        y: 0,
        width: RICHMENU_WIDTH / 2,
        height: RICHMENU_HEIGHT,
      })),
      // template-03
      [
        {
          x: 0,
          y: 0,
          width: (RICHMENU_WIDTH / 3) * 2,
          height: RICHMENU_HEIGHT,
        },
        ...[0, 1].map(i => ({
          x: (RICHMENU_WIDTH / 3) * 2,
          y: (RICHMENU_HEIGHT / 3) * i,
          width: RICHMENU_WIDTH / 3,
          height: RICHMENU_HEIGHT / 2,
        })),
      ],
      // template-04
      [0, 1]
        .map(i =>
          [0, 1].map(j => ({
            x: (RICHMENU_WIDTH / 2) * i,
            y: (RICHMENU_HEIGHT / 2) * j,
            width: RICHMENU_WIDTH / 2,
            height: RICHMENU_HEIGHT / 2,
          })),
        )
        .flat(),
      // template-05
      [
        {
          x: 0,
          y: 0,
          width: (RICHMENU_WIDTH / 3) * 2,
          height: RICHMENU_HEIGHT / 2,
        },
        {
          x: (RICHMENU_WIDTH / 3) * 2,
          y: 0,
          width: RICHMENU_WIDTH / 3,
          height: RICHMENU_HEIGHT / 2,
        },
        ...[0, 1, 2].map(i => ({
          x: (RICHMENU_WIDTH / 3) * i,
          y: RICHMENU_HEIGHT / 2,
          width: RICHMENU_WIDTH / 3,
          height: RICHMENU_HEIGHT / 2,
        })),
      ],
      // template-06
      [0, 1]
        .map(i =>
          [0, 1, 2].map(j => ({
            x: (RICHMENU_WIDTH / 3) * j,
            y: (RICHMENU_HEIGHT / 2) * i,
            width: RICHMENU_WIDTH / 3,
            height: RICHMENU_HEIGHT / 2,
          })),
        )
        .flat(),
    ];

  return boundsMap[templateNo];
};
