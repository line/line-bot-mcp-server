import { McpServer } from "@modelcontextprotocol/server";

export abstract class AbstractTool {
  /**
   * Registers the tool with the given MCP server.
   * @param server The MCP server to register the tool with.
   */
  abstract register(server: McpServer): void;
}
