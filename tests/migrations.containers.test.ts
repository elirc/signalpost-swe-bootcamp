import {
  PostgreSqlContainer,
  type StartedPostgreSqlContainer,
} from "@testcontainers/postgresql";
import { beforeAll, afterAll, it, expect } from "vitest";
import pg from "pg";
import { readFileSync } from "node:fs";
let container: StartedPostgreSqlContainer;
let client: pg.Client;
beforeAll(async () => {
  container = await new PostgreSqlContainer("timescale/timescaledb:2.22.1-pg17")
    .withDatabase("signalpost")
    .start();
  client = new pg.Client({ connectionString: container.getConnectionUri() });
  await client.connect();
});
afterAll(async () => {
  await client?.end();
  await container?.stop();
});
it("upgrades seeded core storage to Timescale and private aggregates", async () => {
  await client.query(readFileSync("db/migrations/001_core.sql", "utf8"));
  await client.query(
    "INSERT INTO organizations VALUES('00000000-0000-4000-8000-000000000001','test'); INSERT INTO projects VALUES('00000000-0000-4000-8000-000000000002','00000000-0000-4000-8000-000000000001','test'); INSERT INTO metric_samples(org_id,project_id,event_time,labels,name,value) VALUES('00000000-0000-4000-8000-000000000001','00000000-0000-4000-8000-000000000002',now()-interval '2 hours','{}','cpu',80)",
  );
  await client.query(readFileSync("db/migrations/002_timescale.sql", "utf8"));
  await client.query(readFileSync("db/roles.sql", "utf8"));
  expect(
    (await client.query("SELECT count(*)::int AS n FROM metric_samples"))
      .rows[0].n,
  ).toBe(1);
  expect(
    (
      await client.query(
        "SELECT count(*)::int AS n FROM analytics.metric_source",
      )
    ).rows[0].n,
  ).toBe(1);
  await client.query(
    "CALL refresh_continuous_aggregate('analytics.metric_hourly',now()-interval '1 day',now()-interval '1 hour')",
  );
  expect(
    (await client.query("SELECT total FROM analytics.metric_hourly")).rows[0]
      .total,
  ).toBe(80);
  await client.query("SET ROLE signalpost_query");
  await expect(
    client.query("SELECT * FROM analytics.metric_source"),
  ).rejects.toThrow(/permission/);
  expect(
    (await client.query("SELECT * FROM metric_samples")).rows,
  ).toHaveLength(0);
  await client.query("RESET ROLE");
});
it("documents and exercises core recovery through a fresh database", async () => {
  // Dump only public schema for baseline recovery. Full Timescale restore is a separate operational gate.
  const dumped = await container.exec([
    "pg_dump",
    "-U",
    container.getUsername(),
    "-d",
    "signalpost",
    "--schema-only",
    "--schema=public",
    "-f",
    "/tmp/public-schema.sql",
  ]);
  expect(dumped.exitCode).toBe(0);
  const dump = await container.exec([
    "pg_dump",
    "-U",
    container.getUsername(),
    "-d",
    "signalpost",
    "--data-only",
    "--table=public.organizations",
    "--table=public.projects",
    "-f",
    "/tmp/core-data.sql",
  ]);
  expect(dump.exitCode).toBe(0);
  await client.query("CREATE DATABASE recovery");
  const restored = new pg.Client({
    connectionString: container
      .getConnectionUri()
      .replace("/signalpost", "/recovery"),
  });
  await restored.connect();
  try {
    await restored.query(readFileSync("db/migrations/001_core.sql", "utf8"));
    const result = await container.exec([
      "psql",
      "-U",
      container.getUsername(),
      "-d",
      "recovery",
      "-v",
      "ON_ERROR_STOP=1",
      "-f",
      "/tmp/core-data.sql",
    ]);
    expect(result.exitCode).toBe(0);
    expect(
      (await restored.query("SELECT count(*)::int AS n FROM organizations"))
        .rows[0].n,
    ).toBe(1);
  } finally {
    await restored.end();
  }
});
