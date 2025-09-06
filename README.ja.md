# LINE Bot MCP Server

[![npmjs](https://badge.fury.io/js/%40line%2Fline-bot-mcp-server.svg)](https://www.npmjs.com/package/@line/line-bot-mcp-server)

LINE公式アカウントとAI Agentを接続するために、LINE Messaging APIを統合する[Model Context Protocol (MCP)](https://github.com/modelcontextprotocol) Server

![](/assets/demo.ja.png)

> [!NOTE]
> このリポジトリはプレビュー版として提供されています。実験的な目的で提供されており、完全な機能や包括的なサポートが含まれていないことにご注意ください。

## Tools

1. **push_text_message**
   - LINEでユーザーにシンプルなテキストメッセージを送信する。
   - **入力:**
     - `user_id` (string?): メッセージ受信者のユーザーID。デフォルトはDESTINATION_USER_ID。`user_id`または`DESTINATION_USER_ID`のどちらか一方は必ず設定する必要があります。
     - `message.text` (string): ユーザーに送信するテキスト。
2. **push_flex_message**
   - LINEでユーザーに高度にカスタマイズ可能なフレックスメッセージを送信する。
   - **入力:**
     - `user_id` (string?): メッセージ受信者のユーザーID。デフォルトはDESTINATION_USER_ID。`user_id`または`DESTINATION_USER_ID`のどちらか一方は必ず設定する必要があります。
     - `message.altText` (string): フレックスメッセージが表示できない場合に表示される代替テキスト。
     - `message.content` (any): フレックスメッセージの内容。メッセージのレイアウトとコンポーネントを定義するJSONオブジェクト。
     - `message.contents.type` (enum): コンテナのタイプ。'bubble'は単一コンテナ、'carousel'は複数のスワイプ可能なバブルを示す。
3. **broadcast_text_message**
   - LINE公式アカウントと友だちになっているすべてのユーザーに、LINEでシンプルなテキストメッセージを送信する。
   - **入力:**
     - `message.text` (string): ユーザーに送信するテキスト。
4. **broadcast_flex_message**
   - LINE公式アカウントと友だちになっているすべてのユーザーに、LINEで高度にカスタマイズ可能なフレックスメッセージを送信する。
   - **入力:**
     - `message.altText` (string): フレックスメッセージが表示できない場合に表示される代替テキスト。
     - `message.content` (any): フレックスメッセージの内容。メッセージのレイアウトとコンポーネントを定義するJSONオブジェクト。
     - `message.contents.type` (enum): コンテナのタイプ。'bubble'は単一コンテナ、'carousel'は複数のスワイプ可能なバブルを示す。
5. **get_profile**
   - LINEユーザーの詳細なプロフィール情報を取得する。表示名、プロフィール画像URL、ステータスメッセージ、言語を取得できる。
   - **入力:**
      - `user_id` (string?): プロフィールを取得したいユーザーのユーザーID。デフォルトはDESTINATION_USER_ID。`user_id`または`DESTINATION_USER_ID`のどちらか一方は必ず設定する必要があります。
6. **get_message_quota**
   - LINE公式アカウントのメッセージ容量と消費量を取得します。月間メッセージ制限と現在の使用量が表示されます。
   - **入力:**
     - なし
7. **get_rich_menu_list**
   - LINE公式アカウントに登録されているリッチメニューの一覧を取得する。
   - **入力:**
     - なし
8. **delete_rich_menu**
   - LINE公式アカウントからリッチメニューを削除する。
   - **入力:**
     - `richMenuId` (string): 削除するリッチメニューのID。
9. **set_rich_menu_default**
    - リッチメニューをデフォルトとして設定する。
    - **入力:**
      - `richMenuId` (string): デフォルトとして設定するリッチメニューのID。
10. **cancel_rich_menu_default**
    - デフォルトのリッチメニューを解除する。
    - **入力:**
      - なし

## インストール (npxを使用)

要件:
- Node.js v20 以上

### Step 1: LINE公式アカウントを作成

このMCP ServerはLINE公式アカウントを利用しています。公式アカウントをお持ちでない場合は、[こちらの手順](https://developers.line.biz/ja/docs/messaging-api/getting-started/#create-oa)に従って作成してください。

LINE公式アカウントをお持ちであれば、[こちらの手順](https://developers.line.biz/ja/docs/messaging-api/getting-started/#using-oa-manager)に従ってMessaging APIを有効にしてください。

### Step 2: AI Agentを設定

Claude DesktopやClaudeなどのAI Agentに次の設定を追加してください。

環境変数や引数は次のように設定してください:

- `CHANNEL_ACCESS_TOKEN`: (必須) チャネルアクセストークン。これを取得するには、[こちらの手順](https://developers.line.biz/ja/docs/basics/channel-access-token/#long-lived-channel-access-token)に従ってください。
- `DESTINATION_USER_ID`: (オプション) デフォルトのメッセージ受信者のユーザーID。Toolの入力に`user_id`が含まれていない場合、`DESTINATION_USER_ID`は必ず設定する必要があります。これを確認するには、[こちらの手順](https://developers.line.biz/ja/docs/messaging-api/getting-user-ids/#get-own-user-id)に従ってください。

```json
{
  "mcpServers": {
    "line-bot": {
      "command": "npx",
      "args": [
        "@line/line-bot-mcp-server"
      ],
      "env": {
        "CHANNEL_ACCESS_TOKEN" : "FILL_HERE",
        "DESTINATION_USER_ID" : "FILL_HERE"
      }
    }
  }
}
```

## インストール (Dockerを使用)

### Step 1: LINE公式アカウントを作成

このMCP ServerはLINE公式アカウントを利用しています。公式アカウントをお持ちでない場合は、[こちらの手順](https://developers.line.biz/ja/docs/messaging-api/getting-started/#create-oa)に従って作成してください。

LINE公式アカウントをお持ちであれば、[こちらの手順](https://developers.line.biz/ja/docs/messaging-api/getting-started/#using-oa-manager)に従ってMessaging APIを有効にしてください。

### Step 2: line-bot-mcp-serverをインストール

このリポジトリをクローンします:

```
git clone git@github.com:line/line-bot-mcp-server.git
```

Dockerイメージをビルドします:
```
docker build -t line/line-bot-mcp-server .
```

### Step 3: AI Agentを設定

Claude DesktopやClaudeなどのAI Agentに次の設定を追加してください。

環境変数や引数は次のように設定してください:

- `mcpServers.args`: (必須) `line-bot-mcp-server`へのパス。
- `CHANNEL_ACCESS_TOKEN`: (必須) チャネルアクセストークン。これを取得するには、[こちらの手順](https://developers.line.biz/ja/docs/basics/channel-access-token/#long-lived-channel-access-token)に従ってください。
- `DESTINATION_USER_ID`: (オプション) デフォルトのメッセージ受信者のユーザーID。Toolの入力に`user_id`が含まれていない場合、`DESTINATION_USER_ID`は必ず設定する必要があります。これを確認するには、[こちらの手順](https://developers.line.biz/ja/docs/messaging-api/getting-user-ids/#get-own-user-id)に従ってください。

```json
{
  "mcpServers": {
    "line-bot": {
      "command": "docker",
      "args": [
        "run",
        "-i",
        "--rm",
        "-e",
        "CHANNEL_ACCESS_TOKEN",
        "-e",
        "DESTINATION_USER_ID",
        "line/line-bot-mcp-server"
      ],
      "env": {
        "CHANNEL_ACCESS_TOKEN" : "FILL_HERE",
        "DESTINATION_USER_ID" : "FILL_HERE"
      }
    }
  }
}
```

## Inspector を使用したローカル開発

MCP Inspector を使用して、サーバーをローカルでテストおよびデバッグできます。

### 前提条件

1. リポジトリをクローンする：
```bash
git clone git@github.com:line/line-bot-mcp-server.git
cd line-bot-mcp-server
```

2. 依存関係をインストールする：
```bash
npm install
```

3. プロジェクトをビルドする：
```bash
npm run build
```

### Inspector の実行

プロジェクトをビルドした後、MCP Inspector を起動できます：

```bash
npx @modelcontextprotocol/inspector node dist/index.js
```

これにより、MCP Inspector インターフェースが起動し、LINE Bot MCP Server のツールを操作して機能をテストできます。