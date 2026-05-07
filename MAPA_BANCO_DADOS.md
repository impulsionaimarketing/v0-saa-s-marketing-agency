# Mapa Completo do Banco de Dados

## Tabelas Principais

### 1. USERS (Usuários)
Armazena colaboradores, gestores e administradores.

| Campo | Tipo | Descrição |
|-------|------|-----------|
| id | UUID | Identificador único |
| name | VARCHAR(255) | Nome do usuário |
| email | VARCHAR(255) | Email único |
| role | VARCHAR(50) | Admin, Gestor, Colaborador |
| status | VARCHAR(20) | Ativo, Inativo |
| avatar_url | TEXT | URL da foto de perfil |
| modules_access | TEXT | Módulos acessíveis |
| created_at | TIMESTAMPTZ | Data de criação |
| updated_at | TIMESTAMPTZ | Data de atualização |

**Relações:**
- `1 : N` → user_areas (um usuário pode ter múltiplas áreas)
- `1 : N` → demands (responsável por tarefas)
- `1 : N` → productions (responsável por produções)
- `1 : N` → activity_logs (ações do usuário)
- `1 : N` → client_responsibles (responsável por cliente em áreas)

---

### 2. USER_AREAS (Áreas dos Usuários)
Permite que um usuário trabalhe em múltiplas áreas.

| Campo | Tipo | Descrição |
|-------|------|-----------|
| id | UUID | Identificador único |
| user_id | UUID | FK → users |
| area | VARCHAR(50) | Arte, Vídeo, Tráfego, Comunicação |
| created_at | TIMESTAMPTZ | Data de criação |

**Relações:**
- `N : 1` → users

---

### 3. CLIENTS (Clientes)
Armazena informações dos clientes.

| Campo | Tipo | Descrição |
|-------|------|-----------|
| id | UUID | Identificador único |
| name | VARCHAR(255) | Nome do cliente |
| type | VARCHAR(50) | Serviço, Infoproduto, Local |
| campaign_type | VARCHAR(50) | Mensagem, Venda, Alcance |
| payment_frequency | VARCHAR(50) | Semanal, Mensal, Trimestral, etc |
| plan | VARCHAR(100) | Plano contratado |
| monthly_value | DECIMAL(10,2) | Valor mensal em R$ |
| payment_day | INTEGER | Dia de pagamento (1-31) |
| contract_status | VARCHAR(20) | Ativo, Pausado, Perdido |
| contract_start_date | DATE | Data de início |
| contract_end_date | DATE | Data de término |
| renewal_date | DATE | Data de renovação |
| month_status | VARCHAR(10) | green, yellow, red (status visual) |
| whatsapp_instances | JSONB | Array com instâncias WhatsApp |
| whatsapp_group_name | VARCHAR(255) | Nome do grupo WhatsApp |
| whatsapp_group_id | VARCHAR(100) | ID do grupo WhatsApp |
| ad_account_name | VARCHAR(255) | Nome da conta de ads |
| ad_account_id | VARCHAR(100) | ID da conta de ads |
| business_manager_id | VARCHAR(100) | ID do Business Manager |
| google_ads_id | VARCHAR(100) | ID do Google Ads |
| status | VARCHAR(20) | Ativo, Inativo |
| created_at | TIMESTAMPTZ | Data de criação |
| updated_at | TIMESTAMPTZ | Data de atualização |

**Relações:**
- `1 : N` → client_responsibles (responsáveis por área)
- `1 : N` → demands (tarefas do cliente)
- `1 : N` → productions (produções do cliente)
- `1 : N` → campaigns (campanhas do cliente)
- `1 : N` → payments (pagamentos do cliente)
- `1 : N` → monthly_plannings (planejamentos mensais)
- `1 : N` → reports (relatórios do cliente)
- `1 : N` → alerts (alertas relacionados)

---

### 4. CLIENT_RESPONSIBLES (Responsáveis por Cliente)
Define quem é responsável por cada área de cada cliente.

| Campo | Tipo | Descrição |
|-------|------|-----------|
| id | UUID | Identificador único |
| client_id | UUID | FK → clients |
| user_id | UUID | FK → users |
| area | VARCHAR(50) | Arte, Vídeo, Tráfego, Comunicação |
| created_at | TIMESTAMPTZ | Data de criação |

**Relações:**
- `N : 1` → clients
- `N : 1` → users

---

### 5. DEMANDS (Tarefas/Demandas)
Armazena as tarefas de criação e gestão.

| Campo | Tipo | Descrição |
|-------|------|-----------|
| id | UUID | Identificador único |
| name | VARCHAR(255) | Nome da demanda |
| description | TEXT | Descrição detalhada |
| client_id | UUID | FK → clients |
| area | VARCHAR(50) | Arte, Vídeo, Tráfego, Comunicação |
| responsible_id | UUID | FK → users (responsável) |
| deadline | DATE | Prazo da demanda |
| status | VARCHAR(50) | A Fazer, Em Produção, Em Revisão, Aprovado, Publicado, Atrasado |
| priority | VARCHAR(20) | low, medium, high |
| created_at | TIMESTAMPTZ | Data de criação |
| updated_at | TIMESTAMPTZ | Data de atualização |

**Relações:**
- `N : 1` → clients
- `N : 1` → users
- `1 : N` → productions (pode gerar produções)

**Trigger:**
- Ao criar demanda com area "Arte" ou "Vídeo", cria automaticamente uma production

---

### 6. PRODUCTIONS (Produções)
Armazena informações de vídeos e artes em produção.

| Campo | Tipo | Descrição |
|-------|------|-----------|
| id | UUID | Identificador único |
| client_id | UUID | FK → clients |
| demand_id | UUID | FK → demands (opcional) |
| type | VARCHAR(20) | Vídeo, Arte |
| responsible_id | UUID | FK → users |
| status | VARCHAR(50) | Planejamento, Aprovação do Cliente, Captação, Edição, Revisão, Legenda, Programado, Publicado, Em Tráfego, Finalizado |
| post_date | DATE | Data de publicação |
| notes | TEXT | Observações |
| created_at | TIMESTAMPTZ | Data de criação |
| updated_at | TIMESTAMPTZ | Data de atualização |

**Relações:**
- `N : 1` → clients
- `N : 1` → users
- `N : 1` → demands (opcional)

**Trigger:**
- Ao criar production sem demand_id, cria automaticamente uma demand

---

### 7. CAMPAIGNS (Campanhas)
Armazena campanhas de tráfego e publicidade.

| Campo | Tipo | Descrição |
|-------|------|-----------|
| id | UUID | Identificador único |
| client_id | UUID | FK → clients |
| name | VARCHAR(255) | Nome da campanha |
| objective | VARCHAR(100) | Objetivo da campanha |
| platform | VARCHAR(50) | Meta, Google, TikTok, LinkedIn |
| status | VARCHAR(20) | Ativo, Pausado, Finalizado |
| daily_budget | DECIMAL(10,2) | Orçamento diário |
| impressions | INTEGER | Número de impressões |
| clicks | INTEGER | Número de cliques |
| messages | INTEGER | Número de mensagens |
| conversions | INTEGER | Número de conversões |
| spend | DECIMAL(10,2) | Gasto total |
| cpl | DECIMAL(10,2) | Custo por lead |
| cpa | DECIMAL(10,2) | Custo por aquisição |
| performance | VARCHAR(10) | green, yellow, red |
| external_campaign_id | VARCHAR(100) | ID da campanha na plataforma |
| created_at | TIMESTAMPTZ | Data de criação |
| updated_at | TIMESTAMPTZ | Data de atualização |

**Relações:**
- `N : 1` → clients

---

### 8. PAYMENTS (Pagamentos)
Armazena informações de pagamentos de clientes.

| Campo | Tipo | Descrição |
|-------|------|-----------|
| id | UUID | Identificador único |
| client_id | UUID | FK → clients |
| due_date | DATE | Data de vencimento |
| amount | DECIMAL(10,2) | Valor em R$ |
| is_paid | BOOLEAN | Se foi pago |
| paid_date | DATE | Data do pagamento |
| created_at | TIMESTAMPTZ | Data de criação |
| updated_at | TIMESTAMPTZ | Data de atualização |

**Relações:**
- `N : 1` → clients

---

### 9. MONTHLY_PLANNINGS (Planejamentos Mensais)
Armazena planejamento de quantidades por área e mês.

| Campo | Tipo | Descrição |
|-------|------|-----------|
| id | UUID | Identificador único |
| client_id | UUID | FK → clients |
| month | INTEGER | 1-12 (janeiro a dezembro) |
| year | INTEGER | Ano (2020+) |
| videos_qty | INTEGER | Quantidade de vídeos |
| artes_qty | INTEGER | Quantidade de artes |
| trafego_qty | INTEGER | Quantidade de campanhas |
| comunicacao_qty | INTEGER | Quantidade de comunicações |
| created_at | TIMESTAMPTZ | Data de criação |
| updated_at | TIMESTAMPTZ | Data de atualização |

**Relações:**
- `N : 1` → clients

**Função:**
- `upsert_monthly_planning()` - Atualizar ou inserir se já existe

---

### 10. REPORTS (Relatórios)
Armazena relatórios mensais dos clientes.

| Campo | Tipo | Descrição |
|-------|------|-----------|
| id | UUID | Identificador único |
| client_id | UUID | FK → clients |
| month | DATE | Mês do relatório |
| status | VARCHAR(20) | Pendente, Em Elaboração, Enviado |
| results_summary | TEXT | Resumo dos resultados |
| report_url | TEXT | URL do relatório |
| sent_at | TIMESTAMPTZ | Data de envio |
| created_at | TIMESTAMPTZ | Data de criação |
| updated_at | TIMESTAMPTZ | Data de atualização |

**Relações:**
- `N : 1` → clients

---

### 11. ALERTS (Alertas)
Armazena alertas do sistema para usuários.

| Campo | Tipo | Descrição |
|-------|------|-----------|
| id | UUID | Identificador único |
| type | VARCHAR(50) | late_task, no_balance, blocked_account, kpi_issue, pending_report |
| title | VARCHAR(255) | Título do alerta |
| description | TEXT | Descrição do alerta |
| severity | VARCHAR(20) | low, medium, high |
| client_id | UUID | FK → clients (opcional) |
| related_entity_type | VARCHAR(50) | Tipo de entidade relacionada |
| related_entity_id | UUID | ID da entidade relacionada |
| is_read | BOOLEAN | Se foi lido |
| is_resolved | BOOLEAN | Se foi resolvido |
| created_at | TIMESTAMPTZ | Data de criação |

**Relações:**
- `N : 1` → clients (opcional)

---

### 12. CRM_LEADS (Leads/Oportunidades)
Armazena leads e oportunidades de venda.

| Campo | Tipo | Descrição |
|-------|------|-----------|
| id | UUID | Identificador único |
| name | TEXT | Nome do lead |
| phone | TEXT | Telefone |
| email | TEXT | Email |
| company | TEXT | Empresa |
| source | TEXT | Fonte do lead |
| notes | TEXT | Observações |
| status | TEXT | lead_novo, entrar_em_contato, proposta_enviada, contrato_ativo, contrato_pausado, contrato_cancelado |
| created_at | TIMESTAMPTZ | Data de criação |
| updated_at | TIMESTAMPTZ | Data de atualização |

---

### 13. ACTIVITY_LOGS (Logs de Atividade)
Armazena registro de todas as ações dos usuários.

| Campo | Tipo | Descrição |
|-------|------|-----------|
| id | UUID | Identificador único |
| user_id | UUID | FK → users |
| action | VARCHAR(100) | Ação realizada (create, update, delete) |
| entity_type | VARCHAR(50) | Tipo de entidade |
| entity_id | UUID | ID da entidade |
| changes | JSONB | Mudanças realizadas (diff) |
| created_at | TIMESTAMPTZ | Data da ação |

**Relações:**
- `N : 1` → users

---

### 14. DASHBOARD_VIEWS (Visualizações do Dashboard)
Armazena configurações personalizadas de dashboard.

| Campo | Tipo | Descrição |
|-------|------|-----------|
| id | UUID | Identificador único |
| company_id | UUID | ID da empresa |
| user_id | UUID | ID do usuário |
| context | VARCHAR(50) | Contexto (clientes, demandas, etc) |
| name | VARCHAR(255) | Nome da visualização |
| visible_metrics | JSONB | Métricas visíveis |
| is_default | BOOLEAN | Se é padrão |
| created_at | TIMESTAMPTZ | Data de criação |
| updated_at | TIMESTAMPTZ | Data de atualização |

---

## Relacionamentos Visuais

```
users (1) ──── (N) user_areas
               │
               ├──── (N) client_responsibles (N) ──── (1) clients
               │
               ├──── (N) demands
               │         │
               │         └──── (1 ou N) productions
               │
               └──── (N) productions
               
clients (1) ──── (N) ├─ client_responsibles
                    ├─ demands
                    ├─ productions
                    ├─ campaigns
                    ├─ payments
                    ├─ monthly_plannings
                    ├─ reports
                    └─ alerts
```

---

## Triggers Automáticos

### 1. sync_demand_to_production
**Quando:** Ao inserir uma demand com area = "Arte" ou "Vídeo"
**Ação:** Cria automaticamente uma production

### 2. sync_production_to_demand
**Quando:** Ao inserir uma production sem demand_id
**Ação:** Cria automaticamente uma demand

### 3. update_monthly_plannings_updated_at
**Quando:** Ao atualizar monthly_planning
**Ação:** Atualiza o campo updated_at

---

## Índices

Todos os campos frequentemente consultados têm índices para melhor performance:
- Campos de busca: name, email
- Foreign keys: todas
- Status: todas as tabelas
- Datas: deadline, due_date
- Filtros comuns: role, type, area

---

## Como Adicionar Dados

### Exemplo 1: Adicionar um usuário
```sql
INSERT INTO public.users (name, email, role)
VALUES ('João Silva', 'joao@agencia.com', 'Admin');
```

### Exemplo 2: Adicionar um cliente
```sql
INSERT INTO public.clients (name, type, plan, monthly_value, contract_status)
VALUES ('Tech Solutions', 'Serviço', 'Premium', 5000.00, 'Ativo');
```

### Exemplo 3: Atribuir área a um usuário
```sql
INSERT INTO public.user_areas (user_id, area)
VALUES ('uuid-do-usuario', 'Arte');
```

### Exemplo 4: Atribuir responsável por cliente
```sql
INSERT INTO public.client_responsibles (client_id, user_id, area)
VALUES ('uuid-cliente', 'uuid-usuario', 'Arte');
```

---

## Próximos Passos

1. Execute o `SCHEMA_COMPLETO.sql` no seu banco de dados
2. Adicione seus dados usando INSERTs
3. Se usar Supabase, ative as políticas RLS comentadas no schema
4. Use os data layers em `lib/data/` para consultar os dados
