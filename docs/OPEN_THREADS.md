# Open threads and acceptance blockers

This file preserves the full project scope. None of these requirements is silently removed by producing a useful foundation.

1. Public repository/PR and public URL: destination/account not supplied. Local branch remains unreviewed; no publication or real deployment observed. Public tenant data and privileged operations stay closed until M3 review.
2. Learning process: M0 calibration, plans, SOLO/PAIR work, predictions, explain-backs, changed-example assessments and skill ratings are all unassessed.
3. Independent review: Claude Code must review the exact handoff commit; findings need written resolution/rebuttal. Monthly human review from M2, real users from M6, and outside contributions are pending.
4. OTLP compatibility: receiver currently accepts JSON logs, numeric gauges and spans, retaining each original JSON payload atomically. Binary Protobuf and remaining metric types are explicit open work. Normalized scope metadata and complete span querying need a compatibility expansion before claiming full OTLP support.
5. Identity: scoped bearer credentials are implemented for ingestion/querying; interactive identity, organization membership, RBAC administration and key-management UI are not implemented.
6. Sentinel integration: state machine/resolver and worker source are present. Actual PostgreSQL/Redis evaluator crash/restart, lease takeover, outbox ambiguity and cross-service trace stitching need end-to-end verification. Full grouping/inhibition and configurable escalation policies remain open.
7. On-call/incident product: schema and resolver exist. Schedule editor, audited mutations, acknowledgement API, incident console, postmortem/action-item workflow and reviewed status publication are pending.
8. Storage operations: private continuous-aggregate source and Timescale migration require container verification. Refresh watermarks, retention/downsample jobs, recovery rehearsal and durable dead-letter replay controls remain open. Never enable destructive retention to make a demo appear complete.
9. Frontend product depth: curriculum/evidence portal and synthetic chart/log explorer are implemented. Persistent dashboard editor, accessible real-data charts, incident interactions and measured frame budget remain open.
10. Platform API: scoped query route exists. Versioned alerts/incidents/on-call API, config importer, SDK, signed webhooks and deprecation policy remain open.
11. Performance/ops/security: 50k logs/s + 20k samples/s + 5k spans/s, 500-rule cadence, seven-day workload, 4-vCPU Timescale budget, zero-loss reconciliation, SLOs, backup drills, Sentry, feature flags and independent security review remain unproven.

Use the matching milestone tickets to complete each requirement. Do not mark a milestone delivered merely because its schema, documentation or unit tests exist.
