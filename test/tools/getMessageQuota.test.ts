import { describe, it, expect, afterEach, vi } from "vitest";
import { createToolHarness } from "../helpers/createToolHarness.js";
import getMessageQuotaTool from "../../src/tools/getMessageQuota.js";

describe("get_message_quota tool", () => {
  const resources: Array<{ close(): Promise<void> }> = [];

  afterEach(async () => {
    await Promise.all(resources.splice(0).map(resource => resource.close()));
  });

  it("returns quota and consumption data", async () => {
    const h = await createToolHarness(getMessageQuotaTool);
    resources.push(h);

    vi.mocked(h.mocks.messaging.getMessageQuota).mockResolvedValue({
      type: "limited",
      value: 1000,
    } as never);
    vi.mocked(h.mocks.messaging.getMessageQuotaConsumption).mockResolvedValue({
      totalUsage: 250,
    } as never);

    const result = await h.client.callTool({
      name: "get_message_quota",
      arguments: {},
    });

    expect(h.mocks.messaging.getMessageQuota).toHaveBeenCalled();
    expect(h.mocks.messaging.getMessageQuotaConsumption).toHaveBeenCalled();
    expect(result.isError).toBeFalsy();
    const text = (result.content as Array<{ type: string; text: string }>)[0]
      .text;
    expect(JSON.parse(text)).toEqual({ limited: 1000, totalUsage: 250 });
  });

  it("returns an error when LINE API fails", async () => {
    const h = await createToolHarness(getMessageQuotaTool);
    resources.push(h);

    vi.mocked(h.mocks.messaging.getMessageQuota).mockRejectedValue(
      new Error("API error"),
    );

    const result = await h.client.callTool({
      name: "get_message_quota",
      arguments: {},
    });

    expect(result.isError).toBe(true);
  });
});
