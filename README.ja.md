# LINE Bot MCP Server

LINE公式アカウントとAI Agentを接続するために、LINE Messaging APIを統合する[Model Context Protocol (MCP)](https://github.com/modelcontextprotocol) Server

![](/assets/demo.ja.png)

> [!NOTE]
> このリポジトリはプレビュー版として提供されています。実験的な目的で提供されており、完全な機能や包括的なサポートが含まれていないことにご注意ください。

## Tools

1. **push_text_message**
   - LINEでユーザーにシンプルなテキストメッセージを送信する
   - **入力:**
     - `user_id` (string): メッセージ受信者のユーザーID。デフォルトはDESTINATION_USER_ID。
     - `message.text` (string): ユーザーに送信するテキスト。
2. **push_flex_message**
   - LINEでユーザーに高度にカスタマイズ可能なフレックスメッセージを送信する。バブル（単一コンテナ）とカルーセル（スワイプ可能な複数のバブル）レイアウトの両方をサポート。
   - **入力:**
     - `user_id` (string): メッセージ受信者のユーザーID。デフォルトはDESTINATION_USER_ID。
     - `message.altText` (string): フレックスメッセージが表示できない場合に表示される代替テキスト。
     - `message.content` (any): フレックスメッセージの内容。メッセージのレイアウトとコンポーネントを定義するJSONオブジェクト。
     - `message.contents.type` (enum): コンテナのタイプ。'bubble'は単一コンテナ、'carousel'は複数のスワイプ可能なバブルを示す。
3. **get_profile**
   - LINEユーザーの詳細なプロフィール情報を取得する。表示名、プロフィール画像URL、ステータスメッセージ、言語を取得できる。
   - **Inputs:**
      - `user_id` (string): プロフィールを取得したいユーザーのユーザーID。デフォルトはDESTINATION_USER_ID。

## インストール

### Step 1: line-bot-mcp-serverをインストール

要件:
- Node.js v20 以上

このリポジトリをクローンします:

```
git clone git@github.com:line/line-bot-mcp-server.git
```

Node.jsを利用する場合は、必要な依存関係をインストールし、line-bot-mcp-serverをビルドします。Dockerを利用する場合は不要です。:

```
cd line-bot-mcp-server && npm install && npm run build
```

### Step 2: チャンネルアクセストークンを取得

このMCP ServerはLINE公式アカウントを利用しています。公式アカウントをお持ちでない場合は、[こちらの手順](https://developers.line.biz/ja/docs/messaging-api/getting-started)に従って作成してください。

Messaging APIに接続するには、チャンネルアクセストークンが必要です。これを確認するには、[こちらの手順](https://developers.line.biz/ja/docs/basics/channel-access-token/#long-lived-channel-access-token)に従ってください。

加えて、メッセージの受信者のユーザーIDも必要です。これを確認するには、[こちらの手順](https://developers.line.biz/ja/docs/messaging-api/getting-user-ids/#get-own-user-id)に従ってください。


### Step 3: AI Agentを設定

Claude DesktopやClaudeなどのAI Agentに次の設定を追加してください。
`CHANNEL_ACCESS_TOKEN`と`DESTINATION_USER_ID`には、先ほど取得したチャンネルアクセストークンとユーザーIDをそれぞれ挿入してください。
加えて、`mcpServers.args`にある`line-bot-mcp-server`へのパスを更新してください。

#### Option 1: Node.jsを利用する場合

```json
{
  "mcpServers": {
    "line-bot": {
      "command": "node",
      "args": [
        "PATH/TO/line-bot-mcp-server/dist/index.js"
      ],
      "env": {
        "CHANNEL_ACCESS_TOKEN" : "FILL_HERE",
        "DESTINATION_USER_ID" : "FILL_HERE"
      }
    }
  }
}
```

#### Option 2: Dockerを利用する場合

まずDockerイメージをビルドします:
```
docker build -t line/line-bot-mcp-server .
```

次のように設定します:

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
