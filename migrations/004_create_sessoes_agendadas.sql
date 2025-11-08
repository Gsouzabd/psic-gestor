-- Migration: Criar tabela sessoes_agendadas separada de prontuarios
-- Sessões agendadas ficam apenas nesta tabela, não em prontuarios

-- Criar tabela sessoes_agendadas
CREATE TABLE IF NOT EXISTS sessoes_agendadas (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  paciente_id UUID NOT NULL REFERENCES pacientes(id) ON DELETE CASCADE,
  data DATE NOT NULL,
  hora TIME NOT NULL,
  compareceu BOOLEAN, -- NULL = ainda não foi marcado, true = compareceu, false = não compareceu
  recorrencia_id UUID REFERENCES recorrencias(id) ON DELETE SET NULL,
  anotacoes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Adicionar campo sessao_agendada_id em pagamentos para vincular pagamentos previstos
ALTER TABLE pagamentos 
ADD COLUMN IF NOT EXISTS sessao_agendada_id UUID REFERENCES sessoes_agendadas(id) ON DELETE SET NULL;

-- Criar índices para melhor performance
CREATE INDEX IF NOT EXISTS idx_sessoes_agendadas_paciente_id ON sessoes_agendadas(paciente_id);
CREATE INDEX IF NOT EXISTS idx_sessoes_agendadas_data ON sessoes_agendadas(data);
CREATE INDEX IF NOT EXISTS idx_sessoes_agendadas_compareceu ON sessoes_agendadas(compareceu);
CREATE INDEX IF NOT EXISTS idx_sessoes_agendadas_recorrencia_id ON sessoes_agendadas(recorrencia_id);
CREATE INDEX IF NOT EXISTS idx_pagamentos_sessao_agendada_id ON pagamentos(sessao_agendada_id);

-- Migrar dados existentes: mover prontuários com compareceu = null para sessoes_agendadas
INSERT INTO sessoes_agendadas (id, paciente_id, data, hora, compareceu, recorrencia_id, anotacoes, created_at, updated_at)
SELECT 
  id,
  paciente_id,
  data,
  hora,
  compareceu,
  recorrencia_id,
  anotacoes,
  created_at,
  updated_at
FROM prontuarios
WHERE compareceu IS NULL;

-- Atualizar pagamentos que estão vinculados a prontuários agendados (compareceu = null)
-- para vincular às sessões agendadas correspondentes
UPDATE pagamentos p
SET sessao_agendada_id = sa.id
FROM sessoes_agendadas sa
WHERE p.prontuario_id = sa.id
  AND p.prontuario_id IN (SELECT id FROM prontuarios WHERE compareceu IS NULL);

-- Deletar prontuários que foram migrados para sessoes_agendadas
DELETE FROM prontuarios WHERE compareceu IS NULL;

-- Comentários para documentação
COMMENT ON TABLE sessoes_agendadas IS 'Armazena sessões agendadas. Quando compareceu = true, cria prontuário correspondente.';
COMMENT ON COLUMN sessoes_agendadas.compareceu IS 'NULL = ainda não marcado, true = compareceu (cria prontuário), false = não compareceu';
COMMENT ON COLUMN pagamentos.sessao_agendada_id IS 'Vincula pagamento previsto a uma sessão agendada';

-- Habilitar RLS na tabela sessoes_agendadas
ALTER TABLE sessoes_agendadas ENABLE ROW LEVEL SECURITY;

-- Política RLS: Psicólogos veem apenas sessões agendadas de seus pacientes
CREATE POLICY "Psicólogos veem sessões agendadas de seus pacientes"
ON sessoes_agendadas
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM pacientes
    WHERE pacientes.id = sessoes_agendadas.paciente_id
    AND pacientes.psicologo_id = auth.uid()
  )
);

-- Política RLS: Psicólogos inserem sessões agendadas para seus pacientes
CREATE POLICY "Psicólogos inserem sessões agendadas de seus pacientes"
ON sessoes_agendadas
FOR INSERT
WITH CHECK (
  EXISTS (
    SELECT 1 FROM pacientes
    WHERE pacientes.id = sessoes_agendadas.paciente_id
    AND pacientes.psicologo_id = auth.uid()
  )
);

-- Política RLS: Psicólogos atualizam sessões agendadas de seus pacientes
CREATE POLICY "Psicólogos atualizam sessões agendadas de seus pacientes"
ON sessoes_agendadas
FOR UPDATE
USING (
  EXISTS (
    SELECT 1 FROM pacientes
    WHERE pacientes.id = sessoes_agendadas.paciente_id
    AND pacientes.psicologo_id = auth.uid()
  )
);

-- Política RLS: Psicólogos deletam sessões agendadas de seus pacientes
CREATE POLICY "Psicólogos deletam sessões agendadas de seus pacientes"
ON sessoes_agendadas
FOR DELETE
USING (
  EXISTS (
    SELECT 1 FROM pacientes
    WHERE pacientes.id = sessoes_agendadas.paciente_id
    AND pacientes.psicologo_id = auth.uid()
  )
);

