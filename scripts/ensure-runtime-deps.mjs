#!/usr/bin/env node

import fs from "node:fs";
import path from "node:path";
import { spawnSync } from "node:child_process";

const root = process.cwd();

const requiredFiles = [
  "node_modules/react/package.json",
  "node_modules/react-dom/package.json",
  "node_modules/next/package.json",
  "node_modules/next/dist/bin/next",
  "node_modules/convex/package.json",
  "node_modules/convex/bin/main.js",
  "node_modules/concurrently/package.json",
];

const missing = requiredFiles.filter((relPath) => !fs.existsSync(path.join(root, relPath)));

if (missing.length === 0) {
  process.exit(0);
}

console.warn("Detected incomplete runtime dependency install. Repairing missing packages...");
for (const relPath of missing) {
  console.warn(`- Missing ${relPath}`);
}

fs.rmSync(path.join(root, "node_modules"), { recursive: true, force: true });
fs.rmSync(path.join(root, ".next"), { recursive: true, force: true });

const result = spawnSync(
  "npm",
  [
    "install",
    "--include=dev",
  ],
  {
    cwd: root,
    stdio: "inherit",
    shell: process.platform === "win32",
  }
);

process.exit(result.status ?? 1);