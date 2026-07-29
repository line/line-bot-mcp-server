import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { Client } from "@modelcontextprotocol/sdk/client/index.js";
import { InMemoryTransport } from "@modelcontextprotocol/sdk/inMemory.js";
import { createMockLineBotClient } from "../helpers/mock-line-clients.js";
import fs from "fs";
import os from "os";
import path from "path";
import UpdateRichMenuImage from "../../src/tools/updateRichMenuImage.js";

// Build a minimal PNG buffer whose IHDR header advertises the given dimensions.
// The pixel data is not real; only the header bytes are read by the tool.
function makePngBuffer(width: number, height: number): Buffer {
  const buffer = Buffer.alloc(33);
  // PNG signature
  Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]).copy(buffer, 0);
  // IHDR length + type (not strictly parsed, kept for realism)
  buffer.writeUInt32BE(13, 8);
  buffer.write("IHDR", 12, "ascii");
  buffer.writeUInt32BE(width, 16);
  buffer.writeUInt32BE(height, 20);
  return buffer;
}

function writeTempPng(width: number, height: number): string {
  const filePath = path.join(
    os.tmpdir(),
    `update-rich-menu-image-test-${Date.now()}-${Math.random().toString(36).slice(2)}.png`,
  );
  fs.writeFileSync(filePath, makePngBuffer(width, height));
  return filePath;
}

const OLD_RICH_MENU = {
  richMenuId: "richmenu-old-123",
  size: { width: 1600, height: 910 },
  selected: true,
  name: "My Menu",
  chatBarText: "Menu",
  areas: [
    {
      bounds: { x: 0, y: 0, width: 1600, height: 910 },
      action: { type: "message", text: "hi" },
    },
  ],
};

describe("update_rich_menu_image tool", () => {
  let client: Client;
  let server: McpServer;
  let mockLineClient: ReturnType<typeof createMockLineBotClient>;
  const tempFiles: string[] = [];

  function tempPng(width: number, height: number): string {
    const p = writeTempPng(width, height);
    tempFiles.push(p);
    return p;
  }

  beforeEach(async () => {
    mockLineClient = createMockLineBotClient();
    server = new McpServer({ name: "test", version: "0.0.1" });
    new UpdateRichMenuImage(mockLineClient).register(server);

    const [clientTransport, serverTransport] =
      InMemoryTransport.createLinkedPair();
    client = new Client({ name: "test-client", version: "0.0.1" });
    await Promise.all([
      client.connect(clientTransport),
      server.connect(serverTransport),
    ]);
  });

  afterEach(async () => {
    await client?.close();
    await server?.close();
    for (const f of tempFiles.splice(0)) {
      try {
        fs.unlinkSync(f);
      } catch {
        // ignore
      }
    }
  });

  function parseResult(result: Awaited<ReturnType<Client["callTool"]>>) {
    const text = (result.content as Array<{ type: string; text: string }>)[0]
      .text;
    return JSON.parse(text);
  }

  it("clones the menu, uploads the image, switches default and deletes the old menu", async () => {
    vi.mocked(mockLineClient.getRichMenu).mockResolvedValue(
      OLD_RICH_MENU as never,
    );
    vi.mocked(mockLineClient.createRichMenu).mockResolvedValue({
      richMenuId: "richmenu-new-456",
    } as never);
    vi.mocked(mockLineClient.setRichMenuImage).mockResolvedValue({} as never);
    vi.mocked(mockLineClient.getDefaultRichMenuId).mockResolvedValue({
      richMenuId: "richmenu-old-123",
    } as never);
    vi.mocked(mockLineClient.setDefaultRichMenu).mockResolvedValue({} as never);
    vi.mocked(mockLineClient.deleteRichMenu).mockResolvedValue({} as never);

    const imagePath = tempPng(1600, 910);
    const result = await client.callTool({
      name: "update_rich_menu_image",
      arguments: { richMenuId: "richmenu-old-123", imagePath },
    });

    expect(result.isError).toBeFalsy();
    expect(mockLineClient.createRichMenu).toHaveBeenCalledWith(
      expect.objectContaining({
        name: "My Menu",
        chatBarText: "Menu",
        selected: true,
        size: { width: 1600, height: 910 },
      }),
    );
    expect(mockLineClient.setRichMenuImage).toHaveBeenCalledWith(
      "richmenu-new-456",
      expect.any(Blob),
    );
    expect(mockLineClient.setDefaultRichMenu).toHaveBeenCalledWith(
      "richmenu-new-456",
    );
    expect(mockLineClient.deleteRichMenu).toHaveBeenCalledWith(
      "richmenu-old-123",
    );

    const parsed = parseResult(result);
    expect(parsed.oldRichMenuId).toBe("richmenu-old-123");
    expect(parsed.newRichMenuId).toBe("richmenu-new-456");
    expect(parsed.defaultSwitched).toBe(true);
    expect(parsed.oldRichMenuDeleted).toBe(true);
  });

  it("does not switch the default when the old menu was not the default", async () => {
    vi.mocked(mockLineClient.getRichMenu).mockResolvedValue(
      OLD_RICH_MENU as never,
    );
    vi.mocked(mockLineClient.createRichMenu).mockResolvedValue({
      richMenuId: "richmenu-new-456",
    } as never);
    vi.mocked(mockLineClient.setRichMenuImage).mockResolvedValue({} as never);
    vi.mocked(mockLineClient.getDefaultRichMenuId).mockResolvedValue({
      richMenuId: "richmenu-other-999",
    } as never);
    vi.mocked(mockLineClient.deleteRichMenu).mockResolvedValue({} as never);

    const imagePath = tempPng(1600, 910);
    const result = await client.callTool({
      name: "update_rich_menu_image",
      arguments: { richMenuId: "richmenu-old-123", imagePath },
    });

    expect(result.isError).toBeFalsy();
    expect(mockLineClient.setDefaultRichMenu).not.toHaveBeenCalled();
    const parsed = parseResult(result);
    expect(parsed.defaultSwitched).toBe(false);
    expect(parsed.oldRichMenuDeleted).toBe(true);
  });

  it("does not delete the old menu when deleteOldRichMenu is false", async () => {
    vi.mocked(mockLineClient.getRichMenu).mockResolvedValue(
      OLD_RICH_MENU as never,
    );
    vi.mocked(mockLineClient.createRichMenu).mockResolvedValue({
      richMenuId: "richmenu-new-456",
    } as never);
    vi.mocked(mockLineClient.setRichMenuImage).mockResolvedValue({} as never);
    vi.mocked(mockLineClient.getDefaultRichMenuId).mockResolvedValue({
      richMenuId: "richmenu-other-999",
    } as never);

    const imagePath = tempPng(1600, 910);
    const result = await client.callTool({
      name: "update_rich_menu_image",
      arguments: {
        richMenuId: "richmenu-old-123",
        imagePath,
        deleteOldRichMenu: false,
      },
    });

    expect(result.isError).toBeFalsy();
    expect(mockLineClient.deleteRichMenu).not.toHaveBeenCalled();
    const parsed = parseResult(result);
    expect(parsed.oldRichMenuDeleted).toBe(false);
  });

  it("returns an actionable error and does not create a menu when image size mismatches", async () => {
    vi.mocked(mockLineClient.getRichMenu).mockResolvedValue(
      OLD_RICH_MENU as never,
    );

    // Passes width/height/aspect-ratio checks but does not match the 1600x910 menu.
    const imagePath = tempPng(2000, 910);
    const result = await client.callTool({
      name: "update_rich_menu_image",
      arguments: { richMenuId: "richmenu-old-123", imagePath },
    });

    expect(result.isError).toBe(true);
    const text = (result.content as Array<{ type: string; text: string }>)[0]
      .text;
    expect(text).toContain("2000x910");
    expect(text).toContain("1600x910");
    expect(mockLineClient.createRichMenu).not.toHaveBeenCalled();
  });

  it("rolls back the newly created menu when the image upload fails", async () => {
    vi.mocked(mockLineClient.getRichMenu).mockResolvedValue(
      OLD_RICH_MENU as never,
    );
    vi.mocked(mockLineClient.createRichMenu).mockResolvedValue({
      richMenuId: "richmenu-new-456",
    } as never);
    vi.mocked(mockLineClient.setRichMenuImage).mockRejectedValue(
      new Error("upload failed"),
    );
    vi.mocked(mockLineClient.deleteRichMenu).mockResolvedValue({} as never);

    const imagePath = tempPng(1600, 910);
    const result = await client.callTool({
      name: "update_rich_menu_image",
      arguments: { richMenuId: "richmenu-old-123", imagePath },
    });

    expect(result.isError).toBe(true);
    expect(mockLineClient.deleteRichMenu).toHaveBeenCalledWith(
      "richmenu-new-456",
    );
    const text = (result.content as Array<{ type: string; text: string }>)[0]
      .text;
    expect(text).toContain("upload failed");
    expect(JSON.parse(text).rolledBack).toBe(true);
  });

  it("continues when getDefaultRichMenuId throws (no default set)", async () => {
    vi.mocked(mockLineClient.getRichMenu).mockResolvedValue(
      OLD_RICH_MENU as never,
    );
    vi.mocked(mockLineClient.createRichMenu).mockResolvedValue({
      richMenuId: "richmenu-new-456",
    } as never);
    vi.mocked(mockLineClient.setRichMenuImage).mockResolvedValue({} as never);
    vi.mocked(mockLineClient.getDefaultRichMenuId).mockRejectedValue(
      new Error("404 not found"),
    );
    vi.mocked(mockLineClient.deleteRichMenu).mockResolvedValue({} as never);

    const imagePath = tempPng(1600, 910);
    const result = await client.callTool({
      name: "update_rich_menu_image",
      arguments: { richMenuId: "richmenu-old-123", imagePath },
    });

    expect(result.isError).toBeFalsy();
    expect(mockLineClient.setDefaultRichMenu).not.toHaveBeenCalled();
    const parsed = parseResult(result);
    expect(parsed.defaultSwitched).toBe(false);
    expect(parsed.oldRichMenuDeleted).toBe(true);
  });
});
