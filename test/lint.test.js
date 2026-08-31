import test from "node:test";
import assert from "node:assert/strict";
import { lintCompose, parseImage } from "../src/lint.js";

const VALID = `name: demo
services:
  app:
    image: nginx:1.27.2-alpine
    restart: unless-stopped
    mem_limit: 128m
    cpus: 0.5
    ports:
      - "127.0.0.1:8080:80"
    healthcheck:
      test: ["CMD", "wget", "-qO-", "http://localhost/"]
      interval: 10s
      timeout: 5s
      retries: 3
    networks:
      - edge
networks:
  edge:
    driver: bridge
`;

const ENV = "APP_PORT=8080\n";

test("a well-formed stack produces no errors or warnings", () => {
  const result = lintCompose(VALID, { envExample: ENV });
  assert.deepEqual(result.errors, []);
  assert.deepEqual(result.warnings, []);
  assert.equal(result.services, 1);
  assert.equal(result.stack, "demo");
});

test("unpinned and latest images are errors", () => {
  for (const image of ["nginx", "nginx:latest", "postgres"]) {
    const result = lintCompose(VALID.replace("nginx:1.27.2-alpine", image), { envExample: ENV });
    assert.ok(result.errors.some((error) => error.rule === "unpinned-image"), image);
  }
  assert.equal(parseImage("nginx:1.27.2-alpine").pinned, true);
  assert.equal(parseImage("nginx").pinned, false);
  assert.equal(parseImage("registry.local:5000/app").pinned, false);
  assert.equal(parseImage("registry.local:5000/app:2.1").pinned, true);
  assert.equal(parseImage("app@sha256:abc").pinned, true);
});

test("databases with host ports are rejected, localhost bindings warn", () => {
  const exposed = VALID
    .replace("nginx:1.27.2-alpine", "postgres:16.4-alpine")
    .replace('"127.0.0.1:8080:80"', '"5432:5432"');
  const result = lintCompose(exposed, { envExample: ENV });
  assert.ok(result.errors.some((error) => error.rule === "database-port"));

  const local = VALID
    .replace("nginx:1.27.2-alpine", "postgres:16.4-alpine")
    .replace('"127.0.0.1:8080:80"', '"127.0.0.1:5432:5432"');
  const localResult = lintCompose(local, { envExample: ENV });
  assert.ok(localResult.warnings.some((warning) => warning.rule === "database-port-local"));
  assert.equal(localResult.errors.length, 0);
});

test("missing healthcheck, restart policy and resource limits are reported", () => {
  const broken = VALID
    .replace(/\n    healthcheck:\n(?:      .*\n)+/, "\n")
    .replace("    restart: unless-stopped\n", "")
    .replace("    mem_limit: 128m\n", "")
    .replace("    cpus: 0.5\n", "");
  const result = lintCompose(broken, { envExample: ENV });
  const rules = result.errors.map((error) => error.rule);
  assert.ok(rules.includes("healthcheck"));
  assert.ok(rules.includes("restart"));
  assert.ok(result.warnings.some((warning) => warning.rule === "resources"));
});

test("read-write bind mounts, privileged containers and host networking are errors", () => {
  const unsafe = VALID.replace("    networks:\n      - edge\n", `    networks:
      - edge
    volumes:
      - ./data:/data
    privileged: true
    network_mode: host
`);
  const result = lintCompose(unsafe, { envExample: ENV });
  const rules = result.errors.map((error) => error.rule);
  assert.ok(rules.includes("bind-mount"));
  assert.ok(rules.includes("privileged"));
  assert.ok(rules.includes("host-network"));
});

test("read-only bind mounts and declared volumes are fine", () => {
  const fine = VALID.replace("    networks:\n      - edge\n", `    networks:
      - edge
    volumes:
      - ./nginx.conf:/etc/nginx/conf.d/default.conf:ro
      - cache:/var/cache/nginx
volumes:
  cache:
`);
  const result = lintCompose(fine, { envExample: ENV });
  assert.deepEqual(result.errors, []);
});

test("undeclared volumes, networks and dependencies are errors", () => {
  const broken = VALID.replace("networks:\n  edge:\n    driver: bridge\n", "").replace(
    "    networks:\n      - edge\n",
    "    networks:\n      - edge\n    volumes:\n      - orphan:/data\n    depends_on:\n      ghost:\n        condition: service_started\n",
  );
  const result = lintCompose(broken, { envExample: ENV });
  const rules = result.errors.map((error) => error.rule);
  assert.ok(rules.includes("network-declaration"));
  assert.ok(rules.includes("volume-declaration"));
  assert.ok(rules.includes("depends-on"));
});

test("variables referenced by the stack must be documented in .env.example", () => {
  const withVar = VALID.replace("http://localhost/", "http://localhost:${APP_PORT}/");
  const result = lintCompose(withVar, { envExample: "" });
  assert.ok(result.warnings.some((warning) => warning.rule === "env-example"));
  assert.deepEqual([...result.envKeys], ["APP_PORT"]);
  const documented = lintCompose(withVar, { envExample: ENV });
  assert.equal(documented.warnings.length, 0);
});

test("broken YAML comes back as an error instead of throwing", () => {
  const result = lintCompose("services:\n  app:\n    image: nginx\n   bad: indent\n");
  assert.equal(result.errors[0].rule, "yaml");
  assert.match(result.errors[0].message, /line/);
});

test("a compose file without services is rejected", () => {
  const result = lintCompose("name: empty\n");
  assert.ok(result.errors.some((error) => error.rule === "services"));
});
