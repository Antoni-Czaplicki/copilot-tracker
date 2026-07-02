import { spawnSync } from "node:child_process";
import { readFile } from "node:fs/promises";
import * as path from "node:path";
import { fileURLToPath } from "node:url";

const scriptDir = path.dirname(fileURLToPath(import.meta.url));
const repoRoot = path.resolve(scriptDir, "..");
const extensionDir = path.join(repoRoot, "apps", "extension");
const manifestPath = path.join(extensionDir, "package.json");
const manifest = JSON.parse(await readFile(manifestPath, "utf8"));
const packageName = String(manifest.name);
const packageVersion = String(manifest.version);
const packageFileName = `${packageName}-${packageVersion}.vsix`;

const result = spawnSync(
  "pnpm",
  [
    "exec",
    "vsce",
    "package",
    "--no-dependencies",
    "--out",
    packageFileName,
  ],
  {
    cwd: extensionDir,
    stdio: "inherit",
    shell: process.platform === "win32",
  },
);

if (result.error) {
  throw result.error;
}

process.exitCode = result.status ?? 1;
