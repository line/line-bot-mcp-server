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
import { z } from "zod";
import pkg from "../package.json" with { type: "json" };
import fs from "fs";
import { LINE_BOT_MCP_SERVER_VERSION, USER_AGENT } from "./version.js";

const NO_USER_ID_ERROR =
  "Error: Specify the userId or set the DESTINATION_USER_ID in the environment variables of this MCP Server.";

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
    "User-Agent": `${pkg.name}/${pkg.version}`,
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

server.tool(
  "push_text_message",
  "Push a simple text message to a user via LINE. Use this for sending plain text messages without formatting.",
  {
    userId: userIdSchema,
    message: textMessageSchema,
  },
  async ({ userId, message }) => {
    if (!userId) {
      return createErrorResponse(NO_USER_ID_ERROR);
    }

    try {
      const response = await messagingApiClient.pushMessage({
        to: userId,
        messages: [message as unknown as line.messagingApi.Message],
      });
      return createSuccessResponse(response);
    } catch (error) {
      return createErrorResponse(`Failed to push message: ${error.message}`);
    }
  },
);

server.tool(
  "push_flex_message",
  "Push a highly customizable flex message to a user via LINE. Supports both bubble (single container) and carousel " +
    "(multiple swipeable bubbles) layouts.",
  {
    userId: userIdSchema,
    message: flexMessageSchema,
  },
  async ({ userId, message }) => {
    if (!userId) {
      return createErrorResponse(NO_USER_ID_ERROR);
    }

    try {
      const response = await messagingApiClient.pushMessage({
        to: userId,
        messages: [message as unknown as line.messagingApi.Message],
      });
      return createSuccessResponse(response);
    } catch (error) {
      return createErrorResponse(
        `Failed to push flex message: ${error.message}`,
      );
    }
  },
);

server.tool(
  "broadcast_text_message",
  "Broadcast a simple text message via LINE to all users who have followed your LINE Official Account. Use this for sending " +
    "plain text messages without formatting. Please be aware that this message will be sent to all users.",
  {
    message: textMessageSchema,
  },
  async ({ message }) => {
    try {
      const response = await messagingApiClient.broadcast({
        messages: [message as unknown as line.messagingApi.Message],
      });
      return createSuccessResponse(response);
    } catch (error) {
      return createErrorResponse(
        `Failed to broadcast message: ${error.message}`,
      );
    }
  },
);

server.tool(
  "broadcast_flex_message",
  "Broadcast a highly customizable flex message via LINE to all users who have added your LINE Official Account. " +
    "Supports both bubble (single container) and carousel (multiple swipeable bubbles) layouts. Please be aware that " +
    "this message will be sent to all users.",
  {
    message: flexMessageSchema,
  },
  async ({ message }) => {
    try {
      const response = await messagingApiClient.broadcast({
        messages: [message as unknown as line.messagingApi.Message],
      });
      return createSuccessResponse(response);
    } catch (error) {
      return createErrorResponse(
        `Failed to broadcast message: ${error.message}`,
      );
    }
  },
);

server.tool(
  "get_profile",
  "Get detailed profile information of a LINE user including display name, profile picture URL, status message and language.",
  {
    userId: userIdSchema,
  },
  async ({ userId }) => {
    if (!userId) {
      return createErrorResponse(NO_USER_ID_ERROR);
    }

    try {
      const response = await messagingApiClient.getProfile(userId);
      return createSuccessResponse(response);
    } catch (error) {
      return createErrorResponse(`Failed to get profile: ${error.message}`);
    }
  },
);

server.tool(
  "get_message_quota",
  "Get the message quota and consumption of the LINE Official Account. This shows the monthly message limit and current usage.",
  {},
  async () => {
    const messageQuotaResponse = await messagingApiClient.getMessageQuota();
    const messageQuotaConsumptionResponse =
      await messagingApiClient.getMessageQuotaConsumption();
    const response = {
      limited: messageQuotaResponse.value,
      totalUsage: messageQuotaConsumptionResponse.totalUsage,
    };
    return createSuccessResponse(response);
  },
);

server.tool(
  "get_rich_menu_list",
  "Get the list of rich menus associated with your LINE Official Account.",
  {},
  async () => {
    try {
      const response = await messagingApiClient.getRichMenuList();
      return createSuccessResponse(response);
    } catch (error) {
      return createErrorResponse(
        `Failed to broadcast message: ${error.message}`,
      );
    }
  },
);

server.tool(
  "delete_rich_menu",
  "Delete a rich menu from your LINE Official Account.",
  {
    richMenuId: z.string().describe("The ID of the rich menu to delete."),
  },
  async ({ richMenuId }) => {
    try {
      const response = await messagingApiClient.deleteRichMenu(richMenuId);
      return createSuccessResponse(response);
    } catch (error) {
      return createErrorResponse(
        `Failed to delete rich menu: ${error.message}`,
      );
    }
  },
);

server.tool(
  "set_rich_menu_image",
  "Update a rich menu associated with your LINE Official Account.",
  {
    richMenuId: z.string().describe("The ID of the rich menu to update."),
    imagePath: z.string().describe("The path of the image to update."),
  },
  async ({ richMenuId, imagePath }) => {
    try {
      const imageBuffer = fs.readFileSync(imagePath);
      const imageType = "image/png";
      const imageBlob = new Blob([imageBuffer], { type: imageType });

      const response = await lineBlobClient.setRichMenuImage(
        richMenuId,
        imageBlob,
      );
      return createSuccessResponse(response);
    } catch (error) {
      return createErrorResponse(
        `Failed to update rich menu: ${error.message}`,
      );
    }
  },
);

server.tool(
  "set_rich_menu_default",
  "Set a rich menu as the default rich menu.",
  {
    richMenuId: z
      .string()
      .describe("The ID of the rich menu to set as default."),
  },
  async ({ richMenuId }) => {
    const response = await messagingApiClient.setDefaultRichMenu(richMenuId);
    return createSuccessResponse(response);
  },
);

server.tool(
  "cancel_rich_menu_default",
  "Cancel the default rich menu.",
  {},
  async () => {
    const response = await messagingApiClient.cancelDefaultRichMenu();
    return createSuccessResponse(response);
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
