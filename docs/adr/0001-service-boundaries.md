# ADR 0001 — dedicated ingestion and Sentinel boundaries

Status: implemented foundation, pending independent review.

Next owns browser delivery and authenticated bounded queries. Fastify owns ingestion admission, wire validation and durable writes. Sentinel owns threshold state, page identity, on-call resolution and notification attempts. Putting ingestion inside Next would couple ingest admission and shutdown to interactive web traffic and rendering; a separate process provides an explicit capacity boundary and independent scaling.

OTLP/HTTP JSON is the initial supported subset; binary encoding and additional signals/types are open compatibility tickets. gRPC requires a separate ADR covering operational and interoperability benefit. No unimplemented protocol path returns fabricated success.

Source: [OTLP specification](https://opentelemetry.io/docs/specs/otlp/). Sender retries after missing acknowledgements can duplicate data. Optional Signalpost idempotency keys bind a key, request ID and content hash; they do not change OTLP's baseline delivery guarantee.

## Where this lives in code

- Ingest is its own Fastify process: `services/ingest/main.ts` (entry, run with `npm run ingest`) and
  `services/ingest/server.ts` (routes `POST /v1/logs|metrics|traces`, lines 95-152, plus `/health`, lines 90-94).
- Next serves the UI and one bounded query route: `apps/web/app/api/query/route.ts`, backed by
  `packages/core/query.ts`.
- Sentinel is a separate .NET service: `services/sentinel/Program.cs`, `Evaluator.cs` (thresholds, pages),
  `Delivery.cs` (outbox), `Domain.cs` (pure state machine and on-call resolver).
- OTLP/HTTP JSON decoding: `packages/core/otlp.ts`. Metrics accept numeric **gauge** points only; a batch
  containing `sum`, `histogram` or `summary` is rejected whole (`otlp.ts:167-180`).
- The JSON parser accepts only `identity` or `gzip` content encoding (`server.ts:33-37`); anything else is 400.

**Check:** confirm that no route in `services/ingest/server.ts` returns success without calling `storeBatch`
— the only `200` is at line 150, after the `await storeBatch(...)` on line 124.
