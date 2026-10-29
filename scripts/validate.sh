#!/usr/bin/env bash
# Validate every compose stack without requiring a Docker daemon.
#
#   ./scripts/validate.sh
#
# First pass: the repository's own linter (YAML shape, pinned images, healthchecks,
# database ports, bind mounts, declarations, .env coverage). If a Docker daemon is
# available, a second pass asks `docker compose config` to normalise each file;
# when it is not available the script says so and exits on the static result.
set -euo pipefail
cd "$(dirname "$0")/.."

if ! command -v node >/dev/null 2>&1; then
  echo "node is required for the static validator" >&2
  exit 1
fi

node scripts/validate.mjs "$@"

if command -v docker >/dev/null 2>&1 && docker info >/dev/null 2>&1 && docker compose version >/dev/null 2>&1; then
  echo
  echo "docker daemon found, running 'docker compose config' on every stack"
  for stack in stacks/*/; do
    docker compose -f "${stack}docker-compose.yml" config >/dev/null
    echo "  ${stack}  config ok"
  done
else
  echo
  echo "docker daemon not available, static validation only (this is the CI path)"
fi
