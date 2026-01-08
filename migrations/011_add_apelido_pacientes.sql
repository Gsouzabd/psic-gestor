-- Migration: Adicionar campo apelido na tabela pacientes
-- Permite cadastrar um apelido opcional para cada paciente

-- Adicionar coluna apelido na tabela pacientes
ALTER TABLE pacientes 
ADD COLUMN IF NOT EXISTS apelido TEXT;

-- Comentário para documentação
COMMENT ON COLUMN pacientes.apelido IS 'Apelido opcional do paciente para uso em notificações personalizadas';

