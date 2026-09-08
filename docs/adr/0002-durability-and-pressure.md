# ADR 0002 — durable commit, bounded admission and rate counters

Status: implemented foundation, benchmark pending.

Success follows COMMIT under the database's configured durability semantics. A failed or uncertain write returns retryable unavailability. A lost response after commit remains uncertain to the client; a retry with the same idempotency key resolves duplicate insertion. Receipts have a unique key/request ID and a content hash; altered content conflicts. No default content-hash deduplication: identical legitimate batches may represent separate events.

Fastify limits admitted requests before parsing, with compressed and expanded body limits. Capacity returns 429 with Retry-After. Each admitted request consumes one reservation through completion. Redis counts by credential ID and minute using one atomic increment/expiry script; no in-memory fallback on outage. Fail-closed Redis outage returns 503. Fixed windows permit boundary bursts; the separate concurrency cap still bounds memory. A token-bucket/quota expansion requires measured requirements.

Do not claim process crash, database host loss and region loss have the same durability guarantee. This release assumes PostgreSQL WAL/fsync and synchronous_commit defaults with durable underlying storage. Replication and disaster recovery remain separate operational work.
