# nginx reverse proxy

An nginx entry point with a plain-HTTP health endpoint, an HTTP-to-HTTPS redirect
and a TLS server block. Config is mounted read-only; certificates live in the
`certs` volume.

## Run

```bash
cp .env.example .env
# Put fullchain.pem and privkey.pem into the certs volume, or point the TLS
# server block at a mounted directory you control.
docker compose up -d
curl -i http://127.0.0.1:8080/healthz
```

## Notes

- `proxy_pass http://app:3000` assumes a service named `app` on the `edge`
  network. Rename it to the service you are putting behind the proxy.
- The TLS block needs a certificate before nginx will start. For local
  development, generate a self-signed pair with `openssl req -x509` and copy it
  into the volume.
- Healthchecks hit nginx itself, not the upstream. An unhealthy upstream shows up
  as a 502, not as an unhealthy container.
- Request size limits and timeouts belong here; nginx defaults are generous.
