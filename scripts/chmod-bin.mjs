import { chmodSync, statSync } from "node:fs";

const file = "dist/index.js";

chmodSync(file, (statSync(file).mode & 0o777) | 0o111);
