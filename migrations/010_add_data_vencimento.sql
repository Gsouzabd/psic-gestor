-- Migration: Adicionar campo data_vencimento na tabela pagamentos
-- data = Data da consulta/sessão
-- data_vencimento = Data em que o pagamento vence (quando deve ser pago)
-- data_pagamento = Data em que o pagamento foi efetivamente realizado

-- Adicionar campo data_vencimento
ALTER TABLE pagamentos 
ADD COLUMN IF NOT EXISTS data_vencimento DATE;

-- Comentário para documentação
COMMENT ON COLUMN pagamentos.data IS 'Data da consulta/sessão';
COMMENT ON COLUMN pagamentos.data_vencimento IS 'Data em que o pagamento vence (quando deve ser pago). NULL = usa data da consulta como vencimento';
COMMENT ON COLUMN pagamentos.data_pagamento IS 'Data em que o pagamento foi efetivamente realizado (NULL = ainda não foi pago)';

-- Criar índice para melhor performance nas consultas por data de vencimento
CREATE INDEX IF NOT EXISTS idx_pagamentos_data_vencimento ON pagamentos(data_vencimento);

