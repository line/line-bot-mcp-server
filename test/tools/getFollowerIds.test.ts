import { describe, it, expect, afterEach, vi } from "vitest";
import { createToolHarness } from "../helpers/createToolHarness.js";
import getFollowerIdsTool from "../../src/tools/getFollowerIds.js";

describe("get_follower_ids tool", () => {
  const resources: Array<{ close(): Promise<void> }> = [];

  afterEach(async () => {
    await Promise.all(resources.splice(0).map(resource => resource.close()));
  });

  it("calls getFollowers with the correct arguments", async () => {
    const h = await createToolHarness(getFollowerIdsTool);
    resources.push(h);

    const followerData = {
      userIds: ["U_USER_1", "U_USER_2"],
      next: "continuation_token",
    };
    vi.mocked(h.mocks.messaging.getFollowers).mockResolvedValue(
      followerData as never,
    );

    const result = await h.client.callTool({
      name: "get_follower_ids",
      arguments: { start: "token_abc", limit: 100 },
    });

    expect(h.mocks.messaging.getFollowers).toHaveBeenCalledWith(
      "token_abc",
      100,
    );
    expect(result.isError).toBeFalsy();
    const text = (result.content as Array<{ type: string; text: string }>)[0]
      .text;
    expect(JSON.parse(text)).toEqual(followerData);
  });

  it("calls getFollowers without optional parameters", async () => {
    const h = await createToolHarness(getFollowerIdsTool);
    resources.push(h);

    vi.mocked(h.mocks.messaging.getFollowers).mockResolvedValue({
      userIds: [],
    } as never);

    const result = await h.client.callTool({
      name: "get_follower_ids",
      arguments: {},
    });

    expect(h.mocks.messaging.getFollowers).toHaveBeenCalledWith(
      undefined,
      undefined,
    );
    expect(result.isError).toBeFalsy();
  });

  it("returns an error response when LINE API fails", async () => {
    const h = await createToolHarness(getFollowerIdsTool);
    resources.push(h);

    vi.mocked(h.mocks.messaging.getFollowers).mockRejectedValue(
      new Error("Forbidden"),
    );

    const result = await h.client.callTool({
      name: "get_follower_ids",
      arguments: {},
    });

    expect(result.isError).toBe(true);
    const text = (result.content as Array<{ type: string; text: string }>)[0]
      .text;
    expect(text).toContain("Failed to get follower IDs");
  });
});
