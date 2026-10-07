# ADR 0002 — durable commit, bounded admission and rate counters

Status: implemented foundation, benchmark pending.

Success follows COMMIT under the database's configured durability semantics. A failed or uncertain write returns retryable unavailability. A lost response after commit remains uncertain to the client; a retry with the same idempotency key resolves duplicate insertion. Receipts have a unique key/request ID and a content hash; altered content conflicts. No default content-hash deduplication: identical legitimate batches may represent separate events.

Fastify limits admitted requests before parsing, with compressed and expanded body limits. Capacity returns 429 with Retry-After. Each admitted request consumes one reservation through completion. Redis counts by credential ID and minute using one atomic increment/expiry script; no in-memory fallback on outage. Fail-closed Redis outage returns 503. Fixed windows permit boundary bursts; the separate concurrency cap still bounds memory. A token-bucket/quota expansion requires measured requirements.

Do not claim process crash, database host loss and region loss have the same durability guarantee. This release assumes PostgreSQL WAL/fsync and synchronous_commit defaults with durable underlying storage. Replication and disaster recovery remain separate operational work.

## Where this lives in code

| Claim | Code |
| --- | --- |
| Success only after COMMIT | `packages/core/db.ts:22-38` (`BEGIN`, `set_config('app.org_id', …, true)`, work, `COMMIT`); `services/ingest/server.ts:123-151` returns 200 only after `storeBatch` resolves |
| Failed/uncertain write -> retryable 503 | `server.ts:136-146` (`Retry-After: 2`) |
| Receipts keyed by key + request id, content hash | `db/migrations/001_core.sql:10-14` (`PRIMARY KEY (key_id, request_id)`); `services/ingest/store.ts:15-36` (`ON CONFLICT DO NOTHING`, then compare `payload_hash`, `IdempotencyConflict` -> 409 at `server.ts:134-135`) |
| Idempotency key format | `server.ts:111-118` (`^[A-Za-z0-9._:-]{1,128}$`, otherwise a random UUID) |
| Admission before parsing | `onRequest` hook, `server.ts:59-86`: concurrency cap (default 16, 429 `Retry-After: 1`), then auth, then rate limit |
| Compressed and expanded limits | `bodyLimit: 1024 * 1024` (`server.ts:17`); `gunzipSync(..., { maxOutputLength: 1024 * 1024 })` (`server.ts:37`) |
| One reservation per admitted request | `active++` + `admitted` WeakSet (`server.ts:66-67`), released in `onResponse` (`server.ts:87-89`) |
| Atomic per-key-per-minute counter, fail closed | `services/ingest/rate-limit.ts:19-29` (Lua `INCR` + `EXPIRE 120`, key `signalpost:rate:{keyId}:{minute}`); Redis error -> 503 at `server.ts:80-85` |

## Review notes

- **Hash is over re-serialized JSON.** The content hash is `sha256(signal + JSON.stringify(request.body))`
  (`server.ts:119-122`) — the *parsed* body, re-serialized. A retry whose JSON differs only in key order or
  whitespace hashes the same if the parsed objects stringify identically, but a client that reorders object keys
  between retries gets a 409 conflict. Document that retries must resend the same payload.
- **Raw payload is retained.** `ingest_batches.payload` stores the full request body (`store.ts:16`, `23`)
  alongside the decoded rows, roughly doubling write volume per batch; no retention for it is configured here.
- **Rollback on a broken connection.** If `COMMIT` fails because the connection died, the `ROLLBACK` in
  `db.ts:33` can itself throw and replace the original error, and `client.release()` (line 36) returns the
  client to the pool without marking it broken. Releasing with the error (`client.release(error)`) avoids
  reusing a dead connection.

**Check:** trace a retry that reuses an idempotency key with *identical* content: which query returns no rows,
which `SELECT` runs, and what HTTP status the client gets (`store.ts:26-35`; 200 at `server.ts:148-151`).
