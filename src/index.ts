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
import CreateRichMenu from "./tools/createRichMenu.js";

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
new CreateRichMenu(messagingApiClient, lineBlobClient).register(server);

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
