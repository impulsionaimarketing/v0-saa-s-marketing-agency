#!/bin/bash
cd /vercel/share/v0-project
git restore lib/data/clients.ts
git restore lib/data/users.ts
git restore lib/data/demands.ts
git restore lib/data/alerts.ts
echo "✓ Arquivos restaurados para Supabase"
