# Prepare the Signalpost bootcamp and verified local foundation

Signalpost began as an empty directory and an ambitious project/mentoring contract. This change provides a self-paced Next.js workspace with 13 milestones, 52 full tickets, a prediction/evidence journal, and a synthetic telemetry lab. It also establishes bounded OTLP/HTTP JSON ingestion, transactional raw-payload receipts and normalized telemetry storage, tenant-scoped queries, and a .NET 10 Sentinel foundation.

Delivery evidence and learner competence are tracked separately. The autonomous-work amendment allows preparation without a live calibration interview, but does not invent learner plans, SOLO hours, explain-backs, skill ratings, independent reviews or production operation.

Verified locally: strict TypeScript; 16 JS invariant tests plus the subsequently added empty-log regression; 14 xUnit domain tests; production Next build; curriculum validation; five browser behaviors including automated accessibility, with failed contrast checks corrected and rerun; npm production audit and .NET transitive package scan with no reported vulnerabilities. Exact commands and limits are in run 0001.

Risks and limits: the Docker/Timescale test suite cannot start on this host; full OTLP binary/metric compatibility, interactive identity/RBAC, incident-management workflows, maintenance jobs, real notifications, distributed restart/load tests and production SLOs remain open. This is a local foundation, not a completed production platform. No public deployment, remote CI, independent review or human assessment has occurred. The branch must not be merged merely because local checks pass.

Alternatives and tradeoffs are recorded in six ADRs: service boundaries, durable acknowledgement/backpressure, query isolation and private aggregates, persisted alert effects/leadership, elapsed-time on-call scheduling, and upgrade/recovery policy. Original JSON preservation and the private aggregate mirror add write/storage overhead that must be measured before the full-rate claim.

This is an agent-authored draft. It is not graded as the learner's communication artifact. The learner's independent review and defense remain pending.
