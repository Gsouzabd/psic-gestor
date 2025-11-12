-- Migration: Adicionar suporte para notificações de desconexão do WhatsApp
-- Permite notificações sem sessao_id e adiciona tipo 'whatsapp_disconnect'

-- Remover constraint que exige sessao_id (tornar opcional)
ALTER TABLE notifications 
  ALTER COLUMN sessao_id DROP NOT NULL;

-- Modificar constraint de tipo para incluir 'whatsapp_disconnect'
ALTER TABLE notifications 
  DROP CONSTRAINT IF EXISTS notifications_type_check;

ALTER TABLE notifications 
  ADD CONSTRAINT notifications_type_check 
  CHECK (type IN ('confirmacao', 'cancelamento', 'whatsapp_disconnect'));

-- Atualizar comentário da tabela
COMMENT ON TABLE notifications IS 'Armazena notificações do sistema para psicólogos, incluindo confirmações/cancelamentos de sessões e desconexões do WhatsApp';
COMMENT ON COLUMN notifications.type IS 'Tipo de notificação: confirmacao, cancelamento ou whatsapp_disconnect';
COMMENT ON COLUMN notifications.sessao_id IS 'ID da sessão (opcional, apenas para notificações de sessão)';

