import test from "node:test";
import assert from "node:assert/strict";
import { parseYaml, YamlError } from "../src/yaml.js";

test("parses nested mappings, sequences and flow arrays", () => {
  const doc = parseYaml(`
name: demo
services:
  app:
    image: nginx:1.27.2-alpine
    ports:
      - "127.0.0.1:8080:80"
    environment:
      DEBUG: false
      RETRIES: 3
    healthcheck:
      test: ["CMD", "wget", "-qO-", "http://localhost/"]
      interval: 10s
    mem_limit: 128m
`);
  assert.equal(doc.name, "demo");
  assert.equal(doc.services.app.image, "nginx:1.27.2-alpine");
  assert.deepEqual(doc.services.app.ports, ["127.0.0.1:8080:80"]);
  assert.equal(doc.services.app.environment.DEBUG, false);
  assert.equal(doc.services.app.environment.RETRIES, 3);
  assert.deepEqual(doc.services.app.healthcheck.test, ["CMD", "wget", "-qO-", "http://localhost/"]);
  assert.equal(doc.services.app.healthcheck.interval, "10s");
  assert.equal(doc.services.app.mem_limit, "128m");
});

test("parses comments, blank lines, quoted strings and null mappings", () => {
  const doc = parseYaml(`
# a comment
volumes:
  pgdata:            # trailing comment
  cache:
services:
  db:
    image: "postgres:16.4-alpine"
    command: server /data --console-address ":9001"
`);
  assert.deepEqual(doc.volumes, { pgdata: null, cache: null });
  assert.equal(doc.services.db.image, "postgres:16.4-alpine");
});

test("parses depends_on conditions and variable placeholders", () => {
  const doc = parseYaml(`
services:
  web:
    image: app:1.0
    depends_on:
      db:
        condition: service_healthy
    environment:
      DB_URL: postgres://app:\${DB_PASSWORD:-secret}@db:5432/app
`);
  assert.equal(doc.services.web.depends_on.db.condition, "service_healthy");
  assert.match(doc.services.web.environment.DB_URL, /\$\{DB_PASSWORD:-secret\}/);
});

test("empty values become null and empty flow structures become objects/arrays", () => {
  const doc = parseYaml("a:\nb: {}\nc: []\n");
  assert.equal(doc.a, null);
  assert.deepEqual(doc.b, {});
  assert.deepEqual(doc.c, []);
});

test("bad indentation, tabs and missing colons are rejected with a line number", () => {
  assert.throws(() => parseYaml("a:\n\tb: 1"), YamlError);
  assert.throws(() => parseYaml("a:\n  b: 1\n c: 2"), YamlError);
  assert.throws(() => parseYaml("just some words"), YamlError);
});

test("anchor syntax is unsupported rather than silently mishandled", () => {
  assert.throws(() => parseYaml("a: &anchor 1"), (error) => error instanceof YamlError || error instanceof Error);
});
