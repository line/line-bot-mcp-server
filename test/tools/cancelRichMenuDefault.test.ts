import { describe, it, expect, afterEach, vi } from "vitest";
import { createToolHarness } from "../helpers/createToolHarness.js";
import cancelRichMenuDefaultTool from "../../src/tools/cancelRichMenuDefault.js";

describe("cancel_rich_menu_default tool", () => {
  const resources: Array<{ close(): Promise<void> }> = [];

  afterEach(async () => {
    await Promise.all(resources.splice(0).map(resource => resource.close()));
  });

  it("calls cancelDefaultRichMenu", async () => {
    const h = await createToolHarness(cancelRichMenuDefaultTool);
    resources.push(h);

    vi.mocked(h.mocks.messaging.cancelDefaultRichMenu).mockResolvedValue(
      {} as never,
    );

    const result = await h.client.callTool({
      name: "cancel_rich_menu_default",
      arguments: {},
    });

    expect(h.mocks.messaging.cancelDefaultRichMenu).toHaveBeenCalled();
    expect(result.isError).toBeFalsy();
  });

  it("returns an error when LINE API fails", async () => {
    const h = await createToolHarness(cancelRichMenuDefaultTool);
    resources.push(h);

    vi.mocked(h.mocks.messaging.cancelDefaultRichMenu).mockRejectedValue(
      new Error("API error"),
    );

    const result = await h.client.callTool({
      name: "cancel_rich_menu_default",
      arguments: {},
    });

    expect(result.isError).toBe(true);
  });
});
