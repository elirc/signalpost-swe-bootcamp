# Run 0001 — autonomous bootcamp and implementation

## Contract

- Starting revision: unborn repository; initially empty workspace. Pre-existing changes: none. Contract amendment was the first created file.
- Scope: full self-paced curriculum and evidence system; runnable, verified Signalpost services and infrastructure as far as local capabilities permit; documented deployment and independent-review handoff.
- Outcome: reviewable source, executable verification, every milestone specified, actual implementation coverage and pending gates explicitly recorded. This outcome does not substitute for the original whole-project production and learning definition of done.
- Protected invariants: durable-before-success; bounded pressure to sender; one open Page per alert episode/step; deterministic on-call; conservative retention/durable raw downsampling; tenant query isolation; append-only audit.
- Environment: Windows PowerShell; Node 24.19.0 and Git present. npm.ps1 blocked by execution policy: use npm.cmd. Docker and .NET absent from PATH at initial check.
- External actions: read official docs and package registries, install local dependencies/toolchain. Local test notifications only. No real deployment, publication, external notification or expenditure configured.
- Budget: no paid services; bounded implementation phases with checkpoints at least per component. Retry twice without new evidence, then change approach. No silent weakening of acceptance criteria.
- Verification: TS unit/integration tests, database migration/recovery and isolation tests, Next production build, browser smoke/accessibility tests, .NET build/xUnit when SDK is available. Timescale and Testcontainers require a Docker-capable runner.

## Checkpoint 1

Read the supplied program; verified initially empty workspace. Created contract amendment, canonical conventions and run file. Learning remains unassessed. No external effects other than documentation reads. Next: establish dependencies, implementation, curriculum, then verify and record criterion-by-criterion results.

## Checkpoint 2 — implementation and first verification

Authored 13 milestone guides, 52 full tickets, assessment/drill/agent exercises, evidence ledgers, six ADRs, threat model, runbooks and review handoff. Created Next portal and query route, Fastify JSON receiver with durable receipts and raw payload preservation, relational/Timescale migrations, and .NET Sentinel domain/worker source.

Observed .NET SDK 10.0.400 at `C:/Users/E/Desktop/astr1/.tools/dotnet/dotnet.exe`. Used this existing tool binary without modifying that project. Initial restore had no usable source; added repository NuGet.Config. Security checks rejected OpenTelemetry 1.15.0. Registry lookup established 1.18.0 and Npgsql EF 10.0.3; upgraded, kept checks enabled. `dotnet test tests/Sentinel.Tests/Sentinel.Tests.csproj --nologo`: **12 passed, 0 failed, 0 skipped**, domain tests only. Generated NuGet lockfiles.

First TS attempt during incomplete install showed missing dependencies and real web import/chart type errors; fixed the import depths and required uPlot selection fields. Formatted source. npm's original unpacking made very slow progress; stopped only this run's identified install processes, preserved incomplete Next package inside `.tools/partial-next`, and reused same-version installed package files as hardlinks from the local dependency cache. No source package files were edited. Reconciled an exact manifest and restarted npm installation with scripts disabled; final build/tests still required. TypeScript intentionally pinned to compatible 5.9.3 and Node types to 24.10.0 rather than untested compiler major 7 / Node 26 declarations.

PostgreSQL inspection found only client tools, not initdb/server; attempted initdb failed before creating a database. No server, migration, live notification or public deployment has run. No Docker on PATH. Timescale and distributed restart/load evidence remain unavailable locally. Next bounded action: finish dependency installation, execute TS/database/browser checks, fix failures, then finalize the evidence and review branch.

## Checkpoint 3 — observed verification

Rebuilt the npm lockfile in an empty `.tools/lockgen` directory because interrupted unpacking had produced incomplete entries. Copied the complete 505-entry lock into the repository. A temporary ignored hydration helper verified downloaded tarball integrity and reused same-version local package files without modifying the source cache. `npm rebuild --ignore-scripts --no-audit --no-fund` succeeded. `npm prune --ignore-scripts --no-audit --no-fund` removed 240 stale/extraneous packages. One-off installation scripts were removed from versioned source; normal installation is `npm ci`.

| Command / observation | Actual result | Limit |
| --- | --- | --- |
| `npm run typecheck` | Passed, including final code and browser-test edits | Static checking, not runtime proof |
| `npm test` | 16 passed, 2 files | PostgreSQL semantics via PGlite, not fsync/host-crash/Timescale evidence |
| `npm test -- tests/ingest.test.ts -t "accepts a valid log"` | New regression passed; six unrelated cases filtered out | Tests valid unset body/timestamp after review; total 17 distinct JS cases verified across runs |
| `dotnet test tests/Sentinel.Tests/Sentinel.Tests.csproj --nologo` | Final suite: 14 passed, 0 failed, 0 skipped | State/resolver domain tests; no live failover/provider proof |
| `npm run curriculum:check` | 13 milestones, 52 tickets, SOLO floor and unassessed initial statuses validated | Prepared program, not learner completion |
| `npm run build` | Passed; static `/` and dynamic `/api/query` | Local build, no deployment |
| `npm audit --omit=dev --audit-level=high` | 0 vulnerabilities reported | Known production dependency advisories only |
| `dotnet list services/sentinel/Sentinel.csproj package --vulnerable --include-transitive` | No vulnerable packages reported by configured source | Not a security review |
| `npm run test:e2e` | 4 passed; automated contrast test failed | Failure preserved and fixed, not waived |
| Browser rerun for journal and accessibility | Both passed after text-color corrections; prediction timestamp preserved when appending results | Automated checks do not replace manual assistive-technology evaluation |
| `npm run test:containers` | Suite failed to initialize: `Could not find a working container runtime strategy`; 2 tests skipped | Timescale upgrade/aggregate/recovery evidence unavailable, not passed |

Visual inspection of desktop/mobile screenshots found missing spaces where mobile CSS hides line breaks. Added explicit spaces, rebuilt successfully, and scheduled the focused mobile recheck. Screenshots and temporary tooling are in ignored `artifacts/` and `.tools/`.

## Invariant evidence and pending work

1. Durable acceptance: success waits on the transaction; injected write failure returns retryable failure; raw JSON and normalized records commit together; same-key replay deduplicates and changed content conflicts. Real disk/host loss remains untested.
2. Pressure: blocked-write test demonstrates 429 before capacity overflows and reservations release; gzip expansion is bounded; wrong scopes/revocation and limiter outage fail closed. Real Redis limits and the required 2× load reconciliation remain open.
3. Pages: database uniqueness rejects duplicate episode/step even after acknowledgement; domain tests preserve/reopen episodes correctly. Multi-instance evaluator/outbox crash scenarios remain open.
4. On-call: 14-test .NET suite includes deterministic offset-equivalent resolution across four named zones with 10,000 generated instants each, half-open overrides, negative slots, stable priority ties, exact distant tick boundaries and duplicate-identity rejection. Full calendar-policy/editor integration remains open.
5. Retention/downsampling: no destructive retention is enabled. Timescale aggregate source/trigger migration is prepared but unavailable for local execution. This is not an end-to-end invariant pass.
6. Tenancy: compiler rejects forged scope and parameterizes labels; restricted-role RLS test proves own-org visibility, cross-org denial and transaction-scope reset. Interactive identity and membership authorization remain open.
7. Audit: actual database tests reject audit UPDATE, DELETE and TRUNCATE. Privileged superuser/backup protections and complete audited product actions remain open.

Full remaining scope is in OPEN_THREADS.md. No learning assessments, independent reviews, human reviews, real-user operation, public URL, remote CI results or load/SLO measurements were invented. The original whole-project definition of done is not satisfied.

## Final checkpoint

Two late self-review regressions were run against the initial resolver and both failed: duplicate override IDs were accepted and floating-point seconds rounded a distant single-tick boundary. Changed the resolver to unique override IDs and integer UTC tick floor division. Re-ran the entire .NET suite: **14 passed, zero failed/skipped**. These are agent findings, not learner assessment credit.

Focused mobile recheck passed after explicit-space correction. Final Next build passed. Desktop/mobile screenshots were captured and visually reviewed; no horizontal overflow was observed. Final preview is a hidden Node process, PID **26712**, bound only to **127.0.0.1:3427**. Logs: `artifacts/preview.stdout.log` and `artifacts/preview.stderr.log`. It serves synthetic data; no query DB credential is configured. Stop only that identified process if shutting down this preview. Previous preview PID 19332 was stopped before rebuilding.

Run outcome: curriculum preparation and local foundation complete and reviewable; full project delivery incomplete; learning unassessed. Test/installation processes have completed. Temporary package archives/cache links and screenshots remain in ignored `.tools/` and `artifacts/`; no real notification was sent and no public deployment occurred. SDK first use created a local ASP.NET development certificate, which was not trusted or deployed by this run.

Review handoff: use the final commit on `build/signalpost-foundation`, verify `git status --short` is clean, and record `git rev-parse HEAD` in the independent review. Draft PR text is in docs/PR_DESCRIPTION.md. No source was merged to main. Next bounded delivery work is the Docker/Timescale verification and the outstanding M1/M3 release gates; next learner work is SOLO M00-01.
