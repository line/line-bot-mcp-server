[日本語版 READMEはこちら](README.ja.md)

# LINE Bot MCP Server

[![npmjs](https://badge.fury.io/js/%40line%2Fline-bot-mcp-server.svg)](https://www.npmjs.com/package/@line/line-bot-mcp-server)

[Model Context Protocol (MCP)](https://github.com/modelcontextprotocol) server implementation that integrates the LINE Messaging API to connect an AI Agent to the LINE Official Account.

![](/assets/demo.png)

> [!NOTE]
> This repository is provided as a preview version. While we offer it for experimental purposes, please be aware that it may not include complete functionality or comprehensive support.

## Tools

1. **push_text_message**
   - Push a simple text message to a user via LINE.
   - **Inputs:**
     - `user_id` (string?): The user ID to receive a message. Defaults to DESTINATION_USER_ID. Either `user_id` or `DESTINATION_USER_ID` must be set.
     - `message.text` (string): The plain text content to send to the user.
2. **push_flex_message**
   - Push a highly customizable flex message to a user via LINE.
   - **Inputs:**
     - `user_id` (string?): The user ID to receive a message. Defaults to DESTINATION_USER_ID. Either `user_id` or `DESTINATION_USER_ID` must be set.
     - `message.altText` (string): Alternative text shown when flex message cannot be displayed.
     - `message.content` (any): The content of the flex message. This is a JSON object that defines the layout and components of the message.
     - `message.contents.type` (enum): Type of the container. 'bubble' for single container, 'carousel' for multiple swipeable bubbles.
3. **broadcast_text_message**
   - Broadcast a simple text message via LINE to all users who have followed your LINE Official Account.
   - **Inputs:**
     - `message.text` (string): The plain text content to send to the users.
4. **broadcast_flex_message**
   - Broadcast a highly customizable flex message via LINE to all users who have added your LINE Official Account.
   - **Inputs:**
     - `message.altText` (string): Alternative text shown when flex message cannot be displayed.
     - `message.content` (any): The content of the flex message. This is a JSON object that defines the layout and components of the message.
     - `message.contents.type` (enum): Type of the container. 'bubble' for single container, 'carousel' for multiple swipeable bubbles.
5. **get_profile**
   - Get detailed profile information of a LINE user including display name, profile picture URL, status message and language.
   - **Inputs:**
     - `user_id` (string?): The ID of the user whose profile you want to retrieve. Defaults to DESTINATION_USER_ID.
6. **get_message_quota**
   - Get the message quota and consumption of the LINE Official Account. This shows the monthly message limit and current usage.
   - **Inputs:**
     - None
7. **get_rich_menu_list**
   - Get the list of rich menus associated with your LINE Official Account.
   - **Inputs:**
     - None
8. **delete_rich_menu**
   - Delete a rich menu from your LINE Official Account.
   - **Inputs:**
     - `richMenuId` (string): The ID of the rich menu to delete.
9. **set_rich_menu_default**
    - Set a rich menu as the default rich menu.
    - **Inputs:**
      - `richMenuId` (string): The ID of the rich menu to set as default.
10. **cancel_rich_menu_default**
    - Cancel the default rich menu.
    - **Inputs:**
      - None

## Installation (Using npx)

requirements:
- Node.js v20 or later

### Step 1: Create LINE Official Account

This MCP server utilizes a LINE Official Account. If you do not have one, please create it by following [this instructions](https://developers.line.biz/en/docs/messaging-api/getting-started/#create-oa). 

If you have a LINE Official Account, enable the Messaging API for your LINE Official Account by following [this instructions](https://developers.line.biz/en/docs/messaging-api/getting-started/#using-oa-manager).

### Step 2: Configure AI Agent

Please add the following configuration for an AI Agent like Claude Desktop or Cline. 

Set the environment variables or arguments as follows:

- `CHANNEL_ACCESS_TOKEN`: (required) Channel Access Token. You can confirm this by following [this instructions](https://developers.line.biz/en/docs/basics/channel-access-token/#long-lived-channel-access-token).
- `DESTINATION_USER_ID`: (optional) The default user ID of the recipient. If the Tool's input does not include `user_id`, `DESTINATION_USER_ID` is required. You can confirm this by following [this instructions](https://developers.line.biz/en/docs/messaging-api/getting-user-ids/#get-own-user-id).

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

## Installation (Using Docker)

### Step 1: Create LINE Official Account

This MCP server utilizes a LINE Official Account. If you do not have one, please create it by following [this instructions](https://developers.line.biz/en/docs/messaging-api/getting-started/#create-oa).

If you have a LINE Official Account, enable the Messaging API for your LINE Official Account by following [this instructions](https://developers.line.biz/en/docs/messaging-api/getting-started/#using-oa-manager).


### Step 2: Build line-bot-mcp-server image

Clone this repository:

```
git clone git@github.com:line/line-bot-mcp-server.git
```

Build the Docker image:

```
docker build -t line/line-bot-mcp-server .
```

### Step 3: Configure AI Agent

Please add the following configuration for an AI Agent like Claude Desktop or Cline.

Set the environment variables or arguments as follows:

- `mcpServers.args`: (required) The path to `line-bot-mcp-server`.
- `CHANNEL_ACCESS_TOKEN`: (required) Channel Access Token. You can confirm this by following [this instructions](https://developers.line.biz/en/docs/basics/channel-access-token/#long-lived-channel-access-token).
- `DESTINATION_USER_ID`: (optional) The default user ID of the recipient. If the Tool's input does not include `user_id`, `DESTINATION_USER_ID` is required.
You can confirm this by following [this instructions](https://developers.line.biz/en/docs/messaging-api/getting-user-ids/#get-own-user-id).


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

## Local Development with Inspector

You can use the MCP Inspector to test and debug the server locally.

### Prerequisites

1. Clone the repository:
```bash
git clone git@github.com:line/line-bot-mcp-server.git
cd line-bot-mcp-server
```

2. Install dependencies:
```bash
npm install
```

3. Build the project:
```bash
npm run build
```

### Run the Inspector

After building the project, you can start the MCP Inspector:

```bash
npx @modelcontextprotocol/inspector node dist/index.js
```

This will start the MCP Inspector interface where you can interact with the LINE Bot MCP Server tools and test their functionality.

## Versioning

This project respects semantic versioning

See http://semver.org/

## Contributing

Please check [CONTRIBUTING](./CONTRIBUTING.md) before making a contribution.
