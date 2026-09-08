import { z } from "zod";
const attribute = z.object({
  key: z.string().min(1).max(128),
  value: z.record(z.string(), z.unknown()),
});
const attributes = z.array(attribute).max(64).default([]);
const recordBase = z.object({
  timeUnixNano: z
    .union([z.string().regex(/^\d{1,20}$/), z.number().int().nonnegative()])
    .default("0"),
  attributes,
});
const log = recordBase.extend({
  body: z.record(z.string(), z.unknown()).default({}),
  severityText: z.string().max(64).default("UNSPECIFIED"),
  traceId: z
    .string()
    .regex(/^[a-fA-F0-9]{32}$/)
    .optional(),
});
const point = recordBase.extend({
  asDouble: z.number().finite().optional(),
  asInt: z.union([z.string().regex(/^-?\d+$/), z.number().int()]).optional(),
});
const metric = z.object({
  name: z.string().min(1).max(256),
  gauge: z.object({ dataPoints: z.array(point) }).optional(),
  sum: z.unknown().optional(),
  histogram: z.unknown().optional(),
  exponentialHistogram: z.unknown().optional(),
  summary: z.unknown().optional(),
});
const span = recordBase
  .omit({ timeUnixNano: true })
  .extend({
    startTimeUnixNano: z.string().regex(/^\d{1,20}$/),
    endTimeUnixNano: z.string().regex(/^\d{1,20}$/),
    name: z.string().max(512),
    traceId: z.string().regex(/^[a-fA-F0-9]{32}$/),
    spanId: z.string().regex(/^[a-fA-F0-9]{16}$/),
  });
const resource = z.object({ attributes }).default({ attributes: [] });
const envelope = {
  logs: z.object({
    resourceLogs: z
      .array(
        z.object({
          resource,
          scopeLogs: z
            .array(z.object({ logRecords: z.array(log).default([]) }))
            .default([]),
        }),
      )
      .default([]),
  }),
  metrics: z.object({
    resourceMetrics: z
      .array(
        z.object({
          resource,
          scopeMetrics: z
            .array(z.object({ metrics: z.array(metric).default([]) }))
            .default([]),
        }),
      )
      .default([]),
  }),
  traces: z.object({
    resourceSpans: z
      .array(
        z.object({
          resource,
          scopeSpans: z
            .array(z.object({ spans: z.array(span).default([]) }))
            .default([]),
        }),
      )
      .default([]),
  }),
};
export type Signal = keyof typeof envelope;
export interface TelemetryRecord {
  event_time: string;
  labels: Record<string, unknown>;
  body?: unknown;
  severity?: string;
  name?: string;
  value?: number;
  trace_id?: string;
  span_id?: string;
  duration_ms?: number;
}
function anyValue(value: Record<string, unknown>): unknown {
  if (Object.keys(value).length > 1)
    throw new Error("AnyValue must contain at most one value variant");
  if ("stringValue" in value && typeof value.stringValue === "string")
    return value.stringValue;
  if ("boolValue" in value && typeof value.boolValue === "boolean")
    return value.boolValue;
  if (
    "doubleValue" in value &&
    typeof value.doubleValue === "number" &&
    Number.isFinite(value.doubleValue)
  )
    return value.doubleValue;
  if ("intValue" in value && /^(?:-?\d+)$/.test(String(value.intValue)))
    return String(value.intValue);
  if ("bytesValue" in value && typeof value.bytesValue === "string")
    return { bytesValue: value.bytesValue };
  if (Object.keys(value).length === 0) return null;
  // Structured values are preserved verbatim as JSON; React renders them as text.
  if ("arrayValue" in value || "kvlistValue" in value) return value;
  throw new Error("Unsupported or invalid AnyValue");
}
function labels(items: z.infer<typeof attributes>): Record<string, unknown> {
  const result: Record<string, unknown> = Object.create(null) as Record<
    string,
    unknown
  >;
  for (const item of items) {
    if (Object.hasOwn(result, item.key))
      throw new Error("Duplicate attribute key");
    result[item.key] = anyValue(item.value);
  }
  return result;
}
function instant(raw: string | number, now: number): string {
  if (typeof raw === "number" && !Number.isSafeInteger(raw))
    throw new Error(
      "Nanosecond numbers must be safely representable; use decimal strings",
    );
  const ns = BigInt(raw);
  const ms = Number(ns / 1000000n);
  if (ns === 0n) return new Date(now).toISOString();
  if (ms > now + 300000 || ms < now - 31 * 86400000)
    throw new Error(
      "Timestamp outside supported window: past 31 days through future 5 minutes",
    );
  return new Date(ms)
    .toISOString()
    .replace(
      /\.\d{3}Z$/,
      `.${(ns % 1000000000n).toString().padStart(9, "0").slice(0, 6)}Z`,
    );
}
export function decodeOtlp(
  signal: Signal,
  input: unknown,
  now = Date.now(),
): TelemetryRecord[] {
  const result: TelemetryRecord[] = [];
  if (signal === "logs")
    for (const r of envelope.logs.parse(input).resourceLogs)
      for (const s of r.scopeLogs)
        for (const item of s.logRecords)
          result.push({
            event_time: instant(item.timeUnixNano, now),
            labels: {
              ...labels(r.resource.attributes),
              ...labels(item.attributes),
            },
            body: anyValue(item.body),
            severity: item.severityText,
            ...(item.traceId ? { trace_id: item.traceId.toLowerCase() } : {}),
          });
  if (signal === "metrics")
    for (const r of envelope.metrics.parse(input).resourceMetrics)
      for (const s of r.scopeMetrics)
        for (const m of s.metrics) {
          if (
            !m.gauge ||
            m.sum ||
            m.histogram ||
            m.exponentialHistogram ||
            m.summary
          )
            throw new Error(
              "Only numeric gauge metrics are supported; entire batch rejected",
            );
          for (const item of m.gauge.dataPoints) {
            if ((item.asInt === undefined) === (item.asDouble === undefined))
              throw new Error("Metric requires exactly one numeric value");
            const value = item.asDouble ?? Number(item.asInt);
            if (
              !Number.isFinite(value) ||
              (item.asInt !== undefined && !Number.isSafeInteger(value))
            )
              throw new Error("Metric integer exceeds safe precision");
            result.push({
              event_time: instant(item.timeUnixNano, now),
              labels: {
                ...labels(r.resource.attributes),
                ...labels(item.attributes),
              },
              name: m.name,
              value,
            });
          }
        }
  if (signal === "traces")
    for (const r of envelope.traces.parse(input).resourceSpans)
      for (const s of r.scopeSpans)
        for (const item of s.spans) {
          const duration =
            BigInt(item.endTimeUnixNano) - BigInt(item.startTimeUnixNano);
          if (duration < 0n) throw new Error("Span ends before it starts");
          instant(item.endTimeUnixNano, now);
          result.push({
            event_time: instant(item.startTimeUnixNano, now),
            labels: {
              ...labels(r.resource.attributes),
              ...labels(item.attributes),
            },
            name: item.name,
            trace_id: item.traceId.toLowerCase(),
            span_id: item.spanId.toLowerCase(),
            duration_ms: Number(duration) / 1000000,
          });
        }
  if (result.length > 5000) throw new Error("Batch exceeds 5000 records");
  return result;
}
