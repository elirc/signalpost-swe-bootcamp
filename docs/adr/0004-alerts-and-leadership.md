# ADR 0004 — persisted episodes, constraints and expiring leadership

Status: implementation plus domain tests; distributed restart verification pending.

Threshold rules evaluate the mean of matching metric samples over a bounded lookback. `for` requires consecutive observed high evaluations; low values resolve. Missing data clears pending continuity but does not assert recovery of a firing alert. A gap longer than two cadences restarts pending. Persist every observation and state; no outage backfill is inferred.

An alert episode has an identity. Database UNIQUE(episode_id,step) prevents duplicate logical pages, including after acknowledgement. State, pages and outbox records commit together. An expiring Redis token lease reduces duplicate evaluator work; compare-and-delete prevents an old owner deleting a successor's lease. The database transaction advisory lock serializes each organization even if a lease expires mid-work. A constraint alone cannot serialize competing state transitions; that is why the transaction lock exists.

Outbox workers lock pending rows with SKIP LOCKED, send with a stable idempotency key, and retry with bounded backoff and dead-letter status. A crash after provider acceptance but before commit can repeat a send. Provider idempotency is required for duplicate suppression outside the database. A provider HTTP success is not evidence a human received or acknowledged a page. This release permits loopback sinks only.

The custom transaction outbox is the page-delivery correctness mechanism, not a substitute for the planned pg-boss/BullMQ maintenance-job system. General jobs, grouping, inhibition, policy-driven escalation and real provider integration remain open.

## Where this lives in code

| Mechanism | Code |
| --- | --- |
| Lease: `SET NX` with 25 s expiry, rechecked between organizations | `services/sentinel/Evaluator.cs:25-38` |
| Compare-and-delete release | `Evaluator.cs:41` (Lua `GET == token then DEL`) |
| Per-organization transaction lock | `Evaluator.cs:48-51` (`set_config('app.org_id')`, `pg_advisory_xact_lock(hashtextextended(org,0))`) |
| Mean over lookback, state machine | `Evaluator.cs:56-60` -> `ThresholdMachine.Evaluate` in `Domain.cs` |
| Initial page and one timeout escalation; acknowledgement halts | `Evaluator.cs:71-88` |
| Logical page identity | `UNIQUE(episode_id, step)` in `db/migrations/001_core.sql:75`; one outbox row per page and kind, `UNIQUE(page_id, kind)` at `:81` |
| State, evaluation, pages, outbox in one commit | `Evaluator.cs:100-101` |
| Outbox claim with `FOR UPDATE SKIP LOCKED`, batch of 10 | `services/sentinel/Delivery.cs:36-38` |
| Stable `Idempotency-Key` = outbox row id | `Delivery.cs:47` |
| Backoff `min(300, 2^attempts)` s + jitter; dead after 8 attempts | `Delivery.cs:57-60` |
| Loopback-only sinks | `Delivery.cs:16-17` |

## Review notes

- **HTTP inside the row-lock transaction.** Delivery holds the `FOR UPDATE` locks and an open transaction
  while it makes up to ten sequential HTTP calls (`Delivery.cs:36-64`). A slow sink stretches the transaction
  for the whole batch. Claiming rows (mark + commit), sending outside the transaction, then recording the
  result would shorten lock time at the cost of a claim-expiry rule.
- **Only transport errors are counted.** The `catch` covers `HttpRequestException` and
  `TaskCanceledException` (`Delivery.cs:53`). Any other exception aborts the organization's batch, rolls back
  the `Attempts++` (line 43), and the row can never reach dead-letter status.

**Check:** explain why the advisory lock on line 51 is still needed when the lease on line 27 exists (the lease
can expire mid-evaluation; line 36 only checks it *between* organizations).
