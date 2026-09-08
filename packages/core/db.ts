import pg from "pg";
export type Row = Record<string, unknown>;
export interface Sql {
  query<T extends Row = Row>(
    text: string,
    values?: unknown[],
  ): Promise<{ rows: T[]; rowCount?: number | null }>;
}
export interface Database extends Sql {
  transaction<T>(orgId: string, work: (sql: Sql) => Promise<T>): Promise<T>;
  close(): Promise<void>;
}
export function database(url: string): Database {
  const pool = new pg.Pool({
    connectionString: url,
    max: 20,
    connectionTimeoutMillis: 3000,
    statement_timeout: 10000,
  });
  return {
    query: (text, values) => pool.query(text, values),
    async transaction(orgId, work) {
      const client = await pool.connect();
      try {
        await client.query("BEGIN");
        await client.query("SELECT set_config('app.org_id', $1, true)", [
          orgId,
        ]);
        const result = await work(client);
        await client.query("COMMIT");
        return result;
      } catch (error) {
        await client.query("ROLLBACK");
        throw error;
      } finally {
        client.release();
      }
    },
    close: () => pool.end(),
  };
}
