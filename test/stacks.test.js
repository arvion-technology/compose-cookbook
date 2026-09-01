import test from "node:test";
import assert from "node:assert/strict";
import { readdirSync, readFileSync, existsSync, statSync } from "node:fs";
import { join, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { buildCatalog, summarise, serviceSummary } from "../src/catalog.js";
import { lintCompose, parseImage } from "../src/lint.js";
import { STACKS } from "../demo/stacks-data.js";

const root = resolve(fileURLToPath(new URL("..", import.meta.url)));
const stacksDir = join(root, "stacks");
const slugs = readdirSync(stacksDir).filter((entry) => statSync(join(stacksDir, entry)).isDirectory()).sort();

const files = slugs.map((slug) => ({
  slug,
  compose: readFileSync(join(stacksDir, slug, "docker-compose.yml"), "utf8"),
  envExample: readFileSync(join(stacksDir, slug, ".env.example"), "utf8"),
  readme: readFileSync(join(stacksDir, slug, "README.md"), "utf8"),
}));

test("there are twelve stacks, each with a compose file, env example and README", () => {
  assert.equal(slugs.length, 12);
  for (const slug of slugs) {
    for (const file of ["docker-compose.yml", ".env.example", "README.md"]) {
      assert.ok(existsSync(join(stacksDir, slug, file)), `${slug} is missing ${file}`);
    }
    assert.ok(readFileSync(join(stacksDir, slug, "README.md"), "utf8").length > 400, `${slug} README is too thin`);
  }
});

test("every stack passes the linter with zero errors and zero warnings", () => {
  for (const file of files) {
    const result = lintCompose(file.compose, { envExample: file.envExample });
    assert.deepEqual(result.errors, [], `${file.slug}: ${JSON.stringify(result.errors)}`);
    assert.deepEqual(result.warnings, [], `${file.slug}: ${JSON.stringify(result.warnings)}`);
    assert.ok(result.services > 0, `${file.slug} has no services`);
  }
});

test("every service has a pinned image, a healthcheck and a restart policy", () => {
  for (const file of files) {
    for (const service of serviceSummary(file.compose)) {
      const image = parseImage(service.image);
      assert.ok(image?.pinned, `${file.slug}/${service.name}: ${service.image} is not pinned`);
      assert.equal(service.healthcheck, true, `${file.slug}/${service.name}: missing healthcheck`);
      assert.ok(service.restart && service.restart !== "no", `${file.slug}/${service.name}: missing restart`);
    }
  }
});

test("no database service publishes a host port by default", () => {
  const databasePattern = /(postgres|mysql|mariadb|mongo|redis|clickhouse|cockroachdb)/i;
  for (const file of files) {
    for (const service of serviceSummary(file.compose)) {
      if (!databasePattern.test(service.image ?? "")) continue;
      assert.deepEqual(service.ports, [], `${file.slug}/${service.name} publishes ${service.ports.join(", ")}`);
    }
  }
});

test("bind mounts are read-only and every stack declares its volumes", () => {
  for (const file of files) {
    const result = lintCompose(file.compose, { envExample: file.envExample });
    assert.equal(result.errors.filter((error) => error.rule === "bind-mount").length, 0);
    assert.equal(result.errors.filter((error) => error.rule === "volume-declaration").length, 0);
  }
});

test("the catalog derives services, env keys and summaries from the files", () => {
  const catalog = buildCatalog(files);
  assert.equal(catalog.length, 12);
  for (const stack of catalog) {
    assert.ok(stack.title.length > 2);
    assert.ok(stack.summary.length > 20, `${stack.slug} summary`);
    assert.ok(stack.services.length > 0);
    assert.ok(Array.isArray(stack.envKeys));
    assert.ok(stack.compose.includes("services:"));
    assert.ok(stack.readme.startsWith("#"));
    assert.deepEqual(stack.lint.errors, []);
  }
  const postgres = catalog.find((stack) => stack.slug === "postgres");
  assert.equal(postgres.services[0].name, "postgres");
  assert.equal(postgres.services[0].ports.length, 0);
  assert.ok(postgres.envKeys.includes("POSTGRES_PASSWORD"));
});

test("summary extraction takes the first paragraph after the heading", () => {
  const text = "# Title\n\nFirst sentence. Second sentence.\n\n## Run\n\nother";
  assert.equal(summarise(text), "First sentence. Second sentence.");
  assert.equal(summarise(""), "");
});

test("demo/stacks-data.js matches the compose files on disk", () => {
  const expected = buildCatalog(files);
  assert.deepEqual(JSON.parse(JSON.stringify(STACKS)), JSON.parse(JSON.stringify(expected)),
    "demo data is stale — run `npm run sync-demo`");
});
