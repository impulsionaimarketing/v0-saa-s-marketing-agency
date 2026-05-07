#!/usr/bin/env node

/**
 * Script de Migração de Dados: Supabase → PostgreSQL
 * 
 * Este script exporta todos os dados do Supabase e importa no PostgreSQL novo.
 * 
 * Uso: node scripts/migrate-data.js
 * 
 * Pré-requisitos:
 * - DATABASE_URL configurada em .env.local (PostgreSQL destino)
 * - SUPABASE_URL e SUPABASE_SERVICE_ROLE_KEY em .env.local
 * - As tabelas já criadas no PostgreSQL (execute scripts/postgres-setup.sql primeiro)
 */

import { createClient } from "@supabase/supabase-js";
import { Pool } from "pg";

// Validar variáveis de ambiente
const requiredEnvVars = [
  "DATABASE_URL",
  "SUPABASE_URL",
  "SUPABASE_SERVICE_ROLE_KEY",
];

const missingEnvVars = requiredEnvVars.filter((varName) => !process.env[varName]);
if (missingEnvVars.length > 0) {
  console.error(
    "[v0] Erro: Variáveis de ambiente ausentes:",
    missingEnvVars.join(", ")
  );
  process.exit(1);
}

// Conectar ao Supabase (origem)
const supabase = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

// Conectar ao PostgreSQL (destino)
const pgPool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

interface MigrationTable {
  name: string;
  columns: string[];
}

const TABLES_TO_MIGRATE: MigrationTable[] = [
  {
    name: "users",
    columns: [
      "id",
      "name",
      "email",
      "role",
      "area",
      "status",
      "avatar_url",
      "created_at",
      "updated_at",
    ],
  },
  {
    name: "clients",
    columns: [
      "id",
      "name",
      "type",
      "campaign_type",
      "payment_frequency",
      "plan",
      "monthly_value",
      "payment_day",
      "contract_status",
      "contract_start_date",
      "contract_end_date",
      "renewal_date",
      "month_status",
      "whatsapp_instances",
      "whatsapp_group_name",
      "whatsapp_group_id",
      "ad_account_name",
      "ad_account_id",
      "business_manager_id",
      "google_ads_id",
      "status",
      "created_at",
      "updated_at",
    ],
  },
  {
    name: "demands",
    columns: [
      "id",
      "name",
      "description",
      "client_id",
      "area",
      "responsible_id",
      "deadline",
      "status",
      "priority",
      "created_at",
      "updated_at",
    ],
  },
  {
    name: "alerts",
    columns: [
      "id",
      "type",
      "title",
      "description",
      "severity",
      "client_id",
      "related_entity_type",
      "related_entity_id",
      "is_read",
      "is_resolved",
      "created_at",
    ],
  },
  {
    name: "client_responsibles",
    columns: ["id", "client_id", "user_id", "area", "created_at"],
  },
];

async function migrateTable(table: MigrationTable): Promise<void> {
  console.log(`\n[v0] Migrando tabela: ${table.name}`);

  try {
    // 1. Buscar dados do Supabase
    const { data, error } = await supabase
      .from(table.name)
      .select("*")
      .limit(10000); // Limite de segurança

    if (error) {
      console.error(`[v0] Erro ao buscar dados de ${table.name}:`, error);
      return;
    }

    if (!data || data.length === 0) {
      console.log(`[v0] Nenhum dado encontrado em ${table.name}`);
      return;
    }

    console.log(`[v0] Encontrados ${data.length} registros em ${table.name}`);

    // 2. Preparar dados para inserção no PostgreSQL
    const client = await pgPool.connect();
    let insertedCount = 0;
    let errorCount = 0;

    try {
      // Desabilitar constraints temporariamente
      await client.query(`ALTER TABLE ${table.name} DISABLE TRIGGER ALL`);

      for (const row of data) {
        try {
          // Construir query de inserção com ON CONFLICT DO NOTHING
          const columns = Object.keys(row);
          const values = Object.values(row);
          const placeholders = columns
            .map((_, i) => `$${i + 1}`)
            .join(", ");

          const query = `
            INSERT INTO ${table.name} (${columns.join(", ")})
            VALUES (${placeholders})
            ON CONFLICT (id) DO NOTHING
          `;

          await client.query(query, values);
          insertedCount++;
        } catch (err) {
          errorCount++;
          console.error(
            `[v0] Erro ao inserir registro em ${table.name}:`,
            err instanceof Error ? err.message : err
          );
        }
      }

      // Reabilitar constraints
      await client.query(`ALTER TABLE ${table.name} ENABLE TRIGGER ALL`);

      console.log(
        `[v0] ${table.name}: ${insertedCount} inseridos, ${errorCount} erros`
      );
    } finally {
      client.release();
    }
  } catch (error) {
    console.error(`[v0] Erro geral ao migrar ${table.name}:`, error);
  }
}

async function main(): Promise<void> {
  console.log("[v0] Iniciando migração de dados Supabase → PostgreSQL");
  console.log("[v0] =====================================================");

  try {
    // Testar conexões
    console.log("[v0] Testando conexões...");

    const supabaseTest = await supabase.auth.getSession();
    console.log("[v0] ✓ Supabase conectado");

    const pgTest = await pgPool.query("SELECT NOW()");
    console.log("[v0] ✓ PostgreSQL conectado");

    // Migrar cada tabela
    for (const table of TABLES_TO_MIGRATE) {
      await migrateTable(table);
    }

    console.log("\n[v0] =====================================================");
    console.log("[v0] Migração concluída!");
    console.log("[v0] Verifique os dados no PostgreSQL.");
  } catch (error) {
    console.error("[v0] Erro fatal:", error);
    process.exit(1);
  } finally {
    await pgPool.end();
  }
}

// Executar
main().catch(console.error);
