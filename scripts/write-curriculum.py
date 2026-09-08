"""Canonical learner-first curriculum. Generates materials, never learner evidence."""
import json
from pathlib import Path

OUT = Path(__file__).resolve().parents[1] / 'docs/curriculum'
RESOURCES = {
 'JavaScript': 'https://developer.mozilla.org/en-US/docs/Learn_web_development/Core/Scripting',
 'TypeScript': 'https://www.typescriptlang.org/docs/handbook/intro.html',
 'Node tests': 'https://nodejs.org/docs/latest-v24.x/api/test.html',
 'Git': 'https://git-scm.com/book/en/v2',
 'HTTP': 'https://developer.mozilla.org/en-US/docs/Web/HTTP/Guides/Overview',
 'Fastify': 'https://fastify.dev/docs/latest/Guides/Getting-Started/',
 'SQL': 'https://www.postgresql.org/docs/current/tutorial.html',
 'PGlite': 'https://pglite.dev/docs/',
 'HTML and CSS': 'https://developer.mozilla.org/en-US/docs/Learn_web_development/Core',
 'React': 'https://react.dev/learn',
 'Authorization': 'https://cheatsheetseries.owasp.org/cheatsheets/Authorization_Cheat_Sheet.html',
 'Query plans': 'https://www.postgresql.org/docs/current/using-explain.html',
 'SRE': 'https://sre.google/workbook/table-of-contents/',
}

def exercise(title, context, *acceptance):
    return dict(title=title, context=context, acceptance=list(acceptance))

stages = [
dict(title='Programming you can explain', competencies=['programming fundamentals', 'tool fluency'], hours=[2,4],
 objective='Write, run, test and explain a small program from a blank function.',
 lesson='A program transforms inputs into outputs. A variable names a value; a function names a reusable transformation. Parameters receive inputs and return sends a result to the caller. Logging displays a value but does not return it. A condition chooses a path; a loop repeats an action. An array is an ordered collection; an object groups named properties. Trace a concrete example on paper before adding syntax. Files, the terminal working directory and error messages are part of programming. Read FIRST_SESSION.md for a complete first lesson with setup, vocabulary and a 75-minute sequence.',
 concepts=['Values include numbers, strings, booleans and undefined. === compares without coercion.', 'const prevents rebinding; it does not freeze an array. Avoid changing caller-owned input accidentally.', 'A test assertion compares actual behavior to a stated expectation; read its first relevant file and line.', 'Git status lists changes; diff shows edits. Commit only changes you can explain.'],
 example="function countWarm(readings) {\n  let count = 0;\n  for (const reading of readings) {\n    if (reading >= 20) count = count + 1;\n  }\n  return count;\n}\nconsole.log(countWarm([19, 20, 24])); // 2",
 explanation='For 19, count stays 0. For 20 it becomes 1, and 24 makes it 2. The boundary is inclusive because of >=. Empty input never enters the loop, so returns 0. The independent exercise uses a different rule.',
 guided=['Follow FIRST_SESSION.md; confirm node --version in the repository terminal.', 'Type the temperature example into a scratch file; predict results for [] and [20] before running it.', 'Change the threshold into a second parameter and explain which lines depend on it.', 'Run the unfinished U01 checks and read one failure. Seek a concept hint if needed; type the code yourself.'],
 tasks=[
 exercise('Trace and change a small function', 'Work through the temperature example. Use a tutor for explanation and one hint at a time.', 'Trace [19,20,24], [] and [20] on paper.', 'Make threshold an argument and demonstrate two values.', 'Explain your working directory, git diff and one test failure.'),
 exercise('Implement the task summary', 'In practice/learner/u01.mjs implement remainingTitles(tasks): return titles whose done is exactly false, in original order. Input is an array of {title:string,done:boolean}. Also implement totalMinutes(values): sum nonnegative integer minutes. Inputs are valid; neither function may mutate them.', 'node --test practice/checks/u01.test.mjs passes with supplied checks unchanged.', 'Empty inputs return [] and 0 respectively. Add your own duplicate-title and all-done cases.', 'Explain a loop and return value with code closed; show your diff.'),
 exercise('Transfer to a study budget', 'In a new file implement fitSessions(durations,budget). Return a consecutive prefix whose sum stays <= budget. Stop at the first duration that cannot fit; do not skip it. All inputs are nonnegative integers. Preserve input.', '[20,30,10] with budget 45 returns [20]; with 50 returns [20,30].', 'Test empty input, zero budget and a zero-minute session.', 'Write your own assertion and explain why filtering durations individually is wrong.'),
 exercise('Explain, correct and revisit', 'Use MENTOR.md for feedback, then return 2–7 days later with the prior solution closed.', 'Record help used and actual output.', 'Explain logging versus returning.', 'Pass a changed boundary independently; missing evidence stays pending.')],
 transfer='Return the first title longer than a supplied length, or null. Define equality behavior and test that boundary.',
 drill='Predict what happens when a function logs 7 and its caller adds the return value to 1. Explain undefined from the observation.',
 remediation='Trace three values on paper. Write a one-input function before returning to the loop. If the terminal is the obstacle, repeat only FIRST_SESSION setup.', sources=['JavaScript','Git']),
dict(title='Debugging and problem solving', competencies=['systematic debugging','problem decomposition'], hours=[2,4],
 objective='Turn an unclear failure into a small reproduction and a verified correction.',
 lesson='Start with a precise difference between expected and observed behavior. Reduce the input until the failure is easy to reason about. A hypothesis proposes a cause; an experiment should distinguish it from another cause. Inspect values at a boundary and change one thing at a time. Syntax errors prevent parsing, runtime errors interrupt execution and logic errors can produce plausible wrong answers. Decompose a problem into small operations with explicit contracts. Async work completes later: a Promise represents its eventual outcome, and await can throw when that work rejects.',
 concepts=['A minimal reproduction preserves the failure while removing unrelated code.', 'Off-by-one errors, accidental mutation and string/number confusion deserve explicit experiments.', 'Use a breakpoint or targeted log to inspect a hypothesis; remove debug noise afterward.', 'A regression must fail under the old defect and pass after the correction.'],
 example="const samples = [2,4,6];\nlet total = 0;\nfor (let i = 0; i <= samples.length; i++) total += samples[i];\nconsole.log(total); // observed: NaN",
 explanation='Indices 0, 1 and 2 exist; index 3 is undefined. Inspect i and samples[i] to distinguish a boundary error from invalid data. Changing the expected answer would conceal the defect.',
 guided=['Reproduce the example unchanged; predict the first invalid iteration.', 'Inspect with a log or debugger and correct the boundary.', 'Write a regression for the original defect.', 'In a scratch async function, await Promise.resolve and Promise.reject; catch and explain rejection.'],
 tasks=[
 exercise('Investigate one boundary error', 'Work through the loop and async examples. Keep expected/observed/cause/verification in four short lines.', 'Show the failure before the correction.', 'Name a competing cause and the observation rejecting it.', 'Explain why await does not guarantee success.'),
 exercise('Repair a label search', 'Repair findTitles(tasks,query) in practice/learner/u02.mjs. Match a trimmed case-insensitive substring. A whitespace-only query returns all titles. Preserve title text, order and input. The isolated starter deliberately contains defects.', 'node --test practice/checks/u02.test.mjs passes; do not change supplied expectations.', 'Add regressions for an empty list and a mixed-case last item.', 'Identify causes separately from symptoms; show the smallest correction.'),
 exercise('Decompose a paged result', 'Implement pageItems(items,page,size). Page and size are one-based positive integers; return that page without mutation. An out-of-range page returns []. Invalid page or size throws RangeError.', '[a,b,c,d,e], page 2, size 2 yields [c,d]; page 3 yields [e].', 'Test first page, beyond end, zero, negative and fractional inputs.', 'Explain the index calculation and demonstrate a meaningful regression.'),
 exercise('Review an investigation', 'Ask for feedback on reasoning before code suggestions. Retest a changed boundary after a delay.', 'Give a reproduction command and expected/actual result.', 'Record whether the cause was found independently or via a hint.', 'Solve a changed case without copying the first correction.')],
 transfer='A search fails only at the last item. Propose two different causes and an experiment separating them before editing.',
 drill='A test passes alone but fails after another test. Investigate shared mutable state before adding a timeout.',
 remediation='Reduce to two items. Trace indices and values, then reintroduce one condition at a time.', sources=['JavaScript','Node tests']),
dict(title='TypeScript and trustworthy tests', competencies=['typed domain modeling','behavioral testing'], hours=[3,5],
 objective='Express valid states in types and verify behavior at runtime boundaries.',
 lesson='JavaScript is the runtime; TypeScript checks assumptions before execution. Type annotations do not validate external JSON. Treat external input as unknown, inspect it and narrow to a trusted type. A discriminated union expresses alternatives without contradictory boolean flags. Keep domain decisions in functions with explicit inputs and outputs. Tests should verify caller-visible behavior: ordinary cases, boundaries and failures. Unit tests isolate decisions; integration tests check real components working together. A mock does not prove that its real dependency behaves the same way.',
 concepts=['Learn object types, optional fields, unions and narrowing before advanced generics.', 'Avoid any and unchecked assertions that hide a missing runtime check.', 'Make time and randomness explicit inputs when testing decisions.', 'Coverage alone does not establish that assertions detect meaningful failures.'],
 example="type Result = {kind:'found'; value:string} | {kind:'missing'};\nfunction describe(result: Result): string {\n  if (result.kind === 'missing') return 'No result';\n  return result.value;\n}",
 explanation='Checking kind narrows the union. value exists only in the found branch. The compiler cannot prove a network response has this shape unless the boundary validates it.',
 guided=['Read Everyday Types and Narrowing in the TypeScript handbook.', 'Type the example; intentionally read value before narrowing and explain the error.', 'Run U03 checks and implement one valid-input case with a hint if needed.', 'Compare a test of output with a test that only asserts an internal call.'],
 tasks=[
 exercise('Model valid outcomes', 'Extend the example with an error outcome and handle it explicitly.', 'Demonstrate and explain a compiler error.', 'Handle the new branch without a catch-all assertion.', 'Distinguish type checking from validation.'),
 exercise('Validate a task at the boundary', 'Implement parseTask(value:unknown) in practice/learner/u03.ts. Return {ok:true,task:{title:string,minutes:number}} or {ok:false,error:string}. Trim title, require nonempty <=80 characters and integer minutes 1–240. Reject null, arrays and wrong types; ignore unknown fields and preserve input.', 'node --import tsx --test practice/checks/u03.test.ts and practice typecheck pass.', 'Add checks for 1,240,0,241 and whitespace-only title.', 'Use no any or unchecked as assertion; explain narrowing.'),
 exercise('Model completion explicitly', 'Create open/completed task variants, with completedAt only on completed tasks. Implement complete(task,now); validate the supplied timestamp and preserve the first timestamp on repeated completion.', 'Test open-to-completed, repeated completion and invalid time.', 'The compiler rejects reading completedAt from an unnarrowed open task.', 'Time is supplied by the caller; tests do not wait for a clock.'),
 exercise('Assess test quality', 'In a disposable copy introduce a boundary mistake, prove a test catches it, restore it and review the test set.', 'Explain what tests protect and what they miss.', 'Add one behavior case after review.', 'Retest a changed validator independently after a delay.')],
 transfer='Validate a book request with a title and optional integer page count. Write policy first; transfer narrowing without pasting the task implementation.',
 drill='A JSON object is cast to Task and the compiler is satisfied. Supply input that still crashes the caller.',
 remediation='Write a truth table of inputs. Practice null, typeof and Array.isArray checks separately.', sources=['TypeScript','Node tests']),
dict(title='HTTP and a small API', competencies=['HTTP API design','boundary validation'], hours=[3,6],
 objective='Build and diagnose a small request-response service with explicit error behavior.',
 lesson='An HTTP request contains method, URL, headers and sometimes a body. A response contains status, headers and a body. JSON is a representation, not proof of valid input. Trace parsing, validation, domain logic and response separately. A network failure differs from a 400 or 500 response. Start with a single process and an explicitly temporary memory store; persistence comes next. Authentication establishes who is calling; authorization determines allowed actions. This local practice service uses synthetic data and does not claim real user authentication.',
 concepts=['Separate transport, domain rules and storage.', 'Declare statuses, body limits, missing-object behavior and error shape.', 'Catch an awaited failure at a boundary that can return useful feedback.', 'Bind training services to loopback; never put credentials in logs.'],
 example='POST /notes with {"text":"Read a chapter"}\n201 Created with {"id":"n1","text":"Read a chapter"}\nInvalid text -> 400 with {"error":"Invalid text"}',
 explanation='The server assigns the ID and validates text. Malformed JSON fails parsing; a well-formed invalid object fails field validation. A failed connection has no HTTP response status.',
 guided=['Create the isolated learner project described in PROJECTS.md.', 'Using Fastify, write GET /health returning {ok:true}.', 'Send a request with Invoke-RestMethod and inspect status/headers with Invoke-WebRequest.', 'Add one guided POST /notes example. Type it yourself; do not copy the prepared service.'],
 tasks=[
 exercise('Trace an HTTP exchange', 'Implement guided health/note requests and draw the request path.', 'Capture method, URL, status and body.', 'Handle an awaited failure without a hanging request.', 'Explain what process restart does to memory.'),
 exercise('Build the task API', 'Implement POST /tasks, GET /tasks and PATCH /tasks/:id/complete with a memory store. Apply U03 title/minutes policy; server creates IDs; new tasks start open. Use 201 for creation, 200 for read/complete, 400 invalid input, 404 missing ID and 413 for bodies above 16 KiB. Repeated completion preserves its first timestamp.', 'Exercise success, malformed JSON, body limit and missing ID through the HTTP boundary.', 'Rejected creation leaves the store unchanged.', 'Document ordering as creation order and restart data loss.'),
 exercise('Add a compatible filter', 'Add GET /tasks?status=open|completed. No status returns all; unsupported status returns 400. Keep the response fields stable.', 'Old tests plus empty/filter/invalid cases pass.', 'Explain the URL-to-validation-to-filter path with code closed.', 'Distinguish connection failure from a server error response using observations.'),
 exercise('Review as an API caller', 'Have a tutor use the contract without implementation details. Resolve one ambiguity, then retest a changed endpoint.', 'Examples are reproducible.', 'State authentication limits honestly.', 'Add a regression protecting existing callers.')],
 transfer='Specify and implement GET /tasks/:id with successful and missing cases.',
 drill='The client shows success before awaiting a request that fails. Test the user-visible consequence.',
 remediation='Return a hardcoded response first; add parsing, validation and state one boundary at a time.', sources=['HTTP','Fastify']),
dict(title='SQL, integrity and transactions', competencies=['relational data modeling','transactional reasoning'], hours=[4,7],
 objective='Persist the API and prove failed changes preserve valid data.',
 lesson='A relational schema describes entities and relationships; constraints reject invalid state even when callers make mistakes. Learn SELECT, INSERT, UPDATE, DELETE and JOIN with tiny datasets before an ORM. A transaction groups changes that commit or roll back together. Parameterize values instead of building SQL with untrusted text. A uniqueness pre-check can race; the database constraint must enforce the rule. Choose indexes from access paths and inspect the plan. Embedded PostgreSQL practice teaches semantics; it does not prove networked concurrency or host-crash durability.',
 concepts=['Keys identify rows; foreign keys enforce relationships.', 'NULL means missing/unknown; use IS NULL for that predicate.', 'NOT NULL and CHECK express different promises.', 'A migration needs populated-data upgrade and recovery evidence.'],
 example="CREATE TABLE books (id integer PRIMARY KEY, title text NOT NULL, pages integer CHECK (pages > 0));\nINSERT INTO books VALUES (1,'Small Systems',120);\nSELECT title FROM books WHERE pages >= 100;",
 explanation='A duplicate id fails. NOT NULL title still permits an empty string. The pages check rejects zero but permits NULL unless a separate NOT NULL constraint forbids it. Test the promise each constraint actually makes.',
 guided=['Run node practice/sql-console.mjs; each statement ends in a semicolon.', 'Type the books example, then try duplicate ID, zero pages and NULL pages.', 'Read tutorial joins and transactions; use two or three rows.', 'Use PROJECTS.md for a file-backed PGlite store in your own API.'],
 tasks=[
 exercise('Explore constraints with tiny data', 'Create books/authors, join them and rehearse BEGIN/INSERT/ROLLBACK in the SQL console.', 'Predict then observe duplicate and invalid-value behavior.', 'Show rollback removes the uncommitted row.', 'Explain a relationship versus an index.'),
 exercise('Persist projects and tasks', 'Replace your memory store with file-backed PGlite. Model projects and tasks with projectId,title,minutes,status,completedAt. Enforce valid minutes, trimmed nonempty title and coherent completion fields. Complete a task and append an event in one transaction. Preserve the API contract.', 'Close/reopen and prove records remain.', 'Test bad foreign key, invalid status and injection-like title at storage.', 'Injected failure between completion and event leaves neither change.'),
 exercise('Migrate without losing work', 'Add nullable dueDate to a populated database. Validate date-only input. Track applied migrations, support empty/populated upgrade and recover from a copy made with the database closed.', 'Compare original rows before/after.', 'Repeat migration safely using a ledger.', 'Explain why dropping the table is not acceptable rollback.'),
 exercise('Defend the query', 'Review a project-task join and an index for project/status lookups.', 'Two projects do not leak rows across the query boundary.', 'Capture EXPLAIN; do not invent a speedup for tiny data.', 'Retest an aggregate query after a delay; state the embedded lab’s limits.')],
 transfer='Return every project and its count of open tasks, including zero. Demonstrate why an inner join can omit a project.',
 drill='Two writers both observe an unused name. Identify which constraint decides the final outcome.',
 remediation='Draw rows before writing a join. Rehearse one rollback before integrating the API.', sources=['SQL','PGlite']),
dict(title='Usable interfaces with React', competencies=['frontend state modeling','accessible interaction'], hours=[4,7],
 objective='Build a usable interface with explicit loading, failure and keyboard behavior.',
 lesson='Learn semantic HTML and CSS layout before JSX. A button performs an action; a link navigates; a label names a control. React renders from props and state. Keep one owner for a state value and derive what you can calculate instead of duplicating it. Event handlers respond to actions; effects synchronize with external systems. Requests can load, succeed, return empty or fail. Show each state deliberately and preserve user input after failure. Older async responses can arrive after newer ones, so immediate-response tests are insufficient.',
 concepts=['Study HTML forms, box model, flex/grid, responsive widths and visible focus.', 'Props carry data down; callbacks request change. Use stable IDs as list keys.', 'A state update requests a render; it does not replace values inside the running handler.', 'Test keyboard interaction and request ordering as well as the happy path.'],
 example="function Counter() {\n  const [count,setCount] = useState(0);\n  return <button onClick={() => setCount(c => c + 1)}>Books read: {count}</button>;\n}",
 explanation='The button already supports keyboard activation. The updater receives the prior state. A styled div would need additional semantics and interaction behavior.',
 guided=['Create a plain HTML labeled form and list; navigate by Tab and Enter.', 'Make the layout fit 390px with visible focus.', 'Read React Quick Start for props, state, events and lists.', 'Use PROJECTS.md to create your own Next app; type a counter and guided note list.'],
 tasks=[
 exercise('Build the form before the framework', 'Create the semantic form, then move it into React.', 'Keyboard users can focus, submit and receive feedback.', 'Every input has an associated visible label.', 'Explain props/state and render/handler distinctions.'),
 exercise('Build the task interface', 'Connect your learner UI to U05. List, create and complete tasks. Show loading, empty, success and error. Preserve typed input on failed save; prevent duplicate submission while pending. Confirm success before showing completion.', 'Browser checks exercise create, complete, empty and failed save.', 'At least one flow uses the real learner API; mocks alone do not prove integration.', 'No overflow at 390px; keyboard-only create/complete works.'),
 exercise('Handle stale search results', 'Add title search and delay an older query so it completes after a newer one. Display only the current query’s result using cleanup/abort or an explained request-identity policy.', 'A deterministic test reorders responses.', 'Failed search offers recovery without clearing unrelated state.', 'Explain why an immediate-response test misses the bug.'),
 exercise('Observe usability and revise', 'Let a willing person try the flow at a portfolio checkpoint. Until available, record a keyboard walkthrough labeled self-review.', 'Record actual friction, never invented user feedback.', 'Verify one justified improvement.', 'Retest a state variation later; state limits of automated accessibility checks.')],
 transfer='Add editable project name with cancel, save and failed-save behavior. Decide local versus server-owned state.',
 drill='A slow save causes a duplicate task. Distinguish duplicate submission from duplicate rendering with network evidence.',
 remediation='Build a two-state form without requests, then add one async transition at a time.', sources=['HTML and CSS','React']),
dict(title='Own a complete feature', competencies=['feature ownership','authorization design'], hours=[6,10],
 objective='Deliver a bounded feature from a written need through verification and review.',
 lesson='Independent delivery connects a user need to dependable behavior through small decisions. Plan a thin end-to-end slice, expose uncertainty and include failures in the estimate. Authorization belongs on the server; a hidden button is not protection. A local server-only test identity seam can test permission rules but does not establish production authentication. Use an established authentication integration before sharing private data with real users. A useful PR explains the final behavior, tradeoff, risk and observed verification.',
 concepts=['Write acceptance examples and non-goals before implementation.', 'Check membership on every read/mutation, including guessed object IDs.', 'Keep authentication separate from browser-selected user or project IDs.', 'Plan verification, failure detection and recovery alongside the feature.'],
 example='Viewer V belongs to project A.\nGET A tasks -> allowed.\nPATCH A task -> denied.\nGET guessed B task -> no B data.\nA disabled edit button alone proves none of these server rules.',
 explanation='Direct API calls bypass the UI. A trusted synthetic principal in local tests is a seam, not a real sign-in system. Label that boundary honestly.',
 guided=['Write a one-page project-collaboration brief.', 'Review a sample owner/editor/viewer permission matrix with a tutor.', 'Trace one existing learner request and locate the authority boundary.', 'Plan a small vertical slice, uncertainty range and fallback.'],
 tasks=[
 exercise('Scope a reviewable feature', 'Define owner/editor/viewer permissions for listing, creating, completing and renaming. Use a server-only test identity seam locally.', 'Six allow/deny examples include another project.', 'Browser-supplied identity is never treated as authentication.', 'Estimate slices and name a concrete uncertainty.'),
 exercise('Deliver project permissions', 'Implement your matrix in storage, server checks and UI feedback. Test two projects and three synthetic principals. Keep test identity unavailable to external clients; run locally.', 'Direct calls cannot cross projects or mutate as viewer.', 'Browser allowed-path and integration denied-path checks pass.', 'Supply PR, migration/recovery evidence and explicit real-authentication limits.'),
 exercise('Handle revocation mid-session', 'Revoke an editor while a form is open. Recheck current authority on later save, preserve unsaved text and explain denial.', 'Show success before revocation and denial after it.', 'No unauthorized write occurs.', 'Explain the race boundary and chosen transactional/check policy.'),
 exercise('Defend independent ownership', 'Present the learner revision for a real review when available; label tutor review provisional.', 'Explain user behavior, failure path and one tradeoff with code closed.', 'Resolve or rebut findings using evidence.', 'Apply the independent-delivery gate; unresolved authority failures block a readiness claim.')],
 transfer='Add archived projects: readable, but no new tasks. Enforce the rule on direct API calls.',
 drill='A viewer sends a handcrafted mutation despite the disabled button. Find the missing authority check.',
 remediation='Reduce to two roles and one route. Prove denial before propagating policy.', sources=['Authorization']),
dict(title='Maintain code with other people', competencies=['maintainability and review','collaborative delivery'], hours=[3,6],
 objective='Safely change unfamiliar code and leave a handoff another person can use.',
 lesson='Discover the existing contract before refactoring: enter through a public function, follow one path and run tests. A refactor preserves behavior; a feature changes it. Prefer a small comprehensible boundary over a speculative framework. Git conflicts require preserving both intended behaviors, not accepting one side blindly. Review findings need a trigger, evidence and consequence. Agents may draft work, but you remain responsible for the integrated behavior and must be able to reject a plausible patch.',
 concepts=['Use characterization tests before changing unfamiliar behavior.', 'Choose abstractions from real repeated needs and dependency direction.', 'Separate blocking defects from preferences in review.', 'Delegate only bounded work whose result you can inspect and verify.'],
 example='Finding: PATCH /tasks/unknown/complete returns 200.\nContract: missing ID returns 404.\nImpact: caller cannot distinguish no change from a saved task.\nVerification: assert response and unchanged storage.',
 explanation='A useful finding provides a reproducible consequence. Confidence and stylistic preference cannot substitute for evidence.',
 guided=['Rehearse branch, diff, log and a small conflict in a disposable Git repo.', 'Read one unfamiliar 50–150 line function from the prepared project at this stage.', 'Write a characterization check before changing an isolated copy.', 'Read AGENT_ENGINEERING.md and draft a bounded brief.'],
 tasks=[
 exercise('Read and review an unfamiliar change', 'Map inputs, outputs and dependencies for a small change; review it with evidence.', 'Run original checks before edits.', 'Separate observations, inferences and preferences.', 'Name behavior that must remain stable.'),
 exercise('Refactor without expanding scope', 'Give your task app clear transport, domain and persistence seams without changing its public contract.', 'The same before/after behavior checks pass.', 'Explain one rejected abstraction and its cost.', 'Write a PR with commands another engineer can run.'),
 exercise('Integrate conflicting intentions', 'In a disposable repo, one branch changes error wording and another adds metadata in the same function. Merge both intentions. Review one small agent-generated patch separately.', 'Resolve a real conflict and test both requirements.', 'Attribute agent work and independently verify its diff.', 'Explain revert without resetting another person’s work.'),
 exercise('Close a review loop', 'Use a real reviewer when possible; otherwise keep review provisional. Rewrite unclear handoff instructions.', 'Record actual findings and responses.', 'Handoff includes setup, verification and limits.', 'Repeat a different maintenance change without step-by-step help.')],
 transfer='A second storage adapter must preserve API errors. Define a small contract check and apply it to both.',
 drill='An agent changes twelve unrelated files for one bug. Assess scope and integrate only a change you understand.',
 remediation='Write a behavior table for one function and make one safe edit first.', sources=['Git']),
dict(title='Data structures and measured performance', competencies=['algorithmic reasoning','performance investigation'], hours=[4,7],
 objective='Choose suitable data structures and verify performance against a defined workload.',
 lesson='Arrays, maps, sets, stacks and queues support different access patterns. Big-O describes growth under an explicit model; it does not predict response time on particular hardware. Recognize repeated scans and unbounded work before optimizing syntax. Define a workload, symptom and correctness oracle; distinguish CPU, I/O and waiting. Compare multiple sizes, warmup and repeated trials. Inspect database plans or browser profiles at the actual bottleneck. Caching adds memory and invalidation obligations.',
 concepts=['Practice linear scan, binary search on sorted input, map/set lookup and queue processing.', 'State both time and space cost and any precondition.', 'Averages can hide slow requests; examine distribution and variation.', 'Measure the generator too; faster wrong output is not an improvement.'],
 example='N tasks each scan M projects: up to N × M comparisons.\nBuild a project Map once: M inserts, then N lookups under the usual average lookup model.\nCost: memory and a rebuild/invalidation policy when names change.',
 explanation='A map removes repeated scans, but small input may not get faster in wall time. Prove identical behavior and measure relevant sizes before claiming improvement.',
 guided=['Implement and trace a stack and queue on tiny problems.', 'Trace binary search for first, last and missing values.', 'Compare both project-lookup approaches on five tasks.', 'Profile your learner app before selecting an optimization.'],
 tasks=[
 exercise('Explain growth and preconditions', 'Trace linear scan, map lookup and binary search for 8 and 16 items.', 'Test empty, first, last and missing search.', 'Explain why binary search needs sorted data.', 'State extra memory cost of an index.'),
 exercise('Improve a measured bottleneck', 'Generate tasks/projects at three recorded sizes and measure list/search. Improve one demonstrated repeated scan or access path. If the app is already fast, report that and use a deliberately slow isolated training version.', 'Publish raw before/after trials, hardware and fixture sizes.', 'Results and permission checks are unchanged.', 'Identify the limiting resource and limits of inference.'),
 exercise('Build a bounded recent-items cache', 'Implement LRU cache with positive integer capacity, get and put. Read/update refreshes recency; insertion at capacity evicts least recently used; missing get returns undefined.', 'Test capacity one, update, read-driven eviction and invalid capacity.', 'Explain time/space cost and why cache is not durable storage.', 'Specify stale-data policy for project rename before integration.'),
 exercise('Defend the evidence', 'Review cases where the optimization does not help and retest a different data-structure problem later.', 'Explain a rejected optimization.', 'Do not extrapolate toy throughput to production SLOs.', 'Solve a changed bounded lookup/queue problem independently.')],
 transfer='Deduplicate events by ID preserving first appearance. Compare array-only and Set approaches.',
 drill='A benchmark gets faster after omitting authorization. Reject the result using correctness checks.',
 remediation='Count operations on five records. Establish correctness before adding timers.', sources=['Query plans','JavaScript']),
dict(title='Reliability and operating a service', competencies=['failure-aware design','operational diagnosis'], hours=[5,9],
 objective='Reason about partial failure and operate a small service using observable evidence.',
 lesson='A service can commit while its caller never receives success. Retrying can repeat effects, so define stable request identity and an atomic persistence boundary before claiming idempotency. Bound payloads, queues and retries so overload is visible. Logs should connect symptoms to a user path without exposing secrets. Select a user-outcome SLI and consider needs and data before choosing an SLO. Restore practice matters as much as backup creation. Local drills develop reasoning but do not establish sustained production ownership.',
 concepts=['Distinguish retry attempts from logical application effects.', 'Use timeouts and a bounded retryable/nonretryable policy.', 'Readiness, liveness and user success measure different things.', 'Incident notes connect impact, timeline, evidence and owned follow-up.'],
 example='Create request R -> task + receipt commit atomically.\nConnection closes before success reaches the client.\nRetry R with same payload -> prior result.\nRetry R with changed payload -> conflict.',
 explanation='If task and receipt commit separately, a crash can leave one without the other. This logical deduplication does not prove an external notification reached a human.',
 guided=['Draw success, pre-commit failure and response-loss paths.', 'Add request IDs and local error counts without logging secrets.', 'Read one prepared Signalpost invariant test after writing your own expectations.', 'Plan a synthetic drill in a disposable copy with stop/recovery criteria.'],
 tasks=[
 exercise('Map partial failures', 'Trace client, handler and transaction; predict a timeout at each boundary.', 'Distinguish durable state from caller knowledge.', 'Specify key/payload conflict behavior.', 'Define bounded retry and overload policies.'),
 exercise('Make one retry safe', 'Add durable request receipts for task creation in the same transaction. Same key/payload returns prior result; changed payload returns 409. Inject response loss after commit in a controlled test.', 'A tested retry creates one logical task.', 'Pre-commit failure leaves neither task nor receipt.', 'Record parallel/restart behavior only if actually tested; state limits.'),
 exercise('Diagnose and recover a local failure', 'In an isolated copy, make a dependency unavailable, diagnose with logs and a user check, restore service, then restore a closed-database backup into a separate path.', 'Record impact, timestamps, hypothesis and recovery verification.', 'Reconcile restored records and state recovery-point limits.', 'Write a short postmortem with one verifiable follow-up.'),
 exercise('Defend the operating model', 'Review with a practitioner when available and propose an SLI/SLO with missing data clearly stated.', 'A reader can follow the local runbook.', 'Local simulation is not recorded as production on-call.', 'Retest a different failure without a prepared diagnosis.')],
 transfer='A timeout follows a successful external effect. Explain what a database transaction cannot undo and propose deduplication or reconciliation.',
 drill='Slow dependencies cause retries to multiply load. Explain how unbounded retries delay recovery.',
 remediation='Draw three boxes and mark the last durable fact at each failure point.', sources=['SRE']),
dict(title='Design under uncertain requirements', competencies=['system design judgment','risk and scope management'], hours=[4,8],
 objective='Choose a proportionate design, expose assumptions and revise it as evidence changes.',
 lesson='Begin with users, constraints and failure consequences. Clarify the important decision before drawing infrastructure. Estimate capacity with units and ranges, then identify the dominant assumption. Compare a simple design with one credible alternative across consistency, complexity, cost and operation. Additional services add coordination boundaries; a modular monolith may suffice. A decision record should state when to reconsider it. Migration design must preserve behavior and include validation and recovery.',
 concepts=['Separate functionality from latency, availability, privacy and retention constraints.', 'Rough arithmetic exposes questions; it does not manufacture a forecast.', 'State ownership and consistency of data across boundaries.', 'A spike resolves one uncertainty with a timebox and stopping criterion.'],
 example='2,000 users × 20 tasks/day × 500 bytes ≈ 20 MB/day raw payload.\nExcluded: indexes, history, backups and peak traffic.\nStart with app + relational store. Revisit on measured bottlenecks or team-boundary needs.',
 explanation='Explicit units make the estimate reviewable. Raw payload is not total disk usage; a daily average hides bursts. The design remains conditional.',
 guided=['Use the ambiguity cards in PROJECTS.md.', 'Calculate a traffic/storage range with units.', 'Compare in-process polling with a durable reminder worker.', 'Write a one-page ADR with a reversal trigger.'],
 tasks=[
 exercise('Turn vague needs into decisions', 'Card: “Tasks must never be lost, reminders must be instant, and it must be cheap.” Translate absolutes into testable needs. With no stakeholder, document provisional assumptions.', 'Separate facts, assumptions and unresolved input.', 'Define a minimal slice and two non-goals.', 'Show capacity arithmetic and uncertainty.'),
 exercise('Design and spike reminders', 'Compare app polling and a durable worker. Define timing, timezone, cancellation, duplicate, retry and recovery behavior. Implement only a synthetic local sink spike for the highest-risk assumption; no real messages.', 'ADR compares two viable choices and defends the sufficient one.', 'Spike records stop criterion, observations and decision.', 'Sequence diagram and tests address cancellation and response loss.'),
 exercise('Adapt to a changed requirement', 'New card: owners can export/delete project data; aggregate counts can remain only if they do not identify it. Revise copies, derived data and recovery assumptions. Legal retention policy is unresolved stakeholder/legal input, not an engineering guess.', 'Map every affected copy and derived record.', 'Specify authorization, validation and recovery.', 'Explicitly revise the earlier design.'),
 exercise('Defend a conditional decision', 'Have a reviewer challenge the strongest assumption; revise if evidence warrants it.', 'Keep an assumption log and reversal trigger.', 'Separate proposed architecture from implemented behavior.', 'Complete a different small design case later.')],
 transfer='Design a resumable import with record identity, progress, validation errors and bounded resource use before choosing a queue.',
 drill='A stakeholder requests tenfold scale without usage data. Propose measurement and a bounded experiment before rewriting.',
 remediation='Reduce to one user journey and failure; compare two choices in a five-row table.', sources=['SRE']),
dict(title='Ownership, mentoring and readiness', competencies=['sustained engineering ownership','technical communication and mentoring'], hours=[5,10],
 objective='Assemble honest evidence of independent work, contribution and judgment across time.',
 lesson='Senior responsibilities include selecting valuable work under ambiguity, reducing risk for others and improving a shared system over time. A syllabus alone cannot provide that experience. A good handoff enables another person to run, diagnose and change the work. Mentoring develops the other person’s reasoning; writing their solution removes that evidence. Readiness varies with team and role. Report observed behavior, assistance and practical limits with dated artifacts, then choose the next useful responsibility.',
 concepts=['Connect work to an actual user/team problem and revisit the effect.', 'Maintain responsibility across more than one change.', 'Attribute personal work, agent output and reviewer feedback separately.', 'Do not average away a critical gap with unrelated strong scores.'],
 example='Claim: independently improved diagnosis.\nEvidence: reproduction, corrective PR/regression, runbook used by another person, later drill.\nLimit: controlled local exercise, no sustained production support yet.\nNext: own a bounded real issue through review and follow-up.',
 explanation='The claim matches the artifact and names its limit. A demo without another reader or later follow-up leaves collaboration and retained learning unobserved.',
 guided=['Inventory actual artifacts using ASSESSMENT.md.', 'Select the second-domain capstone in PROJECTS.md.', 'Prepare a five-minute explanation and ten-minute mentoring exercise.', 'Use PORTFOLIO.md to name missing evidence without inventing it.'],
 tasks=[
 exercise('Audit the portfolio', 'Select two independent features, two investigations, one design and one review/handoff. Attribute help and remove unsupported claims.', 'Each claim has artifact, date and observed behavior.', 'Separate simulation from real users/operations.', 'Identify the weakest essential skill and a focused remedy.'),
 exercise('Transfer to room booking', 'Build the room-booking capstone in PROJECTS.md from your own brief. Independently implement interval conflicts, persistence, API, UI and failure tests. Reuse tools, not task-domain implementation.', 'Demonstrate interval reasoning and direct authorization checks.', 'A second reader can run documented checks.', 'Explain a changed requirement before editing code.'),
 exercise('Own a maintenance cycle', 'Use a real permissioned project or your app with a willing reviewer. Triage, agree scope, implement, obtain review, integrate under project rules and revisit the outcome. Without collaborators, label the simulation and keep real collaboration evidence pending.', 'Record actual feedback without invented conversations.', 'Show a later maintenance follow-up.', 'Teach through hints; record another learner’s transfer only if observed.'),
 exercise('Write a readiness report', 'Apply ASSESSMENT.md and seek a practitioner’s role-specific judgment when available; AI review remains provisional.', 'Support foundation/independent-delivery claims with behavioral gates.', 'Senior evidence includes ambiguity, shared responsibility and sustained follow-up; gaps stay explicit.', 'Choose a 30-day plan for two useful gaps rather than another framework list.')],
 transfer='Enter an unfamiliar small repository: run it, map one behavior, fix a bounded issue and hand off reasoning without a tutorial.',
 drill='A polished portfolio is mostly agent-authored. Inspect contributions and request independent transfer before claiming competence.',
 remediation='Return to the weakest gate and rebuild a small piece. Real responsibility requires participation, not more course generation.', sources=['Git'])
]

modules = []
for i, source in enumerate(stages, 1):
    m = dict(source)
    m.update(id=i, code=f'U{i:02}', phase='Foundations' if i <= 6 else 'Independent delivery' if i <= 9 else 'Senior practice',
             prerequisites=[] if i == 1 else [f'U{i-1:02}'], targetLevel=3 if i <= 6 else 4,
             learning_status='unassessed', delivery_status='materials_prepared')
    m['resources'] = [dict(title=s, url=RESOURCES[s]) for s in m.pop('sources')]
    hours = m.pop('hours')
    m['tickets'] = []
    for n, raw in enumerate(m.pop('tasks'), 1):
        t = dict(raw)
        t.update(id=f'U{i:02}-{n:02}', mode='PAIR' if n in (1,4) else 'SOLO',
                 step=['Learn with guidance','Build independently','Transfer independently','Feedback and delayed check'][n-1],
                 estimate=[1,2] if n == 4 else hours, competencies=m['competencies'],
                 dependencies=[f'U{i:02}-{n-1:02}'] if n > 1 else ([f'U{i-1:02}-04'] if i > 1 else []),
                 outOfScope='Extra frameworks, real notifications, paid infrastructure and unrelated platform work. Use synthetic data and the smallest exercise that proves the skill.',
                 done=['Acceptance checked against actual output and a learner-owned artifact.', 'Help used recorded; learner explains behavior and limitations.', 'Feedback and delayed transfer pending until performed. Agent-prepared code earns no learning credit.'],
                 delivery_status='not_started', learning_status='unassessed')
        m['tickets'].append(t)
    if i == 7:
        for t, estimate in zip(m['tickets'], [[2,4],[12,24],[3,6],[2,4]]):
            t['estimate'] = estimate
    if i == 12:
        for t, estimate in zip(m['tickets'], [[2,4],[20,40],[8,16],[2,4]]):
            t['estimate'] = estimate
    m['readiness'] = 'Demonstrate both competencies on your own task and a changed example. Apply ASSESSMENT.md; ratings describe behavior, not job titles.'
    modules.append(m)
program = dict(title='Signalpost — Grow as an engineer', version=2, weeklyHours=15, pilotWeeks=2,
               intent='Personal skill development: fundamentals, independent delivery and senior responsibilities.',
               phases=['Foundations','Independent delivery','Senior practice'], milestones=modules)
(OUT / 'program.json').write_text(json.dumps(program, indent=2, ensure_ascii=False)+'\n', encoding='utf-8', newline='\n')
for m in modules:
    lines = [f'# {m["code"]} — {m["title"]}', '', f'**{m["phase"]} · Learning unassessed.** {m["objective"]}', '',
             'Prerequisites: '+(', '.join(m['prerequisites']) or 'None. Start with FIRST_SESSION.md.')+'. Challenge-out requires evidence; see ASSESSMENT.md.', '',
             '## Learn', '', m['lesson'], ''] + ['- '+c for c in m['concepts']]
    lines += ['', '## Worked example', '', '```text', m['example'], '```', '', m['explanation'], '', '## Guided practice', '']
    lines += [f'{i}. {s}' for i,s in enumerate(m['guided'],1)]
    for t in m['tickets']:
        lines += ['', f'## {t["id"]} — {t["title"]}', '', f'**{t["mode"]} · {t["step"]} · {t["estimate"][0]}–{t["estimate"][1]} focused hours, provisional.**', '', t['context'], '', 'Acceptance:', '']
        lines += ['- '+a for a in t['acceptance']]
        lines += ['', 'Done:', ''] + ['- '+a for a in t['done']]
        lines += ['', 'Out of scope: '+t['outOfScope']]
    lines += ['', '## Delayed transfer', '', m['transfer'], '', 'Revisit after 2–7 days and around three weeks with the prior solution closed. These are scheduling defaults, not scientific mastery thresholds.', '',
              '## Debugging scenario', '', m['drill'], '', 'Injected defects belong only in disposable copies with synthetic data and external effects disabled.', '',
              '## If stuck', '', m['remediation'], '', '## Readiness', '', m['readiness'], '',
              'Keep small-exercise records to three lines: intention; result/artifact; help/next gap. Portfolio work also needs a plan, review and handoff.', '', '## Targeted references', '']
    lines += [f'- [{r["title"]}]({r["url"]}) — use the sections named in guided practice, then return to the task.' for r in m['resources']]
    (OUT / f'{m["code"]}.md').write_text('\n'.join(lines)+'\n', encoding='utf-8', newline='\n')
print(f'Generated {len(modules)} modules / {sum(len(m["tickets"]) for m in modules)} tasks; learner evidence unchanged.')

# Preserve advanced guides while making their historical status unmistakable.
banner = '> Historical advanced platform reference. The active learner path is [START_HERE](START_HERE.md), U01–U12. These release targets are not required learning gates.\n\n'
for legacy in OUT.glob('M[0-9][0-9].md'):
    text = legacy.read_text(encoding='utf-8')
    if not text.startswith(banner):
        legacy.write_text(banner + text, encoding='utf-8', newline='\n')

public = OUT.parents[1] / 'apps/web/public/guides'
public.mkdir(parents=True, exist_ok=True)
for name in [m['code'] for m in modules] + ['FIRST_SESSION','START_HERE','ASSESSMENT','PROJECTS','MENTOR','PORTFOLIO','DRILLS','AGENT_ENGINEERING']:
    (public / f'{name}.md').write_text((OUT / f'{name}.md').read_text(encoding='utf-8'), encoding='utf-8', newline='\n')
