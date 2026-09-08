# Establishing honest boundaries

Signalpost's first implementation separates the ingest acknowledgement from parsing and transaction entry: the success response follows the completed transaction. A network failure after commit can still leave the sender uncertain; optional idempotency keys let it retry the same request without inserting a second copy. OTLP without such a key permits duplicates and does not provide exactly-once ingestion.

The query compiler derives tenant/project scope from a server-verified credential and parameterizes filters. Database RLS provides another boundary. Tests using a superuser alone would not demonstrate RLS, so the isolation exercise switches to a restricted role and checks connection-scope reset.

Timescale's documented RLS restriction on continuous-aggregate sources required a separate decision: an inaccessible aggregate source receives a transactional mirror while user-queryable raw data retains RLS. This adds write amplification and requires real Timescale verification; it is not a measured performance win.

The accompanying bootcamp keeps learner evidence separate from generated code. All personal skill ratings remain unassessed. See the final run file for observed test results and OPEN_THREADS for the unimplemented project scope.
