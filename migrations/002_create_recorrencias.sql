-- Migration: Criar sistema de recorrência para agendamentos
-- Permite criar agendamentos recorrentes (semanal ou quinzenal)

-- Criar tabela de recorrências
CREATE TABLE IF NOT EXISTS recorrencias (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  paciente_id UUID NOT NULL REFERENCES pacientes(id) ON DELETE CASCADE,
  data_inicio DATE NOT NULL,
  hora TIME NOT NULL,
  tipo_recorrencia TEXT NOT NULL CHECK (tipo_recorrencia IN ('semanal', 'quinzenal')),
  data_fim DATE NOT NULL,
  ativo BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Adicionar campos na tabela prontuarios para vincular à recorrência
ALTER TABLE prontuarios 
ADD COLUMN IF NOT EXISTS recorrencia_id UUID REFERENCES recorrencias(id) ON DELETE SET NULL,
ADD COLUMN IF NOT EXISTS ocorrencia_original BOOLEAN DEFAULT false;

-- Criar índices para melhor performance
CREATE INDEX IF NOT EXISTS idx_recorrencias_paciente_id ON recorrencias(paciente_id);
CREATE INDEX IF NOT EXISTS idx_recorrencias_ativo ON recorrencias(ativo);
CREATE INDEX IF NOT EXISTS idx_prontuarios_recorrencia_id ON prontuarios(recorrencia_id);

-- Comentários para documentação
COMMENT ON TABLE recorrencias IS 'Armazena metadados de agendamentos recorrentes';
COMMENT ON COLUMN recorrencias.tipo_recorrencia IS 'semanal = a cada 7 dias, quinzenal = a cada 14 dias';
COMMENT ON COLUMN prontuarios.recorrencia_id IS 'Vincula o prontuário a uma recorrência. NULL = agendamento único';
COMMENT ON COLUMN prontuarios.ocorrencia_original IS 'true = primeira ocorrência da recorrência, false = ocorrência gerada';

-- Habilitar RLS na tabela recorrencias
ALTER TABLE recorrencias ENABLE ROW LEVEL SECURITY;

-- Política RLS: Psicólogos veem apenas recorrências de seus pacientes
CREATE POLICY "Psicólogos veem recorrências de seus pacientes"
ON recorrencias
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM pacientes
    WHERE pacientes.id = recorrencias.paciente_id
    AND pacientes.psicologo_id = auth.uid()
  )
);

-- Política RLS: Psicólogos inserem recorrências para seus pacientes
CREATE POLICY "Psicólogos inserem recorrências de seus pacientes"
ON recorrencias
FOR INSERT
WITH CHECK (
  EXISTS (
    SELECT 1 FROM pacientes
    WHERE pacientes.id = recorrencias.paciente_id
    AND pacientes.psicologo_id = auth.uid()
  )
);

-- Política RLS: Psicólogos atualizam recorrências de seus pacientes
CREATE POLICY "Psicólogos atualizam recorrências de seus pacientes"
ON recorrencias
FOR UPDATE
USING (
  EXISTS (
    SELECT 1 FROM pacientes
    WHERE pacientes.id = recorrencias.paciente_id
    AND pacientes.psicologo_id = auth.uid()
  )
);

-- Política RLS: Psicólogos deletam recorrências de seus pacientes
CREATE POLICY "Psicólogos deletam recorrências de seus pacientes"
ON recorrencias
FOR DELETE
USING (
  EXISTS (
    SELECT 1 FROM pacientes
    WHERE pacientes.id = recorrencias.paciente_id
    AND pacientes.psicologo_id = auth.uid()
  )
);

