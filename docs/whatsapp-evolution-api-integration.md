# Integração WhatsApp via Evolution API

## Vis Geral

Este sistema permite que cada agente tenha sua própria instância WhatsApp conectada através da Evolution API. A configuração da URL e chave da Evolution API é feita no nível da organização, e cada agente pode gerenciar sua própria conexão WhatsApp.

## Arquitetura

```
┌─────────────────┐
│  Frontend       │
│  (React)        │
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│  Edge Function  │
│  whatsapp-proxy │
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│  Evolution API  │
│  (WhatsApp)     │
└─────────────────┘
```

## Configuração

### 1. Configurar Evolution API na Organização

Acesse `/organizations` e preencha:
- **Evolution API - URL**: URL base da Evolution API (ex: `http://localhost:8080` ou `https://api.example.com`)
- **Evolution API - Chave**: Chave de autenticação da Evolution API

### 2. Criar Instância WhatsApp para um Agente

1. Acesse `/agents/:id/edit`
2. Vá na aba "WhatsApp"
3. Clique em "Conectar WhatsApp"
4. Sistema cria instância na Evolution API com nome `agent-{agent_id}`
5. Exibe QR code para escanear com WhatsApp
6. Status é atualizado automaticamente a cada 5 segundos quando status = `connecting`
7. Quando conectado, mostra número e status "Conectado"

### 3. Configurar Webhook n8n

1. Crie um webhook no n8n para receber mensagens do WhatsApp
2. No AgentForm, aba WhatsApp, informe a URL do webhook
3. Clique em "Salvar Webhook"
4. A Evolution API passará a enviar mensagens recebidas para o webhook configurado

## Estrutura de Banco de Dados

### Tabela: `organizations`

Novos campos:
- `evolution_api_url` (TEXT): URL da Evolution API
- `evolution_api_key` (TEXT): Chave de autenticação

### Tabela: `whatsapp_instances`

| Campo | Tipo | Descrição |
|-------|------|-----------|
| id | UUID | ID único da instância |
| agent_id | UUID | ID do agente (FK) |
| organization_id | UUID | ID da organização (FK) |
| instance_name | TEXT | Nome único na Evolution API |
| phone_number | TEXT | Número do WhatsApp quando conectado |
| status | VARCHAR(50) | Status: disconnected, connecting, connected, error |
| qr_code | TEXT | QR code base64 temporário |
| qr_code_expires_at | TIMESTAMPTZ | Expiração do QR code |
| error_message | TEXT | Mensagem de erro se houver |
| last_status_check | TIMESTAMPTZ | Última verificação de status |
| webhook_url | TEXT | URL do webhook n8n |
| created_at | TIMESTAMPTZ | Data de criação |
| updated_at | TIMESTAMPTZ | Data de atualização |

## Edge Function: whatsapp-proxy

Localização: `supabase/functions/whatsapp-proxy/index.ts`

### Rotas Disponíveis

| Método | Rota | Descrição |
|--------|------|-----------|
| POST | `/instance/create` | Cria uma nova instância |
| GET | `/instance/connect/{instance}` | Obtém QR code |
| GET | `/instance/connectionState/{instance}` | Obtém status de conexão |
| DELETE | `/instance/delete/{instance}` | Deleta instância |
| POST | `/message/sendText/{instance}` | Envia mensagem de texto |
| POST | `/webhook/set/{instance}` | Configura webhook |
| GET | `/instance/fetchInstances` | Lista todas as instâncias |

### Segurança

- Valida JWT do usuário autenticado
- Verifica se usuário pertence a uma organização ativa
- Busca credenciais Evolution API da organização
- Faz proxy das requisições para Evolution API
- Nunca expõe `evolution_api_key` no frontend

## Serviço Frontend: whatsappService.ts

Localização: `src/services/whatsappService.ts`

### Métodos Disponíveis

```typescript
// Buscar instância do agente
getInstance(agentId: string): Promise<WhatsAppInstance | null>

// Criar instância
createInstance(agentId: string, organizationId: string, instanceName: string): Promise<WhatsAppInstance>

// Obter QR code
getQRCode(instanceName: string): Promise<string | null>

// Obter status de conexão
getConnectionState(instanceName: string): Promise<EvolutionAPIConnectionState | null>

// Deletar instância
deleteInstance(instanceName: string, instanceId: string): Promise<void>

// Enviar mensagem
sendMessage(instanceName: string, to: string, message: string): Promise<void>

// Configurar webhook
setWebhook(instanceName: string, webhookUrl: string): Promise<void>

// Atualizar webhook no banco
updateInstanceWebhook(instanceId: string, webhookUrl: string): Promise<void>

// Sincronizar status
syncInstanceStatus(agentId: string): Promise<WhatsAppInstance | null>

// Atualizar QR code no banco
updateQRCode(instanceId: string, qrCode: string): Promise<void>
```

## Integração com n8n

### Estrutura do Webhook Evolution API

A Evolution API envia mensagens no seguinte formato:

```json
{
  "event": "messages.upsert",
  "instance": "agent-{agent_id}",
  "data": {
    "key": {
      "remoteJid": "5511999999999@s.whatsapp.net",
      "fromMe": false,
      "id": "3EB0XXX"
    },
    "message": {
      "conversation": "Olá, gostaria de fazer uma reserva"
    },
    "messageTimestamp": 1234567890,
    "pushName": "João Silva"
  }
}
```

### Fluxo de Processamento no n8n

1. **Webhook Trigger**: Recebe mensagem da Evolution API
2. **Extrair Dados**:
   - `remoteJid`: Número do remetente
   - `message.conversation` ou `message.extendedTextMessage.text`: Texto da mensagem
   - `instance`: Nome da instância (para identificar o agente)
3. **Chamar Webhook do Agente**:
   ```json
   {
     "agent_id": "uuid-do-agente",
     "session_id": "5511999999999",
     "message": "Olá, gostaria de fazer uma reserva",
     "history": []
   }
   ```
4. **Enviar Resposta**:
   - Usar Edge Function `whatsapp-proxy`
   - POST `/message/sendText/{instance_name}`
   ```json
   {
     "number": "5511999999999",
     "text": "Resposta do agente IA..."
   }
   ```

### Exemplo de Workflow n8n

```
[Webhook Evolution] 
    ↓
[Extract Data]
    - remoteJid
    - message text
    - instance name
    ↓
[Get Agent ID from instance name]
    ↓
[HTTP Request - Agent Webhook]
    - POST webhook_url do agente
    - Body: { agent_id, session_id, message, history }
    ↓
[Get Response]
    ↓
[HTTP Request - Send WhatsApp Message]
    - POST /functions/v1/whatsapp-proxy/message/sendText/{instance}
    - Body: { number, text }
```

## Estados da Instância

| Status | Descrição | Ações Disponíveis |
|--------|-----------|-------------------|
| `disconnected` | Não conectado | Conectar WhatsApp |
| `connecting` | Aguardando conexão (QR code) | Ver QR code, Atualizar |
| `connected` | Conectado | Desconectar, Configurar Webhook |
| `error` | Erro na conexão | Ver Erro, Reconectar |

## Polling e Atualização de Status

Quando o status é `connecting`, o sistema faz polling automático a cada 5 segundos para:
1. Verificar se o QR code foi escaneado
2. Atualizar o status da instância
3. Obter o número do WhatsApp conectado

O polling é interrompido automaticamente quando:
- Status muda para `connected`
- Status muda para `error`
- Usuário sai da aba WhatsApp

## Tratamento de Erros

### Erro: "Evolution API not configured for this organization"
**Solução**: Configure a Evolution API URL e Key em `/organizations`

### Erro: "Failed to create instance in Evolution API"
**Possíveis causas**:
- Evolution API está offline
- Chave da API está incorreta
- Instância com esse nome já existe

### Erro: "Failed to get QR code"
**Possíveis causas**:
- QR code expirou (tenta novamente)
- Instância não está em modo de pareamento

### Erro: "Failed to send message"
**Possíveis causas**:
- WhatsApp não está conectado
- Número de destino inválido
- Limite de mensagens atingido

## Boas Práticas

1. **Nomenclatura de Instâncias**: Use o padrão `agent-{agent_id}` para facilitar identificação
2. **Webhook URL**: Use HTTPS e valide a autenticidade das mensagens
3. **Renovação de QR Code**: QR codes expiram em ~2 minutos, solicite novo se necessário
4. **Monitoramento**: Verifique periodicamente o status das instâncias
5. **Logs**: A Evolution API mantém logs de todas as mensagens enviadas/recebidas

## Limitações

- Uma instância WhatsApp por agente
- QR code expira em aproximadamente 2 minutos
- Evolution API pode ter limites de taxa (rate limits)
- Mensagens de mídia requerem configuração adicional

## Próximos Passos

- [ ] Suporte a mensagens de mídia (imagens, áudios, vídeos)
- [ ] Suporte a mensagens de botões e listas
- [ ] Dashboard de analytics de mensagens WhatsApp
- [ ] Suporte a múltiplas instâncias por agente (multicanal)
- [ ] WebSockets para atualização em tempo real
- [ ] Histórico de mensagens no painel

