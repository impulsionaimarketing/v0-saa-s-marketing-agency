import { Pool } from "pg";

// Para Supabase auto-hospedado, use DATABASE_URL ou construa a partir das variáveis Supabase
const connectionString = process.env.DATABASE_URL || 
  (process.env.SUPABASE_DB_URL ? process.env.SUPABASE_DB_URL : null);

if (!connectionString) {
  console.error("[v0] DATABASE_URL ou SUPABASE_DB_URL não está configurada!");
}

const pool = new Pool({
  connectionString: connectionString || undefined,
  ssl: connectionString?.includes("localhost")
    ? false
    : { rejectUnauthorized: false },
});

export async function query<T>(text: string, params?: unknown[]): Promise<T[]> {
  if (!connectionString) {
    console.error("[v0] Erro: DATABASE_URL não configurada. Adicione DATABASE_URL nas variáveis de ambiente (Vars no menu de configurações).");
    return [];
  }
  const client = await pool.connect();
  try {
    const result = await client.query(text, params);
    return result.rows as T[];
  } catch (error) {
    console.error("[v0] Erro na query:", error);
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
  if (!connectionString) {
    console.error("[v0] Erro: DATABASE_URL não configurada. Adicione DATABASE_URL nas variáveis de ambiente (Vars no menu de configurações).");
    return 0;
  }
  const client = await pool.connect();
  try {
    const result = await client.query(text, params);
    return result.rowCount || 0;
  } catch (error) {
    console.error("[v0] Erro na execução:", error);
    throw error;
  } finally {
    client.release();
  }
}

export { pool };
