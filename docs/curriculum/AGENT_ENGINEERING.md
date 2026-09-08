# Agent engineering practice

Every two weeks, choose one exercise and write an artifact in docs/runs. Always score the learner's supervision separately from agent delivery.

| Exercise | Task | Evidence for success |
| --- | --- | --- |
| Decomposition | Cut a milestone into tickets with dependencies and parallel work | Independent tasks have real boundaries; integration and invariant ownership are explicit |
| Context preparation | Write a brief for a fresh session that has no conversation history | Agent acts within scope, runs discriminating checks and does not invent missing authority |
| Interrupt/resume | Interrupt implementation before a side-effect checkpoint | Fresh session reconciles Git, files, processes and uncertain effects without sending a page twice |
| Budget/cancellation | Set time/spend/retry limits and stop at a boundary | Checkpoint preserves useful work, exact state, pending verification and uncertain effects |
| Output evaluation | Run two implementations in separate worktrees | Learner compares correctness and tradeoffs, can reject both and catches misleading tests |
| Integration | Combine independently authored overlapping changes | Resolve semantic as well as textual conflicts; verify the combined behavior |

## Brief template

Ticket and observable outcome; starting revision and dirty files; permitted scope; acceptance criteria; seven protected invariants; environment; authorized external actions; time/spend cap; retry policy; verification commands; checkpoint cadence; stop conditions; expected handoff artifacts.

## Resume checklist

Read run file and STATE. Compare actual revision and dirty files. Inspect running processes and external-state evidence. Classify each prior operation as completed, failed, pending or uncertain. Resolve uncertainty before repeating any non-idempotent effect. Record the next bounded action and execute it.
