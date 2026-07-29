import { vi } from "vitest";
import type { LineBotClient } from "@line/bot-sdk";

export function createMockLineBotClient() {
  return {
    pushMessage: vi.fn(),
    broadcast: vi.fn(),
    getProfile: vi.fn(),
    getMessageQuota: vi.fn(),
    getMessageQuotaConsumption: vi.fn(),
    getRichMenuList: vi.fn(),
    getRichMenu: vi.fn(),
    deleteRichMenu: vi.fn(),
    setDefaultRichMenu: vi.fn(),
    cancelDefaultRichMenu: vi.fn(),
    createRichMenu: vi.fn(),
    getFollowers: vi.fn(),
    setRichMenuImage: vi.fn(),
    getDefaultRichMenuId: vi.fn(),
  } as unknown as LineBotClient;
}
