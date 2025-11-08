-- Migration: Adicionar campo notification_token na tabela sessoes_agendadas
-- Permite gerar token único para cada sessão para confirmação pública segura

-- Adicionar campo notification_token
ALTER TABLE sessoes_agendadas
ADD COLUMN IF NOT EXISTS notification_token TEXT UNIQUE;

-- Criar índice para busca rápida por token
CREATE INDEX IF NOT EXISTS idx_sessoes_agendadas_notification_token 
ON sessoes_agendadas(notification_token) 
WHERE notification_token IS NOT NULL;

-- Função para gerar token único (UUID)
-- O token será gerado no código da aplicação, mas podemos criar uma função helper se necessário
-- Por enquanto, vamos apenas garantir que o campo existe

-- Comentário na coluna
COMMENT ON COLUMN sessoes_agendadas.notification_token IS 'Token único para confirmação pública da sessão. Usado na URL /confirmar-sessao/{id}?token={token}';

