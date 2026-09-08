# Signalpost — grow as an engineer

Private source repository: [elirc/signalpost-swe-bootcamp](https://github.com/elirc/signalpost-swe-bootcamp). The default branch is `main`; create a review branch for future changes.

This workspace is now focused on your learning: fundamentals, independent feature delivery and senior responsibilities. Start with [your first 75 minutes](docs/curriculum/FIRST_SESSION.md) and [the learning path](docs/curriculum/START_HERE.md). Read [the curriculum review](docs/curriculum/REVIEW.md) for what changed and why.

The active course has 12 modules and 48 practice tasks. Each module includes instruction, a worked example, guided steps, independent tasks, feedback, delayed transfer and remediation. The first three labs are intentionally unfinished or defective so the learner can do the work. All personal skills remain unassessed.

## Start learning locally

On this prepared machine, use the existing Node 24 and dependencies. The first two labs need no package installation, database or cloud setup.

```powershell
node --version
node --test practice/checks/u01.test.mjs
```

The initial U01 run fails because its functions are unfinished; [FIRST_SESSION](docs/curriculum/FIRST_SESSION.md) explains the next step. Do not change the supplied expectations or count prepared software as your own work.

For the portal, `npm.cmd run dev` serves http://127.0.0.1:3000. The managed production preview, when running, is http://127.0.0.1:3427. A fresh checkout needs `npm.cmd ci` first. The portal shows lessons, downloadable guides and a journal; records stay in this browser, so export backups. Journal entries never award competence automatically. Old M identifiers retain their original meaning.

The [assessment](docs/curriculum/ASSESSMENT.md), [tutor instructions](docs/curriculum/MENTOR.md), [project setup](docs/curriculum/PROJECTS.md) and [portfolio](docs/curriculum/PORTFOLIO.md) define the process. `python scripts/write-curriculum.py` regenerates active guides/JSON and browser downloads without touching learner files. `npm.cmd run curriculum:check` validates the authored path.

## Optional advanced platform reference

The previous Signalpost backend remains available for later code reading and advanced exercises. Its unfinished release requirements are deferred, not learning prerequisites. Original M00–M12 materials and [original program](docs/curriculum/ORIGINAL_PROGRAM.md) are preserved under the [scope amendment](docs/CONTRACT_LOG.md). Start with U01 instead of these service commands.

## Run the data services locally

Requirements: Docker for Timescale/PostgreSQL and Redis, .NET 10 SDK for Sentinel. These local database passwords are development examples only.

```sh
docker compose up -d
```

Copy `.env.example` to `.env`, then set its connection strings. Run `npm run migrate` using the migration administrator. Apply `db/roles.sql` once using that administrator (for example `docker compose exec -T postgres psql -U signalpost -d signalpost`, supplying the file via your shell). Run `npm run bootstrap` to create a synthetic organization/project and one ingest plus one read credential. Store newly generated tokens locally, never in Git.

Start `npm run ingest` with INGEST_DATABASE_URL and REDIS_URL set. Set SIGNALPOST_INGEST_TOKEN and run `npm run demo`. Configure QUERY_DATABASE_URL on the Next process and use the read token in the Advanced reference to query the last 24 hours. Tokens entered there remain in memory.

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
| docs/curriculum | 12 active learning modules, 48 tasks, labs and assessment; original advanced guides archived |
| docs/adr | Decisions and their costs, assumptions and pending evidence |

## Boundaries that matter

Ingest success follows commit. Overload is returned to the sender. Query scope comes from authenticated credentials and is enforced with parameterized predicates plus RLS. A logical page is unique per episode/step; external notification delivery is not exactly once by assertion. Audit/timeline mutation is rejected by the database. Retention is not enabled before its safety evidence exists.

Supported receiver subset: OTLP/HTTP JSON logs, numeric gauges and spans with gzip, 1 MiB request/expanded-body cap and 5000-record cap. Unsupported metric types are rejected as whole batches. Original JSON payloads are retained atomically with normalized rows. Binary Protobuf and broader normalized field coverage remain compatibility work. The source of truth is the actual implementation and its tests, not an optimistic feature list.

Use [AGENTS.md](AGENTS.md), [STATE](docs/STATE.md), [RUNBOOK](docs/RUNBOOK.md) and [review handoff](docs/REVIEW_HANDOFF.md) to resume safely. Changes remain on a local review branch until independent and learner gates are met.
