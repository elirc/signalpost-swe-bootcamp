"""Generate the self-paced program from authored milestone specifications."""
import json
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
stages = [
 (0, 'Calibration', 'Establish evidence before assigning a level.', ['independent diagnosis','agent supervision'],
  'Separate what you can explain from what you can reproduce. A successful agent run establishes delivery evidence, not transfer. Use a prediction with a falsifying observation to expose your assumptions.',
  ['Trace a request through an unfamiliar service without AI','Diagnose a failing transaction from a supplied trace','Prepare and audit a bounded delegation brief','Defend your evidence and set the pilot schedule'],
  ['Produce a request-path diagram and identify each trust boundary; distinguish observation from inference.', 'Reproduce a failure; record a prediction before changing anything; demonstrate a counterexample to the first hypothesis.', 'Specify scope, invariants, environment, cancellation and verification; identify what the delegate may not infer.', 'Submit two independent artifacts; record actual hours in four buckets; choose target levels with reasons.'],
  'An implementation passes every provided test but its author cannot explain rollback after a network failure. Assess what the evidence supports.',
  'Repeat diagnosis using a changed failure and no AI. Do not copy the original fix.'),
 (1, 'Walking skeleton', 'One real request, one durable write, one visible log.', ['delivery pipeline','testing setup'],
  'A walking skeleton crosses every deployment boundary with minimal domain breadth. Keep durable commit before success, separate public synthetic demonstrations from private data, and make failure visible in both tests and traces.',
  ['Build a migration upgrade and recovery test','Write a durable log-ingest integration test','Deliver the first observable vertical slice','Review the release and explain its failure path'],
  ['Upgrade an empty and a seeded database; demonstrate recovery with retained records; record exact commands.', 'Show failure before commit cannot return success; verify persisted rows after a successful response; test invalid payloads.', 'Accept one supported OTLP log batch through Fastify, persist it and query it through a scoped read path; build web and CI.', 'Produce a PR description and demo; trace a rejected request; verify keyboard navigation and secret handling; prepare gated deployment.'],
  'The database commits but the socket closes before success reaches the exporter. Trace a retry through the system.',
  'Change the input body to include an HTML script tag. Demonstrate safe display and explain the actual protection.'),
 (2, 'Domain core', 'Make storage and query semantics explicit.', ['data modeling','storage design'],
  'Choose indexes from access paths. High-cardinality labels multiply series and index cost. Time partitioning limits scans only when predicates align with partition keys. Aggregating averages requires carrying counts or sums, not averaging averages.',
  ['Design event-time retention and metric identities','Implement a pure parameterized query compiler','Deliver signal storage and aggregate migrations','Defend storage costs using actual query plans'],
  ['Model resources, labels, series identity and late arrivals; state event-time versus received-time policy; defend a future-timestamp rule.', 'Reject unsupported filters and identifiers; keep malicious label text in parameters; test half-open time ranges and bounded limits.', 'Provide log/sample/span indexes, a trace-id path and continuous aggregates; demonstrate upgrade and recovery on Timescale.', 'Capture EXPLAIN ANALYZE for sparse and dense labels; estimate seven-day storage from measured record sizes; submit an ADR.'],
  'A daily chart combines an hour with 10 samples and an hour with 10000 samples. Find the misleading aggregate.',
  'Add a second tenant with overlapping labels and measure the same query again.'),
 (3, 'Identity and organizations', 'Bind every privileged action to server-verified authority.', ['authz modeling','tenancy'],
  'Authentication identifies a credential; authorization constrains its actions and data. Derive organization scope from the authenticated principal. Defense in depth means both a parameterized tenant predicate and database permissions that fail closed.',
  ['Build an authorization matrix and attack it','Verify tenant isolation under connection reuse','Deliver organizations, roles and scoped credentials','Review key rotation and public-surface boundaries'],
  ['Define reader/operator/admin capabilities and ingest-only credentials; list object-level attacks across tenants.', 'Use two orgs and a restricted DB role; forge org/project inputs; reuse pooled connections; verify no cross-tenant reads or writes.', 'Implement scoped key creation/revocation plus identity/session flows and role checks; audit privileged changes.', 'Revoke a live key; prove next use fails; inspect logs/bundles for secrets; independently review before public tenant access.'],
  'An API checks organization membership but updates an incident by its globally unique ID alone. Construct the failure.',
  'Move an authorized user out of an organization while an old session remains open.'),
 (4, 'Ingestion pipeline', 'Make overload an observable sender outcome.', ['backpressure','reliability under load'],
  'Bound admission before parsing and buffering. A queue only postpones failure when arrival rate exceeds service rate. Define success, explicit rejection and uncertain network outcomes separately; reconcile sender IDs with durable storage.',
  ['Prove the capacity bound under a slow database','Build an honest load-accounting harness','Deliver batching, key limits and OTLP compatibility','Defend overload and retry behavior'],
  ['Block a durable write, exceed configured capacity and observe sender pressure; prove memory is bounded; release and verify accepted rows.', 'Track attempts, successes, explicit rejections, timeouts and reconciled IDs; run at twice the configured rate; never label timeouts as rejections.', 'Accept JSON and binary Protobuf with gzip; validate limits; use per-key rate counters; prove revocation and graceful shutdown.', 'Publish p50/p95/p99, accepted/rejected/uncertain totals, dataset and hardware; identify the precise no-silent-loss evidence.'],
  'A single noisy key consumes the entire organization limit and starves another source. Design a fair limit boundary.',
  'Repeat overload with compressed bodies whose expansion exceeds the configured maximum.'),
 (5, 'Sentinel v1', 'Persist alert meaning across evaluations and restarts.', ['state machines','exactly-once effects'],
  'Pending measures sustained evidence, not one high sample. Persist state, episode identity and an outbox atomically. A lease reduces duplicate work; constraints and transaction semantics establish correctness. Database uniqueness cannot promise a recipient reads one notification.',
  ['Implement the threshold transition model without AI','Test restart and concurrent page creation','Deliver the .NET evaluator and one delivery channel','Defend cross-service failure windows'],
  ['Cover for=0, flapping, missing samples and clock ordering; define restart-gap policy; use changed examples.', 'Crash between state change, page creation, outbox commit and delivery; assert episode/step uniqueness and visible retries.', 'Use ASP.NET Core, EF Core and hosted services; persist evaluations; justify leadership; trace evaluation to notification.', 'Explain ambiguous provider outcomes and idempotency; run an exact-revision independent review; rebut findings in writing.'],
  'The provider accepted a page, then the worker died before marking delivery complete. Distinguish safe retry from a false exactly-once claim.',
  'Resume a checkpoint after leadership changed and show which effects can safely be repeated.'),
 (6, 'On-call and incidents', 'Resolve one responder and preserve the incident history.', ['scheduling logic','notification reliability'],
  'Decide whether rotation duration means elapsed time or local calendar boundaries. Store named time zones and explicit anchors. Overrides need a total precedence rule; ambiguous and nonexistent local times need a documented policy.',
  ['Implement deterministic on-call resolution','Property-test DST, overlaps and boundaries','Deliver acknowledgement, escalation and incident workflow','Run a delivery failure and incident defense'],
  ['Resolve negative offsets, exact handoffs, competing overrides and invalid empty rosters; return one primary for each supported instant.', 'Generate instants around spring/fall transitions in multiple zones; show instance-local timezone cannot change results.', 'Persist timeout escalation and idempotent acknowledgement; audit schedule mutations; manage timeline, postmortem and owned action items.', 'Fail a notification channel; observe retries and dead letters without falsely acknowledging; complete an incident postmortem.'],
  'A responder is removed during an active escalation. Specify how existing pages and future resolution behave.',
  'Use a zone with a non-hour UTC offset and an override ending exactly at the handoff.'),
 (7, 'Performance', 'Find the bottleneck from measurements.', ['throughput engineering','query planning'],
  'Start with a reproducible workload and a budget. Distinguish generator saturation from server saturation. Record bytes, cardinality, concurrency, warmup and hardware. Reject optimization claims without before/after evidence and correctness reconciliation.',
  ['Diagnose the first throughput bottleneck','Design a reproducible mixed-workload benchmark','Deliver the measured optimization','Defend performance and its limits'],
  ['Measure CPU, I/O, locks, allocation and query plans without mentor hints; predict the limiting resource and falsifier.', 'Specify 50k logs/s, 20k samples/s, 5k spans/s, 50 dashboards, 500 rules, seven-day raw data; record payloads and disk/RAM.', 'Meet or explicitly fail ingest <100ms p95, dashboard <2s p95, rules every 30s on the declared hardware; reconcile data.', 'Publish raw artifacts and repeatability limits; explain rejected optimizations and correctness risks; never extrapolate a small test as a pass.'],
  'Throughput doubles when the generator skips JSON decoding, but database counters do not change. Locate the benchmark mistake.',
  'Repeat with 100 times as many label combinations at the same event rate.'),
 (8, 'Reliability', 'Operate the correctness chain under failure.', ['observability','operational design'],
  'An SLO needs a numerator, denominator, window and user-visible meaning. Alert on evaluator lag and undelivered pages, not just process health. Runbooks must say how to establish safety before replaying effects.',
  ['Triage an unfamiliar production-shaped failure','Define and instrument meaningful SLOs','Deliver recovery jobs and operational dashboards','Run an incident drill and write the postmortem'],
  ['Use logs, traces and metrics to distinguish leader loss, DB saturation and provider outage; record timeline and confidence.', 'Define ingest availability, evaluation latency and page delivery indicators; distinguish rejected load and silent loss.', 'Implement retention with safe watermarks, dead-letter replay controls, backup/restore and feature flags; instrument failures.', 'Kill the evaluator mid-page; recover without missing persisted work; document impact, evidence, contributing factors and owned prevention.'],
  'A provider returns 200 for messages it never delivers. Identify what your current SLO can and cannot observe.',
  'Restore a backup into a fresh environment and reconcile alert state with previously sent pages.'),
 (9, 'Frontend depth', 'Make high-volume data usable and accessible.', ['frontend performance','a11y'],
  'Virtualization bounds rendered elements, but does not remove expensive transforms or broad React rerenders. Charts need textual summaries and keyboard-operable controls. Measure interaction frames on a declared device before choosing an optimization.',
  ['Diagnose a dashboard interaction freeze','Build an accessible chart and log-viewer test','Deliver the dashboard editor and incident console','Defend frame budgets and interaction design'],
  ['Profile eight panels with thousands of points; separate network, transform, render and paint cost; record a falsifiable hypothesis.', 'Verify keyboard navigation, focus, text equivalents, contrast and empty/error states; test stored-XSS payloads.', 'Implement panel editing, persistence, virtualized logs and accessible incident actions; keep interaction state predictable.', 'Measure frame distribution in Playwright with a declared environment; set justified CI budgets; obtain user feedback.'],
  'A virtual list renders only 30 rows but still freezes because filtering recomputes on every pointer move. Demonstrate the cause.',
  'Use the complete primary workflow with keyboard and a screen reader, including errors.'),
 (10, 'Platform', 'Turn internal behavior into a durable public contract.', ['API design','config-as-code'],
  'Versioning is a promise about behavior, not a URL prefix. Config validation must happen before effects; a failed import should not leave half a dashboard. Webhooks need signatures, replay protection, bounded retries and explicit delivery history.',
  ['Design a compatible API change and deprecation','Validate declarative config without partial writes','Deliver versioned APIs, SDK and webhook delivery','Defend compatibility with a consumer test'],
  ['Specify error shape, pagination, idempotency and scope; introduce an unfamiliar optional field without breaking a pinned client.', 'Reject invalid references and duplicate names; provide a dry-run diff; apply atomically and test rollback.', 'Publish reviewed alert/incident/on-call contracts, TypeScript SDK and signed webhooks with dead-letter handling.', 'Run previous-version consumer fixtures; document deprecation windows and rollback; test replay and signing-key rotation.'],
  'A config importer creates two rules then fails parsing the third. Define a contract users can safely automate.',
  'Rotate a webhook secret while deliveries from the previous key are still retrying.'),
 (11, 'Hardening', 'Attack the exposed trust boundaries.', ['security engineering','threat modeling'],
  'Threat models connect an asset, adversary capability, entry point, failure and testable control. Dependency scanners cover known advisories, not tenant authorization or business-logic abuse. Security claims need adversarial verification.',
  ['Red-team query and ingest paths in a sandbox','Review supply chain and migration privileges','Deliver fixes with exploit regression evidence','Defend the threat model under changed assumptions'],
  ['Attempt query injection, object-level auth bypass, key leakage, stored XSS and decompression abuse; record false positives too.', 'Inspect lockfiles, CI permissions, images, secret handling and database roles; test ordinary roles cannot bypass audit/RLS.', 'Fix verified findings without weakening behavior; test compromised credentials and key revocation; review status-page leakage.', 'Separate blockers from suggestions; explain residual risks and attack costs; obtain independent and human review.'],
  'A valid write-scoped key is embedded in a public browser bundle. Assess the exposed capability and containment.',
  'Re-run tenant attacks while the connection pool is under concurrent load.'),
 (12, 'Handover', 'Demonstrate operation and transfer to another engineer.', ['system design','operational ownership'],
  'A handover is successful when another engineer can reproduce, deploy, diagnose and safely recover the system. A portfolio explains decisions and limitations with evidence. No milestone automatically grants a professional level.',
  ['Reconstruct a twelve-minute evaluator outage','Prepare a reproducible operational handover','Deliver the final case study and evidence bundle','Defend the system cold with external reviewers'],
  ['Determine which alerts should have fired and which did using stored evidence; state what cannot be reconstructed.', 'A fresh environment can build, migrate, seed synthetic data, run tests and recover a failed page without unsafe replay.', 'Link writeups, ADRs, measured performance, real-user feedback, independent review and one outside contribution; mark missing evidence.', 'Perform unfamiliar requirement change, incorrect-finding rebuttal and incident defense; obtain reasoned human readiness feedback.'],
  'An unfamiliar maintainer follows the runbook and sends a page twice. Determine whether the failure is implementation, documentation or both.',
  'Have a human reviewer select a new failure without revealing the expected diagnosis.')
]
factors = [1,2,3,3,3,4,4,6,4,4,4,4,3]
milestones = []
for number, title, objective, competencies, lesson, names, criteria, drill, transfer in stages:
    if number == 5:
        competencies = competencies + ['cross-service contracts']
    tickets = []
    for i, (name, ac) in enumerate(zip(names, criteria)):
        mode = ['SOLO','SOLO','DELEGATE','PAIR'][i]
        tickets.append(dict(id=f'M{number:02}-{i+1:02}', title=name, mode=mode,
            competencies=[competencies[i % 2]] + (['cross-service contracts'] if number == 5 and i in [1,2] else []), estimate=[x*factors[number] for x in ([4,8] if i in [0,2] else [2,4])],
            context=f'{objective} This ticket addresses {competencies[i % 2]} within milestone {number}.',
            acceptance=[s.strip()+'.' for s in ac.rstrip('.').split('; ')],
            outOfScope='Unrelated services, unmeasured optimizations, production customer data and live notification sends.',
            done=['Acceptance criteria have linked observed evidence.','Author records plan, falsifiable prediction, verification and PR description.','Explain-back and independent exact-revision review are recorded separately from delivery.','Open failures are resolved or explicitly block acceptance; no success-shaped stubs.'],
            dependencies=[] if i == 0 else [f'M{number:02}-{i:02}'],
            delivery_status='not_started', learning_status='unassessed'))
    milestones.append(dict(id=number,title=title,objective=objective,competencies=competencies,
        targetLevel=3 if number < 5 else 4, lesson=lesson,tickets=tickets,drill=drill,transfer=transfer,
        delivery_status='not_started',learning_status='unassessed'))
(ROOT/'docs/curriculum').mkdir(parents=True,exist_ok=True)
(ROOT/'docs/curriculum/program.json').write_text(json.dumps(dict(title='Signalpost Engineering Bootcamp',version=1,weeklyHours=15,pilotWeeks=2,milestones=milestones),indent=2)+'\n',encoding='utf-8')
for m in milestones:
    parts=[f"# M{m['id']:02} — {m['title']}",m['objective'],f"Target competencies: {', '.join(m['competencies'])}. Provisional target rubric level: {m['targetLevel']}. Learning: unassessed.",
        '## Working knowledge',m['lesson'],
        '## Prerequisites','Complete prior milestone delivery and declared learning gates before claiming advancement. Independent work can be prepared in advance; no future milestone is credited by association.',
        '## Study sequence','Read the relevant ADR and primary reference. Reproduce the smallest boundary behavior. Close the implementation before the SOLO exercise. Record a prediction before running it. Write the explanation from memory, then compare with observed behavior.',
        '## Tickets']
    for t in m['tickets']:
        parts.extend([f"### {t['id']} — {t['title']}",f"Mode: **{t['mode']}**. Estimate: {t['estimate'][0]}–{t['estimate'][1]} hours. Target: {', '.join(t['competencies'])}. Delivery: not_started. Learning: unassessed.",
            t['context'],'Acceptance criteria:\n\n'+'\n'.join('- '+x for x in t['acceptance']),
            'Out of scope: '+t['outOfScope'],'Definition of done:\n\n'+'\n'.join('- '+x for x in t['done']),
            'Before implementation: write 5–10 lines covering approach, files, data, risks and tests. Record prediction, confidence and falsifier. For DELEGATE work, predict a likely agent error before opening its diff.'])
    parts.extend(['## Weekly practice','Reserve 30% of study time for drills. Every week: one no-AI hour and one independent planted-defect review. Rotate chaos, interview, code-reading, bad requirements and agent supervision. Use git bisect at least monthly.',
        '## Adversarial scenario',m['drill'],'## Transfer assessment',m['transfer'],
        '## Demo and defense','Present a reproducible demo and failure. Defend an alternative, a concurrency/failure/scale boundary and the first expected breaking point. On a miss, preserve correct software, complete the smallest exposing exercise, then reassess with a changed example.',
        '## Readiness gate','Link the writeup, exact reviewed commit, criterion evidence, learner transfer evidence and human feedback where required. Compare behavior to the declared target level; list what evidence does not establish. Never infer a hiring level.',
        '## Scheduling',f'Estimated ticket work: {12*factors[m["id"]]}–{24*factors[m["id"]]} hours, 50% SOLO by both lower and upper estimates. This is a first planning hypothesis, not a completion promise. With 70% of 15 weekly hours allocated to tickets, scope-heavy milestones will require re-estimation. A full production performance/security milestone may greatly exceed this range.'])
    (ROOT/f"docs/curriculum/M{m['id']:02}.md").write_text('\n\n'.join(parts)+'\n',encoding='utf-8')
print(f'Generated {len(milestones)} milestones and {sum(len(m["tickets"]) for m in milestones)} complete tickets.')
