#!/usr/bin/env node

/**
 * Copyright 2025 LY Corporation
 *
 * LINE Corporation licenses this file to you under the Apache License,
 * version 2.0 (the "License"); you may not use this file except in compliance
 * with the License. You may obtain a copy of the License at:
 *
 *   https://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS, WITHOUT
 * WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied. See the
 * License for the specific language governing permissions and limitations
 * under the License.
 */

import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import * as line from "@line/bot-sdk";
import { LINE_BOT_MCP_SERVER_VERSION, USER_AGENT } from "./version.js";
import {
  generateRichMenuImage,
  validateRichMenuImage,
  initializeTempleteNumber,
  richmenuBounds,
} from "./utils/generateRichMenuImage.js";
import { z } from "zod";
import fs from "fs";

const NO_USER_ID_ERROR =
  "Error: Specify the userId or set the DESTINATION_USER_ID in the environment variables of this MCP Server.";
import CancelRichMenuDefault from "./tools/cancelRichMenuDefault.js";
import PushTextMessage from "./tools/pushTextMessage.js";
import PushFlexMessage from "./tools/pushFlexMessage.js";
import BroadcastTextMessage from "./tools/broadcastTextMessage.js";
import BroadcastFlexMessage from "./tools/broadcastFlexMessage.js";
import GetProfile from "./tools/getProfile.js";
import GetMessageQuota from "./tools/getMessageQuota.js";
import GetRichMenuList from "./tools/getRichMenuList.js";
import DeleteRichMenu from "./tools/deleteRichMenu.js";
import SetRichMenuDefault from "./tools/setRichMenuDefault.js";

const server = new McpServer({
  name: "line-bot",
  version: LINE_BOT_MCP_SERVER_VERSION,
});

const channelAccessToken = process.env.CHANNEL_ACCESS_TOKEN || "";
const destinationId = process.env.DESTINATION_USER_ID || "";

const messagingApiClient = new line.messagingApi.MessagingApiClient({
  channelAccessToken: channelAccessToken,
  defaultHeaders: {
    "User-Agent": USER_AGENT,
  },
});

const lineBlobClient = new line.messagingApi.MessagingApiBlobClient({
  channelAccessToken: channelAccessToken,
  defaultHeaders: {
    "User-Agent": USER_AGENT,
  },
});

function createErrorResponse(message: string) {
  return {
    isError: true,
    content: [
      {
        type: "text" as const,
        text: message,
      },
    ],
  };
}

function createSuccessResponse(response: object) {
  return {
    content: [
      {
        type: "text" as const,
        text: JSON.stringify(response),
      },
    ],
  };
}

const userIdSchema = z
  .string()
  .default(destinationId)
  .describe(
    "The user ID to receive a message. Defaults to DESTINATION_USER_ID.",
  );

const textMessageSchema = z.object({
  type: z.literal("text").default("text"),
  text: z
    .string()
    .max(5000)
    .describe("The plain text content to send to the user."),
});

const flexMessageSchema = z.object({
  type: z.literal("flex").default("flex"),
  altText: z
    .string()
    .describe("Alternative text shown when flex message cannot be displayed."),
  contents: z
    .object({
      type: z
        .enum(["bubble", "carousel"])
        .describe(
          "Type of the container. 'bubble' for single container, 'carousel' for multiple swipeable bubbles.",
        ),
    })
    .passthrough()
    .describe(
      "Flexible container structure following LINE Flex Message format. For 'bubble' type, can include header, " +
        "hero, body, footer, and styles sections. For 'carousel' type, includes an array of bubble containers in " +
        "the 'contents' property.",
    ),
});
// 代表的なAction型
const messageActionSchema = z.object({
  type: z.literal("message"),
  label: z.string(),
  text: z.string(),
});
const postbackActionSchema = z.object({
  type: z.literal("postback"),
  label: z.string(),
  data: z.string(),
  displayText: z.string().optional(),
});
const uriActionSchema = z.object({
  type: z.literal("uri"),
  label: z.string(),
  uri: z.string(),
});

// すべてのAction型をunion
const actionSchema = z.union([
  messageActionSchema,
  postbackActionSchema,
  uriActionSchema,
  // 必要に応じて他のAction型も追加
]);

new PushTextMessage(messagingApiClient, destinationId).register(server);
new PushFlexMessage(messagingApiClient, destinationId).register(server);
new BroadcastTextMessage(messagingApiClient).register(server);
new BroadcastFlexMessage(messagingApiClient).register(server);
new GetProfile(messagingApiClient, destinationId).register(server);
new GetMessageQuota(messagingApiClient).register(server);
new GetRichMenuList(messagingApiClient).register(server);
new DeleteRichMenu(messagingApiClient).register(server);
new SetRichMenuDefault(messagingApiClient).register(server);
new CancelRichMenuDefault(messagingApiClient).register(server);

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
      templateNumber = initializeTempleteNumber(templateNumber, actions.length);

      // create rich menu
      const bounds = richmenuBounds(templateNumber);
      const areas: Array<line.messagingApi.RichMenuArea> = actions.map(
        (action, index) => {
          // action.typeが'message'の場合、textプロパティがなければlabelで補完
          let areaAction = { ...action };
          if (areaAction.type === "message" && !areaAction.text) {
            areaAction.text = areaAction.label || "";
          }
          return {
            bounds: bounds[index],
            action: areaAction as line.messagingApi.Action,
          };
        },
      );
      createRichMenuResponse = await messagingApiClient.createRichMenu({
        name: chatBarText,
        chatBarText: chatBarText,
        selected: false,
        size: {
          width: 1600,
          height: 900,
        },
        areas: areas,
      });
      const richMenuId = createRichMenuResponse.richMenuId;

      // upload rich menu image
      const richMenuImagePath = await generateRichMenuImage(
        templateNumber,
        actions.map(action => action.label || ""),
      );
      const imageBuffer = fs.readFileSync(richMenuImagePath);
      const imageType = "image/png";
      const imageBlob = new Blob([imageBuffer], { type: imageType });

      setImageResponse = await lineBlobClient.setRichMenuImage(
        richMenuId,
        imageBlob,
      );

      return createSuccessResponse(setImageResponse);
    } catch (error) {
      return createErrorResponse(
        `create richmenu: ${JSON.stringify(error, null, 2)}\n` +
          `createRichMenuResponse: ${JSON.stringify(createRichMenuResponse, null, 2)}\n` +
          `setImageResponse: ${JSON.stringify(setImageResponse, null, 2)}`,
      );
    }
  },
);

server.tool(
  "generate_rich_menu_image",
  "Generate a rich menu image based on the user's request.",
  {
    templeteNumber: z
      .number()
      .optional()
      .describe(
        "The number of the templete. 1-7. If not specified, the number will be automatically determined based on the number of texts.",
      ),
    texts: z
      .array(z.string())
      .describe("The texts to be displayed on the slide. 1-6"),
  },
  async ({ templeteNumber, texts }) => {
    try {
      templeteNumber = initializeTempleteNumber(templeteNumber, texts.length);
      const error = validateRichMenuImage(templeteNumber, texts.length);
      if (error) {
        return createErrorResponse(error);
      }
      const richMenuImagePath = await generateRichMenuImage(
        templeteNumber,
        texts,
      );
      return createSuccessResponse({
        imagePath: richMenuImagePath,
        templeteNumber,
      });
    } catch (error) {
      return createErrorResponse(
        `Failed to generate rich menu image: ${error.message}`,
      );
    }
  },
);

async function main() {
  if (!process.env.CHANNEL_ACCESS_TOKEN) {
    console.error("Please set CHANNEL_ACCESS_TOKEN");
    process.exit(1);
  }

  const transport = new StdioServerTransport();
  await server.connect(transport);
}

main().catch(error => {
  console.error("Fatal error in main():", error);
  process.exit(1);
});
