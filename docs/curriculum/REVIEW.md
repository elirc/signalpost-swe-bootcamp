# Review and redesign — 2026-09-07

The original program was a demanding observability-platform specification with a learning process attached. For an uncalibrated novice/junior, the sequencing and assessment burden did not support the user's sole goal of personal upskilling. These are findings about the materials, not a diagnosis of the learner.

| Finding | Consequence | Revision |
| --- | --- | --- |
| Unfamiliar service/concurrency diagnosis preceded fundamentals | Starting tasks assumed skills that had never been taught or demonstrated | Beginner-safe U01 and optional evidence-based challenge-out |
| Thin lessons and large delivery tickets | A learner could finish agent-assisted code without acquiring transferable reasoning | Worked examples, guided practice, independent tasks, changed examples and remediation in every module |
| Several runtimes and infrastructure systems arrived early | Setup and context switching could consume the learning budget | JavaScript → TypeScript → HTTP/SQL → React; advanced platform remains optional |
| Fixed drills and per-ticket ceremony | Recordkeeping competed with novice practice | Three-line small-session records; fuller reviews at portfolio gates |
| Platform throughput/release targets dominated | Engineering output could look like personal progress | Behavioral gates for fundamentals, independent delivery and senior responsibilities |
| One project and immediate explain-back | Memorization and familiarity could masquerade as retained skill | Delayed changed tasks and a room-booking capstone in a second domain |
| Senior endpoint lacked sufficient contextual evidence | A solo curriculum could overstate readiness | Explicit real collaboration, ambiguity, maintenance and sustained-ownership evidence, judged for a particular role |

The resulting active path has 12 modules and 48 tasks. Each module contains instruction, a different-domain worked example, guided steps, concrete acceptance, independent practice, feedback, delayed transfer and a smaller remedy for getting stuck. Three starting labs and an in-memory SQL console make the first steps locally runnable. No learner implementation or assessment was fabricated.

This is a curriculum design judgment, not a claim that these exact intervals or hour allocations are scientifically validated. Primary technical references anchor the topics: [MDN JavaScript](https://developer.mozilla.org/en-US/docs/Learn_web_development/Core/Scripting), [TypeScript handbook](https://www.typescriptlang.org/docs/handbook/intro.html), [React Quick Start](https://react.dev/learn), [PostgreSQL tutorial](https://www.postgresql.org/docs/current/tutorial.html), [Node test runner](https://nodejs.org/docs/latest-v24.x/api/test.html) and [Pro Git](https://git-scm.com/book/en/v2). The web portions of MDN assume HTML/CSS; U01 uses language-only examples and U06 explicitly teaches those browser prerequisites before React. References are reading aids, not replacement courses to complete in full.

Original program and M00–M12 guides remain historical advanced reference; their JSON is preserved in archive/program-v1.json. New U identifiers prevent old journal entries from being misattributed. Original backend evidence remains in run 0001. Backend release work is deferred under the user's latest instruction.
