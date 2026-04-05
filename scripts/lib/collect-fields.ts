/**
 * Zod schema introspection — walk schemas and collect documented() fields.
 */

import { z } from "zod";
import type { LocalizedText } from "../../src/tooling/lineTool.js";
import { getFieldDoc } from "../../src/tooling/schemaDocs.js";

export type CollectedField = {
  path: string;
  type: string;
  description: LocalizedText;
};

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

/**
 * Walk a Zod schema recursively and collect fields that have
 * `documented()` metadata attached. Returns fields in traversal order.
 */
export function collectDocumentedFields(
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
