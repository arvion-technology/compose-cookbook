# LocalStack (lite)

S3 and SQS emulated locally, with persistence enabled. The gateway is published
on `127.0.0.1:4566` so the AWS CLI and SDKs can use it.

## Run

```bash
cp .env.example .env
docker compose up -d
AWS_ACCESS_KEY_ID=test AWS_SECRET_ACCESS_KEY=test   aws --endpoint-url http://127.0.0.1:4566 s3 mb s3://demo-bucket
```

## Notes

- Only the services listed in `SERVICES` are enabled. Adding more is one env
  change, at the cost of a slower start.
- Credentials are the literal strings `test`; LocalStack ignores their content.
  An application must never ship these defaults to a real AWS account.
- `PERSISTENCE=1` keeps state in the `localstack-data` volume across restarts.
- Emulated services do not behave identically to AWS at the edges. Run the
  integration suite against the real service before release.
