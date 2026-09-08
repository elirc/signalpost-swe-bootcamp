import { PGlite } from "@electric-sql/pglite";
import { readFileSync } from "node:fs";
import { randomUUID } from "node:crypto";
import { hashToken } from "../packages/core/auth";
import type { Database, Sql, Row } from "../packages/core/db";
export async function fixture() {
  const engine = new PGlite();
  await engine.exec(readFileSync("db/migrations/001_core.sql", "utf8"));
  const org = randomUUID(),
    project = randomUUID(),
    key = randomUUID();
  const token = "synthetic-secret-".repeat(3);
  await engine.query("INSERT INTO organizations(id,name) VALUES($1,$2)", [
    org,
    "Test",
  ]);
  await engine.query("INSERT INTO projects(id,org_id,name) VALUES($1,$2,$3)", [
    project,
    org,
    "Test",
  ]);
  await engine.query(
    "INSERT INTO api_keys(id,org_id,project_id,token_hash,scope) VALUES($1,$2,$3,$4,$5)",
    [key, org, project, hashToken(token), "ingest"],
  );
  const db: Database = {
    query: <T extends Row>(text: string, values?: unknown[]) =>
      engine.query<T>(text, values),
    transaction: async (orgId, work) =>
      engine.transaction(async (tx) => {
        await tx.query("SELECT set_config('app.org_id',$1,true)", [orgId]);
        return work({
          query: <T extends Row>(text: string, values?: unknown[]) =>
            tx.query<T>(text, values),
        } satisfies Sql);
      }),
    close: () => engine.close(),
  };
  return { engine, db, org, project, key, token };
}
export const payload = (message = "hello") => ({
  resourceLogs: [
    {
      resource: {
        attributes: [{ key: "service.name", value: { stringValue: "test" } }],
      },
      scopeLogs: [
        {
          logRecords: [
            {
              timeUnixNano: (BigInt(Date.now()) * 1000000n).toString(),
              body: { stringValue: message },
              severityText: "INFO",
            },
          ],
        },
      ],
    },
  ],
});
