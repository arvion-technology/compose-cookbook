# Prometheus

Prometheus with a scrape configuration mounted read-only and a retained data
volume. The UI is published on `127.0.0.1` only.

## Run

```bash
cp .env.example .env
docker compose up -d
open http://127.0.0.1:9090
```

## Notes

- `prometheus.yml` is mounted `:ro`. Edit it on the host, then
  `docker compose exec prometheus kill -HUP 1` (lifecycle API is enabled).
- Retention defaults to 15 days. Storage lives in the `prometheus-data` volume.
- The stack scrapes itself; add services by name on the `monitoring` network.
- Prometheus is not long-term storage. Send remote-write to a store built for it
  if you need a year of history.
