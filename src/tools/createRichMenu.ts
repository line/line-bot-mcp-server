import { messagingApi, type MessageAPIResponseBase } from "@line/bot-sdk";
import { z } from "zod";
import {
  createErrorResponse,
  createSuccessResponse,
} from "../common/response.js";
import { actionSchema } from "../common/schema/actionSchema.js";
import { defineLineTool } from "../tooling/lineTool.js";
import { documented } from "../tooling/schemaDocs.js";
import { Marp } from "@marp-team/marp-core";
import puppeteer from "puppeteer";
import fs from "fs";
import path from "path";
import os from "os";
import { promises as fsp } from "fs";

const RICHMENU_HEIGHT = 910;
const RICHMENU_WIDTH = 1600;

export default defineLineTool({
  kind: "line-tool",
  name: "create_rich_menu",
  order: 11,
  title: "Create Rich Menu",
  summary: {
    en: "Create a rich menu based on the given actions. Generate and upload a rich menu image based on the given action. This rich menu will be registered as the default.",
    ja: "指定されたアクションに基づいてリッチメニューを作成。画像を生成してアップロード。このリッチメニューはデフォルトとして登録される。",
  },
  annotations: {
    destructiveHint: true,
  },
  input: () =>
    z.object({
      chatBarText: documented(z.string(), {
        description: {
          en: "Text displayed in chat bar, also used as rich menu name.",
          ja: "チャットバー表示、リッチメニュー名にされるテキスト。",
        },
        typeLabel: "string",
      }),
      actions: documented(z.array(actionSchema).min(1).max(6), {
        description: {
          en: "The actions of the rich menu. You can specify minimum 1 to maximum 6 actions.",
          ja: "リッチメニューのアクション。最小1つから最大6つのアクションを指定できる。",
        },
        typeLabel: "array",
      }),
    }),
  run: async (ctx, { chatBarText, actions }) => {
    // Flow:
    // 1. Validate the rich menu image
    // 2. Create a rich menu
    // 3. Generate a rich menu image
    // 4. Upload the rich menu image
    // 5. Set the rich menu as the default rich menu
    let createRichMenuResponse: messagingApi.RichMenuIdResponse | null = null;
    let setImageResponse: MessageAPIResponseBase | null = null;
    let setDefaultResponse: MessageAPIResponseBase | null = null;
    const lineActions = actions as messagingApi.Action[];
    try {
      // 1. Validate the rich menu image
      if (lineActions.length < 1 || lineActions.length > 6) {
        return createErrorResponse("Invalid actions length");
      }

      // 2. Create a rich menu
      const areas: Array<messagingApi.RichMenuArea> =
        richmenuAreas(lineActions);
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
        await ctx.clients.messaging.createRichMenu(createRichMenuParams);
      const richMenuId = createRichMenuResponse.richMenuId;

      // 3. Generate a rich menu image
      const richMenuImagePath = await generateRichMenuImage(lineActions, {
        serverRootDir: ctx.env.serverRootDir,
        puppeteerExecutablePath: ctx.env.puppeteerExecutablePath,
      });

      // 4. Upload the rich menu image
      const imageBuffer = fs.readFileSync(richMenuImagePath);
      const imageType = "image/png";
      const imageBlob = new Blob([imageBuffer], { type: imageType });
      setImageResponse = await ctx.clients.blob.setRichMenuImage(
        richMenuId,
        imageBlob,
      );

      // 5. Set the rich menu as the default rich menu
      setDefaultResponse =
        await ctx.clients.messaging.setDefaultRichMenu(richMenuId);

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
});

// Function to generate a rich menu image from a Markdown template
async function generateRichMenuImage(
  actions: messagingApi.Action[],
  options: {
    serverRootDir: string;
    puppeteerExecutablePath?: string;
  },
): Promise<string> {
  // Flow:
  // 1. Read the Markdown template
  // 2. Convert Markdown to HTML using Marp
  // 3. Save the HTML as a temporary file
  // 4. Use puppeteer to convert HTML to PNG
  // 5. Delete the temporary HTML file
  const templateNo = actions.length;
  const richMenuImagePath = path.join(
    os.tmpdir(),
    `template-0${templateNo}-${Date.now()}.png`,
  );
  // 1. Read the Markdown template
  const srcPath = path.join(
    options.serverRootDir,
    `richmenu-template/template-0${templateNo}.md`,
  );
  let content = await fsp.readFile(srcPath, "utf8");
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
            font-family: 'Noto Sans JP', 'IPAexGothic', 'IPAexMincho', 'Noto Sans CJK JP', sans-serif !important;
            box-sizing: border-box;
          }
          html, body {
            margin: 0;
            padding: 0;
            height: ${RICHMENU_HEIGHT}px;
            overflow: hidden;
          }
          h3 {
            font-weight: 500;
            line-height: 1.4;
            margin: 0;
            padding: 0.4em 0;
          }
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
  const browser = await puppeteer.launch({
    headless: true,
    executablePath: options.puppeteerExecutablePath || undefined,
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
  const page = await browser.newPage();
  await page.setViewport({ width: RICHMENU_WIDTH, height: RICHMENU_HEIGHT });
  await page.goto(`file://${tempHtmlPath}`, {
    waitUntil: "networkidle0",
  });

  // Wait for fonts to load
  await page.evaluate(() => document.fonts.ready);
  await new Promise(resolve => setTimeout(resolve, 2000));

  await page.screenshot({
    path: richMenuImagePath as `${string}.png`,
    clip: { x: 0, y: 0, width: RICHMENU_WIDTH, height: RICHMENU_HEIGHT },
  });
  await browser.close();

  // Save image to output directory
  const outputPath = path.join("/tmp", path.basename(richMenuImagePath));

  try {
    await fsp.copyFile(richMenuImagePath, outputPath);
  } catch (error) {
    console.warn(`Failed to save image to output directory: ${error}`);
  } finally {
    // 5. Delete the temporary HTML file
    await fsp.unlink(tempHtmlPath);
  }

  return richMenuImagePath;
}

const richmenuAreas = (
  actions: messagingApi.Action[],
): messagingApi.RichMenuArea[] => {
  const bounds = richmenuBounds(actions.length);
  return actions.map((action, index) => {
    return {
      bounds: bounds[index],
      action: action,
    };
  });
};

const richmenuBounds = (actionCount: number) => {
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
          y: (RICHMENU_HEIGHT / 2) * i,
          width: RICHMENU_WIDTH / 3,
          height: RICHMENU_HEIGHT / 2,
        })),
      ],
      // template-04
      [0, 1]
        .map(i =>
          [0, 1].map(j => ({
            x: (RICHMENU_WIDTH / 2) * j,
            y: (RICHMENU_HEIGHT / 2) * i,
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

  return boundsMap[actionCount];
};
