# Sistema de Permissões - Documentação

## Visão Geral

O sistema de permissões permite controlar o acesso granular de cada usuário a diferentes módulos (seções) da aplicação. Cada usuário pode ter as seguintes permissões por módulo:

- **Visualizar**: Pode acessar o módulo
- **Editar**: Pode realizar alterações no módulo
- **Sem Acesso**: Acesso completamente bloqueado - exibe mensagem "Você não tem acesso para essa página"

## Módulos Disponíveis

1. **dashboard** - Painel de controle e análises
2. **clientes** - Gerenciamento de clientes
3. **producoes** - Gestão de produções
4. **demandas** - Gerenciamento de demandas
5. **campanhas** - Gestão de campanhas
6. **relatorios** - Visualização de relatórios
7. **configuracoes** - Configurações do sistema
8. **usuarios** - Gerenciamento de usuários

## Como Usar

### 1. Configurar Permissões de um Usuário

Na tela de "Colaboradores", ao criar ou editar um usuário:

1. Clique em "Nova Colaborador" ou edite um existente
2. Vá para a aba "Permissões"
3. Para cada módulo, selecione:
   - ✓ **Visualizar**: Usuário pode ver o módulo
   - ✓ **Editar**: Usuário pode editar conteúdo
   - ✓ **Sem Acesso**: Bloqueia completamente o acesso

**Nota**: Se marcar "Sem Acesso", as outras opções são automaticamente desativadas.

### 2. Proteger uma Página

Para proteger uma página com verificação de permissões, use o componente `ModuleAccessWrapper`:

```tsx
import { ModuleAccessWrapper } from '@/components/auth/module-access-wrapper'

export default function MinhaPage() {
  return (
    <ModuleAccessWrapper moduleName="clientes" moduleDisplayName="Clientes">
      <AppShell>
        {/* Conteúdo da página */}
      </AppShell>
    </ModuleAccessWrapper>
  )
}
```

Se o usuário não tiver permissão, verá: "Você não tem acesso para essa página"

### 3. Verificar Permissões em Componentes

Use o hook `useModuleAccess` para verificar permissões em componentes:

```tsx
import { useModuleAccess } from '@/lib/hooks/use-module-access'

export function MeuComponente() {
  const { canView, canEdit, isBlocked, isLoading } = useModuleAccess('clientes')

  if (isLoading) return <Spinner />
  if (isBlocked) return <AccessDenied />

  return (
    <div>
      {canView && <p>Você pode visualizar</p>}
      {canEdit && <button>Editar</button>}
    </div>
  )
}
```

### 4. Verificar Apenas Permissão de Edição

Use o hook `useCanEdit` para verificar se pode editar:

```tsx
import { useCanEdit } from '@/lib/hooks/use-can-edit'

export function BotaoEditar() {
  const canEdit = useCanEdit('clientes')

  return (
    <button disabled={!canEdit}>
      {canEdit ? 'Editar' : 'Sem permissão'}
    </button>
  )
}
```

## Banco de Dados

### Tabelas

#### `modules`
- `id` (UUID)
- `name` (String) - Identificador único do módulo
- `display_name` (String) - Nome para exibição
- `description` (Text) - Descrição do módulo
- `icon` (String) - Ícone (nome do Lucide Icon)
- `sort_order` (Integer) - Ordem de exibição

#### `user_permissions`
- `id` (UUID)
- `user_id` (UUID) - Referência ao usuário
- `module_id` (UUID) - Referência ao módulo
- `can_view` (Boolean) - Pode visualizar
- `can_edit` (Boolean) - Pode editar
- `is_blocked` (Boolean) - Acesso bloqueado
- `created_at` (Timestamp)
- `updated_at` (Timestamp)

### RPC Functions

#### `get_user_permissions(p_user_id UUID)`
Retorna todas as permissões de um usuário incluindo todos os módulos.

#### `update_user_permission(p_user_id, p_module_id, p_can_view, p_can_edit, p_is_blocked)`
Atualiza ou cria uma permissão para um usuário em um módulo específico.

#### `get_all_modules()`
Retorna lista de todos os módulos disponíveis.

## Fluxo de Permissões

1. **Admin cria usuário** → Define permissões na aba "Permissões"
2. **Permissões são salvas** → Armazenadas em `user_permissions`
3. **Usuário acessa página** → `ModuleAccessWrapper` verifica permissões via `useModuleAccess`
4. **Se bloqueado** → Exibe `AccessDenied` com mensagem "Você não tem acesso para essa página"
5. **Se tem visualizar** → Permite acesso à página
6. **Se não tem editar** → Botões de edição são desativados

## Exemplos de Implementação

### Dashboard - Sem Proteção (todos têm acesso)
```tsx
export default function DashboardPage() {
  return (
    <ProtectedRoute>
      <AppShell>
        {/* Conteúdo */}
      </AppShell>
    </ProtectedRoute>
  )
}
```

### Clientes - Com Proteção
```tsx
import { ModuleAccessWrapper } from '@/components/auth/module-access-wrapper'

export default function ClientesPage() {
  return (
    <ModuleAccessWrapper moduleName="clientes" moduleDisplayName="Clientes">
      <ProtectedRoute>
        <AppShell>
          {/* Conteúdo de clientes */}
        </AppShell>
      </ProtectedRoute>
    </ModuleAccessWrapper>
  )
}
```

### Botões com Verificação de Edição
```tsx
import { useCanEdit } from '@/lib/hooks/use-can-edit'

export function ClienteCard({ cliente }) {
  const canEdit = useCanEdit('clientes')

  return (
    <div>
      <h3>{cliente.name}</h3>
      <button disabled={!canEdit}>Editar</button>
      <button disabled={!canEdit}>Deletar</button>
    </div>
  )
}
```

## Comportamento Padrão

Se um usuário não tiver permissão explícita registrada para um módulo:
- **canView**: `true` (acesso permitido por padrão)
- **canEdit**: `true` (edição permitida por padrão)
- **isBlocked**: `false` (não bloqueado)

Isso significa que novos módulos adicionados estarão disponíveis para todos por padrão até que um admin restrinja explicitamente.
