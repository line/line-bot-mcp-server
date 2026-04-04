import type { ToolDocField } from "./lineTool.js";

export const destinationUserIdField: ToolDocField = {
  path: "userId",
  type: "string?",
  description: {
    en: "The user ID to receive a message. Defaults to DESTINATION_USER_ID. Either `userId` or `DESTINATION_USER_ID` must be set.",
    ja: "メッセージ受信者のユーザーID。デフォルトは DESTINATION_USER_ID。`userId` または `DESTINATION_USER_ID` のどちらか一方が必要です。",
  },
};

export const profileUserIdField: ToolDocField = {
  path: "userId",
  type: "string?",
  description: {
    en: "The ID of the user whose profile you want to retrieve. Defaults to DESTINATION_USER_ID.",
    ja: "プロフィールを取得したいユーザーのユーザーID。デフォルトは DESTINATION_USER_ID。",
  },
};

export function textMessageFields(prefix = "message"): ToolDocField[] {
  return [
    {
      path: `${prefix}.text`,
      type: "string",
      description: {
        en: "The plain text content to send to the user.",
        ja: "ユーザーに送信するテキスト。",
      },
    },
  ];
}

export function flexMessageFields(prefix = "message"): ToolDocField[] {
  return [
    {
      path: `${prefix}.altText`,
      type: "string",
      description: {
        en: "Alternative text shown when the flex message cannot be displayed.",
        ja: "フレックスメッセージが表示できない場合に表示される代替テキスト。",
      },
    },
    {
      path: `${prefix}.contents`,
      type: "any",
      description: {
        en: "The contents of the flex message. This is a JSON object that defines the layout and components of the message.",
        ja: "フレックスメッセージの内容。メッセージのレイアウトとコンポーネントを定義する JSON オブジェクト。",
      },
    },
    {
      path: `${prefix}.contents.type`,
      type: "enum",
      description: {
        en: "Type of the container. `bubble` for a single container, `carousel` for multiple swipeable bubbles.",
        ja: "コンテナのタイプ。`bubble` は単一コンテナ、`carousel` は複数のスワイプ可能なバブル。",
      },
    },
  ];
}
