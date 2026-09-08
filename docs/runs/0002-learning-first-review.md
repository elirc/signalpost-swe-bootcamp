# Run 0002 — learning-first review

2026-09-07. Mode: DELEGATE for curriculum preparation only. Starting revision: `0ca3e4460fd35772359b468fd34a3d3c3b8b857a`; branch `build/signalpost-foundation`; working tree clean. Read AGENTS, STATE, CONTRACT_LOG and run 0001. Windows / Node 24; existing local dependencies. Learner baseline unknown.

User: “review and improve soley focused on upskilling me from nood jun ior swe to mid/srnior swe”. Earlier no-questions instruction persists.

Scope: critique and replace the active learning path, prepare runnable beginner practice, revise assessment/mentoring instructions and learning portal. Preserve the original advanced project as reference. No new product backend work. Existing evidence stays attributable to its original task; new curriculum gets new identifiers. Never credit agent work as learner practice.

Budget: local files and existing tools; no spending, public deployment, messages to others or real notifications. Work in bounded authoring, implementation, verification and handoff checkpoints. Retry only to diagnose or fix a concrete failure. Seven service invariants remain protected. No backend/schema changes planned.

Verification: curriculum structure/prerequisites/independent practice; beginner lab harness must fail unfinished work without shipping answers; TypeScript; production build; focused browser flows, journal preservation and accessibility. Existing backend checks remain historical because their implementation is outside this change. Close ledgers and create a new local review commit; independent review remains pending.

Initial findings: the old path assigns unfamiliar distributed-system diagnosis before foundational instruction, conflates platform requirements with learning outcomes, has thin lesson content, frontloads multiple stacks, and imposes review/record-keeping overhead before basic fluency. No learner evidence supports skipping fundamentals.

## Authoring and implementation checkpoint

Replaced the active path with 12 U modules and 48 tasks across foundations, independent delivery and senior practice. Each contains substantive concepts, a worked example, guided steps, independent task and variation, feedback, delayed check and remediation. Added FIRST_SESSION, PROJECTS, MENTOR, PORTFOLIO and curriculum REVIEW. Reworked assessment, drills, agent practice, skill ledger and pacing; kept real collaboration and sustained ownership explicitly pending.

Prepared U01/U03 unfinished functions and a disclosed isolated U02 defect with separate Node checks. No assessed implementation or answer key supplied. Added an in-memory SQL console. Portal now starts with a 75-minute session, shows lessons and downloadable guides, records minimal evidence with optional assessment detail, and preserves old M identities under new U curriculum IDs. Journal supports recording help/artifact/hours with later results while preserving the prediction and timestamp. Original program JSON preserved in archive/program-v1.json; M guides marked historical.

Primary technical references checked: MDN language/HTTP, TypeScript handbook, React Quick Start, PostgreSQL tutorial, Node 24 test runner, Pro Git, Fastify, PGlite, Next rewrites, OWASP authorization and Google SRE workbook. These support technical content, not claims that exact pacing/rating defaults scientifically predict seniority.

## Verification checkpoint

- `npm.cmd run typecheck`: passed after the journal simplification and lesson/download changes.
- `npm.cmd run curriculum:check`: passed for 12 modules/48 tasks, prerequisite order, guided-to-independent sequence, guide parity, independent practice and legacy-ID separation. Planned task ranges: 163–311 hours, of which 111–212 are SOLO. These are preparation estimates, not actual learner effort or a career timetable.
- `node node_modules/typescript/bin/tsc -p practice/tsconfig.json`: passed for the U03 starter/check contracts; an unfinished function can typecheck, which is not learner completion.
- U01 learner checks: 2 failed as intended with `U01 learner implementation required`; U02: 1 failed on the disclosed defect; U03: 2 failed as intended with `U03 learner implementation required`. These are verified starting conditions, not passing learner solutions.
- SQL-console smoke: create/insert, BEGIN/insert/ROLLBACK, SELECT count; returned one retained row and exited 0. No persistent database or external effect.
- Final `npm.cmd run build`: passed after updating the learning-first metadata. Earlier successful builds preceded the last copy edit and were not the final artifact.
- Generator reproducibility: hashes unchanged on rerun for active generated content/browser guides and learner files. No learner reset occurred.
- `git diff --exit-code 0ca3e44 -- services packages db package.json package-lock.json`: passed; backend, schema and dependencies unchanged. Their previous tests remain historical; no unnecessary full backend rerun.

Browser verification and final preview/handoff checkpoint follow below when complete. No personal skill, outside review, live learner practice or job level was credited.

## Closing checkpoint

Browser suite: six checks passed on the full run (synthetic reference labeling/virtualization; overview and curriculum automated accessibility; mobile overflow; unavailable unconfigured query; guide downloads; legacy evidence attribution with unassessed competence). The journal test timed out on an exact label locator for a select. The accessibility snapshot showed the correctly named combobox; changed the test to select by its accessible role/name. Focused rerun passed in 7.4 seconds, including prediction/timestamp preservation, appended hours/help/artifact, reload and export. All seven distinct behaviors were verified across the full and focused runs; the initial failure is not represented as an all-green first run.

Captured and inspected desktop 1440px and mobile 390px screenshots of the final overview. No overflow or missing words observed. Captures remain in ignored artifacts/signalpost-desktop.png and artifacts/signalpost-mobile.png. Automated accessibility checks are not a complete assistive-technology review.

A compound detached-preview launch was rejected by automatic command policy without a more specific reason. No action occurred from it. Used the safer managed foreground command `npm.cmd run start -- --port 3427`, which succeeded. Current preview is loopback-only 127.0.0.1:3427, Node PID 11600, managed exec session 7328. It serves the final production build and downloadable guides; no backend credentials or real notifications are configured. This replaces prior preview PID 26712, which was verified and stopped before builds. No permission prompt or policy bypass was used.

Outcome: curriculum review, learning-first redesign, materials, starter labs and portal verification complete. Personal learning remains unassessed and actual learner hours remain zero reported. Next action is the learner's U01 first session, not more autonomous backend delivery. Independent review, real collaboration and role-specific readiness remain pending. Final commit follows this checkpoint on the local review branch; no merge, publication or outside review is claimed.
