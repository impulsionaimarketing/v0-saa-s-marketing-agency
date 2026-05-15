import { Pool } from "pg";

let connectionString = process.env.POSTGRES_URL || process.env.DATABASE_URL;

// Fix SSL for Supabase: use libpq compatibility mode to avoid self-signed certificate errors
if (connectionString && !connectionString.includes("localhost")) {
  // Remove existing sslmode and add libpq compatibility
  connectionString = connectionString.replace(/[?&]sslmode=[^&]+/, "");
  const separator = connectionString.includes("?") ? "&" : "?";
  connectionString = `${connectionString}${separator}sslmode=require&uselibpqcompat=true`;
}

const pool = new Pool({
  connectionString,
});

export async function query<T>(text: string, params?: unknown[]): Promise<T[]> {
  const client = await pool.connect();
  try {
    const result = await client.query(text, params);
    return result.rows as T[];
  } catch (error) {
    console.error("[v0] Query error:", error);
    throw error;
  } finally {
    client.release();
  }
}

export async function queryOne<T>(
  text: string,
  params?: unknown[]
): Promise<T | null> {
  const rows = await query<T>(text, params);
  return rows[0] || null;
}

export async function execute(
  text: string,
  params?: unknown[]
): Promise<number> {
  const client = await pool.connect();
  try {
    const result = await client.query(text, params);
    return result.rowCount || 0;
  } finally {
    client.release();
  }
}

export { pool };
