#!/usr/bin/env node
// Validate every stack without a Docker daemon.
//
//   node scripts/validate.mjs
//
// Checks: file layout, YAML parses, every service has a pinned image, healthcheck
// and restart policy, databases do not publish host ports, bind mounts are
// read-only, volumes/networks are declared and .env.example documents every
// variable referenced by the compose file.

import { readdirSync, readFileSync, existsSync, statSync } from "node:fs";
import { join, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { lintCompose } from "../src/lint.js";

const root = resolve(fileURLToPath(new URL("..", import.meta.url)));
const stacksDir = join(root, "stacks");
const required = ["docker-compose.yml", ".env.example", "README.md"];
let errors = 0;
let warnings = 0;
let services = 0;

if (!existsSync(stacksDir)) {
  console.error("stacks/ directory is missing");
  process.exit(1);
}

const stacks = readdirSync(stacksDir).filter((entry) => statSync(join(stacksDir, entry)).isDirectory()).sort();
console.log(`validating ${stacks.length} stack(s) without Docker\n`);

for (const slug of stacks) {
  const dir = join(stacksDir, slug);
  const missing = required.filter((file) => !existsSync(join(dir, file)));
  if (missing.length) {
    console.error(`${slug.padEnd(18)} FAIL  missing ${missing.join(", ")}`);
    errors++;
    continue;
  }
  const compose = readFileSync(join(dir, "docker-compose.yml"), "utf8");
  const envExample = readFileSync(join(dir, ".env.example"), "utf8");
  const result = lintCompose(compose, { envExample, file: `stacks/${slug}/docker-compose.yml` });
  services += result.services;
  errors += result.errors.length;
  warnings += result.warnings.length;
  const status = result.errors.length ? "FAIL" : "PASS";
  console.log(`${slug.padEnd(18)} ${status}  ${String(result.services).padStart(2)} service(s)  ${result.errors.length} error(s)  ${result.warnings.length} warning(s)`);
  for (const issue of result.errors) console.log(`  error  ${issue.rule.padEnd(20)} ${issue.message}`);
  for (const issue of result.warnings) console.log(`  warn   ${issue.rule.padEnd(20)} ${issue.message}`);
}

console.log(`\n${stacks.length} stacks · ${services} services · ${errors} errors · ${warnings} warnings`);
if (errors) {
  console.error("validation failed");
  process.exit(1);
}
console.log("all static checks passed (no Docker daemon required)");
