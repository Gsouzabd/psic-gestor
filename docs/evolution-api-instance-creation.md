# Integração Evolution API - Criação e Conexão de Instâncias

## Visão Geral

Este documento detalha como o sistema integra com a Evolution API para criar e conectar instâncias WhatsApp. O processo envolve a criação de uma instância na Evolution API, geração de QR code para autenticação e monitoramento do status de conexão.

## Arquitetura da Integração

```
┌─────────────────┐
│   Frontend      │
│  (React/JSX)    │
└────────┬────────┘
         │ HTTP + JWT
         ▼
┌─────────────────┐
│  Edge Function  │
│ whatsapp-proxy  │
│  (Supabase)     │
└────────┬────────┘
         │ HTTP + API Key
         ▼
┌─────────────────┐
│  Evolution API  │
│   (WhatsApp)    │
└─────────────────┘
```

## Pré-requisitos

### 1. Configuração da Evolution API

Antes de criar instâncias, é necessário configurar as credenciais da Evolution API no sistema:

**Localização**: Painel Admin → Configurações → Evolution API

**Campos necessários**:
- **Evolution API - URL**: URL base da Evolution API (ex: `http://localhost:8080` ou `https://api.evolution.com`)
- **Evolution API - Chave**: Chave de autenticação (API Key)

**Armazenamento**: As credenciais são armazenadas na tabela `system_config`:
- Chave: `evolution_api_url`
- Chave: `evolution_api_key`

**Segurança**: As credenciais nunca são expostas no frontend. Apenas a Edge Function `whatsapp-proxy` acessa essas credenciais usando uma função RPC com `SECURITY DEFINER`.

## Fluxo de Criação de Instância

### 1. Requisição do Frontend

O frontend chama o serviço `whatsappService.ts` para criar uma instância:

```typescript
// src/services/whatsappService.ts
createInstance(psicologoId: string, instanceName?: string)
```

**Parâmetros**:
- `psicologoId`: ID do psicólogo (UUID)
- `instanceName`: Nome opcional da instância (padrão: `psicologo-{psicologoId}`)

**Exemplo de chamada**:
```typescript
const instance = await createInstance('123e4567-e89b-12d3-a456-426614174000')
```

### 2. Processamento na Edge Function

A Edge Function `whatsapp-proxy` processa a requisição:

**Rota**: `POST /instance/create`

**Fluxo interno**:

1. **Autenticação**:
   - Valida o token JWT do usuário
   - Verifica se o usuário tem perfil de psicólogo
   - Obtém o `psicologo_id` do usuário

2. **Validação**:
   - Verifica se a Evolution API está configurada
   - Verifica se já existe uma instância com o mesmo nome

3. **Criação na Evolution API**:
   ```typescript
   // supabase/functions/whatsapp-proxy/index.ts
   const evolutionResponse = await proxyToEvolutionAPI(
     evolutionConfig,
     'POST',
     `/instance/create`,
     { 
       instanceName, 
       integration: 'WHATSAPP-BAILEYS', // Padrão: Baileys
       qrcode: true  // Solicita QR code na criação
     }
   )
   ```

4. **Persistência no Banco**:
   ```sql
   INSERT INTO whatsapp_instances (
     psicologo_id,
     instance_name,
     status
   ) VALUES (
     :psicologo_id,
     :instance_name,
     'connecting'
   )
   ```

### 3. Requisição para Evolution API

**Endpoint Evolution API**: `POST {evolution_api_url}/instance/create`

**Headers**:
```
apikey: {evolution_api_key}
Content-Type: application/json
```

**Body**:
```json
{
  "instanceName": "psicologo-123e4567-e89b-12d3-a456-426614174000",
  "integration": "WHATSAPP-BAILEYS",
  "qrcode": true
}
```

**Resposta de Sucesso** (200):
```json
{
  "instance": {
    "instanceName": "psicologo-123e4567-e89b-12d3-a456-426614174000",
    "status": "created"
  }
}
```

**Resposta de Erro** (400/500):
```json
{
  "error": "Instance already exists"
}
```

### 4. Resposta ao Frontend

**Sucesso**:
```json
{
  "id": "uuid-da-instancia",
  "psicologo_id": "123e4567-e89b-12d3-a456-426614174000",
  "instance_name": "psicologo-123e4567-e89b-12d3-a456-426614174000",
  "status": "connecting",
  "created_at": "2025-01-15T10:30:00Z",
  "updated_at": "2025-01-15T10:30:00Z"
}
```

**Erro**:
```json
{
  "error": "Instância já existe"
}
```

## Fluxo de Conexão (QR Code)

### 1. Obter QR Code

Após criar a instância, o frontend solicita o QR code para conexão:

```typescript
// src/services/whatsappService.ts
getQRCode(instanceName: string)
```

**Rota Edge Function**: `GET /instance/connect/{instanceName}`

### 2. Processamento na Edge Function

1. **Validação de Propriedade**:
   - Verifica se a instância pertence ao psicólogo autenticado
   - Consulta a tabela `whatsapp_instances` para validar `psicologo_id`

2. **Proxy para Evolution API**:
   ```typescript
   return proxyToEvolutionAPI(
     evolutionConfig,
     'GET',
     `/instance/connect/${instanceName}`
   )
   ```

### 3. Requisição para Evolution API

**Endpoint**: `GET {evolution_api_url}/instance/connect/{instanceName}`

**Headers**:
```
apikey: {evolution_api_key}
```

**Resposta de Sucesso** (200):
```json
{
  "code": "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAA...",
  "base64": "iVBORw0KGgoAAAANSUhEUgAA..."
}
```

**Resposta quando já conectado**:
```json
{
  "code": null,
  "base64": null
}
```

### 4. Processamento do QR Code no Frontend

O serviço `whatsappService.ts` processa diferentes formatos de resposta:

```typescript
// Suporta múltiplos formatos:
// - String direta (base64)
// - data.base64
// - data.code
// - data.qrcode.base64
// - data.qrcode.code
// - data.instance.qrcode
```

**Atualização no Banco**:
```typescript
await updateQRCode(instanceId, qrCode)
// Define qr_code_expires_at para 2 minutos no futuro
```

### 5. Exibição do QR Code

O frontend exibe o QR code em formato base64:

```jsx
<img 
  src={`data:image/png;base64,${qrCode}`} 
  alt="QR Code WhatsApp"
/>
```

## Monitoramento de Status de Conexão

### 1. Verificação de Status

O frontend verifica periodicamente o status da conexão:

```typescript
// src/services/whatsappService.ts
getConnectionState(instanceName: string)
```

**Rota Edge Function**: `GET /instance/connectionState/{instanceName}`

### 2. Requisição para Evolution API

**Endpoint**: `GET {evolution_api_url}/instance/connectionState/{instanceName}`

**Resposta de Sucesso** (200):
```json
{
  "instance": "psicologo-123e4567-e89b-12d3-a456-426614174000",
  "state": "open",
  "status": "5511999999999@s.whatsapp.net"
}
```

**Estados possíveis**:
- `open`: Conectado
- `close`: Desconectado
- `connecting`: Aguardando conexão

### 3. Sincronização de Status

O serviço `syncInstanceStatus()` mapeia os estados da Evolution API para o status interno:

```typescript
// Mapeamento de estados
if (state === 'open' || state === 'connected') {
  status = 'connected'
  phoneNumber = connectionState.status // Número do WhatsApp
} else if (state === 'connecting') {
  status = 'connecting'
} else if (state === 'close' || state === 'closed') {
  status = 'disconnected'
  // Instância é deletada automaticamente
}
```

**Atualização no Banco**:
```sql
UPDATE whatsapp_instances
SET 
  status = :status,
  phone_number = :phone_number,
  error_message = :error_message,
  last_status_check = NOW()
WHERE id = :id
```

### 4. Polling Automático

Quando o status é `connecting`, o frontend faz polling a cada 5 segundos:

```typescript
// Polling automático enquanto status === 'connecting'
const interval = setInterval(async () => {
  const updated = await syncInstanceStatus(psicologoId)
  if (updated?.status !== 'connecting') {
    clearInterval(interval) // Para quando conecta ou erro
  }
}, 5000)
```

## Estrutura de Dados

### Tabela: `whatsapp_instances`

```sql
CREATE TABLE whatsapp_instances (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  psicologo_id UUID NOT NULL REFERENCES profiles(id),
  instance_name TEXT NOT NULL UNIQUE,
  phone_number TEXT,
  status VARCHAR(50) NOT NULL DEFAULT 'disconnected',
  qr_code TEXT,
  qr_code_expires_at TIMESTAMPTZ,
  error_message TEXT,
  last_status_check TIMESTAMPTZ,
  webhook_url TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
```

**Campos importantes**:
- `instance_name`: Nome único na Evolution API (formato: `psicologo-{psicologo_id}`)
- `status`: `disconnected` | `connecting` | `connected` | `error`
- `qr_code`: Base64 do QR code (temporário, expira em 2 minutos)
- `phone_number`: Número do WhatsApp quando conectado

### Tabela: `system_config`

```sql
CREATE TABLE system_config (
  key TEXT PRIMARY KEY,
  value TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
```

**Registros para Evolution API**:
- `evolution_api_url`: URL da Evolution API
- `evolution_api_key`: Chave de autenticação

## Função RPC: `get_evolution_api_config`

Esta função RPC é usada pela Edge Function para obter as credenciais:

```sql
CREATE OR REPLACE FUNCTION get_evolution_api_config()
RETURNS TABLE(url TEXT, key TEXT)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    MAX(CASE WHEN sc.key = 'evolution_api_url' THEN sc.value END) as url,
    MAX(CASE WHEN sc.key = 'evolution_api_key' THEN sc.value END) as key
  FROM system_config sc
  WHERE sc.key IN ('evolution_api_url', 'evolution_api_key');
END;
$$;
```

**Segurança**: Usa `SECURITY DEFINER` para bypass de RLS, permitindo que a Edge Function acesse as credenciais mesmo sem permissões diretas na tabela.

## Tratamento de Erros

### Erro: "Evolution API não configurada"

**Causa**: Credenciais não foram configuradas no painel Admin.

**Solução**: 
1. Acessar `/admin`
2. Configurar "Evolution API - URL" e "Evolution API - Chave"
3. Salvar configurações

### Erro: "Instância já existe"

**Causa**: Tentativa de criar instância com nome duplicado.

**Solução**: 
- Deletar instância existente primeiro
- Ou usar um `instanceName` diferente

### Erro: "Token inválido ou expirado"

**Causa**: JWT expirado ou inválido.

**Solução**: 
- Fazer login novamente
- Verificar se o token está sendo enviado no header `Authorization`

### Erro: "Instância não encontrada ou sem permissão"

**Causa**: Tentativa de acessar instância de outro psicólogo.

**Solução**: Verificar se o `instanceName` corresponde ao psicólogo autenticado.

### Erro ao obter QR Code

**Causas possíveis**:
- QR code expirou (válido por ~2 minutos)
- Instância já está conectada
- Instância não existe na Evolution API

**Solução**: 
- Solicitar novo QR code
- Verificar status da instância
- Recriar instância se necessário

### Erro: "Erro ao conectar com Evolution API"

**Causas possíveis**:
- Evolution API está offline
- URL da Evolution API está incorreta
- Chave da API está incorreta
- Problemas de rede/firewall

**Solução**: 
- Verificar se a Evolution API está rodando
- Testar URL e chave diretamente
- Verificar logs da Edge Function

## Fluxo Completo: Diagrama

```
┌─────────────┐
│  Frontend   │
└──────┬──────┘
       │ 1. createInstance()
       ▼
┌──────────────────┐
│ whatsappService  │
└──────┬───────────┘
       │ 2. POST /instance/create
       ▼
┌──────────────────┐
│  Edge Function   │
│  whatsapp-proxy  │
└──────┬───────────┘
       │ 3. Valida JWT
       │ 4. getEvolutionAPIConfig()
       │ 5. Verifica se existe
       │ 6. POST Evolution API
       ▼
┌──────────────────┐
│  Evolution API   │
└──────┬───────────┘
       │ 7. Cria instância
       │ 8. Retorna sucesso
       ▼
┌──────────────────┐
│  Edge Function   │
└──────┬───────────┘
       │ 9. INSERT whatsapp_instances
       │ 10. status = 'connecting'
       ▼
┌──────────────────┐
│  Frontend         │
└──────┬───────────┘
       │ 11. getQRCode()
       ▼
┌──────────────────┐
│  Edge Function   │
└──────┬───────────┘
       │ 12. GET Evolution API /connect
       ▼
┌──────────────────┐
│  Evolution API   │
└──────┬───────────┘
       │ 13. Retorna QR code
       ▼
┌──────────────────┐
│  Frontend         │
└──────┬───────────┘
       │ 14. Exibe QR code
       │ 15. Polling getConnectionState()
       │ 16. Usuário escaneia QR code
       ▼
┌──────────────────┐
│  Evolution API   │
└──────┬───────────┘
       │ 17. Conecta WhatsApp
       │ 18. state = 'open'
       ▼
┌──────────────────┐
│  Frontend         │
└──────┬───────────┘
       │ 19. syncInstanceStatus()
       │ 20. status = 'connected'
       │ 21. phone_number atualizado
       ▼
┌──────────────────┐
│  Banco de Dados  │
└──────────────────┘
```

## Código de Referência

### Edge Function: Criação de Instância

```232:296:supabase/functions/whatsapp-proxy/index.ts
    if (pathname.startsWith('/instance/create') && req.method === 'POST') {
      const body = await req.json();
      const instanceName = body.instanceName || `psicologo-${psicologoId}`;

      // Verificar se instância já existe
      const { data: existingInstance } = await supabase
        .from('whatsapp_instances')
        .select('id')
        .eq('instance_name', instanceName)
        .single();

      if (existingInstance) {
        return new Response(
          JSON.stringify({ error: 'Instância já existe' }),
          {
            status: 400,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          }
        );
      }

      // Criar instância na Evolution API
      // Evolution API requer o campo 'integration' (WHATSAPP-BAILEYS ou WHATSAPP-BUSINESS)
      const evolutionResponse = await proxyToEvolutionAPI(
        evolutionConfig,
        'POST',
        `/instance/create`,
        { 
          instanceName, 
          integration: 'WHATSAPP-BAILEYS', // Usar BAILEYS como padrão
          qrcode: true 
        }
      );

      if (!evolutionResponse.ok) {
        return evolutionResponse;
      }

      // Salvar instância no banco
      const { data: instanceData, error: dbError } = await supabase
        .from('whatsapp_instances')
        .insert({
          psicologo_id: psicologoId,
          instance_name: instanceName,
          status: 'connecting',
        })
        .select()
        .single();

      if (dbError) {
        console.error('Erro ao salvar instância:', dbError);
        return new Response(
          JSON.stringify({ error: 'Erro ao salvar instância no banco' }),
          {
            status: 500,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          }
        );
      }

      return new Response(JSON.stringify(instanceData), {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }
```

### Serviço Frontend: Criação de Instância

```56:77:src/services/whatsappService.ts
export async function createInstance(psicologoId: string, instanceName?: string): Promise<WhatsAppInstance> {
  try {
    const name = instanceName || `psicologo-${psicologoId}`
    
    const response = await callEdgeFunction('/instance/create', {
      method: 'POST',
      body: JSON.stringify({ instanceName: name }),
    })

    if (!response.ok) {
      const error = await response.json()
      throw new Error(error.error || 'Erro ao criar instância')
    }

    const data = await response.json()
    return data as WhatsAppInstance
  } catch (error) {
    console.error('Erro ao criar instância:', error)
    throw error
  }
}
```

### Serviço Frontend: Obter QR Code

```79:158:src/services/whatsappService.ts
export async function getQRCode(instanceName: string): Promise<string | null> {
  try {
    const response = await callEdgeFunction(`/instance/connect/${instanceName}`, {
      method: 'GET',
    })

    if (!response.ok) {
      const error = await response.json()
      throw new Error(error.error || 'Erro ao obter QR code')
    }

    const data = await response.json()
    console.log('Resposta Evolution API para QR code:', data)
    
    // A Evolution API pode retornar o QR code em diferentes formatos
    // Tentar diferentes propriedades possíveis
    
    // Se for string direta (base64)
    if (typeof data === 'string') {
      // Verificar se é base64 válido
      if (data.startsWith('data:image') || data.length > 100) {
        // Remover prefixo data:image se existir
        const base64 = data.includes(',') ? data.split(',')[1] : data
        return base64
      }
      return data
    }
    
    // Verificar propriedades comuns
    if (data.base64) {
      const base64 = typeof data.base64 === 'string' ? data.base64 : data.base64.code || data.base64.base64
      if (base64) {
        // Remover prefixo se existir
        return base64.includes(',') ? base64.split(',')[1] : base64
      }
    }
    
    if (data.code) {
      return data.code
    }
    
    if (data.qrcode) {
      if (typeof data.qrcode === 'string') {
        return data.qrcode.includes(',') ? data.qrcode.split(',')[1] : data.qrcode
      }
      if (data.qrcode.base64) {
        return data.qrcode.base64.includes(',') ? data.qrcode.base64.split(',')[1] : data.qrcode.base64
      }
      if (data.qrcode.code) {
        return data.qrcode.code
      }
    }
    
    // Verificar se há uma propriedade 'qrcode' como objeto aninhado
    if (data.qrcode?.base64) {
      const base64 = data.qrcode.base64
      return base64.includes(',') ? base64.split(',')[1] : base64
    }
    
    if (data.qrcode?.code) {
      return data.qrcode.code
    }
    
    // Verificar se há uma propriedade 'qrcode' no primeiro nível
    if (data.instance?.qrcode) {
      const qrcode = data.instance.qrcode
      if (typeof qrcode === 'string') {
        return qrcode.includes(',') ? qrcode.split(',')[1] : qrcode
      }
      return qrcode.base64 || qrcode.code || null
    }
    
    console.warn('Formato de QR code não reconhecido. Dados recebidos:', JSON.stringify(data).substring(0, 500))
    return null
  } catch (error) {
    console.error('Erro ao obter QR code:', error)
    throw error
  }
}
```

## Boas Práticas

1. **Nomenclatura de Instâncias**: Use sempre o padrão `psicologo-{psicologo_id}` para facilitar identificação e evitar conflitos.

2. **Validação de Propriedade**: Sempre verifique se a instância pertence ao psicólogo antes de realizar operações.

3. **Tratamento de QR Code**: QR codes expiram rapidamente (~2 minutos). Implemente renovação automática se necessário.

4. **Polling Inteligente**: Faça polling apenas quando necessário (status `connecting`). Pare quando conectado ou em erro.

5. **Limpeza Automática**: Instâncias desconectadas são deletadas automaticamente para evitar dados órfãos.

6. **Logs**: Mantenha logs detalhados nas Edge Functions para facilitar debug.

7. **Tratamento de Erros**: Sempre trate erros da Evolution API e forneça mensagens claras ao usuário.

## Limitações Conhecidas

- **Uma instância por psicólogo**: O sistema permite apenas uma instância WhatsApp por psicólogo.
- **QR Code temporário**: QR codes expiram em aproximadamente 2 minutos.
- **Rate Limits**: A Evolution API pode ter limites de taxa (rate limits) que não são controlados pelo sistema.
- **Dependência da Evolution API**: O sistema depende da disponibilidade da Evolution API para funcionar.

## Próximas Melhorias

- [ ] Suporte a múltiplas instâncias por psicólogo
- [ ] Renovação automática de QR code
- [ ] WebSockets para atualização em tempo real (sem polling)
- [ ] Retry automático em caso de falhas temporárias
- [ ] Cache de credenciais da Evolution API na Edge Function
- [ ] Métricas e monitoramento de instâncias


