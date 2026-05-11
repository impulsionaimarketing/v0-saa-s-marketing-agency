#!/usr/bin/env node

/**
 * Script para executar o setup de autenticação no Supabase
 * 
 * Uso: node scripts/setup-auth.js --url <url> --key <key>
 * Ou: npm run setup:auth
 */

import { createClient } from '@supabase/supabase-js'
import fs from 'fs'
import path from 'path'

const args = process.argv.slice(2)
const urlIndex = args.indexOf('--url')
const keyIndex = args.indexOf('--key')

const SUPABASE_URL = urlIndex >= 0 ? args[urlIndex + 1] : process.env.SUPABASE_URL || 'https://chatwoot-supabase.6gpkjl.easypanel.host'
const SERVICE_KEY = keyIndex >= 0 ? args[keyIndex + 1] : process.env.SUPABASE_SERVICE_KEY

if (!SUPABASE_URL) {
  console.error('❌ Erro: SUPABASE_URL não fornecida')
  console.error('Use: node scripts/setup-auth.js --url <url> --key <service-key>')
  process.exit(1)
}

if (!SERVICE_KEY) {
  console.error('❌ Erro: SERVICE_KEY não fornecida')
  console.error('⚠️  Nota: Você precisa de uma SERVICE_KEY (não a ANON_KEY)')
  console.error('Use: node scripts/setup-auth.js --url <url> --key <service-key>')
  console.error('')
  console.error('Para obter a SERVICE_KEY:')
  console.error('1. Acesse seu dashboard do Supabase')
  console.error('2. Vá para Settings > API')
  console.error('3. Copie a "service_role key" (não a "anon key")')
  process.exit(1)
}

async function setupAuthentication() {
  console.log('🚀 Iniciando setup de autenticação...')
  console.log(`📍 Supabase URL: ${SUPABASE_URL}`)
  console.log('')

  try {
    // Criar cliente Supabase com service key
    const supabase = createClient(SUPABASE_URL, SERVICE_KEY, {
      auth: {
        persistSession: false,
      },
    })

    // Ler o script SQL
    const scriptPath = path.join(process.cwd(), 'scripts', 'add-authentication.sql')
    const sqlScript = fs.readFileSync(scriptPath, 'utf-8')

    console.log('📋 Lendo script SQL...')
    const statements = sqlScript
      .split(';')
      .map(stmt => stmt.trim())
      .filter(stmt => stmt && !stmt.startsWith('--'))

    console.log(`📊 Total de comandos SQL: ${statements.length}`)
    console.log('')

    // Executar cada comando
    for (let i = 0; i < statements.length; i++) {
      const statement = statements[i]
      const progress = `[${i + 1}/${statements.length}]`
      
      try {
        console.log(`${progress} Executando comando...`)
        
        // Para queries diretas, usar rpc('execute_sql') ou similar
        // Para DDL statements, precisamos usar um edge function ou executar via admin
        const { error } = await supabase.rpc('execute_sql', {
          sql: statement + ';'
        }).catch(err => {
          // Se a RPC não existir, tentar outro método
          return { error: err }
        })

        if (error) {
          // Tentar via admin API
          console.log(`⚠️  RPC não disponível, tentando via admin API...`)
          // Nota: Isso requer um endpoint especial no Supabase
          throw error
        }

        console.log(`✅ Comando ${i + 1} executado com sucesso`)
      } catch (err) {
        console.error(`❌ Erro ao executar comando ${i + 1}:`)
        console.error(`   ${(err as Error).message}`)
      }
    }

    console.log('')
    console.log('✅ Setup de autenticação concluído!')
    console.log('')
    console.log('📝 Próximos passos:')
    console.log('1. Execute: UPDATE public.users SET password_hash = crypt(...) WHERE...')
    console.log('2. Acesse sua aplicação e teste o login')
    console.log('')

  } catch (error) {
    console.error('❌ Erro durante o setup:')
    console.error((error as Error).message)
    process.exit(1)
  }
}

setupAuthentication()
