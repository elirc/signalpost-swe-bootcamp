import { database, type Database } from "../../../../../packages/core/db";
import { authenticate } from "../../../../../packages/core/auth";
import { compileQuery } from "../../../../../packages/core/query";
export const runtime = "nodejs";
let db: Database | undefined;
export async function POST(request: Request) {
  if (!process.env.QUERY_DATABASE_URL)
    return Response.json(
      { message: "Query database is not configured" },
      { status: 503 },
    );
  db ??= database(process.env.QUERY_DATABASE_URL);
  try {
    const principal = await authenticate(
      db,
      request.headers.get("authorization") ?? undefined,
      ["read", "admin"],
    );
    if (!principal)
      return Response.json(
        { message: "Read credential required" },
        { status: 401 },
      );
    const reader = request.body?.getReader();
    const parts: Uint8Array[] = [];
    let size = 0;
    if (reader) {
      for (;;) {
        const chunk = await reader.read();
        if (chunk.done) break;
        size += chunk.value.length;
        if (size > 16384) {
          await reader.cancel();
          return Response.json({ message: "Query too large" }, { status: 413 });
        }
        parts.push(chunk.value);
      }
    }
    const text = Buffer.concat(parts).toString("utf8");
    let query;
    try {
      query = compileQuery(
        JSON.parse(text) as unknown,
        principal.orgId,
        principal.projectId,
      );
    } catch {
      return Response.json({ message: "Invalid query" }, { status: 400 });
    }
    const result = await db.transaction(principal.orgId, (sql) =>
      sql.query(query.text, query.values),
    );
    return Response.json(
      { rows: result.rows },
      { headers: { "Cache-Control": "no-store" } },
    );
  } catch {
    return Response.json(
      { message: "Query service unavailable" },
      { status: 503 },
    );
  }
}
