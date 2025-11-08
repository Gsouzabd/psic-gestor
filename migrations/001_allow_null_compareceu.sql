-- Migration: Permitir NULL no campo compareceu para suportar status "Agendado"
-- NULL = Agendado, true = Compareceu, false = Não compareceu

-- Alterar tabela prontuarios
ALTER TABLE prontuarios 
ALTER COLUMN compareceu DROP NOT NULL;

-- Alterar tabela pagamentos
ALTER TABLE pagamentos 
ALTER COLUMN compareceu DROP NOT NULL;

-- Comentário para documentação
COMMENT ON COLUMN prontuarios.compareceu IS 'NULL = Agendado, true = Compareceu, false = Não compareceu';
COMMENT ON COLUMN pagamentos.compareceu IS 'NULL = Agendado, true = Compareceu, false = Não compareceu';

