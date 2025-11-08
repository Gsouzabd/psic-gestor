-- Migration: Criar tabela notifications para armazenar notificações do sistema
-- Notificações são criadas quando pacientes confirmam/cancelam sessões

-- Criar tabela notifications
CREATE TABLE IF NOT EXISTS notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  psicologo_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  type VARCHAR(50) NOT NULL CHECK (type IN ('confirmacao', 'cancelamento')),
  sessao_id UUID NOT NULL REFERENCES sessoes_agendadas(id) ON DELETE CASCADE,
  message TEXT NOT NULL,
  read BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Criar índices para melhor performance
CREATE INDEX IF NOT EXISTS idx_notifications_psicologo_id ON notifications(psicologo_id);
CREATE INDEX IF NOT EXISTS idx_notifications_read ON notifications(read);
CREATE INDEX IF NOT EXISTS idx_notifications_created_at ON notifications(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_notifications_sessao_id ON notifications(sessao_id);

-- Habilitar RLS
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;

-- Política RLS: Psicólogos veem apenas suas próprias notificações
CREATE POLICY "Psicólogos veem suas próprias notificações"
ON notifications
FOR SELECT
USING (psicologo_id = auth.uid());

-- Política RLS: Sistema pode criar notificações (via Edge Function ou RPC)
CREATE POLICY "Sistema pode criar notificações"
ON notifications
FOR INSERT
WITH CHECK (true);

-- Política RLS: Psicólogos podem atualizar suas próprias notificações (marcar como lida)
CREATE POLICY "Psicólogos podem atualizar suas notificações"
ON notifications
FOR UPDATE
USING (psicologo_id = auth.uid());

-- Comentários para documentação
COMMENT ON TABLE notifications IS 'Armazena notificações do sistema para psicólogos, como confirmações/cancelamentos de sessões';
COMMENT ON COLUMN notifications.type IS 'Tipo de notificação: confirmacao ou cancelamento';
COMMENT ON COLUMN notifications.read IS 'Indica se a notificação foi lida pelo psicólogo';

