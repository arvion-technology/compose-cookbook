# SonarQube (lite)

SonarQube Community edition with its own Postgres. The UI is on localhost only;
the database has no host port.

## Run

```bash
# SonarQube's embedded Elasticsearch needs a higher map count on the host:
sudo sysctl -w vm.max_map_count=262144
cp .env.example .env
docker compose up -d
open http://127.0.0.1:9000      # admin / admin on first login
```

The first start takes a minute; the healthcheck waits for the API to report UP.

## Notes

- `vm.max_map_count` is a host setting. Without it the container exits and the
  logs mention `max virtual memory areas`.
- `start_period: 120s` is there because SonarQube really does take that long on a
  cold database.
- The 2 GB memory limit is the practical minimum for the Community edition; give
  it more for a real codebase.
- The JDBC password is shared by both services through `.env`. Rotate it in both
  places if you change it.
