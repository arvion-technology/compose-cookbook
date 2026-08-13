# Grafana + Prometheus

Grafana with a Prometheus datasource provisioned at boot. Only Grafana publishes
a port, and only on `127.0.0.1`; Prometheus stays on the internal network.

## Run

```bash
cp .env.example .env      # change the admin password
docker compose up -d
open http://127.0.0.1:3000
```

Log in with the values from `.env`. The datasource is already configured, so a
new panel can query `up` immediately.

## Notes

- Provisioning files are mounted `:ro`; dashboards created in the UI live in the
  `grafana-data` volume, not in the repository.
- Anonymous access and sign-ups are disabled in the environment block.
- Prometheus retention defaults to 15 days.
- `depends_on: condition: service_healthy` means Grafana waits for Prometheus,
  but Prometheus being healthy does not mean your scrape targets are up.
