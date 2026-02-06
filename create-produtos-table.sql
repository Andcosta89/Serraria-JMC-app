-- =====================================================
-- SCRIPT PARA CRIAR TABELA DE PRODUTOS PENDENTES
-- Execute este script no SQL Editor do Supabase
-- =====================================================
-- 1. CRIAR TABELA DE PRODUTOS PENDENTES
CREATE TABLE IF NOT EXISTS produtos_pendentes (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    nome_produto TEXT NOT NULL,
    descricao TEXT,
    foto_url TEXT,
    prioridade TEXT NOT NULL DEFAULT 'media' CHECK (prioridade IN ('alta', 'media', 'baixa')),
    ordem INTEGER DEFAULT 0,
    atribuido BOOLEAN DEFAULT FALSE,
    criado_em TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
-- 2. HABILITAR ROW LEVEL SECURITY (RLS)
ALTER TABLE produtos_pendentes ENABLE ROW LEVEL SECURITY;
-- 3. POLÍTICAS DE ACESSO - Apenas Admin
CREATE POLICY "Admin pode ver todos os produtos pendentes" ON produtos_pendentes FOR
SELECT USING (
        EXISTS (
            SELECT 1
            FROM usuarios
            WHERE auth_id = auth.uid()
                AND tipo = 'admin'
        )
    );
CREATE POLICY "Admin pode criar produtos pendentes" ON produtos_pendentes FOR
INSERT WITH CHECK (
        EXISTS (
            SELECT 1
            FROM usuarios
            WHERE auth_id = auth.uid()
                AND tipo = 'admin'
        )
    );
CREATE POLICY "Admin pode atualizar produtos pendentes" ON produtos_pendentes FOR
UPDATE USING (
        EXISTS (
            SELECT 1
            FROM usuarios
            WHERE auth_id = auth.uid()
                AND tipo = 'admin'
        )
    );
CREATE POLICY "Admin pode excluir produtos pendentes" ON produtos_pendentes FOR DELETE USING (
    EXISTS (
        SELECT 1
        FROM usuarios
        WHERE auth_id = auth.uid()
            AND tipo = 'admin'
    )
);
-- =====================================================
-- SCRIPT EXECUTADO COM SUCESSO!
-- Agora você pode usar o sistema de produtos pendentes
-- =====================================================