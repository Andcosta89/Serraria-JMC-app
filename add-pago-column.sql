-- SCRIPT PARA ADICIONAR COLUNA "PAGO" EM SERVIÇOS
-- Execute este script no SQL Editor do Supabase

-- 1. Adicionar coluna pago (padrão false)
ALTER TABLE servicos
ADD COLUMN IF NOT EXISTS pago BOOLEAN DEFAULT FALSE;

-- 2. Atualizar serviços antigos concluídos para pago = false, se necessário
-- (O DEFAULT FALSE já resolve pros novos e antigos, mas garante compatibilidade)
UPDATE servicos
SET pago = FALSE
WHERE pago IS NULL;

-- SUCESSO!
