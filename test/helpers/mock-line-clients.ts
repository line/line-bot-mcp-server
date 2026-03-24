import { vi } from "vitest";
import type { messagingApi } from "@line/bot-sdk";

export function createMockMessagingApiClient() {
  return {
    pushMessage: vi.fn(),
    broadcast: vi.fn(),
    getProfile: vi.fn(),
    getMessageQuota: vi.fn(),
    getMessageQuotaConsumption: vi.fn(),
    getRichMenuList: vi.fn(),
    deleteRichMenu: vi.fn(),
    setDefaultRichMenu: vi.fn(),
    cancelDefaultRichMenu: vi.fn(),
    createRichMenu: vi.fn(),
  } as unknown as messagingApi.MessagingApiClient;
}

export function createMockBlobClient() {
  return {
    setRichMenuImage: vi.fn(),
  } as unknown as messagingApi.MessagingApiBlobClient;
}
