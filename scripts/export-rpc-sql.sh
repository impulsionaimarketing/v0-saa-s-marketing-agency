#!/bin/bash

# Exportar schema das RPC functions do Supabase oficial
# Requer acesso ao banco de dados

SUPABASE_URL="https://oohfpxgryppemtqhcbbw.supabase.co"
DB_HOST="db.oohfpxgryppemtqhcbbw.supabase.co"
DB_PORT="5432"
DB_NAME="postgres"
DB_USER="postgres"

echo "Exportando RPC functions do Supabase oficial..."
echo "Você precisa fornecer a senha do banco de dados"
echo ""

# Este comando exportará apenas as functions do schema public
pg_dump \
  -h $DB_HOST \
  -p $DB_PORT \
  -U $DB_USER \
  -d $DB_NAME \
  --schema=public \
  --schema-only \
  -T 'information_schema.*' \
  -T 'pg_*' \
  -O \
  > rpc-functions.sql

echo "Arquivo exportado: rpc-functions.sql"
