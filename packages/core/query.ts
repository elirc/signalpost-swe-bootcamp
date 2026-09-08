import { z } from "zod";
const scalar = z.union([z.string().max(512), z.number().finite(), z.boolean()]);
export const querySchema = z
  .object({
    signal: z.enum(["logs", "metrics", "traces"]),
    from: z.iso.datetime({ offset: true }),
    to: z.iso.datetime({ offset: true }),
    labels: z.record(z.string().min(1).max(128), scalar).default({}),
    metric: z.string().max(256).optional(),
    traceId: z
      .string()
      .regex(/^[a-f0-9]{32}$/)
      .optional(),
    limit: z.number().int().min(1).max(5000).default(200),
  })
  .strict()
  .refine(
    (q) =>
      Date.parse(q.to) > Date.parse(q.from) &&
      Date.parse(q.to) - Date.parse(q.from) <= 31 * 86400000,
    "Time range must be positive and at most 31 days",
  )
  .refine((q) => Object.keys(q.labels).length <= 20, "At most 20 labels");
export type Query = z.infer<typeof querySchema>;
export function compileQuery(
  input: unknown,
  orgId: string,
  projectId: string,
): { text: string; values: unknown[] } {
  const q = querySchema.parse(input);
  const table = { logs: "logs", metrics: "metric_samples", traces: "spans" }[
    q.signal
  ];
  const columns = {
    logs: "event_time, severity, body, labels, trace_id",
    metrics: "event_time, name, value, labels",
    traces: "event_time, name, trace_id, span_id, duration_ms, labels",
  }[q.signal];
  const values: unknown[] = [
    orgId,
    projectId,
    q.from,
    q.to,
    JSON.stringify(q.labels),
  ];
  let text = `SELECT ${columns} FROM ${table} WHERE org_id = $1 AND project_id = $2 AND event_time >= $3 AND event_time < $4 AND labels @> $5::jsonb`;
  if (q.metric) {
    if (q.signal !== "metrics")
      throw new Error("metric filter requires metrics");
    values.push(q.metric);
    text += ` AND name = $${values.length}`;
  }
  if (q.traceId) {
    if (q.signal !== "traces") throw new Error("trace filter requires traces");
    values.push(q.traceId);
    text += ` AND trace_id = $${values.length}`;
  }
  values.push(q.limit);
  text += ` ORDER BY event_time DESC LIMIT $${values.length}`;
  return { text, values };
}
