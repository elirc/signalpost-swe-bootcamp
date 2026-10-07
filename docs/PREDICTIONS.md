# Prediction ledger

No learner predictions have been submitted. Do not retroactively invent them.

Before code or reading an agent diff, record: ticket, timestamp, predicted outcome, confidence (0–100%), observation that would falsify it, planned experiment. Afterward append the observed result without editing the prediction. A vague statement that the agent will make mistakes is not assessable.

The browser journal can export self-reported records; reviewed entries should be linked here with an exact commit or artifact.

## Entry template

```text
ticket:            U0x-0y
recorded_at:       <ISO timestamp, before reading code or a diff>
prediction:        <one observable outcome>
confidence:        <0-100%>
falsified_by:      <the observation that would prove it wrong>
experiment:        <command or action you will run>
--- appended afterwards, never edited above this line ---
observed:          <actual output or behaviour>
commit/artifact:   <exact sha or file>
```

A good first prediction is checkable against code you can run without infrastructure, for example:
"`node --test practice/checks/u01.test.mjs` fails on `remainingTitles` before I implement it" (U01).
