#!/usr/bin/env node
import fs from "node:fs";
import path from "node:path";

const root = process.cwd();
const envPath = path.join(root, ".env.local");

function parseEnvFile(content) {
  const result = {};
  for (const rawLine of content.split(/\r?\n/)) {
    const line = rawLine.trim();
    if (!line || line.startsWith("#")) continue;
    const eq = line.indexOf("=");
    if (eq <= 0) continue;
    const key = line.slice(0, eq).trim();
    const value = line.slice(eq + 1).trim();
    result[key] = value;
  }
  return result;
}

const required = [
  "NEXT_PUBLIC_CONVEX_URL",
  "NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY",
  "CLERK_SECRET_KEY",
  "CLERK_JWT_ISSUER_DOMAIN",
  "FIRECRAWL_API_KEY",
];

function hasPlaceholder(value) {
  const v = String(value || "").toLowerCase();
  return (
    v.includes("your-") ||
    v.includes("your_") ||
    v.includes("example") ||
    v.includes("replace") ||
    v.includes("changeme")
  );
}

function validateEnvValue(key, value) {
  if (!value) return false;
  if (hasPlaceholder(value)) return false;

  switch (key) {
    case "NEXT_PUBLIC_CONVEX_URL":
      return /^https:\/\/.+/.test(value);
    case "NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY":
      return value.startsWith("pk_");
    case "CLERK_SECRET_KEY":
      return value.startsWith("sk_");
    case "CLERK_JWT_ISSUER_DOMAIN":
      return /^https:\/\/.+\.clerk\.accounts\.dev$/.test(value);
    case "FIRECRAWL_API_KEY":
      return value.startsWith("fc-");
    default:
      return true;
  }
}

if (!fs.existsSync(envPath)) {
  console.error("Missing .env.local file.");
  console.error("Run: cp .env.example .env.local");
  process.exit(1);
}

const env = parseEnvFile(fs.readFileSync(envPath, "utf8"));
const missing = required.filter((k) => !validateEnvValue(k, env[k]));

if (missing.length > 0) {
  console.error("Setup incomplete. Missing or placeholder values:");
  for (const key of missing) {
    console.error(`- ${key}`);
  }
  console.error("\nAfter filling .env.local, sync Clerk issuer with Convex:");
  console.error('npx convex env set CLERK_JWT_ISSUER_DOMAIN "$CLERK_JWT_ISSUER_DOMAIN"');
  console.error("npx convex dev");
  process.exit(1);
}

console.log("Environment looks good.");
console.log("Next steps:");
console.log("1) npx convex dev");
console.log("2) npm run dev");
