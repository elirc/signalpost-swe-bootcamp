# Assessment instruments

## Calibration without a live interview

Submit four artifacts: a request-path explanation from unfamiliar code; a reproduced persistence/concurrency defect with a prediction and counterexample; a delegation brief with explicit scope/cancellation/verification; a short feature history separating personal and agent contributions. Add sustainable hours, strengths and gaps with evidence. The mentor's assessment remains provisional until independent behavior is observed.

## Plan rubric (0–2 each)

Score scope, dependency reasoning, data/invariant impact, failure hypotheses and discriminating verification. Zero: absent or generic. One: relevant but incomplete. Two: concrete and falsifiable. A high total does not compensate for an ignored protected invariant. Return the smallest revision needed before code.

## Prediction rubric

Score 0 for vague pessimism or an unfalsifiable claim; 1 for a specific outcome with missing confidence/falsifier; 2 for all three with a discriminating experiment; 3 for a useful belief revision after contradictory evidence. Preserve the original prediction.

## PR communication rubric

Score problem, resulting behavior, alternatives/tradeoff, risks, and observed verification 0–2 each. A reviewer should understand the final implementation without reading the conversation. Explicitly distinguish measured results from expectations and unavailable infrastructure.

## Explain-back and transfer

Diff closed: explain the request/state path, defend an alternative, analyze a concurrency or partial-failure scenario, and identify the first breaking point. Then alter a requirement or inject an unfamiliar failure. A memorized walkthrough without transfer does not support level 3.

## Defect review scoring

Record true findings, missed defects and false positives separately. Every finding needs a scenario, source line/test/trace, severity, confidence and invariant. Every miss names the pattern that would have caught it. An incorrect but convincing examiner finding is deliberate only in an agreed exercise; the learner must rebut it with evidence.

## Readiness report

State observed independent behaviors, unfamiliar variations handled, assistance required, communication evidence, operational exposure and human feedback. Then state what the evidence does not establish. Ratings follow SKILLS.md, with date and retest deadline. Never automatically translate points or milestones into “mid-level” or “senior.”
