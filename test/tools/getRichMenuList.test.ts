import { describe, it, expect, afterEach, vi } from "vitest";
import { createToolHarness } from "../helpers/createToolHarness.js";
import getRichMenuListTool from "../../src/tools/getRichMenuList.js";

describe("get_rich_menu_list tool", () => {
  const resources: Array<{ close(): Promise<void> }> = [];

  afterEach(async () => {
    await Promise.all(resources.splice(0).map(resource => resource.close()));
  });

  it("returns the list of rich menus", async () => {
    const h = await createToolHarness(getRichMenuListTool);
    resources.push(h);

    const richMenus = {
      richmenus: [
        { richMenuId: "rm-1", name: "Menu 1" },
        { richMenuId: "rm-2", name: "Menu 2" },
      ],
    };
    vi.mocked(h.mocks.messaging.getRichMenuList).mockResolvedValue(
      richMenus as never,
    );

    const result = await h.client.callTool({
      name: "get_rich_menu_list",
      arguments: {},
    });

    expect(h.mocks.messaging.getRichMenuList).toHaveBeenCalled();
    expect(result.isError).toBeFalsy();
    const text = (result.content as Array<{ type: string; text: string }>)[0]
      .text;
    expect(JSON.parse(text)).toEqual(richMenus);
  });

  it("returns an error response when LINE API fails", async () => {
    const h = await createToolHarness(getRichMenuListTool);
    resources.push(h);

    vi.mocked(h.mocks.messaging.getRichMenuList).mockRejectedValue(
      new Error("API error"),
    );

    const result = await h.client.callTool({
      name: "get_rich_menu_list",
      arguments: {},
    });

    expect(result.isError).toBe(true);
    const text = (result.content as Array<{ type: string; text: string }>)[0]
      .text;
    expect(text).toContain("Failed to get rich menu list");
  });
});
