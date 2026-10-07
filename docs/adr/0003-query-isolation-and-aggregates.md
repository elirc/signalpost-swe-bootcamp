# ADR 0003 — RLS raw storage and a private aggregate source

Status: source prepared; actual Timescale container verification pending.

Raw queries use fixed table/column choices, parameterized values and org/project scope derived from a hashed bearer credential. Forced RLS is defense in depth, and production query credentials must be non-superuser, NOBYPASSRLS and restricted. A transaction-local setting avoids scope leaking through pooled connections. Read and ingest scopes are distinct. Interactive user identity is not yet implemented.

[Timescale's creation documentation](https://docs.timescale.com/use-timescale/latest/continuous-aggregates/create-a-continuous-aggregate/) prohibits RLS policies on the source hypertable. Disabling RLS on user-queryable raw data would remove a required defense. Instead, a fixed SECURITY DEFINER trigger mirrors metric inserts into a private analytics schema within the original transaction. That schema has no ordinary-service read grants. Its continuous aggregate groups by tenant, project, metric, labels and bucket and preserves sum/count for weighted recombination.

Costs: write amplification, extra storage, migration/backfill complexity. Benefits need performance evidence; this decision is not proof that the M7 budget is feasible. Neither the aggregate nor source is exposed to browser queries. A future aggregate query route needs explicit tenant enforcement and independent review. Retention remains disabled until durable refresh watermarks and restore tests exist.

Stay with PostgreSQL/Timescale for the relational and learning requirements. ClickHouse needs an ADR grounded in measured limits. Do not silently switch databases to make a benchmark pass.

## Where this lives in code

- Forced RLS on every tenant table, policy `org_id = current_setting('app.org_id')`:
  `db/migrations/001_core.sql:114-117`. The scope is set transaction-locally (`set_config(..., true)`) in
  `packages/core/db.ts:26-28`, which is what keeps it from leaking across pooled connections.
- `api_keys` is deliberately *not* in that list: credentials are looked up by SHA-256 token hash before any org
  is known (`packages/core/auth.ts:10`, `:23`).
- Restricted roles, all `NOBYPASSRLS`: `db/roles.sql:2-4`; ingest may only insert telemetry (`:7-8`), query may
  only select (`:9`), Sentinel gets exactly its tables (`:11-13`).
- Private aggregate source: `analytics.mirror_sample()` is `SECURITY DEFINER` with a fixed `search_path`
  (`db/migrations/002_timescale.sql:12`).

**Check:** list the grants in `db/roles.sql` and confirm none of the three roles can read the `analytics`
schema.
