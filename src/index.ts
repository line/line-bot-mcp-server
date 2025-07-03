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

const { McpServer } = require('@modelcontextprotocol/sdk/server');
const { StdioServerTransport } = require('@modelcontextprotocol/sdk/transport/stdio');
import * as line from '@line/bot-sdk';
import pkg from '../package.json' with { type: 'json' };
import { GetFollowerIdsTool } from './tools/getFollowerIds.js';
import { GetProfileTool } from './tools/getProfile.js';
import { GetMessageQuotaTool } from './tools/getMessageQuota.js';
import { PushTextMessageTool } from './tools/pushTextMessage.js';
import { PushFlexMessageTool } from './tools/pushFlexMessage.js';
import { BroadcastTextMessageTool } from './tools/broadcastTextMessage.js';
import { BroadcastFlexMessageTool } from './tools/broadcastFlexMessage.js';

const server = new McpServer({
  name: 'line-bot',
  version: pkg.version,
});

const channelAccessToken = process.env.CHANNEL_ACCESS_TOKEN || '';

const client = new line.messagingApi.MessagingApiClient({
  channelAccessToken: channelAccessToken,
  defaultHeaders: {
    'User-Agent': `${pkg.name}/${pkg.version}`,
  },
});

server.registerTool(new GetProfileTool(client));
server.registerTool(new GetMessageQuotaTool(client));
server.registerTool(new PushTextMessageTool(client));
server.registerTool(new PushFlexMessageTool(client));
server.registerTool(new BroadcastTextMessageTool(client));
server.registerTool(new BroadcastFlexMessageTool(client));
server.registerTool(new GetFollowerIdsTool(client));

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