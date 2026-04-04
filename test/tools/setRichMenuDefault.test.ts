import { describe, it, expect, afterEach, vi } from "vitest";
import { createToolHarness } from "../helpers/createToolHarness.js";
import setRichMenuDefaultTool from "../../src/tools/setRichMenuDefault.js";

describe("set_rich_menu_default tool", () => {
  const resources: Array<{ close(): Promise<void> }> = [];

  afterEach(async () => {
    await Promise.all(resources.splice(0).map(resource => resource.close()));
  });

  it("calls setDefaultRichMenu with the correct richMenuId", async () => {
    const h = await createToolHarness(setRichMenuDefaultTool);
    resources.push(h);

    vi.mocked(h.mocks.messaging.setDefaultRichMenu).mockResolvedValue(
      {} as never,
    );

    const result = await h.client.callTool({
      name: "set_rich_menu_default",
      arguments: { richMenuId: "richmenu-123" },
    });

    expect(h.mocks.messaging.setDefaultRichMenu).toHaveBeenCalledWith(
      "richmenu-123",
    );
    expect(result.isError).toBeFalsy();
  });

  it("returns an error when LINE API fails", async () => {
    const h = await createToolHarness(setRichMenuDefaultTool);
    resources.push(h);

    vi.mocked(h.mocks.messaging.setDefaultRichMenu).mockRejectedValue(
      new Error("API error"),
    );

    const result = await h.client.callTool({
      name: "set_rich_menu_default",
      arguments: { richMenuId: "richmenu-unknown" },
    });

    expect(result.isError).toBe(true);
  });
});
