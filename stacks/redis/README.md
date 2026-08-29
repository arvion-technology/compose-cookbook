# Redis

Redis 7 with AOF persistence, a password and an LRU eviction policy. It does not
publish a host port; put the app on the `cache` network.

## Run

```bash
cp .env.example .env
docker compose up -d
docker compose exec redis redis-cli -a "$(grep REDIS_PASSWORD .env | cut -d= -f2)" ping
```

## Notes

- `appendfsync everysec` is the usual compromise: at most one second of writes
  lost on a crash, without paying a fsync per command.
- `maxmemory` is set below the container `mem_limit`, so Redis evicts instead of
  the kernel OOM-killing it.
- The healthcheck authenticates and looks for PONG; a running server that cannot
  serve commands is reported unhealthy.
- If this is a cache only, drop the volume and AOF for a cheaper setup.
