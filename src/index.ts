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
import { LINE_BOT_MCP_SERVER_VERSION } from "./version.js";
import { createLineToolContext } from "./tooling/createLineToolContext.js";
import { registerAllLineTools } from "./tooling/lineTool.js";
import { TOOL_REGISTRY } from "./generated/tool-registry.js";

async function main() {
  if (!process.env.CHANNEL_ACCESS_TOKEN) {
    console.error("Please set CHANNEL_ACCESS_TOKEN");
    process.exit(1);
  }

  const server = new McpServer({
    name: "line-bot",
    version: LINE_BOT_MCP_SERVER_VERSION,
  });

  const ctx = createLineToolContext();
  registerAllLineTools(server, ctx, TOOL_REGISTRY);

  const transport = new StdioServerTransport();
  await server.connect(transport);
}

main().catch(error => {
  console.error("Fatal error in main():", error);
  process.exit(1);
});
