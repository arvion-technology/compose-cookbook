# Postgres with backups

Postgres 16 plus a sidecar that runs `pg_dump` on a schedule. The sidecar waits
for the database healthcheck before it starts, so the first dump is not empty.

## Run

```bash
cp .env.example .env
docker compose up -d
docker compose logs -f backup        # shows the dump schedule
docker compose exec backup ls /backups
```

## Restore

Copy a dump out, then restore into a scratch database:

```bash
docker compose cp backup:/backups/last/app_latest.sql.gz ./app.sql.gz
gunzip -c app.sql.gz | docker compose exec -T postgres psql -U app -d app
```

## Notes

- The backup container is on the same private network; Postgres still publishes
  no host port.
- Dumps land in the named `backups` volume with daily, weekly and monthly
  rotations handled by the image.
- A backup you have never restored is not a backup. Run the restore above at
  least once before trusting it.
