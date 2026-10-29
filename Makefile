# Compose Cookbook, one target per operation, stack selected with STACK=<slug>.
SHELL := /bin/bash
STACK ?= postgres

.PHONY: help list validate test sync up down logs ps

help:
	@echo "make list                 list stacks"
	@echo "make validate             run scripts/validate.sh (no Docker daemon needed)"
	@echo "make test                 node --test"
	@echo "make sync                 regenerate demo/stacks-data.js from stacks/"
	@echo "make up STACK=redis       copy .env.example if needed and start the stack"
	@echo "make down STACK=redis     stop the stack"
	@echo "make logs STACK=redis     follow logs"
	@echo "make ps STACK=redis       show container state"

list:
	@ls -1 stacks | sed 's/^/  /'

validate:
	@./scripts/validate.sh

test:
	@npm test

sync:
	@node scripts/sync-demo.mjs

up:
	@cd stacks/$(STACK) && { [ -f .env ] || cp .env.example .env; } && docker compose up -d

down:
	@cd stacks/$(STACK) && docker compose down

logs:
	@cd stacks/$(STACK) && docker compose logs -f

ps:
	@cd stacks/$(STACK) && docker compose ps
