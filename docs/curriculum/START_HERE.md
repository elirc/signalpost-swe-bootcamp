# Start here

Open the local portal with `npm run dev`, or read [M00](M00.md). This is a complete curriculum and assessment process, with a growing implementation used as study material. It is not a completed personal bootcamp or a certified production platform.

## The two-week pilot

Use 15 hours/week as a provisional capacity. In week one, spend 7 hours on independent calibration/diagnosis, 3.5 on investigation and review, and 4.5 on drills. In week two, spend 10.5 hours on the first bounded M1 work selected from actual calibration evidence and 4.5 on drills. Unfinished tickets carry forward. Do not advance because a calendar week ended.

At each work session: select a ticket and mode; write a 5–10-line plan; predict an outcome/confidence/falsifier; perform the work; record commands and observed results; explain the change with the diff closed. Export browser evidence for backup and review. No automatic skill scoring.

## Four modes

- SOLO: no AI assistance during work; ordinary documentation and terminal allowed. Self-report honestly.
- PAIR: learner types every line; mentor asks pointed questions and does not write implementation.
- DELEGATE: learner scopes and predicts; agent records a run contract, implements, self-reviews and verifies; learner reviews every line.
- SPIKE: timeboxed throwaway exploration, with findings and consequences in an ADR.

After 45 minutes without progress, write attempts and the precise unresolved issue, then log one mode escalation. A stuck session is evidence; concealment is not progress.

## Repeatable ticket loop

1. Read the ticket's context, acceptance criteria, scope and target competencies.
2. Plan before implementation. Grade specificity, risk recognition, testability and scope.
3. Record prediction before observing the implementation or experiment.
4. Implement in the declared mode. Verify acceptance and protected invariants.
5. Write the PR description: problem, approach, alternatives, risks and observed verification.
6. Close the diff. Explain the change, defend an alternative, analyze a failure/concurrency case and identify where it breaks first.
7. Hand the exact revision to the independent reviewer; resolve or rebut each finding with evidence.
8. Retro and update the skill ledger only using observed transfer evidence.

## Evidence and feedback

On a misunderstanding, preserve correct software and complete the smallest exercise that exposes the gap. Retest with a changed example. Two misses allow the mentor to give the explanation; then test transfer again. Plausible fluency is not independent competence.

Use [assessment rubrics](ASSESSMENT.md), [drills](DRILLS.md), [agent exercises](AGENT_ENGINEERING.md) and [review handoff](../REVIEW_HANDOFF.md). The learner's answers, reviews and operating experience cannot be performed on their behalf.

## Advancement

All ticket delivery criteria must pass and the milestone's declared target competencies must reach their stated provisional target before advancement is credited. Include the demo, writeup, independent review and applicable human feedback. Re-estimate at every milestone. No milestone confers a job level.
