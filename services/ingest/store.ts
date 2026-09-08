import type { Database } from "../../packages/core/db";
import type { Principal } from "../../packages/core/auth";
import type { Signal, TelemetryRecord } from "../../packages/core/otlp";
export class IdempotencyConflict extends Error {}
export async function storeBatch(
  db: Database,
  principal: Principal,
  signal: Signal,
  records: TelemetryRecord[],
  requestId: string,
  payloadHash: string,
  rawPayload: unknown,
): Promise<void> {
  await db.transaction(principal.orgId, async (sql) => {
    const inserted = await sql.query(
      "INSERT INTO ingest_batches(org_id,key_id,request_id,payload_hash,record_count,payload) VALUES($1,$2,$3,$4,$5,$6::jsonb) ON CONFLICT DO NOTHING RETURNING request_id",
      [
        principal.orgId,
        principal.keyId,
        requestId,
        payloadHash,
        records.length,
        JSON.stringify(rawPayload),
      ],
    );
    if (!inserted.rows.length) {
      const existing = await sql.query(
        "SELECT payload_hash FROM ingest_batches WHERE key_id=$1 AND request_id=$2",
        [principal.keyId, requestId],
      );
      if (existing.rows[0]?.payload_hash !== payloadHash)
        throw new IdempotencyConflict(
          "Idempotency key reused with different content",
        );
      return;
    }
    const definitions = {
      logs: [
        "logs",
        "event_time, labels, body, severity, trace_id",
        "event_time timestamptz, labels jsonb, body jsonb, severity text, trace_id text",
      ],
      metrics: [
        "metric_samples",
        "event_time, labels, name, value",
        "event_time timestamptz, labels jsonb, name text, value double precision",
      ],
      traces: [
        "spans",
        "event_time, labels, name, trace_id, span_id, duration_ms",
        "event_time timestamptz, labels jsonb, name text, trace_id text, span_id text, duration_ms double precision",
      ],
    } as const;
    const [table, fields, schema] = definitions[signal];
    if (records.length)
      await sql.query(
        `INSERT INTO ${table}(org_id,project_id,${fields}) SELECT $1::uuid,$2::uuid,${fields} FROM jsonb_to_recordset($3::jsonb) AS batch(${schema})`,
        [principal.orgId, principal.projectId, JSON.stringify(records)],
      );
  });
}
