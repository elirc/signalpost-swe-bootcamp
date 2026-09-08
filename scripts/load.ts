import { randomUUID } from "node:crypto";
import { writeFile, mkdir } from "node:fs/promises";
const token = process.env.SIGNALPOST_INGEST_TOKEN;
if (!token) throw new Error("SIGNALPOST_INGEST_TOKEN required");
const endpoint = process.env.SIGNALPOST_INGEST_URL ?? "http://127.0.0.1:4318";
if (!new URL(endpoint).hostname.match(/^(127\.0\.0\.1|localhost|\[::1\])$/))
  throw new Error("Load harness only targets loopback");
const total = Number(process.env.LOAD_REQUESTS ?? 240);
if (!Number.isInteger(total) || total < 1 || total > 100000)
  throw new Error("LOAD_REQUESTS must be 1..100000");
const results: {
  id: string;
  status: number | null;
  ms: number;
  outcome: string;
}[] = [];
let next = 0;
await Promise.all(
  Array.from({ length: 16 }, async () => {
    while (next < total) {
      const i = next++;
      const id = randomUUID();
      const start = performance.now();
      try {
        const response = await fetch(`${endpoint}/v1/logs`, {
          method: "POST",
          signal: AbortSignal.timeout(15000),
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
            "Idempotency-Key": id,
          },
          body: JSON.stringify({
            resourceLogs: [
              {
                scopeLogs: [
                  {
                    logRecords: [
                      {
                        timeUnixNano: (
                          BigInt(Date.now()) * 1000000n
                        ).toString(),
                        body: { stringValue: `load:${i}:${id}` },
                      },
                    ],
                  },
                ],
              },
            ],
          }),
        });
        await response.arrayBuffer();
        results.push({
          id,
          status: response.status,
          ms: performance.now() - start,
          outcome: response.ok
            ? "success"
            : response.status === 503
              ? "uncertain-or-unavailable"
              : "explicit-rejection",
        });
      } catch {
        results.push({
          id,
          status: null,
          ms: performance.now() - start,
          outcome: "uncertain",
        });
      }
    }
  }),
);
const latency = results
  .filter((r) => r.outcome === "success")
  .map((r) => r.ms)
  .sort((a, b) => a - b);
await mkdir("artifacts", { recursive: true });
await writeFile(
  "artifacts/load.json",
  JSON.stringify(
    {
      timestamp: new Date().toISOString(),
      total,
      p95: latency.length
        ? latency[Math.ceil(latency.length * 0.95) - 1]
        : null,
      results,
    },
    null,
    2,
  ),
);
console.log({
  attempted: total,
  success: latency.length,
  rejected: results.filter((r) => r.outcome === "explicit-rejection").length,
  uncertain: results.filter((r) => r.outcome.startsWith("uncertain")).length,
  p95: latency.length ? latency[Math.ceil(latency.length * 0.95) - 1] : null,
});
console.log(
  "Storage reconciliation is required before claiming zero silent loss. This bounded request test does not establish M7 throughput.",
);
