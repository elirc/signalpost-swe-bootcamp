# Threat model

Assets: tenant telemetry, ingest/read/admin credentials, responder schedules, alert state, page delivery, incident history and public summaries. Trust boundaries: customer→ingest, browser→query API, service→database/Redis, Sentinel→notification provider, operator→migration tooling.

| Threat | Control / verification | Residual work |
| --- | --- | --- |
| Cross-tenant query | Derive org/project from hashed scoped credential; strict query schema; parameterized SQL; forced RLS and restricted query role | Full user identity, membership and browser sessions are not implemented |
| Write key leakage | Separate ingest/read scopes; redact authorization; no token persistence in browser; revocation checked each request | Rotation UX, key issuance audit and quotas require review |
| Ingest DoS | Bound in-flight requests before body parsing; 1 MiB compressed/expanded limit; 5000 records; per-key Redis counter; DB timeouts | Distributed quota fairness, proxy connection controls and real 2× load proof |
| Stored XSS | React text rendering and JSON text output, never HTML insertion | Production CSP with nonce and browser attack suite |
| Schedule tampering | Tenant-bound model, deterministic resolver, append-only audit/timeline tables | Authenticated schedule mutation and RBAC workflow incomplete |
| Notification SSRF / replay | This release only delivers to explicitly configured loopback sink; redirect disabled; stable outbox idempotency key | Real provider egress allowlist, credentials, signature and delivery receipts |
| Status page leakage | No public incident route is exposed | Reviewed explicit public-summary publication flow |
| Privilege escalation through aggregate source | Private analytics schema; no query/ingest read grants; fixed SECURITY DEFINER trigger search_path | Timescale container proof and role audit |
| Supply chain | Exact npm lockfile; NuGet versions/lock; dependency scan CI | Resolve real scan findings and pin deployment images by digest before production |
| Audit erasure | Trigger rejects UPDATE/DELETE/TRUNCATE; ordinary roles lack mutation grants | Superuser can bypass database controls; external immutable backup is not implemented |

No deployment readiness is claimed. Record actual exploit results and independent findings in the run evidence; a control described here is not proof that it passed.
