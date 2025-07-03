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
      "Create a rich menu based on the given actions." +
      "Generate and upload a rich menu image based on the given action." +
      "This rich menu will be registered as the default rich menu.",
      {
        chatBarText: z.string().describe("Text displayed in the chat bar and this is also used as name of the rich menu to create."),
        actions: z
          .array(actionSchema)
          .min(1)
          .max(6)
          .describe(
            "The actions array for the rich menu. Accepts 1-6 items." +
            "Each action defines a button's behavior in the rich menu layout." +
            "The buttons will be automatically arranged in a grid."
          ),
        richMenuAliasId: z
          .string()
          .describe(
            "The alias of the rich menu." +
            "This is required when creating a rich menu that can be switched to from another rich menu using the richmenuswitch action type." +
            "The alias serves as a unique identifier for the target rich menu",
          )
          .optional(),
      },
      async ({ chatBarText, actions, richMenuAliasId }) => {
        // Flow:
        // 1. Validate the rich menu image
        // 2. Create a rich menu
        // 3. Generate a rich menu image
        // 4. Upload the rich menu image
        // 5. Set the rich menu as the default rich menu
        // 6. Set the rich menu alias
        let createRichMenuResponse: any = null;
        let setImageResponse: any = null;
        let setDefaultResponse: any = null;
        let richMenuAliasResponse: any = null;
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

          // 6. Set the rich menu alias
          if (richMenuAliasId) {
            await this.client.deleteRichMenuAlias(richMenuAliasId);
            richMenuAliasResponse = await this.client.createRichMenuAlias({
              richMenuId,
              richMenuAliasId,
            });
          }

          return createSuccessResponse({
            message: "Rich menu created successfully and set as default.",
            richMenuId,
            richMenuAliasId,
            createRichMenuParams,
            createRichMenuResponse,
            setImageResponse,
            setDefaultResponse,
            richMenuImagePath,
            richMenuAliasResponse,
          });
        } catch (error) {
          return createErrorResponse(
            JSON.stringify({
              error,
              createRichMenuResponse,
              setImageResponse,
              setDefaultResponse,
              richMenuAliasResponse,
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
  // Flow:
  // 1. Read the Markdown template
  // 2. Convert Markdown to HTML using Marp
  // 3. Save the HTML as a temporary file
  // 4. Use puppeteer to convert HTML to PNG
  // 5. Delete the temporary HTML file
  const richMenuImagePath = path.join(
    os.tmpdir(),
    `templete-0${templateNo}-${Date.now()}.png`,
  );
  const serverPath =
    process.env.SERVER_PATH || path.resolve(__dirname, "..", "..");
  // 1. Read the Markdown template
  const srcPath = path.join(
    serverPath,
    `richmenu-templetes/templete-0${templateNo}.md`,
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
  await page.setViewport({ width: RICHMENU_WIDTH, height: RICHMENU_HEIGHT });
  await page.goto(`file://${tempHtmlPath}`, {
    waitUntil: "networkidle0",
  });
  await page.screenshot({
    path: richMenuImagePath as `${string}.png`,
    clip: { x: 0, y: 0, width: RICHMENU_WIDTH, height: RICHMENU_HEIGHT },
  });
  await browser.close();

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
      // templete-01
      [
        {
          x: 0,
          y: 0,
          width: RICHMENU_WIDTH,
          height: RICHMENU_HEIGHT,
        },
      ],
      // templete-02
      [0, 1].map(i => ({
        x: (RICHMENU_WIDTH / 2) * i,
        y: 0,
        width: RICHMENU_WIDTH / 2,
        height: RICHMENU_HEIGHT,
      })),
      // templete-03
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
      // templete-04
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
      // templete-05
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
      // templete-06
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
