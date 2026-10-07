# Deployment preparation

No public destination or account was supplied, and no public deployment has occurred. The local source and Dockerfiles are reviewable preparation. Do not expose tenant data or privileged operations until M3 is implemented and independently reviewed.

For a public synthetic curriculum demo, build the root Dockerfile and expose only the Next server behind TLS. Leave QUERY_DATABASE_URL unset, do not ship credentials, and retain the explicit synthetic-data labels. Journal storage is local to the visitor's browser; there is no authenticated multi-device progress service.

For a future data deployment, use separate service networks and restricted ingest/query/Sentinel database roles. Keep PostgreSQL/Redis private; configure durable volumes, secret injection, backups, readiness, bounded ingress, connection limits, TLS and observed traces. Use a reviewed external OTLP collector endpoint so self-instrumentation cannot feed an uncontrolled loop back into ingest.

Production gates: complete M3 identity review; full OTLP contract decision; migration upgrade and restore evidence; crash/lease/outbox test; real notification provider security and idempotency; per-tenant storage quota; measured benchmark and SLOs; runbooks and operational drill; exact-revision independent review. Record the image digest, migrations and rollback/recovery procedure before release.

No automated workflow here deploys or publishes. GitHub CI configuration becomes evidence only after it runs on the chosen repository/revision.

## What the repository actually builds

- The root `Dockerfile` is a two-stage `node:24-bookworm-slim` build that runs `npm ci` and `npm run build`,
  then starts **only** the Next server as the non-root `node` user on port 3000. It does not include the ingest
  service or Sentinel; those have their own entry points (`npm run ingest`, `services/sentinel/Dockerfile`).
- `compose.yaml` provides local infrastructure only — `timescale/timescaledb:2.22.1-pg17` and
  `redis:7.4-alpine` — with ports published on `127.0.0.1` only.
- Role passwords in `db/roles.sql` are explicitly local-development values; they must be replaced through
  secret injection before any shared environment.

**Check:** before a demo deploy, confirm the image you build exposes only port 3000 and that the environment
has no `QUERY_DATABASE_URL`.
