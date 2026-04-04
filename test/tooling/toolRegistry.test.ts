import { describe, it, expect } from "vitest";
import { TOOL_REGISTRY } from "../../src/generated/tool-registry.js";
import type { LineToolContext } from "../../src/tooling/lineTool.js";

function createDocContext(): LineToolContext {
  return {
    clients: { messaging: {} as any, blob: {} as any },
    env: {
      channelAccessToken: "",
      destinationUserId: "",
      serverRootDir: "/tmp",
    },
  };
}

describe("TOOL_REGISTRY", () => {
  it("has no duplicate tool names", () => {
    const names = TOOL_REGISTRY.map(t => t.name);
    expect(new Set(names).size).toBe(names.length);
  });

  it("each tool has kind === 'line-tool'", () => {
    for (const tool of TOOL_REGISTRY) {
      expect(tool.kind).toBe("line-tool");
    }
  });

  it("each tool's input(ctx) builds without error", () => {
    const ctx = createDocContext();
    for (const tool of TOOL_REGISTRY) {
      expect(() => tool.input(ctx)).not.toThrow();
    }
  });

  it("each tool has bilingual summaries", () => {
    for (const tool of TOOL_REGISTRY) {
      expect(tool.summary.en.trim().length).toBeGreaterThan(0);
      expect(tool.summary.ja.trim().length).toBeGreaterThan(0);
    }
  });

  it("contains at least 12 tools", () => {
    expect(TOOL_REGISTRY.length).toBeGreaterThanOrEqual(12);
  });
});
