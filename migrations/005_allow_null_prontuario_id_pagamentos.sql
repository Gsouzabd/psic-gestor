-- Migration: Permitir NULL no campo prontuario_id em pagamentos
-- Pagamentos previstos não têm prontuário ainda (sessão ainda não aconteceu)

-- Tornar prontuario_id nullable
ALTER TABLE pagamentos 
ALTER COLUMN prontuario_id DROP NOT NULL;

-- Comentário para documentação
COMMENT ON COLUMN pagamentos.prontuario_id IS 'ID do prontuário vinculado. NULL = pagamento previsto (sessão ainda não aconteceu) ou pagamento sem prontuário.';
COMMENT ON COLUMN pagamentos.sessao_agendada_id IS 'ID da sessão agendada vinculada. Usado para pagamentos previstos antes da sessão acontecer.';

