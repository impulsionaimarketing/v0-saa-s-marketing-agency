## ⚠️ Problema: Funções RPC Ausentes

O código do aplicativo foi desenvolvido usando **15 funções RPC** (Remote Procedure Call) que não existem no seu Supabase autohospedado.

### Erro Específico Encontrado:
```
POST https://chatwoot-supabase.6gpkjl.easypanel.host/rest/v1/rpc/authenticate_user 404 (Not Found)
```

### O que são RPC Functions?

RPCs são funções SQL customizadas no banco de dados que o aplicativo chama para operações específicas.

### Funções RPC Necessárias:

1. **get_all_clients** - Listar todos os clientes
2. **get_all_demands** - Listar todas as demandas
3. **get_all_alerts** - Listar todos os alertas
4. **get_recent_activity** - Obter atividades recentes
5. **generate_monthly_payments** - Gerar pagamentos mensais
6. **insert_demand** - Inserir nova demanda
7. **get_all_payments** - Listar todos os pagamentos
8. **get_all_productions** - Listar todas as produções
9. **insert_production** - Inserir nova produção
10. **update_production_status** - Atualizar status da produção
11. **delete_production_by_id** - Deletar produção por ID
12. **upsert_monthly_planning** - Atualizar planejamento mensal
13. **get_all_modules** - Listar todos os módulos
14. **get_user_permissions** - Obter permissões do usuário
15. **update_user_permission** - Atualizar permissão do usuário

### Próximos Passos:

1. **Você tem um SQL schema com essas funções?**
   - Se sim, compartilhe comigo e vou executá-lo no seu Supabase
   - Se não, preciso criá-las baseado no padrão do aplicativo

2. **Alternativa Rápida para o Login Funcionar:**
   - O login agora usa server action (sem RPC) ✅
   - Basta você fazer login com: teste@example.com / senha123
   - As outras funcionalidades dependem das RPC functions

### Para Verificar Quais Funções Existem:

Execute no SQL Editor do Supabase:
```sql
SELECT routine_name 
FROM information_schema.routines 
WHERE routine_schema = 'public';
```

### Ação Recomendada:

Você precisa fornecer o SQL com as definições dessas RPC functions para que eu as execute no seu banco.
