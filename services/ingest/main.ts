import { NodeSDK } from "@opentelemetry/sdk-node";
import { getNodeAutoInstrumentations } from "@opentelemetry/auto-instrumentations-node";
import { OTLPTraceExporter } from "@opentelemetry/exporter-trace-otlp-http";
const endpoint = process.env.OTEL_EXPORTER_OTLP_ENDPOINT;
const sdk = endpoint
  ? new NodeSDK({
      traceExporter: new OTLPTraceExporter({
        url: `${endpoint.replace(/\/$/, "")}/v1/traces`,
      }),
      instrumentations: [getNodeAutoInstrumentations()],
    })
  : null;
sdk?.start();
const { database } = await import("../../packages/core/db");
const { redisLimiter } = await import("./rate-limit");
const { createIngestServer } = await import("./server");
const url = process.env.INGEST_DATABASE_URL;
const redisUrl = process.env.REDIS_URL;
if (!url || !redisUrl)
  throw new Error(
    "INGEST_DATABASE_URL and REDIS_URL are required; use a restricted database role",
  );
const db = database(url);
const rate = redisLimiter(
  redisUrl,
  Number(process.env.INGEST_REQUESTS_PER_MINUTE ?? 120),
);
const app = createIngestServer(
  db,
  rate.limiter,
  Number(process.env.INGEST_MAX_CONCURRENT ?? 16),
);
await app.listen({
  port: Number(process.env.INGEST_PORT ?? 4318),
  host: process.env.INGEST_HOST ?? "127.0.0.1",
});
let stopping = false;
async function shutdown() {
  if (stopping) return;
  stopping = true;
  await app.close();
  rate.close();
  await db.close();
  await sdk?.shutdown();
}
process.once("SIGTERM", () => {
  void shutdown();
});
process.once("SIGINT", () => {
  void shutdown();
});
