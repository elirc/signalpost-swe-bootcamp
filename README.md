# Signalpost

An observability platform under development, paired with a complete self-paced engineering curriculum. The current local release includes a Next.js learning workspace, bounded OTLP/HTTP JSON ingestion, PostgreSQL storage and tenant-scoped queries, and a .NET 10 Sentinel foundation.

**This is not a completed production platform or a completed personal assessment.** Implementation coverage and all outstanding acceptance gates are in [OPEN_THREADS](docs/OPEN_THREADS.md). Every learner skill is unassessed. No public deployment, independent review, full-rate benchmark or real-user operation has occurred.

## Start the learning workspace

Requirements: Node 24 and npm. In PowerShell use `npm.cmd` if execution policy blocks `npm.ps1`.

```sh
npm ci
npm run dev
```

Open http://127.0.0.1:3000. The portal contains all 13 milestones and 52 tickets, an evidence journal with JSON export, and a clearly labeled synthetic telemetry lab. Journal entries stay in browser storage and never automatically award a skill rating. Back them up with Export evidence.

For the text-only program, begin with [START_HERE](docs/curriculum/START_HERE.md). The [original program](docs/curriculum/ORIGINAL_PROGRAM.md) is preserved with the [autonomous-work amendment](docs/CONTRACT_LOG.md). The authored program and original requirements govern the remaining work.

## Run the data services locally

Requirements: Docker for Timescale/PostgreSQL and Redis, .NET 10 SDK for Sentinel. These local database passwords are development examples only.

```sh
docker compose up -d
```

Copy `.env.example` to `.env`, then set its connection strings. Run `npm run migrate` using the migration administrator. Apply `db/roles.sql` once using that administrator (for example `docker compose exec -T postgres psql -U signalpost -d signalpost`, supplying the file via your shell). Run `npm run bootstrap` to create a synthetic organization/project and one ingest plus one read credential. Store newly generated tokens locally, never in Git.

Start `npm run ingest` with INGEST_DATABASE_URL and REDIS_URL set. Set SIGNALPOST_INGEST_TOKEN and run `npm run demo`. Configure QUERY_DATABASE_URL on the Next process and use the read token in the Telemetry lab to query the last 24 hours. Tokens entered there remain in memory.

Sentinel uses SENTINEL_DATABASE_URL in Npgsql format (`Host=127.0.0.1;Database=signalpost;Username=signalpost_sentinel;Password=...`) and REDIS_CONNECTION (`127.0.0.1:6379`). Set these in the shell environment; .NET does not load the root `.env` automatically. Run:

```sh
dotnet run --project services/sentinel/Sentinel.csproj
```

It evaluates enabled database rules every 30 seconds. The rule-management UI/API is still open work; use isolated synthetic SQL fixtures for development. With no SIGNALPOST_NOTIFICATION_URL, delivery is disabled and outbox records remain pending. The current release only permits an explicit loopback notification sink.

## Verification

```sh
npm run check
npx playwright install chromium
npm run test:e2e
dotnet test tests/Sentinel.Tests/Sentinel.Tests.csproj
npm run test:containers
```

The normal TypeScript suite uses PGlite to execute actual PostgreSQL semantics locally; it does not establish Timescale, network concurrency, fsync or crash durability. The separate Testcontainers suite needs Docker. See [run evidence](docs/runs/0001-autonomous-bootstrap.md) for commands actually executed and their observed outcomes. CI configuration existing in the repo does not mean remote CI has run.

## Map

| Path | Responsibility |
| --- | --- |
| apps/web | Next.js App Router learning portal and authenticated query endpoint |
| services/ingest | Fastify admission, per-key Redis limits, durable batch transactions |
| services/sentinel | ASP.NET Core, EF Core, threshold state, on-call resolver and outbox delivery |
| packages/core | Validated query compiler, supported OTLP decoder, auth and database access |
| db | Relational/Timescale migrations and restricted service roles |
| tests | Invariant, protocol, .NET, browser and container verification |
| docs/curriculum | 13 milestone guides, 52 tickets, rubrics, drills and agent exercises |
| docs/adr | Decisions and their costs, assumptions and pending evidence |

## Boundaries that matter

Ingest success follows commit. Overload is returned to the sender. Query scope comes from authenticated credentials and is enforced with parameterized predicates plus RLS. A logical page is unique per episode/step; external notification delivery is not exactly once by assertion. Audit/timeline mutation is rejected by the database. Retention is not enabled before its safety evidence exists.

Supported receiver subset: OTLP/HTTP JSON logs, numeric gauges and spans with gzip, 1 MiB request/expanded-body cap and 5000-record cap. Unsupported metric types are rejected as whole batches. Original JSON payloads are retained atomically with normalized rows. Binary Protobuf and broader normalized field coverage remain compatibility work. The source of truth is the actual implementation and its tests, not an optimistic feature list.

Use [AGENTS.md](AGENTS.md), [STATE](docs/STATE.md), [RUNBOOK](docs/RUNBOOK.md) and [review handoff](docs/REVIEW_HANDOFF.md) to resume safely. Changes remain on a local review branch until independent and learner gates are met.
