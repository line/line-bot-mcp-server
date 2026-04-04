# How to contribute to LINE Bot MCP Server

First of all, thank you so much for taking your time to contribute! LINE Bot MCP
Server is not very different from any other open source projects. It will
be fantastic if you help us by doing any of the following:

- File an issue in [the issue tracker](https://github.com/line/line-bot-mcp-server/issues)
  to report bugs and propose new features and improvements.
- Ask a question using [the issue tracker](https://github.com/line/line-bot-mcp-server/issues).
- Contribute your work by sending [a pull request](https://github.com/line/line-bot-mcp-server/pulls).

## Development

You can freely fork the project, clone the forked repository, and start editing.

### Install dependencies

Run `npm install` to install all dependencies for development.

### Understand the project structure

The project structure is as follows:

- `src/tooling/` — Core types (`LineTool`, `LineToolContext`) and helpers (`defineLineTool`, `registerLineTool`).
- `src/tools/` — Each tool is a `camelCase.ts` file that default-exports a `defineLineTool({...})` call.
- `src/generated/` — Auto-generated tool registry (do not edit by hand).
- `src/common/` — Shared utilities, response helpers, and Zod schemas.
- `scripts/` — Code generation scripts (`sync-tool-artifacts.ts`).

### Add a new Tool

To add a new tool:

1. Create a new file under `src/tools/` using camelCase naming (e.g. `pushTextMessage.ts`).
2. Default-export a tool definition using `defineLineTool({...})`.
3. Add or update tests under `test/tools/`.
4. If your tool uses a LINE API method not yet mocked in `test/helpers/mock-line-clients.ts`, add the mock there.
5. Run `npm run generate:tools` to sync:
   - `src/generated/tool-registry.ts`
   - `README.md`
   - `README.ja.md`
   - `manifest.json`

Do not edit the generated registry, README tool sections, or `manifest.json` tool list by hand.

### Run tests

Run `npm test` to execute the test suite:

```bash
npm test
```

Tests are located in the `test/` directory and use [Vitest](https://vitest.dev/).
LINE API calls are mocked via `test/helpers/createToolHarness.ts`, which sets up
a full MCP client–server pair with mock LINE clients injected through `LineToolContext`.
See `test/helpers/mock-line-clients.ts` for the mock factories.

Especially for bug fixes, please follow this flow for testing and development:
1. Write a test before making changes to the library and confirm that the test fails.
2. Modify the code of the library.
3. Run the test again and confirm that it passes thanks to your changes.

### Run all CI tasks in your local

- `npm run format`: Format source code with [Prettier](https://github.com/prettier/prettier)
- `npm run format:check`: Silently run `format` and report formatting errors
- `npm run build`: Build TypeScript code into JavaScript. The built files will
  be placed in `dist/`.
- `npm test`: Run the test suite.
- `npm run check:tools`: Verify that generated files (`tool-registry.ts`, `README.md`, `README.ja.md`, `manifest.json`) are up to date. If this fails, run `npm run generate:tools` and commit the changes.

We lint, build, and test on CI, but it is always nice to check them before
uploading a pull request.

## Contributor license agreement

When you are sending a pull request and it's a non-trivial change beyond fixing typos, please make sure to sign
[the ICLA (individual contributor license agreement)](https://cla-assistant.io/line/line-bot-mcp-server). Please
[contact us](mailto:dl_oss_dev@linecorp.com) if you need the CCLA (corporate contributor license agreement).
