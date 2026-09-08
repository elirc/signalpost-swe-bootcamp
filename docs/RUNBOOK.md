# Operational runbooks

These procedures are prepared for testing. They are not evidence of a completed drill. Use synthetic data and a loopback notification sink until release gates pass.

## Ingest capacity full

Observe HTTP 429 and Retry-After, active count/capacity, DB commit latency and connection waits. Reconcile batch IDs with durable storage; keep uncertain outcomes distinct. Reduce sender rate and repair database health. Do not increase memory without a measured capacity model and do not drop accepted records. Verify capacity reservations return after responses and shutdown drains admitted writes.

## Evaluator lost leadership

Inspect Redis availability/TTL, evaluator logs and last persisted evaluations by org/rule. Check whether the database transaction lock is held and whether the old process is still working. Never delete a lease blindly. Allow expiry or stop the confirmed owner; the successor uses a transaction lock and persisted state. Verify new evaluations and page episode/step uniqueness. Pending continuity resets after a gap; no retrospective “should have fired” claim is inferred without evidence.

## Notification delivery failed

Inspect outbox available_at, attempts, delivered_at, dead_at and sanitized last_error. HTTP success means provider acceptance, not human receipt. An uncommitted delivered marker is ambiguous; retry must preserve the outbox Idempotency-Key. Do not mark the alert acknowledged to stop retries. Dead-letter requeue requires an audited operator action and provider reconciliation; that UI/API is not implemented yet.

## Compression/aggregate job stuck

No compression or destructive retention job is enabled in this release. Inspect Timescale job status, locks, aggregate source and refresh watermarks in a disposable environment. Confirm durable raw data before refresh. Never delete raw data to free space until policy and aggregate coverage are proven. Enabling these jobs requires the open M2/M8 tickets and restore evidence.

## Backup/recovery

Use a migration administrator to take a custom-format pg_dump and restore into a NEW isolated database. Timescale extension version must match and its documented pre/post-restore steps apply. Compare tenant counts, idempotency receipts, page/outbox identities and append-only history. Restore is not a safe way to blindly replay already-sent notifications; reconcile provider identities first. The container test provides a baseline schema/data recovery exercise; a real Timescale operational restore remains a separate gate.
