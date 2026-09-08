# Projects that build skill

## U01–U03: small programs

Use `practice/learner`. Run one module's checks at a time; the starters intentionally fail. A working program, a short explain-back and a changed independent task matter more than adding features. No setup beyond the existing Node environment is required for U01/U02. U03 uses this repository's installed TypeScript/tsx tools.

## U04–U11: a personal task planner

This is your implementation, grown one boundary at a time. Keep it separate from the prepared Signalpost platform. Scope: projects, tasks, completion, basic search, due dates and role rules. Exclude billing, mobile apps, chat, microservices and infrastructure scale targets. Create the following files yourself as the module introduces them:

```text
practice/learner/planner/
  server.ts          HTTP boundary, loopback port 3430
  domain.ts          Task rules and input validation
  store.ts           Memory first; SQL in U05
  tests/             Your contract and integration checks
  web/               Next app introduced in U06, port 3431
  data/              Local database, ignored by Git
  README.md          Run, check, limits, recovery
```

From the repository root, run your server with:

```powershell
node --import tsx practice/learner/planner/server.ts
```

Installed Fastify, TypeScript, React, Next and PGlite resolve from this repository's `node_modules`; do not reinstall a second dependency stack. In guided U04, import Fastify, register a health route, then listen on `host: "127.0.0.1", port: 3430`. Use Fastify's `inject` method for HTTP-level tests and an actual local request for integration. Read [Fastify's getting started guide](https://fastify.dev/docs/latest/Guides/Getting-Started/) alongside local package types; limit reading to routes, validation, errors and testing as needed.

U05: `new PGlite("practice/learner/planner/data/tasks")` creates a file-backed local store when started from the root. Await readiness, close it on shutdown, parameterize query values, and own your migrations. Use only one process per data directory. For isolated tests use a fresh in-memory instance. The [PGlite docs](https://pglite.dev/docs/) describe the embedded runtime. This teaches SQL and persistence semantics, not production crash/network behavior. Copy a file-backed database only after closing it for the basic restore exercise.

U06: create `web/app/layout.tsx` with an HTML/body root, `web/app/page.tsx` and CSS. Start it using:

```powershell
node node_modules/next/dist/bin/next dev practice/learner/planner/web --hostname 127.0.0.1 --port 3431
```

Use a [Next development rewrite](https://nextjs.org/docs/app/api-reference/config/next-config-js/rewrites) from `/learner-api/:path*` to `http://127.0.0.1:3430/:path*`, so the browser can call its own origin without a permissive CORS workaround. This proxy is local development plumbing; explain it before use. Keep the portal on 3427 independent. Use React's [Quick Start](https://react.dev/learn), then its state and effect lessons as needed. Learn a plain HTML form and CSS first.

Add a learner `tsconfig.json` extending the root configuration, with paths relative to that file and include patterns covering your code/tests. U03's supplied config is a small example. Run tests with Node's test runner and `--import tsx`; keep their filenames out of the product suite's `tests/` directory. You decide implementation details within each module's concrete acceptance contract.

The U07 identity seam is server-controlled, synthetic and local. It tests authorization rules, not real authentication. Do not expose browser-supplied principal IDs as a sign-in mechanism. Before sharing private data outside local practice, implement and review an established authentication/session integration separately.

## U11: ambiguity cards

Card A: “Reminders must be instant and nothing can be lost.” Write down the useful user outcome, allowed delay, retries, cancellation, timezone policy and unverified assumptions. Compare polling and a durable worker. Use only a synthetic local sink for the spike.

Card B: “Owners must export and delete data.” Inventory primary rows, event history, exports, backups and aggregates. State what happens on failure and who can invoke the action. Seek the applicable organizational/legal retention policy instead of inventing one. This is a design exercise, not legal guidance.

## U12: a room-booking system in a second domain

Build this in `practice/learner/booking/` with your own brief and implementation. Reuse familiar tools, not the planner's domain code.

- Rooms have stable IDs and a name. Bookings have room, owner, UTC start/end and status. Require start < end; use half-open intervals [start,end), so adjacent bookings are allowed.
- Create and list bookings. Two active bookings for the same room must not overlap, including one interval completely enclosing another. Different rooms may overlap. Test simultaneous attempts against your chosen constraint/transaction policy; do not claim concurrency coverage from sequential tests.
- An owner can cancel their booking; another user cannot. Check authority on direct API calls. Repeated cancellation is safe; canceled bookings no longer block a slot.
- Provide a usable labeled booking form, loading/empty/error states and preserved input after rejection. Store and display a clear timezone policy.
- Persist bookings, show failed-write behavior, supply migration and recovery instructions, and let another reader run the checks. Use the same explicit local authentication limits as U07 unless real authentication is implemented and reviewed.

Changed requirement for independent transfer: rooms can close for maintenance intervals. Decide how existing bookings and future requests behave, record assumptions, then implement the smallest coherent change. Explain it before opening the old planner code.

Definition of done: observed acceptance, independent explanation, changed requirement, reviewable commit, reproducible setup and honest limits. A human maintenance/review cycle remains pending until it actually happens. A local demonstration cannot certify senior-level employment readiness.
