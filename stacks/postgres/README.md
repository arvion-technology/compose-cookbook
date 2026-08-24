# Postgres

Postgres 16 on a private compose network. No host port is published, so the
database is reachable only from containers on the `database` network.

## Run

```bash
cp .env.example .env      # then change POSTGRES_PASSWORD
docker compose up -d
docker compose exec postgres psql -U app -d app
```

## Notes

- The healthcheck uses `pg_isready` with the actual user and database, so a
  server that is up but not accepting connections still reads as unhealthy.
- `POSTGRES_INITDB_ARGS` forces SCRAM authentication for host connections.
- Data lives in the named `postgres-data` volume. `docker compose down -v`
  deletes it; that is deliberate.
- Add `ports: ["127.0.0.1:5432:5432"]` only if you need a GUI client on the host,
  and never bind it to `0.0.0.0`.
