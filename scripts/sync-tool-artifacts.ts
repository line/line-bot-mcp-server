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
 * Why not import TOOL_REGISTRY and generate from that?
 *   tool-registry.ts is itself a generated file, so it can't exist
 *   before this script runs (chicken-and-egg). We must discover and
 *   import the individual tool files directly.
 *
 * Run: npm run generate:tools
 */

import path from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";
import { promises as fs } from "node:fs";
import { z } from "zod";
import type { LineTool, LineToolContext } from "../src/tooling/lineTool.js";

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

type ToolEntry = { file: string; tool: LineTool };

async function main() {
  // 1. Discover *.ts files, import them, keep only kind === "line-tool"
  const files = await discoverToolFiles(toolsDir);
  const entries = await loadToolEntries(files);

  // 2. Sort by order field (tools define their own position)
  entries.sort((a, b) => a.tool.order - b.tool.order);

  const sortedTools = entries.map(e => e.tool);

  // 3. Validate: no duplicate names, no invalid docs paths
  assertUniqueToolNames(sortedTools);
  validateDocsAgainstSchemas(sortedTools);

  // 4. Write all generated artifacts
  await writeGeneratedRegistry(entries);
  await syncReadme(readmePath, renderToolsMarkdown(sortedTools, "en"));
  await syncReadme(readmeJaPath, renderToolsMarkdown(sortedTools, "ja"));
  await syncManifest(sortedTools);

  console.log(`Synced ${sortedTools.length} tools.`);
}

/** Find all *.ts files in the given directory. */
async function discoverToolFiles(dir: string): Promise<string[]> {
  const entries = await fs.readdir(dir, { withFileTypes: true });
  return entries
    .filter(entry => entry.isFile() && entry.name.endsWith(".ts"))
    .map(entry => path.join(dir, entry.name))
    .sort((a, b) => a.localeCompare(b));
}

/** Dynamic-import each file, keep only those with kind === "line-tool". */
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

/** Fail if any tool name or order is duplicated, or missing a bilingual summary. */
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

/** Dummy context used only to build input schemas for validation. */
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

/**
 * For each tool, verify that every docs.fields[].path actually exists
 * in the Zod input schema. Catches typos like "user_id" vs "userId".
 */
function validateDocsAgainstSchemas(tools: LineTool[]) {
  const ctx = createDocContext();

  for (const tool of tools) {
    const schema = tool.input(ctx);

    for (const field of tool.docs.fields) {
      if (!schemaHasPath(schema, field.path)) {
        throw new Error(
          `Invalid docs path "${field.path}" in tool "${tool.name}"`,
        );
      }
    }
  }
}

function unwrapSchema(schema: z.ZodTypeAny): z.ZodTypeAny {
  if (schema instanceof z.ZodOptional) return unwrapSchema(schema.unwrap());
  if (schema instanceof z.ZodNullable) return unwrapSchema(schema.unwrap());
  if (schema instanceof z.ZodDefault)
    return unwrapSchema(schema.removeDefault());
  if (schema instanceof z.ZodEffects) return unwrapSchema(schema.innerType());
  return schema;
}

function schemaHasPath(schema: z.ZodTypeAny, dottedPath: string): boolean {
  return schemaHasPathParts(unwrapSchema(schema), dottedPath.split("."));
}

function schemaHasPathParts(schema: z.ZodTypeAny, parts: string[]): boolean {
  const current = unwrapSchema(schema);

  if (parts.length === 0) {
    return true;
  }

  const [head, ...tail] = parts;

  if (current instanceof z.ZodObject) {
    const next = current.shape[head];
    if (!next) return false;
    return tail.length === 0 ? true : schemaHasPathParts(next, tail);
  }

  if (current instanceof z.ZodArray) {
    return schemaHasPathParts(current.element, parts);
  }

  if (current instanceof z.ZodUnion) {
    return current._def.options.some((option: z.ZodTypeAny) =>
      schemaHasPathParts(option, parts),
    );
  }

  if (current instanceof z.ZodDiscriminatedUnion) {
    const options = Array.from(current.options.values()) as z.ZodTypeAny[];
    return options.some(option => schemaHasPathParts(option, parts));
  }

  if (current instanceof z.ZodLazy) {
    return schemaHasPathParts(current.schema, parts);
  }

  // Leaf types: no further nesting possible
  if (current instanceof z.ZodEnum || current instanceof z.ZodLiteral) {
    return parts.length === 0;
  }

  return false;
}

/** Derive a JS import name from a file path: broadcastFlexMessage.ts → broadcastFlexMessage */
function toolImportName(file: string): string {
  return path.basename(file, ".ts");
}

/** Generate src/generated/tool-registry.ts with sorted imports. */
async function writeGeneratedRegistry(toolEntries: ToolEntry[]) {
  const imports = toolEntries
    .map(({ file }) => {
      const name = toolImportName(file);
      const baseName = path.basename(file, ".ts");
      return `import ${name} from "../tools/${baseName}.js";`;
    })
    .join("\n");

  const entries = toolEntries
    .map(({ file }) => `  ${toolImportName(file)},`)
    .join("\n");

  const output = `/* AUTO-GENERATED BY scripts/sync-tool-artifacts.ts */
/* DO NOT EDIT DIRECTLY. */

import type { LineTool } from "../tooling/lineTool.js";
${imports ? `\n${imports}\n` : ""}
export const TOOL_REGISTRY: readonly LineTool[] = [
${entries}
];
`;

  await fs.mkdir(path.dirname(generatedRegistryPath), { recursive: true });
  await fs.writeFile(generatedRegistryPath, output, "utf8");
}

/** Render a numbered markdown list of tools for a README. */
function renderToolsMarkdown(tools: LineTool[], locale: "en" | "ja"): string {
  const inputLabel = locale === "en" ? "Inputs" : "入力";
  const noneLabel = locale === "en" ? "None" : "なし";

  return tools
    .map((tool, index) => {
      const num = `${index + 1}`;
      // Indent continuation lines to align with content after "N. "
      const indent = " ".repeat(num.length + 2);
      const summary = tool.summary[locale];
      const fields =
        tool.docs.fields.length === 0
          ? `${indent}- **${inputLabel}:** ${noneLabel}`
          : [
              `${indent}- **${inputLabel}:**`,
              ...tool.docs.fields.map(
                field =>
                  `${indent}  - \`${field.path}\` (${field.type}): ${field.description[locale]}`,
              ),
            ].join("\n");

      return `${num}. **${tool.name}**
${indent}- ${summary}
${fields}`;
    })
    .join("\n\n");
}

/** Replace content between GENERATED markers in a README file. */
async function syncReadme(filePath: string, toolsSectionBody: string) {
  const original = await fs.readFile(filePath, "utf8");
  const replacement = `${MARKER_START}\n${toolsSectionBody}\n${MARKER_END}`;
  const next = replaceBetweenMarkers(original, replacement);
  await fs.writeFile(filePath, next, "utf8");
}

function replaceBetweenMarkers(content: string, replacement: string): string {
  const startIndex = content.indexOf(MARKER_START);
  const endIndex = content.indexOf(MARKER_END);

  if (startIndex === -1 || endIndex === -1 || endIndex < startIndex) {
    throw new Error("README markers not found or malformed");
  }

  const before = content.slice(0, startIndex);
  const after = content.slice(endIndex + MARKER_END.length);

  return `${before}${replacement}${after}`;
}

/** Update only the "tools" array in manifest.json, preserving everything else. */
async function syncManifest(tools: LineTool[]) {
  const manifestRaw = await fs.readFile(manifestPath, "utf8");
  const manifest = JSON.parse(manifestRaw);

  manifest.tools = tools.map(tool => ({
    name: tool.name,
    description: tool.summary.en,
  }));

  await fs.writeFile(
    manifestPath,
    `${JSON.stringify(manifest, null, 2)}\n`,
    "utf8",
  );
}

main().catch(error => {
  console.error(error);
  process.exit(1);
});
