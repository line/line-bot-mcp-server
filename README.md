[日本語版 READMEはこちら](README.ja.md)

# LINE Bot MCP Server

[Model Context Protocol (MCP)](https://github.com/modelcontextprotocol) server implementation that integrates the LINE Messaging API to connect an AI Agent to the LINE Official Account.

![](/assets/demo.png)

> [!NOTE]
> This repository is provided as a preview version. While we offer it for experimental purposes, please be aware that it may not include complete functionality or comprehensive support.

## Tools

1. **push_text_message**
   - Push a simple text message to user via LINE.
   - **Inputs:**
     - `user_id` (string): The user ID to receive a message. Defaults to DESTINATION_USER_ID.
     - `message.text` (string): The plain text content to send to the user.
2. **push_flex_message**
   - Push a highly customizable flex message to user via LINE. Supports both bubble (single container) and carousel (multiple swipeable bubbles) layouts.
   - **Inputs:**
     - `user_id` (string): The user ID to receive a message. Defaults to DESTINATION_USER_ID.
     - `message.altText` (string): Alternative text shown when flex message cannot be displayed.
     - `message.content` (any): The content of the flex message. This is a JSON object that defines the layout and components of the message.
     - `message.contents.type` (enum): Type of the container. 'bubble' for single container, 'carousel' for multiple swipeable bubbles.
3. **get_profile**
   - Get detailed profile information of a LINE user including display name, profile picture URL, status message and language.
   - **Inputs:**
     - `user_id` (string): The ID of the user whose profile you want to retrieve. Defaults to DESTINATION_USER_ID.


## Installation

### Step 1: Install line-bot-mcp-server

requirements:
- Node.js v20 or later

Clone this repository:

```
git clone git@github.com:line/line-bot-mcp-server.git
```

Install the necessary dependencies and build line-bot-mcp-server when using Node.js. This step is not required when using Docker:

```
cd line-bot-mcp-server && npm install && npm run build
```

### Step 2: Get a channel access token

This MCP server utilizes a LINE Official Account. If you do not have one, please create it by following [this instructions](https://www.linebiz.com/jp-en/manual/OfficialAccountManager/new_account/). 

To connect to the Messaging API, you need to have a channel access token. You can confirm this by following [this instructions](https://developers.line.biz/en/docs/basics/channel-access-token/#long-lived-channel-access-token).

Additionally, you will need the user ID of the recipient user for messages. You can confirm this by following [this instructions](https://developers.line.biz/en/docs/messaging-api/getting-user-ids/#get-own-user-id).

### Step 3: Configure AI Agent

Please add the following configuration for an AI Agent like Claude Desktop or Cline. 
Insert the channel access token and user ID you obtained earlier into `CHANNEL_ACCESS_TOKEN` and `DESTINATION_USER_ID`, respectively. 
Additionally, update the path to `line-bot-mcp-server` in  `mcpServers.args`.

#### Option 1: Use Node

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

#### Option 2: Use Docker

Build the Docker image first:
```
docker build -t line/line-bot-mcp-server .
```

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
