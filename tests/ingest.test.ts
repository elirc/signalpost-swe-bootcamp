import { describe, it, expect, afterEach } from "vitest";
import { gzipSync } from "node:zlib";
import { createIngestServer } from "../services/ingest/server";
import type { Database } from "../packages/core/db";
import { fixture, payload } from "./helpers";
const cleanup: (() => Promise<unknown>)[] = [];
afterEach(async () => {
  for (const f of cleanup.splice(0).reverse()) await f();
});
async function setup(dbOverride?: (db: Database) => Database, max = 2) {
  const f = await fixture();
  cleanup.push(f.db.close);
  const app = createIngestServer(
    dbOverride ? dbOverride(f.db) : f.db,
    { allow: async () => true },
    max,
  );
  cleanup.push(() => app.close());
  await app.ready();
  return {
    ...f,
    app,
    headers: {
      authorization: `Bearer ${f.token}`,
      "content-type": "application/json",
    },
  };
}
describe("ingestion acceptance", () => {
  it("accepts a valid log with an unset body and timestamp", async () => {
    const f = await setup();
    const result = await f.app.inject({
      method: "POST", url: "/v1/logs", headers: f.headers,
      payload: {resourceLogs: [{scopeLogs: [{logRecords: [{}]}]}]},
    });
    expect(result.statusCode).toBe(200);
    const rows = (await f.db.query("SELECT body, event_time FROM logs")).rows;
    expect(rows).toHaveLength(1);
    expect(rows[0]?.body).toBeNull();
    expect(rows[0]?.event_time).toBeTruthy();
  });
  it("persists before success and deduplicates explicit retries", async () => {
    const f = await setup();
    const data = payload();
    Object.assign(data.resourceLogs[0]!, { schemaUrl: "https://example.test/schema-preserved" });
    for (let i = 0; i < 2; i++)
      expect(
        (
          await f.app.inject({
            method: "POST",
            url: "/v1/logs",
            headers: { ...f.headers, "idempotency-key": "same" },
            payload: data,
          })
        ).statusCode,
      ).toBe(200);
    expect((await f.db.query("SELECT * FROM logs")).rows).toHaveLength(1);
    expect((await f.db.query("SELECT payload FROM ingest_batches")).rows[0]?.payload).toEqual(data);
    expect(
      (await f.db.query("SELECT record_count FROM ingest_batches")).rows[0]
        ?.record_count,
    ).toBe(1);
  });
  it("rejects changed content under a reused idempotency key", async () => {
    const f = await setup();
    await f.app.inject({
      method: "POST",
      url: "/v1/logs",
      headers: { ...f.headers, "idempotency-key": "same" },
      payload: payload("one"),
    });
    expect(
      (
        await f.app.inject({
          method: "POST",
          url: "/v1/logs",
          headers: { ...f.headers, "idempotency-key": "same" },
          payload: payload("two"),
        })
      ).statusCode,
    ).toBe(409);
    expect((await f.db.query("SELECT * FROM logs")).rows).toHaveLength(1);
  });
  it("never acknowledges a failed durable transaction", async () => {
    const f = await setup((db) => ({
      ...db,
      transaction: async () => {
        throw new Error("simulated disk failure");
      },
    }));
    const response = await f.app.inject({
      method: "POST",
      url: "/v1/logs",
      headers: f.headers,
      payload: payload(),
    });
    expect(response.statusCode).toBe(503);
    expect(response.headers["retry-after"]).toBe("2");
    expect(
      (await f.db.query("SELECT * FROM ingest_batches")).rows,
    ).toHaveLength(0);
  });
  it("returns pressure before capacity overflows and releases reservations", async () => {
    let release: () => void = () => {};
    const blocked = new Promise<void>((resolve) => {
      release = resolve;
    });
    let entered: () => void = () => {};
    const start = new Promise<void>((resolve) => {
      entered = resolve;
    });
    const f = await setup(
      (db) => ({
        ...db,
        transaction: async (org, work) => {
          entered();
          await blocked;
          return db.transaction(org, work);
        },
      }),
      1,
    );
    let settled = false;
    const first = f.app
      .inject({
        method: "POST",
        url: "/v1/logs",
        headers: f.headers,
        payload: payload(),
      })
      .then((r) => {
        settled = true;
        return r;
      });
    await start;
    expect(settled).toBe(false);
    const overloaded = await f.app.inject({
      method: "POST",
      url: "/v1/logs",
      headers: f.headers,
      payload: payload(),
    });
    expect(overloaded.statusCode).toBe(429);
    expect(overloaded.headers["retry-after"]).toBe("1");
    release();
    expect((await first).statusCode).toBe(200);
    expect((await f.app.inject("/health")).json().active).toBe(0);
  });
  it("supports gzip and rejects compression bombs", async () => {
    const f = await setup();
    const headers = { ...f.headers, "content-encoding": "gzip" };
    expect(
      (
        await f.app.inject({
          method: "POST",
          url: "/v1/logs",
          headers,
          payload: gzipSync(JSON.stringify(payload())),
        })
      ).statusCode,
    ).toBe(200);
    expect(
      (
        await f.app.inject({
          method: "POST",
          url: "/v1/logs",
          headers,
          payload: gzipSync(" ".repeat(2 * 1024 * 1024)),
        })
      ).statusCode,
    ).toBe(400);
  });
  it("fails closed for wrong scope, revocation, and limiter outages", async () => {
    const f = await setup();
    await f.db.query("UPDATE api_keys SET scope='read' WHERE id=$1", [f.key]);
    expect(
      (
        await f.app.inject({
          method: "POST",
          url: "/v1/logs",
          headers: f.headers,
          payload: payload(),
        })
      ).statusCode,
    ).toBe(401);
    await f.db.query(
      "UPDATE api_keys SET scope='ingest',revoked_at=now() WHERE id=$1",
      [f.key],
    );
    expect(
      (
        await f.app.inject({
          method: "POST",
          url: "/v1/logs",
          headers: f.headers,
          payload: payload(),
        })
      ).statusCode,
    ).toBe(401);
    await f.db.query("UPDATE api_keys SET revoked_at=NULL WHERE id=$1", [
      f.key,
    ]);
    const app = createIngestServer(f.db, {
      allow: async () => {
        throw new Error("offline");
      },
    });
    cleanup.push(() => app.close());
    expect(
      (
        await app.inject({
          method: "POST",
          url: "/v1/logs",
          headers: f.headers,
          payload: payload(),
        })
      ).statusCode,
    ).toBe(503);
  });
});
