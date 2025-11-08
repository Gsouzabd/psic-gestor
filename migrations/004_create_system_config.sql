-- Migration: Criar tabela system_config para configurações globais
-- Armazena credenciais Evolution API que serão configuradas pelo admin

-- Criar tabela system_config
CREATE TABLE IF NOT EXISTS system_config (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  key TEXT NOT NULL UNIQUE,
  value TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Criar índice para busca rápida por key
CREATE INDEX IF NOT EXISTS idx_system_config_key ON system_config(key);

-- Trigger para atualizar updated_at
CREATE OR REPLACE FUNCTION update_system_config_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_system_config_updated_at
  BEFORE UPDATE ON system_config
  FOR EACH ROW
  EXECUTE FUNCTION update_system_config_updated_at();

-- Habilitar RLS
ALTER TABLE system_config ENABLE ROW LEVEL SECURITY;

-- Política RLS: Apenas admin_master pode ler/escrever
CREATE POLICY "Apenas admin_master pode ler configurações do sistema"
ON system_config
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM profiles
    WHERE profiles.id = auth.uid()
    AND profiles.role = 'admin_master'
  )
);

CREATE POLICY "Apenas admin_master pode escrever configurações do sistema"
ON system_config
FOR ALL
USING (
  EXISTS (
    SELECT 1 FROM profiles
    WHERE profiles.id = auth.uid()
    AND profiles.role = 'admin_master'
  )
);

-- Inserir registros iniciais para Evolution API (valores NULL)
INSERT INTO system_config (key, value)
VALUES 
  ('evolution_api_url', NULL),
  ('evolution_api_key', NULL)
ON CONFLICT (key) DO NOTHING;

-- Comentários para documentação
COMMENT ON TABLE system_config IS 'Armazena configurações globais do sistema, como credenciais Evolution API';
COMMENT ON COLUMN system_config.key IS 'Chave única da configuração (ex: evolution_api_url, evolution_api_key)';
COMMENT ON COLUMN system_config.value IS 'Valor da configuração (pode ser NULL)';

