import { describe, it, expect, afterEach } from "vitest";
import fc from "fast-check";
import { compileQuery } from "../packages/core/query";
import { decodeOtlp } from "../packages/core/otlp";
import { fixture, payload } from "./helpers";
const close: (() => Promise<void>)[] = [];
afterEach(async () => {
  for (const f of close.splice(0)) await f();
});
const q = {
  signal: "logs",
  from: "2026-01-01T00:00:00Z",
  to: "2026-01-02T00:00:00Z",
};
describe("query compiler", () => {
  it("never interpolates arbitrary label values", () =>
    fc.assert(
      fc.property(fc.string(), (value) => {
        const query = compileQuery(
          { ...q, labels: { source: value.slice(0, 512) } },
          "org",
          "project",
        );
        expect(query.values[4]).toBe(
          JSON.stringify({ source: value.slice(0, 512) }),
        );
        expect(query.text).toContain("labels @> $5::jsonb");
        expect(query.values.slice(0, 2)).toEqual(["org", "project"]);
      }),
    ));
  it("rejects forged tenant fields and arbitrary tables", () => {
    expect(() =>
      compileQuery({ ...q, orgId: "other" }, "org", "project"),
    ).toThrow();
    expect(() =>
      compileQuery({ ...q, signal: "logs; DROP TABLE logs" }, "org", "project"),
    ).toThrow();
  });
  it("bounds rows and time range", () => {
    expect(() =>
      compileQuery({ ...q, limit: 5001 }, "org", "project"),
    ).toThrow();
    expect(() =>
      compileQuery({ ...q, to: q.from }, "org", "project"),
    ).toThrow();
  });
});
describe("OTLP boundaries", () => {
  it("preserves log bodies as data", () => {
    expect(
      decodeOtlp("logs", payload("<script>alert(1)</script>"))[0]?.body,
    ).toBe("<script>alert(1)</script>");
  });
  it("rejects unsupported metric batches instead of silently dropping points", () => {
    expect(() =>
      decodeOtlp("metrics", {
        resourceMetrics: [
          {
            scopeMetrics: [
              {
                metrics: [{ name: "duration", histogram: { dataPoints: [] } }],
              },
            ],
          },
        ],
      }),
    ).toThrow(/gauge/);
  });
  it("rejects future timestamp poisoning", () => {
    const p = payload();
    p.resourceLogs[0]!.scopeLogs[0]!.logRecords[0]!.timeUnixNano = (
      BigInt(Date.now() + 86400000) * 1000000n
    ).toString();
    expect(() => decodeOtlp("logs", p)).toThrow(/Timestamp/);
  });
  it("rejects unsafe metric precision", () => {
    expect(() =>
      decodeOtlp("metrics", {
        resourceMetrics: [
          {
            scopeMetrics: [
              {
                metrics: [
                  {
                    name: "m",
                    gauge: {
                      dataPoints: [
                        { timeUnixNano: "0", asInt: "9007199254740993" },
                      ],
                    },
                  },
                ],
              },
            ],
          },
        ],
      }),
    ).toThrow(/precision/);
  });
});
describe("database invariants", () => {
  it("enforces RLS independently of query compiler and resets transaction scope", async () => {
    const f = await fixture();
    close.push(f.db.close);
    await f.engine.exec(
      "CREATE ROLE restricted NOBYPASSRLS; GRANT USAGE ON SCHEMA public TO restricted; GRANT SELECT,INSERT ON logs TO restricted;",
    );
    await f.engine.query(
      "INSERT INTO logs(org_id,project_id,event_time,labels,body,severity) VALUES($1,$2,now(),'{}','\"private\"','INFO')",
      [f.org, f.project],
    );
    await f.engine.exec("SET ROLE restricted");
    expect((await f.db.query("SELECT * FROM logs")).rows).toHaveLength(0);
    expect(
      (await f.db.transaction(f.org, (sql) => sql.query("SELECT * FROM logs")))
        .rows,
    ).toHaveLength(1);
    expect((await f.db.query("SELECT * FROM logs")).rows).toHaveLength(0);
    expect(
      (
        await f.db.transaction("00000000-0000-4000-8000-000000000099", (sql) =>
          sql.query("SELECT * FROM logs"),
        )
      ).rows,
    ).toHaveLength(0);
  });
  it("prevents audit updates, deletes and truncation", async () => {
    const f = await fixture();
    close.push(f.db.close);
    await f.db.query(
      "INSERT INTO audit_events(id,org_id,actor,action,target_id,details) VALUES(gen_random_uuid(),$1,'test','change',$2,'{}')",
      [f.org, f.project],
    );
    for (const sql of [
      "UPDATE audit_events SET action='hidden'",
      "DELETE FROM audit_events",
      "TRUNCATE audit_events",
    ])
      await expect(f.db.query(sql)).rejects.toThrow(/append-only/);
    expect((await f.db.query("SELECT * FROM audit_events")).rows).toHaveLength(
      1,
    );
  });
  it("enforces page uniqueness even after acknowledgement", async () => {
    const f = await fixture();
    close.push(f.db.close);
    const rule = "00000000-0000-4000-8000-000000000010",
      episode = "00000000-0000-4000-8000-000000000011";
    await f.db.query(
      "INSERT INTO alert_rules(id,org_id,project_id,name,metric_name,threshold,for_seconds) VALUES($1,$2,$3,'r','cpu',80,0)",
      [rule, f.org, f.project],
    );
    await f.db.query(
      "INSERT INTO pages(id,org_id,rule_id,episode_id,step,responder,state) VALUES(gen_random_uuid(),$1,$2,$3,0,'test','acknowledged')",
      [f.org, rule, episode],
    );
    await expect(
      f.db.query(
        "INSERT INTO pages(id,org_id,rule_id,episode_id,step,responder) VALUES(gen_random_uuid(),$1,$2,$3,0,'test')",
        [f.org, rule, episode],
      ),
    ).rejects.toThrow(/unique/);
  });
});
