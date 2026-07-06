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
  // The integration tests run with the extension active, whose background
  // network retries can briefly exceed Mocha's 2s default on slower machines.
  mocha: {
    timeout: 20000,
  },
});
