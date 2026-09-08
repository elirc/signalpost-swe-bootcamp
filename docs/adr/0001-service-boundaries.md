# ADR 0001 — dedicated ingestion and Sentinel boundaries

Status: implemented foundation, pending independent review.

Next owns browser delivery and authenticated bounded queries. Fastify owns ingestion admission, wire validation and durable writes. Sentinel owns threshold state, page identity, on-call resolution and notification attempts. Putting ingestion inside Next would couple ingest admission and shutdown to interactive web traffic and rendering; a separate process provides an explicit capacity boundary and independent scaling.

OTLP/HTTP JSON is the initial supported subset; binary encoding and additional signals/types are open compatibility tickets. gRPC requires a separate ADR covering operational and interoperability benefit. No unimplemented protocol path returns fabricated success.

Source: [OTLP specification](https://opentelemetry.io/docs/specs/otlp/). Sender retries after missing acknowledgements can duplicate data. Optional Signalpost idempotency keys bind a key, request ID and content hash; they do not change OTLP's baseline delivery guarantee.
