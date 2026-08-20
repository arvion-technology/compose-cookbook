# Mailpit

A local SMTP sink with a web UI. Point the application's `SMTP_HOST` at `mailpit`
on the compose network (or `127.0.0.1:1025` from the host) and every message is
captured instead of delivered.

## Run

```bash
cp .env.example .env
docker compose up -d
open http://127.0.0.1:8025
```

## Notes

- Mailpit accepts any SMTP authentication. That is the point in development and
  exactly why this stack must not be reachable from a network.
- Both the UI and SMTP ports are bound to `127.0.0.1`.
- Message storage is in memory; restarting the container clears the inbox.
- For staging, add a real relay and keep this for tests only.
