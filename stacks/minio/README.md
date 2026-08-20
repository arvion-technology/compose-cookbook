# MinIO

S3-compatible object storage with the web console. API and console are published
on `127.0.0.1` only; remove the `ports` block entirely to keep them private to
compose.

## Run

```bash
cp .env.example .env      # change the root password
docker compose up -d
open http://127.0.0.1:9001
```

Create a bucket from the console, or with any S3 SDK pointed at
`http://127.0.0.1:9000`.

## Notes

- The root credentials are bootstrap credentials. For anything shared, create a
  scoped access key and use that in the application.
- Data lives in the `minio-data` named volume.
- The healthcheck hits MinIO's own `/minio/health/live` endpoint, not a TCP port.
- Pin the release tag rather than `latest`; object-storage upgrades are not
  always reversible.
