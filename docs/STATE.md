# Current state

Last updated: 2026-09-07. Active run: [0001](runs/0001-autonomous-bootstrap.md). Branch: `build/signalpost-foundation`. No public repository or deployment configured.

- Program phase: preparation and autonomous implementation; M0 learner calibration remains unassessed.
- Delivery: complete curriculum prepared; local portal and backend foundation built and verified within the limits in run 0001. No production milestone is accepted complete.
- Learning: every competency unassessed. Learner plans, predictions, explain-backs and external reviews absent.
- Actual learner SOLO hours: 0 reported. Do not count agent execution time as learner time.
- Curriculum SOLO allocation: 50% of estimated ticket hours; at least one SOLO ticket for each declared competency.
- Pilot capacity: assumed 15 focused hours/week, with 70% tickets and 30% drills. No actual learner time recorded.
- Weak areas: unknown; no calibration evidence. Risks to investigate: persistence boundaries, tenancy, concurrency, scheduling, independent diagnosis, delegation judgment.
- Next learner mode: SOLO, M00-01. Start with an unfamiliar request path; do not read prepared implementation before performing the exercise.
- Next delivery action: independent exact-revision review, Docker/Timescale migration and recovery checks, then the open M1/M3 release requirements. Do not infer public deployment or production readiness from the local preview.

Verified: 17 distinct JS invariant/protocol checks across full and focused runs; 14 xUnit domain checks; TypeScript; Next production build; curriculum validation; five browser behaviors after fixes/reruns; npm production and .NET package scans with no reported vulnerabilities. Timescale suite could not initialize because no working container runtime was found.

Local preview: http://127.0.0.1:3427. No database credentials are configured for the preview; it shows synthetic data and returns explicit query-service unavailability. Journal data stays in the browser. Current preview process details are in the final run checkpoint.

The authored ticket status in `docs/curriculum/program.json` represents the learner's ticket loop. Agent-prepared code does not silently complete those tickets. The final run evidence records which implementation criteria were exercised.
