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
import { z } from "zod";
import type { LineTool, LineToolContext } from "../src/tooling/lineTool.js";
import type { LocalizedText } from "../src/tooling/lineTool.js";
import { getFieldDoc } from "../src/tooling/schemaDocs.js";

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

type ToolEntry = { file: string; tool: LineTool };

type CollectedField = {
  path: string;
  type: string;
  description: LocalizedText;
};

async function main() {
  // 1. Discover *.ts files, import them, keep only kind === "line-tool"
  const files = await discoverToolFiles(toolsDir);
  const entries = await loadToolEntries(files);

  // 2. Sort by order field (tools define their own position)
  entries.sort((a, b) => a.tool.order - b.tool.order);

  const sortedTools = entries.map(e => e.tool);

  // 3. Validate: no duplicate names
  assertUniqueToolNames(sortedTools);

  // 4. Collect documented fields from schemas
  const ctx = createDocContext();
  const toolFields = new Map<string, CollectedField[]>();
  for (const tool of sortedTools) {
    const schema = tool.input(ctx);
    toolFields.set(tool.name, collectDocumentedFields(schema, ""));
  }

  // 5. Write / check all generated artifacts
  const changed = await Promise.all([
    writeIfChanged(generatedRegistryPath, buildRegistryContent(entries)),
    syncReadme(readmePath, renderToolsMarkdown(sortedTools, toolFields, "en")),
    syncReadme(
      readmeJaPath,
      renderToolsMarkdown(sortedTools, toolFields, "ja"),
    ),
    syncManifest(sortedTools),
  ]);

  const artifactPaths = [
    "src/generated/tool-registry.ts",
    "README.md",
    "README.ja.md",
    "manifest.json",
  ];
  const staleFiles = artifactPaths.filter((_, i) => changed[i]);

  if (checkMode && staleFiles.length > 0) {
    console.error("Generated tool artifacts are out of date:");
    for (const file of staleFiles) console.error(`- ${file}`);
    process.exit(1);
  }

  if (!checkMode) {
    console.log(`Synced ${sortedTools.length} tools.`);
  }
}

// ---------------------------------------------------------------------------
// File I/O helpers
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

// ---------------------------------------------------------------------------
// Validation
// ---------------------------------------------------------------------------

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

// ---------------------------------------------------------------------------
// Schema walking — collect documented() fields
// ---------------------------------------------------------------------------

/** Dummy context used only to build input schemas for documentation. */
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

function unwrapSchema(schema: z.ZodTypeAny): z.ZodTypeAny {
  if (schema instanceof z.ZodOptional) return unwrapSchema(schema.unwrap());
  if (schema instanceof z.ZodNullable) return unwrapSchema(schema.unwrap());
  if (schema instanceof z.ZodDefault)
    return unwrapSchema(schema.removeDefault());
  if (schema instanceof z.ZodEffects) return unwrapSchema(schema.innerType());
  return schema;
}

function inferZodType(schema: z.ZodTypeAny): string {
  const unwrapped = unwrapSchema(schema);

  if (unwrapped instanceof z.ZodString) return "string";
  if (unwrapped instanceof z.ZodNumber) return "number";
  if (unwrapped instanceof z.ZodBoolean) return "boolean";
  if (unwrapped instanceof z.ZodArray) return "array";
  if (unwrapped instanceof z.ZodObject) return "object";
  if (unwrapped instanceof z.ZodEnum) return "enum";
  if (unwrapped instanceof z.ZodLiteral) return String(unwrapped.value);
  if (unwrapped instanceof z.ZodUnion) return "union";
  if (unwrapped instanceof z.ZodDiscriminatedUnion) return "union";
  return "any";
}

function isOptionalLike(schema: z.ZodTypeAny): boolean {
  if (schema instanceof z.ZodOptional) return true;
  if (schema instanceof z.ZodDefault) return true;
  if (schema instanceof z.ZodNullable) return isOptionalLike(schema.unwrap());
  if (schema instanceof z.ZodEffects) return isOptionalLike(schema.innerType());
  return false;
}

/**
 * Walk a Zod schema recursively and collect fields that have
 * `documented()` metadata attached. Returns fields in traversal order.
 */
function collectDocumentedFields(
  schema: z.ZodTypeAny,
  prefix: string,
): CollectedField[] {
  const fields: CollectedField[] = [];
  const unwrapped = unwrapSchema(schema);

  if (unwrapped instanceof z.ZodObject) {
    for (const [key, value] of Object.entries(
      unwrapped.shape as Record<string, z.ZodTypeAny>,
    )) {
      const fieldPath = prefix ? `${prefix}.${key}` : key;
      const doc = getFieldDoc(value);

      if (doc) {
        const type =
          doc.typeLabel ??
          inferZodType(value) + (isOptionalLike(value) ? "?" : "");
        fields.push({
          path: fieldPath,
          type,
          description: doc.description,
        });
      }

      // Recurse into nested structures to find deeper documented fields
      fields.push(...collectDocumentedFields(value, fieldPath));
    }
  } else if (unwrapped instanceof z.ZodArray) {
    fields.push(...collectDocumentedFields(unwrapped.element, prefix));
  } else if (unwrapped instanceof z.ZodUnion) {
    for (const option of unwrapped._def.options as z.ZodTypeAny[]) {
      fields.push(...collectDocumentedFields(option, prefix));
    }
    deduplicateFields(fields);
  } else if (unwrapped instanceof z.ZodDiscriminatedUnion) {
    const options = Array.from(unwrapped.options.values()) as z.ZodTypeAny[];
    for (const option of options) {
      fields.push(...collectDocumentedFields(option, prefix));
    }
    deduplicateFields(fields);
  } else if (unwrapped instanceof z.ZodLazy) {
    // Don't recurse into lazy schemas to avoid infinite loops
  }

  return fields;
}

/** Remove duplicate paths, keeping the first occurrence. */
function deduplicateFields(fields: CollectedField[]): void {
  const seen = new Set<string>();
  let i = 0;
  while (i < fields.length) {
    if (seen.has(fields[i].path)) {
      fields.splice(i, 1);
    } else {
      seen.add(fields[i].path);
      i++;
    }
  }
}

// ---------------------------------------------------------------------------
// Code generation
// ---------------------------------------------------------------------------

/** Derive a JS import name from a file path: broadcastFlexMessage.ts → broadcastFlexMessage */
function toolImportName(file: string): string {
  return path.basename(file, ".ts");
}

/** Build the contents of src/generated/tool-registry.ts. */
function buildRegistryContent(toolEntries: ToolEntry[]): string {
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

  return `/* AUTO-GENERATED BY scripts/sync-tool-artifacts.ts */
/* DO NOT EDIT DIRECTLY. */

import type { LineTool } from "../tooling/lineTool.js";
${imports ? `\n${imports}\n` : ""}
export const TOOL_REGISTRY: readonly LineTool[] = [
${entries}
];
`;
}

/** Render a numbered markdown list of tools for a README. */
function renderToolsMarkdown(
  tools: LineTool[],
  toolFields: Map<string, CollectedField[]>,
  locale: "en" | "ja",
): string {
  const inputLabel = locale === "en" ? "Inputs" : "入力";
  const noneLabel = locale === "en" ? "None" : "なし";

  return tools
    .map((tool, index) => {
      const num = `${index + 1}`;
      // Indent continuation lines to align with content after "N. "
      const indent = " ".repeat(num.length + 2);
      const summary = tool.summary[locale];
      const fields = toolFields.get(tool.name) ?? [];
      const fieldsSection =
        fields.length === 0
          ? `${indent}- **${inputLabel}:** ${noneLabel}`
          : [
              `${indent}- **${inputLabel}:**`,
              ...fields.map(
                field =>
                  `${indent}  - \`${field.path}\` (${field.type}): ${field.description[locale]}`,
              ),
            ].join("\n");

      return `${num}. **${tool.name}**
${indent}- ${summary}
${fieldsSection}`;
    })
    .join("\n\n");
}

// ---------------------------------------------------------------------------
// Artifact sync
// ---------------------------------------------------------------------------

/** Replace content between GENERATED markers and write if changed. */
async function syncReadme(
  filePath: string,
  toolsSectionBody: string,
): Promise<boolean> {
  const original = await fs.readFile(filePath, "utf8");
  const replacement = `${MARKER_START}\n${toolsSectionBody}\n${MARKER_END}`;
  const next = replaceBetweenMarkers(original, replacement);
  return writeIfChanged(filePath, next);
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

/** Build updated manifest.json content and write if changed. */
async function syncManifest(tools: LineTool[]): Promise<boolean> {
  const manifestRaw = await fs.readFile(manifestPath, "utf8");
  const manifest = JSON.parse(manifestRaw);

  manifest.tools = tools.map(tool => ({
    name: tool.name,
    description: tool.summary.en,
  }));

  const next = `${JSON.stringify(manifest, null, 2)}\n`;
  return writeIfChanged(manifestPath, next);
}

main().catch(error => {
  console.error(error);
  process.exit(1);
});
