import { z } from "zod";
import type { LocalizedText } from "./lineTool.js";

const FIELD_DOC = Symbol("line-tool:field-doc");

export type SchemaFieldDoc = Readonly<{
  description: LocalizedText;
  typeLabel?: string;
}>;

type ZodWithFieldDoc = z.ZodTypeAny & {
  [FIELD_DOC]?: SchemaFieldDoc;
};

/**
 * Attach bilingual documentation metadata to a Zod schema node.
 * The English description is also set via `.describe()` so that
 * MCP clients see it in the JSON-Schema output.
 */
export function documented<T extends z.ZodTypeAny>(
  schema: T,
  doc: SchemaFieldDoc,
): T {
  const described = schema.describe(doc.description.en) as T;
  (described as ZodWithFieldDoc)[FIELD_DOC] = doc;
  return described;
}

export function getFieldDoc(schema: z.ZodTypeAny): SchemaFieldDoc | undefined {
  return (schema as ZodWithFieldDoc)[FIELD_DOC];
}
