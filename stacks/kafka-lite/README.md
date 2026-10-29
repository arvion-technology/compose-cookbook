# Kafka (lite)

A single-node Kafka broker using KRaft, no ZooKeeper container, one process. It
does not publish a host port, so producers and consumers join the `messaging`
network.

## Run

```bash
cp .env.example .env
docker compose up -d
docker compose exec kafka kafka-topics.sh --bootstrap-server localhost:9092 --list
```

Create a topic explicitly (auto-creation is disabled):

```bash
docker compose exec kafka kafka-topics.sh --bootstrap-server localhost:9092   --create --topic events --partitions 1 --replication-factor 1
```

## Notes

- This is a development broker. Replication factor one means a broker restart is
  data loss for recent writes, and one node cannot demonstrate failover.
- `advertised.listeners` uses the service name `kafka`, which is what other
  containers must use. A host client needs an extra listener and published port.
- KRaft replaces ZooKeeper; there is no third service to keep healthy.
- Plaintext listeners only. Add SASL and TLS before exposing it beyond compose.
