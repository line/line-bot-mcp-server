import path from "node:path";
import { fileURLToPath } from "node:url";
import * as line from "@line/bot-sdk";
import type { LineToolContext } from "./lineTool.js";
import { USER_AGENT } from "../version.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export function createLineToolContext(): LineToolContext {
  const channelAccessToken = process.env.CHANNEL_ACCESS_TOKEN ?? "";
  const destinationUserId = process.env.DESTINATION_USER_ID ?? "";
  const serverRootDir =
    process.env.SERVER_PATH ?? path.resolve(__dirname, "..", "..");
  const puppeteerExecutablePath = process.env.PUPPETEER_EXECUTABLE_PATH;

  const messaging = new line.messagingApi.MessagingApiClient({
    channelAccessToken,
    defaultHeaders: {
      "User-Agent": USER_AGENT,
    },
  });

  const blob = new line.messagingApi.MessagingApiBlobClient({
    channelAccessToken,
    defaultHeaders: {
      "User-Agent": USER_AGENT,
    },
  });

  return {
    clients: {
      messaging,
      blob,
    },
    env: {
      channelAccessToken,
      destinationUserId,
      serverRootDir,
      puppeteerExecutablePath,
    },
  };
}
