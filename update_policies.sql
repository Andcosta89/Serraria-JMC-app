-- =====================================================
-- ATUALIZAÇÃO DE POLÍTICAS - PERMITIR DELETAR SERVIÇOS
-- Execute este script no SQL Editor do Supabase
-- =====================================================

-- 1. Política para permitir que ADM deletion serviços
CREATE POLICY "Admin pode deletar servicos" ON servicos
    FOR DELETE USING (
        EXISTS (SELECT 1 FROM usuarios WHERE auth_id = auth.uid() AND tipo = 'admin')
    );

-- Nota: Esta política garante que apenas usuários com tipo 'admin' 
-- na tabela 'usuarios' possam remover registros da tabela 'servicos'.
