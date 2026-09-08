import { randomUUID } from "node:crypto";
const token = process.env.SIGNALPOST_INGEST_TOKEN;
if (!token) throw new Error("SIGNALPOST_INGEST_TOKEN is required");
const endpoint = process.env.SIGNALPOST_INGEST_URL ?? "http://127.0.0.1:4318";
const result = await fetch(`${endpoint}/v1/logs`, {
  method: "POST",
  headers: {
    Authorization: `Bearer ${token}`,
    "Content-Type": "application/json",
    "Idempotency-Key": randomUUID(),
  },
  body: JSON.stringify({
    resourceLogs: [
      {
        resource: {
          attributes: [
            { key: "service.name", value: { stringValue: "synthetic-demo" } },
          ],
        },
        scopeLogs: [
          {
            logRecords: [
              {
                timeUnixNano: (BigInt(Date.now()) * 1000000n).toString(),
                severityText: "INFO",
                body: {
                  stringValue: "Signalpost durable ingestion demonstration",
                },
              },
            ],
          },
        ],
      },
    ],
  }),
});
console.log(result.status, await result.text());
if (!result.ok) process.exitCode = 1;
