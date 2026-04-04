import { describe, it, expect, afterEach, vi } from "vitest";
import { createToolHarness } from "../helpers/createToolHarness.js";
import getProfileTool from "../../src/tools/getProfile.js";

describe("get_profile tool", () => {
  const resources: Array<{ close(): Promise<void> }> = [];

  afterEach(async () => {
    await Promise.all(resources.splice(0).map(resource => resource.close()));
  });

  it("calls getProfile with the correct userId", async () => {
    const h = await createToolHarness(getProfileTool);
    resources.push(h);

    const profileData = {
      displayName: "Test User",
      userId: "U_EXPLICIT_USER",
      pictureUrl: "https://example.com/pic.jpg",
      statusMessage: "Hello",
    };
    vi.mocked(h.mocks.messaging.getProfile).mockResolvedValue(
      profileData as never,
    );

    const result = await h.client.callTool({
      name: "get_profile",
      arguments: { userId: "U_EXPLICIT_USER" },
    });

    expect(h.mocks.messaging.getProfile).toHaveBeenCalledWith(
      "U_EXPLICIT_USER",
    );
    expect(result.isError).toBeFalsy();
    const text = (result.content as Array<{ type: string; text: string }>)[0]
      .text;
    expect(JSON.parse(text)).toEqual(profileData);
  });

  it("uses default destinationUserId when userId is omitted", async () => {
    const h = await createToolHarness(getProfileTool);
    resources.push(h);

    vi.mocked(h.mocks.messaging.getProfile).mockResolvedValue({} as never);

    await h.client.callTool({
      name: "get_profile",
      arguments: {},
    });

    expect(h.mocks.messaging.getProfile).toHaveBeenCalledWith("U_DEFAULT_USER");
  });

  it("returns an error response when LINE API fails", async () => {
    const h = await createToolHarness(getProfileTool);
    resources.push(h);

    vi.mocked(h.mocks.messaging.getProfile).mockRejectedValue(
      new Error("Not found"),
    );

    const result = await h.client.callTool({
      name: "get_profile",
      arguments: { userId: "U_UNKNOWN" },
    });

    expect(result.isError).toBe(true);
    const text = (result.content as Array<{ type: string; text: string }>)[0]
      .text;
    expect(text).toContain("Failed to get profile");
  });

  it("returns an error when userId is empty and no default is set", async () => {
    const h = await createToolHarness(getProfileTool, {
      destinationUserId: "",
    });
    resources.push(h);

    const result = await h.client.callTool({
      name: "get_profile",
      arguments: {},
    });

    expect(result.isError).toBe(true);
    const text = (result.content as Array<{ type: string; text: string }>)[0]
      .text;
    expect(text).toContain("userId");
  });
});
