import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";

export abstract class AbstractTool {
  /**
   * Registers the tool with the given MCP server.
   * @param server The MCP server to register the tool with.
   */
  abstract register(server: McpServer): void;
}
