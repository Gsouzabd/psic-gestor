-- Migration: Adicionar campo previsao na tabela pagamentos
-- Permite marcar pagamentos como previstos (criados automaticamente em recorrências)

-- Adicionar campo previsao
ALTER TABLE pagamentos 
ADD COLUMN IF NOT EXISTS previsao BOOLEAN NOT NULL DEFAULT false;

-- Comentário para documentação
COMMENT ON COLUMN pagamentos.previsao IS 'true = Pagamento previsto (criado automaticamente em recorrências), false = Pagamento real';

