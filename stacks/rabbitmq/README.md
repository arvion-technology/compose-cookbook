# RabbitMQ

RabbitMQ 3.13 with the management plugin. AMQP (5672) is not published; only the
management UI is, and only on `127.0.0.1`.

## Run

```bash
cp .env.example .env
docker compose up -d
open http://127.0.0.1:15672      # log in with RABBITMQ_USER / RABBITMQ_PASSWORD
```

Applications connect to `amqp://app:change-me@rabbitmq:5672/app` from another
container on the `messaging` network.

## Notes

- The vhost is created from `RABBITMQ_DEFAULT_VHOST`; per-service users should be
  created separately rather than sharing the default user.
- The management UI is a debugging aid. Do not publish it on `0.0.0.0`.
- Definitions, queues and messages live in the `rabbitmq-data` volume.
- For a queue that must survive a broker restart, use durable queues and
  persistent messages; the volume alone is not enough.
