-- =====================================================
-- SCRIPT DE CONFIGURAÇÃO DO BANCO DE DADOS - SERRARIA
-- Execute este script no SQL Editor do Supabase
-- =====================================================

-- 1. TABELA DE USUÁRIOS
CREATE TABLE IF NOT EXISTS usuarios (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    auth_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    nome TEXT NOT NULL,
    email TEXT UNIQUE NOT NULL,
    tipo TEXT NOT NULL CHECK (tipo IN ('admin', 'marceneiro')),
    criado_em TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 2. TABELA DE SERVIÇOS
CREATE TABLE IF NOT EXISTS servicos (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    titulo TEXT NOT NULL,
    descricao TEXT,
    marceneiro_id UUID REFERENCES usuarios(id) ON DELETE SET NULL,
    valor DECIMAL(10,2) NOT NULL DEFAULT 0,
    prazo DATE,
    status TEXT NOT NULL DEFAULT 'pendente' CHECK (status IN ('pendente', 'andamento', 'concluido')),
    foto_url TEXT,
    visualizado BOOLEAN DEFAULT FALSE,
    criado_em TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    concluido_em TIMESTAMP WITH TIME ZONE
);

-- 3. TABELA DE PAGAMENTOS
CREATE TABLE IF NOT EXISTS pagamentos (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    marceneiro_id UUID REFERENCES usuarios(id) ON DELETE SET NULL,
    valor DECIMAL(10,2) NOT NULL,
    data DATE NOT NULL DEFAULT CURRENT_DATE,
    observacao TEXT,
    criado_em TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 4. HABILITAR ROW LEVEL SECURITY (RLS)
ALTER TABLE usuarios ENABLE ROW LEVEL SECURITY;
ALTER TABLE servicos ENABLE ROW LEVEL SECURITY;
ALTER TABLE pagamentos ENABLE ROW LEVEL SECURITY;

-- 5. POLÍTICAS DE ACESSO - USUARIOS
CREATE POLICY "Usuarios podem ver todos os usuarios" ON usuarios
    FOR SELECT USING (true);

CREATE POLICY "Usuarios podem atualizar proprio perfil" ON usuarios
    FOR UPDATE USING (auth.uid() = auth_id);

-- 6. POLÍTICAS DE ACESSO - SERVICOS
CREATE POLICY "Admin pode ver todos os servicos" ON servicos
    FOR SELECT USING (
        EXISTS (SELECT 1 FROM usuarios WHERE auth_id = auth.uid() AND tipo = 'admin')
    );

CREATE POLICY "Marceneiro pode ver seus servicos" ON servicos
    FOR SELECT USING (
        marceneiro_id IN (SELECT id FROM usuarios WHERE auth_id = auth.uid())
    );

CREATE POLICY "Admin pode criar servicos" ON servicos
    FOR INSERT WITH CHECK (
        EXISTS (SELECT 1 FROM usuarios WHERE auth_id = auth.uid() AND tipo = 'admin')
    );

CREATE POLICY "Admin pode atualizar servicos" ON servicos
    FOR UPDATE USING (
        EXISTS (SELECT 1 FROM usuarios WHERE auth_id = auth.uid() AND tipo = 'admin')
    );

CREATE POLICY "Marceneiro pode atualizar seus servicos" ON servicos
    FOR UPDATE USING (
        marceneiro_id IN (SELECT id FROM usuarios WHERE auth_id = auth.uid())
    );

-- 7. POLÍTICAS DE ACESSO - PAGAMENTOS
CREATE POLICY "Admin pode ver todos os pagamentos" ON pagamentos
    FOR SELECT USING (
        EXISTS (SELECT 1 FROM usuarios WHERE auth_id = auth.uid() AND tipo = 'admin')
    );

CREATE POLICY "Marceneiro pode ver seus pagamentos" ON pagamentos
    FOR SELECT USING (
        marceneiro_id IN (SELECT id FROM usuarios WHERE auth_id = auth.uid())
    );

CREATE POLICY "Admin pode criar pagamentos" ON pagamentos
    FOR INSERT WITH CHECK (
        EXISTS (SELECT 1 FROM usuarios WHERE auth_id = auth.uid() AND tipo = 'admin')
    );

-- 8. CRIAR BUCKET PARA FOTOS
INSERT INTO storage.buckets (id, name, public) 
VALUES ('fotos', 'fotos', true)
ON CONFLICT DO NOTHING;

-- 9. POLÍTICA DE ACESSO AO STORAGE
CREATE POLICY "Qualquer um pode ver fotos" ON storage.objects
    FOR SELECT USING (bucket_id = 'fotos');

CREATE POLICY "Usuarios autenticados podem fazer upload" ON storage.objects
    FOR INSERT WITH CHECK (
        bucket_id = 'fotos' AND auth.role() = 'authenticated'
    );

-- =====================================================
-- APÓS EXECUTAR O SCRIPT ACIMA, CRIE OS USUÁRIOS
-- VÁ EM: Authentication > Users > Add user
-- =====================================================

/*
USUÁRIOS PARA CRIAR MANUALMENTE NO SUPABASE (Authentication > Users):

1. Admin
   - Email: admin@serraria.com
   - Password: admin123

2. Cleirton
   - Email: cleirton@serraria.com
   - Password: cleirton123

3. Dedé
   - Email: dede@serraria.com
   - Password: dede123

4. Rodrigo
   - Email: rodrigo@serraria.com
   - Password: rodrigo123

5. Joselio
   - Email: joselio@serraria.com
   - Password: joselio123

DEPOIS DE CRIAR OS USUÁRIOS, EXECUTE O SCRIPT ABAIXO
PARA VINCULAR OS USUÁRIOS À TABELA 'usuarios':
*/

-- =====================================================
-- EXECUTE ESTE SEGUNDO SCRIPT APÓS CRIAR OS USUÁRIOS
-- Substitua os UUIDs pelos IDs gerados pelo Supabase
-- =====================================================

/*
-- Copie os UUIDs dos usuários criados em Authentication > Users
-- e substitua abaixo:

INSERT INTO usuarios (auth_id, nome, email, tipo) VALUES
('UUID_DO_ADMIN_AQUI', 'Andre Costa', 'admin@serraria.com', 'admin'),
('UUID_DO_CLEIRTON_AQUI', 'Cleirton', 'cleirton@serraria.com', 'marceneiro'),
('UUID_DO_DEDE_AQUI', 'Dedé', 'dede@serraria.com', 'marceneiro'),
('UUID_DO_RODRIGO_AQUI', 'Rodrigo', 'rodrigo@serraria.com', 'marceneiro'),
('UUID_DO_JOSELIO_AQUI', 'Joselio', 'joselio@serraria.com', 'marceneiro');
*/
