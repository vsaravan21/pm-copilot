import { execSync } from "node:child_process";
import fs from "node:fs";
import path from "node:path";

const root = path.resolve(import.meta.dirname, "..");

function rmSafe(target) {
  fs.rmSync(path.join(root, target), { recursive: true, force: true });
}

for (const port of [3000, 3001, 3002, 3003]) {
  try {
    const pids = execSync(`lsof -ti :${port}`, { encoding: "utf8" }).trim();
    if (pids) {
      for (const pid of pids.split(/\s+/)) {
        try {
          process.kill(Number(pid), "SIGKILL");
        } catch {
          /* already gone */
        }
      }
    }
  } catch {
    /* port free */
  }
}

rmSafe(".next");
rmSafe(".cache");

console.log("Cleared .next / .cache and freed ports 3000–3003.");
