# Problemas Identificados no Sistema de Autenticação e Permissões

## ❌ Problemas Críticos

### 1. **Autenticação Mock com localStorage**
**Arquivo:** `/lib/hooks/use-auth.ts`

**Problema:**
- O sistema atual usa localStorage para armazenar dados do usuário
- Não há autenticação real com o Supabase Auth
- Qualquer pessoa pode manipular o localStorage e se passar por admin
- Não há validação de tokens ou sessões

**Código Problemático:**
```typescript
const storedUser = localStorage.getItem('user')
if (storedUser) {
  const userData = JSON.parse(storedUser)
  setUser(userData)
}
```

**Impacto:** 🔴 CRÍTICO - Sistema completamente inseguro

---

### 2. **Falta de Autenticação Real do Supabase**
**Arquivos:** `/lib/supabase/client.ts`, `/lib/supabase/server.ts`

**Problema:**
- Os arquivos de cliente Supabase existem mas não estão sendo usados corretamente
- Não há integração com `supabase.auth.signIn()`, `signUp()`, `signOut()`
- Não há middleware para proteger rotas
- Não há gerenciamento de sessão

**Faltando:**
- Middleware de autenticação
- Páginas de login/signup funcionais
- Gerenciamento de sessão via cookies
- Refresh de tokens automático

**Impacto:** 🔴 CRÍTICO - Não há autenticação real

---

### 3. **Permissões Checadas no Client-Side**
**Arquivo:** `/lib/hooks/use-module-access.ts`

**Problema:**
- Permissões são verificadas apenas no client-side
- Usuários podem desabilitar JavaScript ou manipular o código
- Não há validação server-side das permissões

**Código Problemático:**
```typescript
// Cliente pode manipular isso facilmente
const permissions = await getUserPermissions(user.id)
```

**Impacto:** 🔴 CRÍTICO - Bypass de permissões trivial

---

### 4. **Tabela de Usuários Personalizada sem Link com Auth**
**Tabela:** `users`

**Problema:**
- Existe uma tabela `users` customizada no banco
- Não está linkada com `auth.users` do Supabase
- Não há foreign key ou trigger para sincronização
- Usuários podem existir em uma tabela mas não na outra

**Impacto:** 🔴 CRÍTICO - Inconsistência de dados

---

### 5. **RLS (Row Level Security) Não Implementado**
**Todas as tabelas do banco**

**Problema:**
- As tabelas não têm políticas de RLS
- Qualquer requisição autenticada pode acessar/modificar qualquer dado
- Não há proteção a nível de banco de dados

**Impacto:** 🟠 ALTO - Dados vulneráveis

---

### 6. **Sem Validação Server-Side nas API Routes**
**Arquivos:** `/app/api/*`

**Problema:**
- Routes API não validam se o usuário está autenticado
- Não verificam permissões antes de executar ações
- Confiam cegamente nos dados do cliente

**Impacto:** 🟠 ALTO - API desprotegida

---

## ✅ Solução Proposta

### Fase 1: Implementar Supabase Auth Real

1. **Criar middleware de autenticação**
   - Arquivo: `/middleware.ts`
   - Validar sessão em todas as rotas protegidas
   - Redirecionar não autenticados para /login

2. **Criar páginas de autenticação**
   - `/app/auth/login/page.tsx` - Login funcional
   - `/app/auth/sign-up/page.tsx` - Cadastro funcional  
   - `/app/auth/error/page.tsx` - Erros de auth

3. **Atualizar use-auth hook**
   - Usar `supabase.auth.getUser()` real
   - Remover localStorage
   - Gerenciar sessão via cookies HTTP-only

### Fase 2: Sincronizar Tabelas

1. **Linkar users com auth.users**
   ```sql
   ALTER TABLE users 
   ADD COLUMN auth_id UUID REFERENCES auth.users(id) ON DELETE CASCADE;
   ```

2. **Criar trigger para auto-criar user profile**
   ```sql
   CREATE TRIGGER on_auth_user_created
   AFTER INSERT ON auth.users
   EXECUTE FUNCTION handle_new_user();
   ```

### Fase 3: Implementar RLS

1. **Ativar RLS em todas as tabelas**
   ```sql
   ALTER TABLE users ENABLE ROW LEVEL SECURITY;
   ALTER TABLE clients ENABLE ROW LEVEL SECURITY;
   -- etc...
   ```

2. **Criar políticas baseadas em roles**
   ```sql
   CREATE POLICY "Admin pode ver tudo" ON clients
   FOR SELECT USING (
     EXISTS (
       SELECT 1 FROM users 
       WHERE users.auth_id = auth.uid() 
       AND users.role = 'Admin'
     )
   );
   ```

### Fase 4: Proteger API Routes

1. **Validar autenticação em todas as routes**
   ```typescript
   export async function POST(request: Request) {
     const supabase = await createClient()
     const { data: { user } } = await supabase.auth.getUser()
     
     if (!user) {
       return NextResponse.json({ error: 'Não autenticado' }, { status: 401 })
     }
     
     // Continuar com lógica...
   }
   ```

2. **Verificar permissões server-side**
   ```typescript
   const hasPermission = await checkUserPermission(user.id, 'clientes', 'edit')
   if (!hasPermission) {
     return NextResponse.json({ error: 'Sem permissão' }, { status: 403 })
   }
   ```

### Fase 5: Atualizar Frontend

1. **Remover localStorage do use-auth**
2. **Usar sessão do Supabase em todos os componentes**
3. **Manter verificação client-side apenas como UX** (não como segurança)

---

## 🚨 Prioridade de Implementação

1. 🔴 **URGENTE** - Implementar Supabase Auth real (Fase 1)
2. 🔴 **URGENTE** - Linkar tabelas users e auth.users (Fase 2)
3. 🟠 **ALTA** - Implementar RLS (Fase 3)
4. 🟠 **ALTA** - Proteger API Routes (Fase 4)
5. 🟡 **MÉDIA** - Atualizar Frontend (Fase 5)

---

## 📋 Checklist de Segurança

Antes de ir para produção, verificar:

- [ ] Middleware de auth implementado
- [ ] Todas as páginas protegidas exigem login
- [ ] localStorage removido da autenticação
- [ ] Tabela users linkada com auth.users
- [ ] RLS ativado em todas as tabelas
- [ ] Políticas RLS testadas para cada role
- [ ] API Routes validam autenticação
- [ ] API Routes validam permissões
- [ ] Tokens de sessão são HTTP-only
- [ ] Refresh de token automático funciona
- [ ] Logout limpa sessão corretamente
- [ ] Reset de senha implementado
- [ ] Verificação de email configurada

---

## 🔗 Documentação de Referência

- [Supabase Auth Docs](https://supabase.com/docs/guides/auth)
- [Next.js 16 Middleware](https://nextjs.org/docs/app/building-your-application/routing/middleware)
- [Row Level Security](https://supabase.com/docs/guides/auth/row-level-security)
