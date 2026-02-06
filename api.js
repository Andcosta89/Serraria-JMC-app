// API - Conexão com Supabase
import { SUPABASE_URL, SUPABASE_ANON_KEY } from './config.js';

// Inicializar cliente Supabase
const supabase = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

// ========== AUTENTICAÇÃO ==========

export async function login(email, senha) {
    const { data, error } = await supabase.auth.signInWithPassword({
        email: email,
        password: senha
    });

    if (error) throw error;
    return data;
}

export async function logout() {
    const { error } = await supabase.auth.signOut();
    if (error) throw error;
}

export async function getUsuarioAtual() {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return null;

    // Buscar dados completos do usuário
    const { data: usuario } = await supabase
        .from('usuarios')
        .select('*')
        .eq('auth_id', user.id)
        .single();

    return usuario;
}

export function onAuthChange(callback) {
    return supabase.auth.onAuthStateChange(callback);
}

// ========== SERVIÇOS ==========

export async function getServicos(filtros = {}) {
    let query = supabase
        .from('servicos')
        .select(`
            *,
            marceneiro:usuarios!servicos_marceneiro_id_fkey(id, nome)
        `)
        .order('criado_em', { ascending: false });

    if (filtros.marceneiro_id) {
        query = query.eq('marceneiro_id', filtros.marceneiro_id);
    }

    if (filtros.status) {
        query = query.eq('status', filtros.status);
    }

    const { data, error } = await query;
    if (error) throw error;
    return data;
}

export async function getServico(id) {
    const { data, error } = await supabase
        .from('servicos')
        .select(`
            *,
            marceneiro:usuarios!servicos_marceneiro_id_fkey(id, nome)
        `)
        .eq('id', id)
        .single();

    if (error) throw error;
    return data;
}

export async function criarServico(servico) {
    const { data, error } = await supabase
        .from('servicos')
        .insert([{
            titulo: servico.titulo,
            descricao: servico.descricao,
            marceneiro_id: servico.marceneiro_id,
            valor: servico.valor,
            prazo: servico.prazo,
            foto_url: servico.foto_url,
            status: 'pendente',
            visualizado: false
        }])
        .select()
        .single();

    if (error) throw error;
    return data;
}

export async function atualizarServico(id, dados) {
    const { data, error } = await supabase
        .from('servicos')
        .update(dados)
        .eq('id', id)
        .select()
        .single();

    if (error) throw error;
    return data;
}

export async function deleteServico(id) {
    const { error } = await supabase
        .from('servicos')
        .delete()
        .eq('id', id);

    if (error) throw error;
}

export async function marcarComoVisualizado(id) {
    return atualizarServico(id, { visualizado: true });
}

export async function atualizarStatus(id, status) {
    const dados = { status };
    if (status === 'concluido') {
        dados.concluido_em = new Date().toISOString();
    }
    return atualizarServico(id, dados);
}

// ========== USUÁRIOS (MARCENEIROS) ==========

export async function getMarceneiros() {
    const { data, error } = await supabase
        .from('usuarios')
        .select('*')
        .eq('tipo', 'marceneiro')
        .order('nome');

    if (error) throw error;
    return data;
}

// ========== PAGAMENTOS ==========

export async function getPagamentos(filtros = {}) {
    let query = supabase
        .from('pagamentos')
        .select(`
            *,
            marceneiro:usuarios!pagamentos_marceneiro_id_fkey(id, nome)
        `)
        .order('data', { ascending: false });

    if (filtros.marceneiro_id) {
        query = query.eq('marceneiro_id', filtros.marceneiro_id);
    }

    const { data, error } = await query;
    if (error) throw error;
    return data;
}

export async function criarPagamento(pagamento) {
    const { data, error } = await supabase
        .from('pagamentos')
        .insert([{
            marceneiro_id: pagamento.marceneiro_id,
            valor: pagamento.valor,
            data: pagamento.data,
            observacao: pagamento.observacao
        }])
        .select()
        .single();

    if (error) throw error;
    return data;
}

// ========== FINANÇAS ==========

export async function getResumoFinanceiro(marceneiro_id) {
    // Total de serviços concluídos
    const { data: servicos } = await supabase
        .from('servicos')
        .select('valor')
        .eq('marceneiro_id', marceneiro_id)
        .eq('status', 'concluido');

    const totalServicos = servicos?.reduce((acc, s) => acc + parseFloat(s.valor || 0), 0) || 0;

    // Total de pagamentos
    const { data: pagamentos } = await supabase
        .from('pagamentos')
        .select('valor')
        .eq('marceneiro_id', marceneiro_id);

    const totalPagamentos = pagamentos?.reduce((acc, p) => acc + parseFloat(p.valor || 0), 0) || 0;

    return {
        totalServicos,
        totalPagamentos,
        saldo: totalServicos - totalPagamentos
    };
}

export async function getHistoricoFinanceiro(marceneiro_id) {
    // Buscar serviços concluídos
    const { data: servicos } = await supabase
        .from('servicos')
        .select('id, titulo, valor, concluido_em')
        .eq('marceneiro_id', marceneiro_id)
        .eq('status', 'concluido')
        .order('concluido_em', { ascending: false });

    // Buscar pagamentos
    const { data: pagamentos } = await supabase
        .from('pagamentos')
        .select('id, valor, data, observacao')
        .eq('marceneiro_id', marceneiro_id)
        .order('data', { ascending: false });

    // Combinar e ordenar por data
    const historico = [
        ...(servicos || []).map(s => ({
            id: s.id,
            tipo: 'servico',
            descricao: s.titulo,
            valor: parseFloat(s.valor),
            data: s.concluido_em
        })),
        ...(pagamentos || []).map(p => ({
            id: p.id,
            tipo: 'pagamento',
            descricao: p.observacao || 'Pagamento semanal',
            valor: parseFloat(p.valor),
            data: p.data
        }))
    ].sort((a, b) => new Date(b.data) - new Date(a.data));

    return historico;
}

// ========== ESTATÍSTICAS (ADMIN) ==========

export async function getEstatisticasAdmin() {
    const { data: servicos } = await supabase
        .from('servicos')
        .select('status, valor');

    const stats = {
        total: servicos?.length || 0,
        pendentes: servicos?.filter(s => s.status === 'pendente').length || 0,
        emAndamento: servicos?.filter(s => s.status === 'andamento').length || 0,
        concluidos: servicos?.filter(s => s.status === 'concluido').length || 0,
        valorTotal: servicos?.reduce((acc, s) => acc + parseFloat(s.valor || 0), 0) || 0
    };

    return stats;
}

export async function getSaldosMarceneiros() {
    const marceneiros = await getMarceneiros();
    const saldos = [];

    for (const m of marceneiros) {
        const resumo = await getResumoFinanceiro(m.id);
        saldos.push({
            ...m,
            ...resumo
        });
    }

    return saldos;
}

// ========== PRODUTOS PENDENTES ==========

export async function getProdutosPendentes() {
    const { data, error } = await supabase
        .from('produtos_pendentes')
        .select('*')
        .eq('atribuido', false)
        .order('ordem', { ascending: true })
        .order('criado_em', { ascending: false });

    if (error) throw error;
    return data;
}

export async function criarProdutoPendente(produto) {
    const { data, error } = await supabase
        .from('produtos_pendentes')
        .insert([{
            nome_produto: produto.nome_produto,
            descricao: produto.descricao,
            foto_url: produto.foto_url,
            prioridade: produto.prioridade || 'media',
            ordem: produto.ordem || 0
        }])
        .select()
        .single();

    if (error) throw error;
    return data;
}

export async function atualizarProdutoPendente(id, dados) {
    const { data, error } = await supabase
        .from('produtos_pendentes')
        .update(dados)
        .eq('id', id)
        .select()
        .single();

    if (error) throw error;
    return data;
}

export async function deleteProdutoPendente(id) {
    const { error } = await supabase
        .from('produtos_pendentes')
        .delete()
        .eq('id', id);

    if (error) throw error;
}

export async function converterProdutoEmServico(produtoId, dadosServico) {
    // 1. Buscar produto
    const { data: produto } = await supabase
        .from('produtos_pendentes')
        .select('*')
        .eq('id', produtoId)
        .single();

    if (!produto) throw new Error('Produto não encontrado');

    // 2. Criar serviço com dados do produto + dados adicionais
    const novoServico = {
        titulo: produto.nome_produto,
        descricao: produto.descricao,
        foto_url: produto.foto_url,
        marceneiro_id: dadosServico.marceneiro_id,
        valor: dadosServico.valor,
        prazo: dadosServico.prazo,
        status: 'pendente',
        visualizado: false
    };

    const { data: servico, error: servicoError } = await supabase
        .from('servicos')
        .insert([novoServico])
        .select()
        .single();

    if (servicoError) throw servicoError;

    // 3. Marcar produto como atribuído
    await atualizarProdutoPendente(produtoId, { atribuido: true });

    return servico;
}

// ========== UPLOAD DE IMAGEM ==========

export async function uploadImagem(file) {
    const fileName = `${Date.now()}_${file.name}`;

    const { data, error } = await supabase.storage
        .from('fotos')
        .upload(fileName, file);

    if (error) throw error;

    const { data: urlData } = supabase.storage
        .from('fotos')
        .getPublicUrl(fileName);

    return urlData.publicUrl;
}

// ========== CONTAGEM DE NOVOS SERVIÇOS ==========

export async function getServicosNovos(marceneiro_id) {
    const { data, error } = await supabase
        .from('servicos')
        .select('id')
        .eq('marceneiro_id', marceneiro_id)
        .eq('visualizado', false);

    if (error) throw error;
    return data?.length || 0;
}

export { supabase };
