# Drill bank and safe execution

Before a planted-defect/bad-requirement exercise, the examiner verifies a disposable Git worktree, synthetic database, separate credentials, disabled deployment and disabled real notification channels. The learner knows defects exist but not where. The answer key is git-ignored and accessible only by agreement; private-branch archival happens after scoring. An answer key is not prepared in the normal learner workspace.

## Weekly mandatory drills

- No-AI hour: one bounded ticket, documentation and terminal. Record assistance honestly.
- Independent planted-defect review: findings/misses/false positives, with the pattern behind each miss.

## Rotating drills

1. Chaos: lose leadership mid-evaluation; fill ingest capacity with slow Postgres; send future timestamps; make a provider return success without delivery; delay aggregates. Use `git bisect` at least monthly.
2. Interview: 45 minutes, alternate TypeScript and .NET framing; scores provisional and evidence-linked.
3. Code reading: study SigNoz ingestion/query builder, Loki label indexing, Vector acknowledgement/backpressure or Prometheus alerting. Write one page of mechanics, tradeoffs and a justified change; never copy implementations.
4. Bad requirements: drop accepted logs on overload; evaluate on every incoming sample; allow raw SQL; acknowledge failed delivery; trust org IDs in key names. A well-built violation fails the exercise.
5. Agent exercise: use AGENT_ENGINEERING.md every two weeks.

## Preferred planted defects

Ack before durable commit; ignore `for`; compute on-call in server-local time; rate-limit by org instead of key; interpolate label values into SQL; delete by received time while queries use event time; leader lock without expiry.

## Per milestone

Three-role design defense (staff engineer, security engineer, SRE); independent incident drill with alert/graph/logs and a harder-reviewed postmortem; archaeology in an unfamiliar 600-line module; conflicting-branch Git integration. Prepare drill artifacts in the sandbox at the appropriate time, not by placing hidden defects in accepted production code.
