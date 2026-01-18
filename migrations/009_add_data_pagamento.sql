-- Migration: Adicionar campo data_pagamento separado de data (data da consulta)
-- data = Data da consulta/sessão
-- data_pagamento = Data em que o pagamento foi efetivamente realizado

-- Adicionar campo data_pagamento
ALTER TABLE pagamentos 
ADD COLUMN IF NOT EXISTS data_pagamento DATE;

-- Comentário para documentação
COMMENT ON COLUMN pagamentos.data IS 'Data da consulta/sessão (usado para cálculo de atrasado)';
COMMENT ON COLUMN pagamentos.data_pagamento IS 'Data em que o pagamento foi efetivamente realizado (NULL = ainda não foi pago)';

-- Criar índice para melhor performance nas consultas por data de pagamento
CREATE INDEX IF NOT EXISTS idx_pagamentos_data_pagamento ON pagamentos(data_pagamento);

