# ADR 0006 — versioning, migrations and recovery

Status: implemented source; infrastructure evidence tracked separately.

Use .NET 10 LTS; allow SDK feature-band roll-forward within 10.0 and reject prerelease SDKs. Pin package versions and npm lockfile. Review security updates promptly, run focused compatibility and integration tests, and never disable vulnerability checks to restore a green build. Runtime major upgrades require an ADR with lifecycle, dependencies and operational impact.

Migration 001 creates the relational baseline. Migration 002 converts telemetry to hypertables and adds the private aggregation source. A checksum ledger rejects edits to an applied migration; an advisory lock serializes migration runners. Each migration is transaction-wrapped. Test both fresh and seeded upgrade paths on real Timescale before deployment.

Recovery: preserve a verified backup and restore into a new isolated database; do not use destructive down migrations to erase customer data. Timescale conversion is treated as operationally irreversible in place. Restore extension versions must match and use documented Timescale pre/post-restore procedures. Baseline organization/project recovery tests do not prove telemetry or notification disaster recovery. Those remain release gates.

## Where this lives in code

- SDK policy: `global.json`; package pins: `Directory.Build.props`, `services/sentinel/packages.lock.json`,
  `tests/Sentinel.Tests/packages.lock.json`, `package-lock.json`.
- Migrations: `db/migrations/001_core.sql` (relational baseline + RLS), `002_timescale.sql` (hypertables and
  the private analytics source); runner `scripts/migrate.ts` (`npm run migrate`).
- Container tests for migrations run separately: `tests/migrations.containers.test.ts` via
  `npm run test:containers` (`vitest.containers.config.ts`).

The two runner guarantees are visible in `scripts/migrate.ts`: a session advisory lock
(`pg_advisory_lock(76418291)`, line 9) serializes runners, and each file's SHA-256 (line 18) is compared with the
`schema_migrations.checksum` recorded when it was applied (lines 19-24), so an edited applied migration is
rejected.

**Check:** edit a comment in an already-applied migration on a scratch database and confirm the runner refuses
to proceed (line 24) rather than silently re-running it.
