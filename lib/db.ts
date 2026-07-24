import { Pool, type QueryResultRow } from 'pg';

// Single pooled Postgres connection (Supabase or any standard Postgres
// host). Cached on `globalThis` so Next.js dev-mode hot reloads, and warm
// serverless invocations in production, reuse one pool instead of opening a
// fresh one per request -- easy to exhaust Supabase's connection limit
// otherwise. Use Supabase's *pooled* connection string (port 6543,
// "Transaction" mode) as DATABASE_URL when deploying to a serverless
// platform such as Vercel; the direct connection (port 5432) is fine for a
// traditional always-on Node server.

declare global {
  // eslint-disable-next-line no-var
  var __techplusPool: Pool | undefined;
}

function createPool(): Pool {
  const connectionString = process.env.DATABASE_URL;
  if (!connectionString) {
    throw new Error(
      'DATABASE_URL is not set. Add your Supabase Postgres connection string to .env (see .env.example and README "Setup").'
    );
  }
  const isLocal = /localhost|127\.0\.0\.1/.test(connectionString);
  return new Pool({
    connectionString,
    max: 5,
    idleTimeoutMillis: 30_000,
    connectionTimeoutMillis: 10_000,
    // Supabase terminates TLS with a cert chain that Node's default trust
    // store doesn't always resolve cleanly; this keeps the connection
    // encrypted while skipping strict chain verification, same as
    // Supabase's own connection examples recommend for `pg`.
    ssl: isLocal ? false : { rejectUnauthorized: false },
  });
}

function getPool(): Pool {
  if (!globalThis.__techplusPool) {
    globalThis.__techplusPool = createPool();
  }
  return globalThis.__techplusPool;
}

export async function query<T extends QueryResultRow = QueryResultRow>(
  text: string,
  params: unknown[] = []
): Promise<T[]> {
  const result = await getPool().query<T>(text, params);
  return result.rows;
}

export async function queryOne<T extends QueryResultRow = QueryResultRow>(
  text: string,
  params: unknown[] = []
): Promise<T | null> {
  const rows = await query<T>(text, params);
  return rows[0] ?? null;
}

/** Runs `fn` with a single dedicated client inside a transaction (BEGIN/COMMIT/ROLLBACK). */
export async function transaction<T>(fn: (run: typeof query) => Promise<T>): Promise<T> {
  const client = await getPool().connect();
  try {
    await client.query('BEGIN');
    const scopedQuery = (async (text: string, params: unknown[] = []) => {
      const result = await client.query(text, params);
      return result.rows;
    }) as typeof query;
    const result = await fn(scopedQuery);
    await client.query('COMMIT');
    return result;
  } catch (err) {
    await client.query('ROLLBACK');
    throw err;
  } finally {
    client.release();
  }
}

/** Cheap connectivity check for a health-check endpoint or startup log. */
export async function pingDatabase(): Promise<boolean> {
  try {
    await query('select 1');
    return true;
  } catch {
    return false;
  }
}
