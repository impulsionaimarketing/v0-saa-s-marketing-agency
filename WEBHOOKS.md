# Webhook Integration

Este documento explica como configurar e usar webhooks para receber notificações de mudanças no sistema.

## Configuração

### 1. Adicionar Variáveis de Ambiente

Adicione as seguintes variáveis de ambiente no seu projeto Vercel ou arquivo `.env.local`:

```env
# Webhook automático para notificações de eventos do sistema
WEBHOOK_URL=https://seu-webhook-endpoint.com/webhook
WEBHOOK_SECRET=seu-secret-aqui

# Webhook manual do n8n para atualização de dados Meta Ads (botão "Atualizar Dados" na página de tráfego)
NEXT_PUBLIC_N8N_UPDATE_WEBHOOK_URL=https://seu-n8n.app/webhook/update-meta-ads
```

- **WEBHOOK_URL**: A URL do endpoint que receberá as notificações automáticas de eventos
- **WEBHOOK_SECRET**: Uma chave secreta para validar que os webhooks vêm do seu sistema
- **NEXT_PUBLIC_N8N_UPDATE_WEBHOOK_URL**: URL do webhook n8n que dispara a atualização dos dados do Meta Ads

### 2. Testar a Configuração

Acesse: `https://seu-dominio.com/api/webhook-test`

Isso mostrará se o webhook está configurado corretamente.

## Formato dos Webhooks

### Webhook Simples

```json
{
  "event": "client.created",
  "timestamp": "2024-01-15T10:30:00.000Z",
  "data": {
    "id": "123",
    "name": "Nome do Cliente",
    "type": "Serviço",
    ...
  },
  "metadata": {
    "user_id": "user_123",
    "ip_address": "192.168.1.1"
  }
}
```

### Webhook de Produção com Arquivos

```json
{
  "event": "production.status_changed",
  "timestamp": "2024-01-15T10:30:00.000Z",
  "data": {
    "id": "prod_123",
    "client_id": "client_456",
    "type": "Vídeo",
    "status": "Em Produção",
    "files": [
      {
        "id": "file_789",
        "filename": "video-final.mp4",
        "url": "https://blob.vercel-storage.com/productions/prod_123/video-final.mp4",
        "file_size": 52428800,
        "file_type": "video/mp4",
        "uploaded_at": "2024-01-15T09:00:00.000Z"
      },
      {
        "id": "file_790",
        "filename": "thumbnail.jpg",
        "url": "https://blob.vercel-storage.com/productions/prod_123/thumbnail.jpg",
        "file_size": 204800,
        "file_type": "image/jpeg",
        "uploaded_at": "2024-01-15T09:15:00.000Z"
      }
    ]
  },
  "metadata": {
    "source": "saas-agency-app"
  }
}
```

### Webhook em Lote

```json
{
  "batch": true,
  "timestamp": "2024-01-15T10:30:00.000Z",
  "events": [
    {
      "event": "client.created",
      "data": { ... }
    },
    {
      "event": "payment.updated",
      "data": { ... }
    }
  ]
}
```

## Eventos Disponíveis

### Clientes
- `client.created` - Novo cliente criado
- `client.updated` - Cliente atualizado
- `client.deleted` - Cliente excluído

### Produções
- `production.created` - Nova produção criada (inclui array `files` com mídias vinculadas)
- `production.status_changed` - Status da produção alterado (inclui array `files` com mídias vinculadas)
- `production.deleted` - Produção excluída (inclui array `files` com mídias que foram vinculadas)
- `production.file_uploaded` - Arquivo de mídia enviado para produção
- `production.file_deleted` - Arquivo de mídia removido da produção
- `production.status_changed` - Status da produção alterado (Kanban)

### Pagamentos
- `payment.created` - Novo pagamento criado
- `payment.updated` - Pagamento atualizado
- `payment.status_changed` - Status do pagamento alterado

### Demandas
- `demand.created` - Nova demanda criada
- `demand.updated` - Demanda atualizada
- `demand.deleted` - Demanda excluída

### Colaboradores
- `collaborator.created` - Novo colaborador criado
- `collaborator.updated` - Colaborador atualizado

### Relatórios
- `report.created` - Novo relatório gerado

## Segurança

### Validar o Webhook Secret

No seu endpoint receptor, valide o header `X-Webhook-Secret`:

```javascript
// Exemplo em Node.js/Express
app.post('/webhook', (req, res) => {
  const secret = req.headers['x-webhook-secret'];
  
  if (secret !== process.env.EXPECTED_WEBHOOK_SECRET) {
    return res.status(401).send('Unauthorized');
  }
  
  // Processar webhook
  const { event, data, timestamp } = req.body;
  console.log(`Received ${event} at ${timestamp}`, data);
  
  res.status(200).send('OK');
});
```

## Integrar em Novas Funções

Para adicionar webhooks em novas funções de dados:

```typescript
import { sendWebhookNotification } from '@/lib/webhooks/send-notification'

export async function minhaFuncao(data: any) {
  // ... sua lógica ...
  
  const resultado = await supabase.from('tabela').insert(data)
  
  // Enviar webhook
  await sendWebhookNotification('meu.evento', resultado)
  
  return resultado
}
```

### Webhook em Lote

Para operações em lote:

```typescript
import { sendBatchWebhookNotification } from '@/lib/webhooks/send-notification'

const eventos = items.map(item => ({
  event: 'item.created',
  data: item
}))

await sendBatchWebhookNotification(eventos)
```

## Exemplo de Endpoint Receptor

### Node.js/Express

```javascript
const express = require('express');
const app = express();

app.use(express.json());

app.post('/webhook', (req, res) => {
  // Validar secret
  const secret = req.headers['x-webhook-secret'];
  if (secret !== process.env.WEBHOOK_SECRET) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  const { event, data, timestamp } = req.body;
  
  console.log(`[${timestamp}] Event: ${event}`);
  console.log('Data:', JSON.stringify(data, null, 2));
  
  // Processar evento
  switch (event) {
    case 'client.created':
      // Enviar email de boas-vindas
      break;
    case 'payment.status_changed':
      // Atualizar sistema de contabilidade
      break;
    // ... outros eventos
  }
  
  res.status(200).json({ received: true });
});

app.listen(3001, () => {
  console.log('Webhook server running on port 3001');
});
```

### Zapier/Make.com

Você também pode usar serviços como Zapier ou Make.com:

1. Crie um novo Zap/Scenario
2. Use "Webhooks" como trigger
3. Copie a URL do webhook
4. Configure `WEBHOOK_URL` com essa URL
5. Configure ações baseadas nos eventos recebidos

## Logs e Debug

Os webhooks incluem logs no console do servidor:

```
[v0] Webhook sent successfully: client.created
[v0] Webhook failed: 500 Internal Server Error
```

Para debug, você pode usar serviços como:
- **webhook.site** - Endpoint temporário para testes
- **RequestBin** - Captura e inspeciona requisições HTTP
- **ngrok** - Túnel local para desenvolvimento

## Webhook de Atualização Manual (n8n)

### Botão "Atualizar Dados" na Página de Tráfego

A página de tráfego pago (`/trafego`) possui um botão "Atualizar Dados" que dispara um webhook para o n8n, permitindo atualizar os dados do Meta Ads sob demanda.

**Payload enviado:**
```json
{
  "action": "update_meta_ads_data",
  "date_range": {
    "start": "2024-01-01",
    "end": "2024-01-31"
  },
  "timestamp": "2024-01-15T10:30:00.000Z"
}
```

**Configuração no n8n:**
1. Crie um workflow com trigger "Webhook"
2. Configure o método como POST
3. Copie a URL do webhook
4. Adicione a variável `NEXT_PUBLIC_N8N_UPDATE_WEBHOOK_URL` com essa URL
5. No workflow, adicione nós para:
   - Conectar à API do Meta Ads
   - Buscar dados do período especificado
   - Inserir/atualizar na tabela `meta_ads_insights_full` do Supabase

**Funcionamento:**
- Ao clicar no botão, o sistema envia uma requisição POST para o webhook do n8n
- O n8n processa a atualização dos dados em background
- Após 5 segundos, a página recarrega os dados automaticamente
- Mensagens de sucesso/erro são exibidas via toast

## Importante

- Os webhooks são fire-and-forget (não bloqueiam a operação)
- Falhas no webhook não afetam o funcionamento do app
- Não há retry automático - implemente lógica de retry no receptor se necessário
- Para produção, considere usar fila de mensagens (ex: Redis, RabbitMQ)

## Próximos Passos

Se você precisar de funcionalidades avançadas como:
- ✅ Retry automático
- ✅ Fila de webhooks
- ✅ Webhooks baseados em database triggers (Supabase)

Entre em contato ou consulte a documentação do Supabase sobre Database Webhooks.
