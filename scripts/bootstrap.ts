import { randomBytes, randomUUID } from "node:crypto";
import { database } from "../packages/core/db";
import { hashToken } from "../packages/core/auth";
const url = process.env.DATABASE_URL;
if (!url) throw new Error("DATABASE_URL is required");
const db = database(url);
const org = randomUUID();
const project = randomUUID();
const ingest = randomBytes(32).toString("base64url");
const read = randomBytes(32).toString("base64url");
try {
  await db.transaction(org, async (sql) => {
    await sql.query("INSERT INTO organizations(id,name) VALUES($1,$2)", [
      org,
      "Local synthetic organization",
    ]);
    await sql.query("INSERT INTO projects(id,org_id,name) VALUES($1,$2,$3)", [
      project,
      org,
      "Synthetic application",
    ]);
    for (const [scope, token] of [
      ["ingest", ingest],
      ["read", read],
    ] as const)
      await sql.query(
        "INSERT INTO api_keys(id,org_id,project_id,token_hash,scope) VALUES($1,$2,$3,$4,$5)",
        [randomUUID(), org, project, hashToken(token), scope],
      );
    await sql.query(
      "INSERT INTO retention_policies(org_id,raw_days,aggregate_days) VALUES($1,7,90)",
      [org],
    );
  });
  console.log(
    "Created local synthetic org/project. These newly generated credentials are shown once; store locally, never in Git.",
  );
  console.log(
    JSON.stringify(
      { org, project, ingestToken: ingest, readToken: read },
      null,
      2,
    ),
  );
} finally {
  await db.close();
}
