// Script para criar usuário de teste no Supabase
// Execute este SQL direto no Supabase SQL Editor para criar o usuário de teste:

/*
INSERT INTO public.users (name, email, password_hash, role, status, area, avatar_url, modules_access)
VALUES (
  'Usuário Teste',
  'teste@example.com',
  '$2a$10$1234567890123456789012345678901234567890123456789012345',
  'Admin',
  'Ativo',
  'Administração',
  null,
  array['dashboard', 'clientes', 'colaboradores', 'demandas', 'producao', 'trafego', 'cobrancas', 'relatorios', 'alertas', 'configuracoes']
);
*/

// OU use este comando para gerar um hash de senha válido:
// node -e "require('bcryptjs').hash('senha123', 10).then(h => console.log(h))"

// Depois execute no Supabase:
// INSERT INTO public.users (name, email, password_hash, role, status, area, modules_access)
// VALUES ('Usuário Teste', 'teste@example.com', '[HASH_GERADO_ACIMA]', 'Admin', 'Ativo', 'Administração', array['dashboard', 'clientes', 'colaboradores', 'demandas', 'producao', 'trafego', 'cobrancas', 'relatorios', 'alertas', 'configuracoes']);

console.log('Gerando hash da senha para teste...');
const bcryptjs = require('bcryptjs');

bcryptjs.hash('senha123', 10).then(hash => {
  console.log('\n✅ Hash gerado:');
  console.log(hash);
  console.log('\n📝 Execute este SQL no Supabase SQL Editor:\n');
  console.log(`INSERT INTO public.users (name, email, password_hash, role, status, area, modules_access)
VALUES (
  'Usuário Teste',
  'teste@example.com',
  '${hash}',
  'Admin',
  'Ativo',
  'Administração',
  array['dashboard', 'clientes', 'colaboradores', 'demandas', 'producao', 'trafego', 'cobrancas', 'relatorios', 'alertas', 'configuracoes']
);\n`);
  
  console.log('OU use a Interface do Supabase:');
  console.log('1. Acesse: https://chatwoot-supabase.6gpkjl.easypanel.host/');
  console.log('2. Vá em "SQL Editor"');
  console.log('3. Cole e execute o SQL acima');
  console.log('\n📧 Email: teste@example.com');
  console.log('🔑 Senha: senha123');
});
