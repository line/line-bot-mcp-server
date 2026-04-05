/**
 * sync-tool-artifacts.ts
 *
 * Single source of truth synchronizer.
 * Reads every src/tools/*.ts (filtered by kind === "line-tool"), then generates / updates:
 *
 *   1. src/generated/tool-registry.ts  — import list used by src/index.ts
 *   2. README.md   (tools section between markers)
 *   3. README.ja.md (tools section between markers)
 *   4. manifest.json (tools array only; other fields are preserved)
 *
 * Flags:
 *   --check   Dry-run mode. Reports which files are out of date and exits 1.
 *
 * Run: npm run generate:tools
 */

import path from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";
import { promises as fs } from "node:fs";
import type { LineTool, LineToolContext } from "../src/tooling/lineTool.js";
import { collectDocumentedFields } from "./lib/collect-fields.js";
import {
  buildRegistryContent,
  renderToolsMarkdown,
  buildManifestTools,
  type ToolEntry,
} from "./lib/render.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const repoRoot = path.resolve(__dirname, "..");
const toolsDir = path.join(repoRoot, "src", "tools");
const generatedRegistryPath = path.join(
  repoRoot,
  "src",
  "generated",
  "tool-registry.ts",
);
const readmePath = path.join(repoRoot, "README.md");
const readmeJaPath = path.join(repoRoot, "README.ja.md");
const manifestPath = path.join(repoRoot, "manifest.json");

const MARKER_START = "<!-- GENERATED:TOOLS:START -->";
const MARKER_END = "<!-- GENERATED:TOOLS:END -->";

const checkMode = process.argv.includes("--check");

const artifactPaths = [
  "src/generated/tool-registry.ts",
  "README.md",
  "README.ja.md",
  "manifest.json",
];

async function main() {
  const files = await discoverToolFiles(toolsDir);
  const entries = await loadToolEntries(files);

  entries.sort((a, b) => a.tool.order - b.tool.order);
  const sortedTools = entries.map(e => e.tool);

  assertUniqueToolNames(sortedTools);

  const ctx = createDocContext();
  const toolFields = new Map<
    string,
    ReturnType<typeof collectDocumentedFields>
  >();
  for (const tool of sortedTools) {
    toolFields.set(tool.name, collectDocumentedFields(tool.input(ctx), ""));
  }

  const changed = await Promise.all([
    writeIfChanged(generatedRegistryPath, buildRegistryContent(entries)),
    syncReadme(readmePath, renderToolsMarkdown(sortedTools, toolFields, "en")),
    syncReadme(
      readmeJaPath,
      renderToolsMarkdown(sortedTools, toolFields, "ja"),
    ),
    syncManifest(sortedTools),
  ]);

  if (checkMode) {
    const staleFiles = artifactPaths.filter((_, i) => changed[i]);
    if (staleFiles.length > 0) {
      console.error("Generated tool artifacts are out of date:");
      for (const file of staleFiles) console.error(`  - ${file}`);
      console.error(
        "\nRun the following to fix:\n  npm run generate:tools\n  git add " +
          staleFiles.join(" ") +
          "\n  git commit",
      );
      process.exit(1);
    }
  } else {
    console.log(`Synced ${sortedTools.length} tools.`);
  }
}

// ---------------------------------------------------------------------------
// File I/O
// ---------------------------------------------------------------------------

async function writeIfChanged(
  filePath: string,
  next: string,
): Promise<boolean> {
  let current: string | undefined;
  try {
    current = await fs.readFile(filePath, "utf8");
  } catch {
    // file does not exist yet
  }

  if (current === next) return false;

  if (!checkMode) {
    await fs.mkdir(path.dirname(filePath), { recursive: true });
    await fs.writeFile(filePath, next, "utf8");
  }
  return true;
}

// ---------------------------------------------------------------------------
// Tool discovery
// ---------------------------------------------------------------------------

async function discoverToolFiles(dir: string): Promise<string[]> {
  const entries = await fs.readdir(dir, { withFileTypes: true });
  return entries
    .filter(entry => entry.isFile() && entry.name.endsWith(".ts"))
    .map(entry => path.join(dir, entry.name))
    .sort((a, b) => a.localeCompare(b));
}

async function loadToolEntries(files: string[]): Promise<ToolEntry[]> {
  const modules = await Promise.all(
    files.map(file => import(pathToFileURL(file).href)),
  );

  const entries: ToolEntry[] = [];
  for (let i = 0; i < modules.length; i++) {
    const tool = modules[i].default as LineTool | undefined;
    if (tool && tool.kind === "line-tool") {
      entries.push({ file: files[i], tool });
    }
  }
  return entries;
}

// ---------------------------------------------------------------------------
// Validation
// ---------------------------------------------------------------------------

function assertUniqueToolNames(tools: LineTool[]) {
  const seenNames = new Set<string>();
  const seenOrders = new Map<number, string>();

  for (const tool of tools) {
    if (seenNames.has(tool.name)) {
      throw new Error(`Duplicate tool name: "${tool.name}"`);
    }
    seenNames.add(tool.name);

    const existing = seenOrders.get(tool.order);
    if (existing) {
      throw new Error(
        `Duplicate order ${tool.order}: "${tool.name}" conflicts with "${existing}"`,
      );
    }
    seenOrders.set(tool.order, tool.name);

    if (!tool.summary.en.trim() || !tool.summary.ja.trim()) {
      throw new Error(`Missing bilingual summary for tool: "${tool.name}"`);
    }
  }
}

// ---------------------------------------------------------------------------
// Artifact sync
// ---------------------------------------------------------------------------

function createDocContext(): LineToolContext {
  return {
    clients: {
      messaging: {} as any,
      blob: {} as any,
    },
    env: {
      channelAccessToken: "",
      destinationUserId: "",
      serverRootDir: repoRoot,
      puppeteerExecutablePath: undefined,
    },
  };
}

async function syncReadme(
  filePath: string,
  toolsSectionBody: string,
): Promise<boolean> {
  const original = await fs.readFile(filePath, "utf8");
  const replacement = `${MARKER_START}\n${toolsSectionBody}\n${MARKER_END}`;
  const startIndex = original.indexOf(MARKER_START);
  const endIndex = original.indexOf(MARKER_END);

  if (startIndex === -1 || endIndex === -1 || endIndex < startIndex) {
    throw new Error(`README markers not found or malformed in ${filePath}`);
  }

  const next =
    original.slice(0, startIndex) +
    replacement +
    original.slice(endIndex + MARKER_END.length);

  return writeIfChanged(filePath, next);
}

async function syncManifest(tools: LineTool[]): Promise<boolean> {
  const manifestRaw = await fs.readFile(manifestPath, "utf8");
  const manifest = JSON.parse(manifestRaw);
  manifest.tools = buildManifestTools(tools);
  return writeIfChanged(manifestPath, `${JSON.stringify(manifest, null, 2)}\n`);
}

main().catch(error => {
  console.error(error);
  process.exit(1);
});
