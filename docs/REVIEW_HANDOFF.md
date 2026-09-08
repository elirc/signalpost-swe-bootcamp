# Independent review handoff

Reviewer: a separate Claude Code session using Appendix A from docs/curriculum/ORIGINAL_PROGRAM.md. No independent review has occurred in this run.

Start with AGENTS.md, STATE.md, SKILLS.md, THREAT_MODEL.md and the final run checkpoint. Record the exact revision using `git rev-parse HEAD`; include dirty-file status. Review only that revision. Check behavior, tests and their limits; do not grade an imagined future implementation.

Findings require failure scenario, file/line/test evidence, severity, confidence and affected acceptance criterion/invariant. Separate blockers from suggestions. Zero blockers is a valid outcome. Review the PR description as a communication artifact. The learner resolves or rebuts each finding in writing.

Priorities: durable acknowledgement and uncertain commits; admission capacity; scope and RLS under pooled connections; private aggregate source permissions; episode/page uniqueness; lease expiry during evaluation; outbox ambiguous sends; DST and override boundaries; migration recovery; UI secret handling and stored-XSS safety.

Known incomplete scope is in OPEN_THREADS.md. Do not mistake declared omissions for implemented features. Exact-revision review, human review and learner explain-back gates remain pending even if local tests pass.
