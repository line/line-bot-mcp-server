import { describe, it, expect } from "vitest";
import { promises as fs } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const repoRoot = path.resolve(__dirname, "..", "..");

describe("sync-tool-artifacts generated files", () => {
  it("tool-registry.ts exists and is non-empty", async () => {
    const content = await fs.readFile(
      path.join(repoRoot, "src/generated/tool-registry.ts"),
      "utf8",
    );
    expect(content).toContain("TOOL_REGISTRY");
    expect(content).toContain("AUTO-GENERATED");
  });

  it("README.md tools section has generated markers", async () => {
    const content = await fs.readFile(path.join(repoRoot, "README.md"), "utf8");
    expect(content).toContain("<!-- GENERATED:TOOLS:START -->");
    expect(content).toContain("<!-- GENERATED:TOOLS:END -->");
    expect(content).toContain("push_text_message");
    expect(content).toContain("get_profile");
  });

  it("README.ja.md tools section has generated markers", async () => {
    const content = await fs.readFile(
      path.join(repoRoot, "README.ja.md"),
      "utf8",
    );
    expect(content).toContain("<!-- GENERATED:TOOLS:START -->");
    expect(content).toContain("<!-- GENERATED:TOOLS:END -->");
    expect(content).toContain("push_text_message");
  });

  it("manifest.json tools array includes all tools", async () => {
    const content = await fs.readFile(
      path.join(repoRoot, "manifest.json"),
      "utf8",
    );
    const manifest = JSON.parse(content);
    expect(manifest.tools).toBeInstanceOf(Array);
    expect(manifest.tools.length).toBeGreaterThanOrEqual(12);

    const names = manifest.tools.map((t: any) => t.name);
    expect(names).toContain("push_text_message");
    expect(names).toContain("create_rich_menu");
    expect(names).toContain("get_follower_ids");
  });

  it("manifest.json preserves non-tool fields", async () => {
    const content = await fs.readFile(
      path.join(repoRoot, "manifest.json"),
      "utf8",
    );
    const manifest = JSON.parse(content);
    expect(manifest.name).toBe("line-bot-mcp-server");
    expect(manifest.version).toBeDefined();
    expect(manifest.server).toBeDefined();
  });
});
