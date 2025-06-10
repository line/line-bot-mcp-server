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
import { promises as fs } from "fs";
import path from "path";
import os from "os";
import { fileURLToPath } from "url";
import { actionSchema } from "../common/schema/actionSchema.js";
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
        templateNumber: z.number().describe("The number of the template."),
        actions: z.array(actionSchema),
      },
      async ({ chatBarText, templateNumber, actions }) => {
        let createRichMenuResponse: any = null;
        let setImageResponse: any = null;
        try {
          const error = validateRichMenuImage(templateNumber, actions.length);
          if (error) {
            return createErrorResponse(error);
          }

          // initialize templete number
          templateNumber = initializeTempleteNumber(
            templateNumber,
            actions.length,
          );

          // create rich menu
          const bounds = richmenuBounds(templateNumber);
          const areas: Array<messagingApi.RichMenuArea> = actions.map(
            (action, index) => {
              // action.typeが'message'の場合、textプロパティがなければlabelで補完
              let areaAction = { ...action };
              if (areaAction.type === "message" && !areaAction.text) {
                areaAction.text = areaAction.label || "";
              }
              return {
                bounds: bounds[index],
                action: areaAction as messagingApi.Action,
              };
            },
          );

          createRichMenuResponse = await this.client.createRichMenu({
            name: chatBarText,
            chatBarText: chatBarText,
            selected: false,
            size: {
              width: 1600,
              height: 910,
            },
            areas: areas,
          });
          const richMenuId = createRichMenuResponse.richMenuId;

          // upload rich menu image
          const richMenuImagePath = await generateRichMenuImage(
            templateNumber,
            actions.map(action => action.label || ""),
          );
          const imageBuffer = await fs.readFile(richMenuImagePath);
          const imageType = "image/png";
          const imageBlob = new Blob([imageBuffer], { type: imageType });

          setImageResponse = await this.lineBlobClient.setRichMenuImage(
            richMenuId,
            imageBlob,
          );

          return createSuccessResponse({
            richMenuId,
            setImageResponse,
            richMenuImagePath,
            params: {
              name: chatBarText,
              chatBarText: chatBarText,
              selected: false,
              size: {
                width: 1600,
                height: 910,
              },
              areas: areas,
            },
          });
        } catch (error) {
          return createErrorResponse(
            `create richmenu: ${JSON.stringify(error, null, 2)}\n` +
              `createRichMenuResponse: ${JSON.stringify(createRichMenuResponse, null, 2)}\n` +
              `setImageResponse: ${JSON.stringify(setImageResponse, null, 2)}`,
          );
        }
      },
    );
  }
}

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Function to generate a rich menu image from a Markdown template
export async function generateRichMenuImage(
  templeteNumber: number,
  texts: string[],
): Promise<string> {
  const richMenuImagePath = path.join(
    os.tmpdir(),
    `slide-0${templeteNumber}-${Date.now()}.png`,
  );
  const serverPath =
    process.env.SERVER_PATH || path.resolve(__dirname, "..", "..");
  // 1. Read the Markdown template
  const srcPath = path.join(
    serverPath,
    `richmenu-templetes/templete-0${templeteNumber}.md`,
  );
  let content = await fs.readFile(srcPath, "utf8");
  for (let index = 0; index < texts.length; index++) {
    const pattern = new RegExp(`<h3>item0${index + 1}</h3>`, "g");
    content = content.replace(pattern, `<h3>${texts[index]}</h3>`);
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
  await fs.writeFile(tempHtmlPath, htmlContent);

  // 4. Use puppeteer to convert HTML to PNG
  const browser = await puppeteer.launch();
  const page = await browser.newPage();
  await page.setViewport({ width: 1600, height: 900 });
  await page.goto(`file://${tempHtmlPath}`, {
    waitUntil: "networkidle0",
  });
  await page.screenshot({
    path: richMenuImagePath as `${string}.png`,
    clip: { x: 0, y: 0, width: 1600, height: 910 },
  });
  await browser.close();

  // 5. Delete the temporary HTML file
  await fs.unlink(tempHtmlPath);

  return richMenuImagePath;
}

export const validateRichMenuImage = (
  templeteNumber: number,
  len: number,
): string | null => {
  if (templeteNumber < 1 || templeteNumber > 7) {
    return "Invalid templete number";
  }
  if (len < 1 || len > 6) {
    return "Invalid texts length";
  }
  return null;
};

export const initializeTempleteNumber = (
  templeteNumber: number,
  items: number,
): number => {
  if (!templeteNumber) {
    const templeteNumberMap = {
      // text length: templete number
      1: 7,
      2: 6,
      3: 4,
      4: 2,
    } as const;
    templeteNumber =
      templeteNumberMap[items as keyof typeof templeteNumberMap] || 1;
  }
  return templeteNumber;
};

export const richmenuBounds = (templeteNumber: number) => {
  const boundsMap: {
    [key: number]: { x: number; y: number; width: number; height: number }[];
  } = {
    1: [0, 1, 2]
      .map(i =>
        [0, 1].map(j => ({
          x: 533 * i,
          y: 450 * j,
          width: 533,
          height: 450,
        })),
      )
      .flat(),
    2: [0, 1]
      .map(i =>
        [0, 1].map(j => ({
          x: 800 * i,
          y: 450 * j,
          width: 800,
          height: 450,
        })),
      )
      .flat(),
    3: [
      {
        x: 0,
        y: 0,
        width: 1600,
        height: 450,
      },
      ...[0, 1, 2].map(i => ({
        x: 533 * i,
        y: 450,
        width: 533,
        height: 450,
      })),
    ],
    4: [
      {
        x: 0,
        y: 0,
        width: 800,
        height: 900,
      },
      ...[0, 1].map(i => ({
        x: 800 * i,
        y: 450,
        width: 800,
        height: 450,
      })),
    ],
    5: [0, 1].map(i => ({
      x: 0,
      y: 800 * i,
      width: 1600,
      height: 800,
    })),
    6: [0, 1].map(i => ({
      x: 450 * i,
      y: 0,
      width: 450,
      height: 900,
    })),
    7: [
      {
        x: 0,
        y: 0,
        width: 1600,
        height: 900,
      },
    ],
  };

  return boundsMap[templeteNumber];
};
