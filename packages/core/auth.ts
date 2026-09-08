import { createHash } from "node:crypto";
import type { Sql } from "./db";
export interface Principal {
  keyId: string;
  orgId: string;
  projectId: string;
  scope: "ingest" | "read" | "admin";
}
export const hashToken = (token: string): string =>
  createHash("sha256").update(token).digest("hex");
export async function authenticate(
  db: Sql,
  header: string | undefined,
  allowed: Principal["scope"][],
): Promise<Principal | null> {
  if (!header?.startsWith("Bearer ") || header.length > 256) return null;
  const { rows } = await db.query<{
    id: string;
    org_id: string;
    project_id: string;
    scope: Principal["scope"];
  }>(
    "SELECT id, org_id, project_id, scope FROM api_keys WHERE token_hash = $1 AND revoked_at IS NULL",
    [hashToken(header.slice(7))],
  );
  const key = rows[0];
  return key && allowed.includes(key.scope)
    ? {
        keyId: key.id,
        orgId: key.org_id,
        projectId: key.project_id,
        scope: key.scope,
      }
    : null;
}
