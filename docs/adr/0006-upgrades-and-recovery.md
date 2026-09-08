# ADR 0006 — versioning, migrations and recovery

Status: implemented source; infrastructure evidence tracked separately.

Use .NET 10 LTS; allow SDK feature-band roll-forward within 10.0 and reject prerelease SDKs. Pin package versions and npm lockfile. Review security updates promptly, run focused compatibility and integration tests, and never disable vulnerability checks to restore a green build. Runtime major upgrades require an ADR with lifecycle, dependencies and operational impact.

Migration 001 creates the relational baseline. Migration 002 converts telemetry to hypertables and adds the private aggregation source. A checksum ledger rejects edits to an applied migration; an advisory lock serializes migration runners. Each migration is transaction-wrapped. Test both fresh and seeded upgrade paths on real Timescale before deployment.

Recovery: preserve a verified backup and restore into a new isolated database; do not use destructive down migrations to erase customer data. Timescale conversion is treated as operationally irreversible in place. Restore extension versions must match and use documented Timescale pre/post-restore procedures. Baseline organization/project recovery tests do not prove telemetry or notification disaster recovery. Those remain release gates.
