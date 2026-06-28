import { defineConfig } from "@vscode/test-cli";
import os from "node:os";
import path from "node:path";

const testProfileRoot = path.join(os.tmpdir(), "copilot-tracker-vscode-test");

export default defineConfig({
  files: "out/test/**/*.test.js",
  launchArgs: [
    `--extensions-dir=${path.join(testProfileRoot, "extensions")}`,
    `--user-data-dir=${path.join(testProfileRoot, "user-data")}`,
  ],
});
