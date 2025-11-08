-- Migration: Criar tabela whatsapp_instances
-- Armazena instâncias WhatsApp individuais para cada psicólogo

-- Criar tabela whatsapp_instances
CREATE TABLE IF NOT EXISTS whatsapp_instances (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  psicologo_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  instance_name TEXT NOT NULL UNIQUE,
  phone_number TEXT,
  status VARCHAR(50) NOT NULL DEFAULT 'disconnected' CHECK (status IN ('disconnected', 'connecting', 'connected', 'error')),
  qr_code TEXT,
  qr_code_expires_at TIMESTAMPTZ,
  error_message TEXT,
  last_status_check TIMESTAMPTZ,
  webhook_url TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Criar índices para melhor performance
CREATE INDEX IF NOT EXISTS idx_whatsapp_instances_psicologo_id ON whatsapp_instances(psicologo_id);
CREATE INDEX IF NOT EXISTS idx_whatsapp_instances_status ON whatsapp_instances(status);
CREATE INDEX IF NOT EXISTS idx_whatsapp_instances_instance_name ON whatsapp_instances(instance_name);

-- Trigger para atualizar updated_at
CREATE OR REPLACE FUNCTION update_whatsapp_instances_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_whatsapp_instances_updated_at
  BEFORE UPDATE ON whatsapp_instances
  FOR EACH ROW
  EXECUTE FUNCTION update_whatsapp_instances_updated_at();

-- Habilitar RLS
ALTER TABLE whatsapp_instances ENABLE ROW LEVEL SECURITY;

-- Política RLS: Psicólogos veem apenas suas próprias instâncias
CREATE POLICY "Psicólogos veem apenas suas próprias instâncias WhatsApp"
ON whatsapp_instances
FOR SELECT
USING (psicologo_id = auth.uid());

-- Política RLS: Psicólogos podem criar suas próprias instâncias
CREATE POLICY "Psicólogos podem criar suas próprias instâncias WhatsApp"
ON whatsapp_instances
FOR INSERT
WITH CHECK (psicologo_id = auth.uid());

-- Política RLS: Psicólogos podem atualizar suas próprias instâncias
CREATE POLICY "Psicólogos podem atualizar suas próprias instâncias WhatsApp"
ON whatsapp_instances
FOR UPDATE
USING (psicologo_id = auth.uid())
WITH CHECK (psicologo_id = auth.uid());

-- Política RLS: Psicólogos podem deletar suas próprias instâncias
CREATE POLICY "Psicólogos podem deletar suas próprias instâncias WhatsApp"
ON whatsapp_instances
FOR DELETE
USING (psicologo_id = auth.uid());

-- Comentários para documentação
COMMENT ON TABLE whatsapp_instances IS 'Armazena instâncias WhatsApp individuais para cada psicólogo';
COMMENT ON COLUMN whatsapp_instances.instance_name IS 'Nome único da instância na Evolution API (formato: psicologo-{psicologo_id})';
COMMENT ON COLUMN whatsapp_instances.status IS 'Status da conexão: disconnected, connecting, connected, error';
COMMENT ON COLUMN whatsapp_instances.qr_code IS 'QR code base64 temporário para conexão';
COMMENT ON COLUMN whatsapp_instances.webhook_url IS 'URL do webhook para receber mensagens (opcional)';

