import { describe, it, expect, afterEach, vi } from "vitest";
import { createToolHarness } from "../helpers/createToolHarness.js";
import deleteRichMenuTool from "../../src/tools/deleteRichMenu.js";

describe("delete_rich_menu tool", () => {
  const resources: Array<{ close(): Promise<void> }> = [];

  afterEach(async () => {
    await Promise.all(resources.splice(0).map(resource => resource.close()));
  });

  it("calls deleteRichMenu with the correct richMenuId", async () => {
    const h = await createToolHarness(deleteRichMenuTool);
    resources.push(h);

    vi.mocked(h.mocks.messaging.deleteRichMenu).mockResolvedValue({} as never);

    const result = await h.client.callTool({
      name: "delete_rich_menu",
      arguments: { richMenuId: "richmenu-123" },
    });

    expect(h.mocks.messaging.deleteRichMenu).toHaveBeenCalledWith(
      "richmenu-123",
    );
    expect(result.isError).toBeFalsy();
  });

  it("returns an error response when LINE API fails", async () => {
    const h = await createToolHarness(deleteRichMenuTool);
    resources.push(h);

    vi.mocked(h.mocks.messaging.deleteRichMenu).mockRejectedValue(
      new Error("Not found"),
    );

    const result = await h.client.callTool({
      name: "delete_rich_menu",
      arguments: { richMenuId: "richmenu-unknown" },
    });

    expect(result.isError).toBe(true);
    const text = (result.content as Array<{ type: string; text: string }>)[0]
      .text;
    expect(text).toContain("Failed to delete rich menu");
  });
});
