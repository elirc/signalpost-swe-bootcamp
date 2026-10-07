# Pacing and estimates

Capacity remains an unverified assumption of 15 focused learner hours/week. The first two weeks in [START_HERE](curriculum/START_HERE.md) reserve buffer and revisit time. At 5 or 10 hours, carry work forward; there is no catch-up debt.

Module task ranges are provisional focused-work estimates, including instruction within guided tasks and feedback within review tasks. Independent tasks account for more than the retained 30% planned floor. Delayed checks, remedial work, project setup friction and real-world ownership can extend the schedule. The generator/portal calculate module counts and ranges from the authored data.

The old fixed 70/30 ticket/drill allocation and 540–1080-hour platform forecast are superseded for the active learning path. Study hours are not proof of competence and do not predict a promotion date.

Track only enough time to revise pacing: learning/guided practice, independent practice, debugging, review and brief records. If tracking exceeds about five minutes per small session, simplify it. Actual learner time reported: zero. Agent runtime and generated output are not learner time.

After two weeks compare estimates to actual effort and assistance. Reduce task size if conceptual/tooling gaps dominate; challenge out when independent evidence supports it. Re-estimate the next module rather than the whole career.

## What the checker enforces

`npm run curriculum:check` (`scripts/check-curriculum.ts`) turns part of this policy into a gate:

- each module has exactly four tickets in the order PAIR, SOLO, SOLO, PAIR;
- for both the low and high estimate, SOLO hours must be at least 30% of the module's hours, otherwise
  `"<module> below independent floor"`;
- no estimate range may be reversed;
- every module competency must be exercised by at least one SOLO ticket.

It prints the planned task-hour totals; it does not and cannot measure learning — its own final message ends
"Learning unassessed."

**Check:** read the per-module SOLO/total ratio from `docs/curriculum/program.json` for one module and confirm
it is at or above 0.3 for both ends of the range.
