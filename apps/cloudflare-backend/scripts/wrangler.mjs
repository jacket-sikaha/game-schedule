// Generic wrangler launcher: redirects TEMP/TMP into the workspace (.wrangler/tmp)
// so workerd's durable object storage dirs (miniflare-CacheObject, miniflare-email-store,
// etc.) can be created under the workspace instead of the system temp, which is
// unwritable under this machine's current ACL/sandbox configuration.
//
// Usage: node scripts/wrangler.mjs <wrangler args...>
// e.g.  node scripts/wrangler.mjs dev --ip 0.0.0.0
//       node scripts/wrangler.mjs types
import { spawn } from "node:child_process";
import { mkdirSync } from "node:fs";
import { resolve } from "node:path";
import { fileURLToPath } from "node:url";

const root = resolve(fileURLToPath(import.meta.url), "..", "..");
const tmpDir = resolve(root, ".wrangler", "tmp");
mkdirSync(tmpDir, { recursive: true });

const env = {
  ...process.env,
  TEMP: tmpDir,
  TMP: tmpDir,
  TMPDIR: tmpDir,
};

// Pass through all CLI args after this script's own path
const wranglerArgs = process.argv.slice(2);
const child = spawn("npx", ["wrangler", ...wranglerArgs], {
  stdio: "inherit",
  env,
  shell: true,
});
child.on("exit", (code) => process.exit(code ?? 1));
child.on("error", (err) => {
  console.error("Failed to launch wrangler:", err.message);
  process.exit(1);
});
