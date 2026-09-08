# ADR 0004 — persisted episodes, constraints and expiring leadership

Status: implementation plus domain tests; distributed restart verification pending.

Threshold rules evaluate the mean of matching metric samples over a bounded lookback. `for` requires consecutive observed high evaluations; low values resolve. Missing data clears pending continuity but does not assert recovery of a firing alert. A gap longer than two cadences restarts pending. Persist every observation and state; no outage backfill is inferred.

An alert episode has an identity. Database UNIQUE(episode_id,step) prevents duplicate logical pages, including after acknowledgement. State, pages and outbox records commit together. An expiring Redis token lease reduces duplicate evaluator work; compare-and-delete prevents an old owner deleting a successor's lease. The database transaction advisory lock serializes each organization even if a lease expires mid-work. A constraint alone cannot serialize competing state transitions; that is why the transaction lock exists.

Outbox workers lock pending rows with SKIP LOCKED, send with a stable idempotency key, and retry with bounded backoff and dead-letter status. A crash after provider acceptance but before commit can repeat a send. Provider idempotency is required for duplicate suppression outside the database. A provider HTTP success is not evidence a human received or acknowledged a page. This release permits loopback sinks only.

The custom transaction outbox is the page-delivery correctness mechanism, not a substitute for the planned pg-boss/BullMQ maintenance-job system. General jobs, grouping, inhibition, policy-driven escalation and real provider integration remain open.
