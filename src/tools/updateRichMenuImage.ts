import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { LineBotClient, messagingApi } from "@line/bot-sdk";
import {
  createErrorResponse,
  createSuccessResponse,
} from "../common/response.js";
import { AbstractTool } from "./AbstractTool.js";
import { z } from "zod";
import fs from "fs";
import path from "path";

const MIN_WIDTH = 800;
const MAX_WIDTH = 2500;
const MIN_HEIGHT = 250;
const MIN_ASPECT_RATIO = 1.45;
const MAX_FILE_SIZE = 1_048_576; // 1MB

export type ImageDimensions = { width: number; height: number };

/**
 * Parse the width/height of a PNG or JPEG file by reading its binary header only.
 * No image decoding is performed.
 */
export function readImageDimensions(
  buffer: Buffer,
  ext: string,
): ImageDimensions {
  if (ext === ".png") {
    // PNG signature (8 bytes) + IHDR chunk. width at offset 16, height at offset 20.
    if (buffer.length < 24) {
      throw new Error("Invalid PNG file: header is too short.");
    }
    const width = buffer.readUInt32BE(16);
    const height = buffer.readUInt32BE(20);
    return { width, height };
  }

  // JPEG: scan markers until a Start Of Frame (SOF) marker is found.
  // SOF markers are 0xC0-0xCF, excluding DHT (0xC4), DAC (0xCC) and RSTn (0xD0-0xD7).
  let offset = 2; // skip the 0xFFD8 SOI marker
  while (offset < buffer.length) {
    if (buffer[offset] !== 0xff) {
      offset++;
      continue;
    }
    const marker = buffer[offset + 1];
    if (
      marker >= 0xc0 &&
      marker <= 0xcf &&
      marker !== 0xc4 &&
      marker !== 0xc8 &&
      marker !== 0xcc
    ) {
      // SOF marker: height at marker+5 (u16 BE), width at marker+7 (u16 BE).
      const height = buffer.readUInt16BE(offset + 5);
      const width = buffer.readUInt16BE(offset + 7);
      return { width, height };
    }
    // Skip this segment using its length field.
    const segmentLength = buffer.readUInt16BE(offset + 2);
    offset += 2 + segmentLength;
  }
  throw new Error(
    "Invalid JPEG file: no Start Of Frame marker found; cannot read image dimensions.",
  );
}

/**
 * Validate the new image against LINE rich menu image constraints and against
 * the existing rich menu size. Throws an actionable Error on any violation.
 */
export function validateRichMenuImage(
  imagePath: string,
  richMenuSize: messagingApi.RichMenuSize,
): { dimensions: ImageDimensions; contentType: string } {
  if (!fs.existsSync(imagePath)) {
    throw new Error(
      `Image file not found at "${imagePath}". Provide a valid local file path to an existing PNG or JPEG image.`,
    );
  }

  const ext = path.extname(imagePath).toLowerCase();
  if (ext !== ".png" && ext !== ".jpg" && ext !== ".jpeg") {
    throw new Error(
      `Unsupported image extension "${ext || "(none)"}". Provide a PNG or JPEG file with a .png, .jpg or .jpeg extension.`,
    );
  }
  const contentType = ext === ".png" ? "image/png" : "image/jpeg";

  const stats = fs.statSync(imagePath);
  if (stats.size > MAX_FILE_SIZE) {
    throw new Error(
      `Image file is ${stats.size} bytes but the maximum allowed is ${MAX_FILE_SIZE} bytes (1MB). Compress or re-export the image to be at most 1MB.`,
    );
  }

  const buffer = fs.readFileSync(imagePath);
  const dimensions = readImageDimensions(buffer, ext);
  const { width, height } = dimensions;

  if (width < MIN_WIDTH || width > MAX_WIDTH) {
    throw new Error(
      `Image width is ${width}px but must be between ${MIN_WIDTH} and ${MAX_WIDTH}px. Regenerate the image with a width in that range (ideally ${richMenuSize.width}px to match the rich menu).`,
    );
  }
  if (height < MIN_HEIGHT) {
    throw new Error(
      `Image height is ${height}px but must be at least ${MIN_HEIGHT}px. Regenerate the image taller (ideally ${richMenuSize.height}px to match the rich menu).`,
    );
  }
  const aspectRatio = width / height;
  if (aspectRatio < MIN_ASPECT_RATIO) {
    throw new Error(
      `Image aspect ratio (width/height) is ${aspectRatio.toFixed(3)} but must be at least ${MIN_ASPECT_RATIO}. Regenerate the image wider relative to its height (e.g. ${richMenuSize.width}x${richMenuSize.height}).`,
    );
  }

  if (width !== richMenuSize.width || height !== richMenuSize.height) {
    throw new Error(
      `Image is ${width}x${height} but the rich menu size is ${richMenuSize.width}x${richMenuSize.height}. Regenerate the image at exactly ${richMenuSize.width}x${richMenuSize.height} px.`,
    );
  }

  return { dimensions, contentType };
}

export default class UpdateRichMenuImage extends AbstractTool {
  private client: LineBotClient;

  constructor(client: LineBotClient) {
    super();
    this.client = client;
  }

  register(server: McpServer) {
    server.registerTool(
      "update_rich_menu_image",
      {
        title: "Update Rich Menu Image",
        description:
          "Replace the image of an existing rich menu. LINE does not allow overwriting an already uploaded rich menu image, so this tool uses a clone-and-replace strategy: it creates a new rich menu with the same definition as the old one, uploads the new image, takes over the default assignment if the old menu was the default, and deletes the old menu. As a result, a NEW richMenuId is issued and returned; the old richMenuId will no longer be valid. Image constraints: PNG or JPEG, width 800-2500px, height >= 250px, aspect ratio (width/height) >= 1.45, max 1MB. The image dimensions must match the size of the existing rich menu.",
        inputSchema: {
          richMenuId: z
            .string()
            .describe("The ID of the rich menu whose image to update."),
          imagePath: z
            .string()
            .describe(
              "Local file path to the new image. PNG or JPEG, width 800-2500px, height >= 250px, aspect ratio >= 1.45, max 1MB. Dimensions must match the existing rich menu size (e.g. 1600x910).",
            ),
          deleteOldRichMenu: z
            .boolean()
            .default(true)
            .describe(
              "Whether to delete the old rich menu after replacement. Defaults to true.",
            ),
        },
        annotations: {
          destructiveHint: true,
        },
      },
      async ({ richMenuId, imagePath, deleteOldRichMenu }) => {
        try {
          // 1. Fetch the old rich menu definition.
          let oldRichMenu: messagingApi.RichMenuResponse;
          try {
            oldRichMenu = await this.client.getRichMenu(richMenuId);
          } catch (error: unknown) {
            return createErrorResponse(
              `Failed to get the rich menu "${richMenuId}": ${error instanceof Error ? error.message : String(error)}`,
            );
          }

          // 2. Validate the new image (before any API calls that mutate state).
          let contentType: string;
          try {
            ({ contentType } = validateRichMenuImage(
              imagePath,
              oldRichMenu.size,
            ));
          } catch (error: unknown) {
            return createErrorResponse(
              error instanceof Error ? error.message : String(error),
            );
          }

          // 3. Create a new rich menu with the same definition as the old one.
          const richMenuRequest: messagingApi.RichMenuRequest = {
            size: oldRichMenu.size,
            selected: oldRichMenu.selected,
            name: oldRichMenu.name,
            chatBarText: oldRichMenu.chatBarText,
            areas: oldRichMenu.areas,
          };
          const createResponse =
            await this.client.createRichMenu(richMenuRequest);
          const newRichMenuId = createResponse.richMenuId;

          // 4. Upload the new image. Roll back the new menu on failure.
          try {
            const imageBuffer = fs.readFileSync(imagePath);
            const imageBlob = new Blob([imageBuffer], { type: contentType });
            await this.client.setRichMenuImage(newRichMenuId, imageBlob);
          } catch (uploadError: unknown) {
            let rollbackError: unknown = null;
            try {
              await this.client.deleteRichMenu(newRichMenuId);
            } catch (error: unknown) {
              rollbackError = error;
            }
            return createErrorResponse(
              JSON.stringify({
                error: `Failed to upload the new rich menu image: ${uploadError instanceof Error ? uploadError.message : String(uploadError)}`,
                newRichMenuId,
                rolledBack: rollbackError === null,
                rollbackError:
                  rollbackError === null
                    ? undefined
                    : `Failed to delete the newly created rich menu "${newRichMenuId}" during rollback: ${rollbackError instanceof Error ? rollbackError.message : String(rollbackError)}`,
              }),
            );
          }

          // 5. Determine whether the old menu was the default and take it over.
          let oldWasDefault = false;
          try {
            const defaultResponse = await this.client.getDefaultRichMenuId();
            oldWasDefault = defaultResponse.richMenuId === richMenuId;
          } catch {
            // No default rich menu is set (LINE returns 404). Treat as "no default".
            oldWasDefault = false;
          }

          let defaultSwitched = false;
          let defaultSwitchError: string | undefined;
          if (oldWasDefault) {
            try {
              await this.client.setDefaultRichMenu(newRichMenuId);
              defaultSwitched = true;
            } catch (error: unknown) {
              defaultSwitchError = `Failed to switch the default rich menu to "${newRichMenuId}": ${error instanceof Error ? error.message : String(error)}`;
            }
          }

          // 6. Delete the old rich menu (unless the default switch failed).
          let oldRichMenuDeleted = false;
          let deleteError: string | undefined;
          if (oldWasDefault && !defaultSwitched) {
            // Do not delete the old menu; it is still the active default.
            return createErrorResponse(
              JSON.stringify({
                error: defaultSwitchError,
                oldRichMenuId: richMenuId,
                newRichMenuId,
                defaultSwitched,
                oldRichMenuDeleted,
                message:
                  "The new rich menu and image were created, but switching the default failed. The old rich menu was kept as the active default. Retry setting the default to the new rich menu manually, then delete the old one.",
              }),
            );
          }

          if (deleteOldRichMenu) {
            try {
              await this.client.deleteRichMenu(richMenuId);
              oldRichMenuDeleted = true;
            } catch (error: unknown) {
              deleteError = `Failed to delete the old rich menu "${richMenuId}": ${error instanceof Error ? error.message : String(error)}`;
            }
          }

          return createSuccessResponse({
            message:
              "Rich menu image updated via clone-and-replace. A new richMenuId was issued; the old richMenuId is no longer valid." +
              (deleteError ? ` Warning: ${deleteError}` : ""),
            oldRichMenuId: richMenuId,
            newRichMenuId,
            defaultSwitched,
            oldRichMenuDeleted,
            ...(deleteError ? { deleteError } : {}),
          });
        } catch (error: unknown) {
          return createErrorResponse(
            `Failed to update rich menu image: ${error instanceof Error ? error.message : String(error)}`,
          );
        }
      },
    );
  }
}
