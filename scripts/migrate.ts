import { readFile } from "node:fs/promises";
import { createHash } from "node:crypto";
import pg from "pg";
const url = process.env.DATABASE_URL;
if (!url) throw new Error("DATABASE_URL (migration administrator) is required");
const client = new pg.Client({ connectionString: url });
await client.connect();
try {
  await client.query("SELECT pg_advisory_lock(76418291)");
  await client.query(
    "CREATE TABLE IF NOT EXISTS schema_migrations(name text PRIMARY KEY, checksum text NOT NULL, applied_at timestamptz NOT NULL DEFAULT now())",
  );
  for (const name of ["001_core.sql", "002_timescale.sql"]) {
    const sql = await readFile(
      new URL(`../db/migrations/${name}`, import.meta.url),
      "utf8",
    );
    const hash = createHash("sha256").update(sql).digest("hex");
    const prior = await client.query<{ checksum: string }>(
      "SELECT checksum FROM schema_migrations WHERE name=$1",
      [name],
    );
    if (prior.rows[0]) {
      if (prior.rows[0].checksum !== hash)
        throw new Error(`Applied migration ${name} changed`);
      console.log(`Already applied ${name}`);
      continue;
    }
    await client.query("BEGIN");
    try {
      await client.query(sql);
      await client.query(
        "INSERT INTO schema_migrations(name,checksum) VALUES($1,$2)",
        [name, hash],
      );
      await client.query("COMMIT");
      console.log(`Applied ${name}`);
    } catch (error) {
      await client.query("ROLLBACK");
      throw error;
    }
  }
} finally {
  await client.end();
}
