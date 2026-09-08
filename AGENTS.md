# Signalpost engineering contract

Read docs/STATE.md, docs/CONTRACT_LOG.md and the active docs/runs file first. Reconcile recorded state with Git and running services. Curriculum is in docs/curriculum; this file governs repository work.

The active objective is personal upskilling via U01–U12, not completion of the observability platform. For teaching/assessment, follow docs/curriculum/MENTOR.md. Autonomous material preparation earns no learner credit. Do not implement assessed learner tasks or expand backend scope as a substitute for teaching. Original M milestones are optional advanced reference under the latest contract amendment.

- Separate software delivery evidence from human learning evidence. Never invent scores, predictions, SOLO hours, reviews, measurements, or deployments.
- Default delivery mode is DELEGATE under the user's autonomous-work amendment. Before work, record scope, revision, dirty files, environment, actions, budget, verification and checkpoints in docs/runs. Do not ask routine permission questions.
- Preserve all seven invariants: durable-before-success ingest; bounded pressure returned to senders; one open page per alert episode and escalation step; deterministic primary responder; conservative retention and durable-before-downsample; query tenant isolation; append-only audit.
- Network response loss is an uncertain client outcome. OTLP may retry and duplicate data; never claim external exactly-once delivery.
- TypeScript strict. No explicit any without a justification comment. Validate trust boundaries. Parameterize values; identifiers come from closed allowlists. Never trust an org ID supplied by a browser as authorization.
- Production routes must implement complete declared behavior or reject unsupported input explicitly. Track absent features in docs/OPEN_THREADS.md, never behind success-shaped stubs.
- Every schema migration needs upgrade and recovery evidence. Database constraints before coordination. Architecture changes need an ADR.
- Short-lived review branches, PRs, green CI, no force push to main. Unreviewed local work is not merged. Use independent review of an exact commit; don't impersonate the independent examiner.
- Run focused tests, type checks and builds appropriate to changes. Record exact commands/results and unavailable infrastructure honestly.
- No real notification sends or customer data in drills. Defect drills require a disposable worktree, isolated test database/credentials, and disabled deployment. Never put answer keys in the learner's normal view.
- End sessions by updating STATE, LEARNING, SKILLS, OPEN_THREADS and the active run. Preserve incomplete work and explicit next actions.
