// Main.js - Aplicação principal
import * as api from './api.js';

// Estado global da aplicação
const state = {
    usuario: null,
    servicos: [],
    marceneiros: [],
    produtosPendentes: [], // NOVO: produtos em backlog
    servicosNovos: 0,
    resumoFinanceiro: null,
    loading: true,
    filtroAdmin: 'todos' // filtro inicial
};

// ========== INICIALIZAÇÃO ==========

async function init() {
    renderLoading();

    // Verificar se há usuário logado
    try {
        state.usuario = await api.getUsuarioAtual();

        if (state.usuario) {
            await carregarDados();
            renderDashboard();
        } else {
            renderLogin();
        }
    } catch (error) {
        console.error('Erro na inicialização:', error);
        renderLogin();
    }

    // Listener para mudanças de autenticação
    api.onAuthChange(async (event, session) => {
        if (event === 'SIGNED_OUT') {
            state.usuario = null;
            renderLogin();
        }
    });
}

async function carregarDados() {
    try {
        if (state.usuario.tipo === 'admin') {
            state.marceneiros = await api.getMarceneiros();
            state.servicos = await api.getServicos();
            state.estatisticas = await api.getEstatisticasAdmin();
            state.saldosMarceneiros = await api.getSaldosMarceneiros();
            state.produtosPendentes = await api.getProdutosPendentes(); // NOVO
        } else {
            state.servicos = await api.getServicos({ marceneiro_id: state.usuario.id });
            state.servicosNovos = await api.getServicosNovos(state.usuario.id);
            state.resumoFinanceiro = await api.getResumoFinanceiro(state.usuario.id);
        }
    } catch (error) {
        console.error('Erro ao carregar dados:', error);
    }
}

// ========== RENDERS ==========

function renderLoading() {
    document.getElementById('app').innerHTML = `
        <div class="login-page">
            <div class="spinner"></div>
        </div>
    `;
}

function renderLogin() {
    document.getElementById('app').innerHTML = `
        <div class="login-page">
            <img src="logo.jpg" alt="JMC Madeiras" class="login-brand-img">
            <div class="login-subtitle">Gerenciador de Serviços</div>
            
            <div class="card login-card">
                <div id="login-error" class="login-error hidden"></div>
                
                <form id="login-form">
                    <div class="form-group">
                        <label class="form-label">Email</label>
                        <input type="email" class="form-input" id="email" placeholder="seu@email.com" required>
                    </div>
                    
                    <div class="form-group">
                        <label class="form-label">Senha</label>
                        <input type="password" class="form-input" id="senha" placeholder="••••••••" required>
                    </div>
                    
                    <button type="submit" class="btn btn-primary btn-block" id="btn-login">
                        Entrar
                    </button>
                </form>
            </div>
        </div>
    `;

    document.getElementById('login-form').addEventListener('submit', handleLogin);
}

async function handleLogin(e) {
    e.preventDefault();

    const email = document.getElementById('email').value;
    const senha = document.getElementById('senha').value;
    const btnLogin = document.getElementById('btn-login');
    const errorDiv = document.getElementById('login-error');

    btnLogin.disabled = true;
    btnLogin.textContent = 'Entrando...';
    errorDiv.classList.add('hidden');

    try {
        await api.login(email, senha);
        state.usuario = await api.getUsuarioAtual();
        await carregarDados();
        renderDashboard();
    } catch (error) {
        console.error('Erro no login:', error);
        errorDiv.textContent = 'Email ou senha incorretos';
        errorDiv.classList.remove('hidden');
        btnLogin.disabled = false;
        btnLogin.textContent = 'Entrar';
    }
}

function renderDashboard() {
    if (state.usuario.tipo === 'admin') {
        renderAdminDashboard();
    } else {
        renderMarceneiroDashboard();
    }
}

// ========== DASHBOARD ADMIN ==========

function renderAdminDashboard() {
    const stats = state.estatisticas || { total: 0, pendentes: 0, emAndamento: 0, concluidos: 0 };

    document.getElementById('app').innerHTML = `
        <header class="header">
            <div class="header-title">🪵 Serraria</div>
            <div class="header-user">
                <span>${state.usuario.nome} <small style="opacity: 0.7">(Admin)</small></span>
                <button class="header-avatar" onclick="handleLogout()">${state.usuario.nome.charAt(0)}</button>
            </div>
        </header>
        
        <div class="dashboard">
            <div class="dashboard-header">
                <div class="welcome-text">Bem-vindo,</div>
                <div class="welcome-name">${state.usuario.nome}</div>
            </div>
            
            <div class="stats-grid">
                <div class="stat-card ${state.filtroAdmin === 'todos' ? 'active-filter' : ''}" 
                     onclick="filtrarServicosAdmin('todos')" style="cursor: pointer">
                    <div class="stat-value">${stats.total}</div>
                    <div class="stat-label">Total</div>
                </div>
                <div class="stat-card ${state.filtroAdmin === 'pendente' ? 'active-filter' : ''}" 
                     onclick="filtrarServicosAdmin('pendente')" style="cursor: pointer">
                    <div class="stat-value warning">${stats.pendentes}</div>
                    <div class="stat-label">Pendentes</div>
                </div>
                <div class="stat-card ${state.filtroAdmin === 'andamento' ? 'active-filter' : ''}" 
                     onclick="filtrarServicosAdmin('andamento')" style="cursor: pointer">
                    <div class="stat-value info">${stats.emAndamento}</div>
                    <div class="stat-label">Em Andamento</div>
                </div>
                <div class="stat-card ${state.filtroAdmin === 'concluido' ? 'active-filter' : ''}" 
                     onclick="filtrarServicosAdmin('concluido')" style="cursor: pointer">
                    <div class="stat-value positive">${stats.concluidos}</div>
                    <div class="stat-label">A Pagar</div>
                </div>
                <div class="stat-card ${state.filtroAdmin === 'pago' ? 'active-filter' : ''}" 
                     onclick="filtrarServicosAdmin('pago')" style="cursor: pointer">
                    <div class="stat-value" style="color: var(--text-secondary)">${stats.pagos}</div>
                    <div class="stat-label">Pagos</div>
                </div>
            </div>
            
            <div class="tabs">
                <button class="tab active" data-tab="servicos">Serviços</button>
                <button class="tab" data-tab="produtos">
                    Produtos Pendentes
                    ${state.produtosPendentes.length > 0 ? `<span class="badge badge-novo">${state.produtosPendentes.length}</span>` : ''}
                </button>
                <button class="tab" data-tab="marceneiros">Marceneiros</button>
                <button class="tab" data-tab="pagamentos">Pagamentos</button>
            </div>
            
            <div id="tab-content">
                ${renderServicosTab()}
            </div>
        </div>
        
        <button class="fab" onclick="openNovoServicoModal()">+</button>
        
        <div id="modal-container"></div>
    `;

    // Event listeners das tabs
    document.querySelectorAll('.tab').forEach(tab => {
        tab.addEventListener('click', (e) => {
            document.querySelectorAll('.tab').forEach(t => t.classList.remove('active'));
            e.target.classList.add('active');

            const tabName = e.target.dataset.tab;
            if (tabName === 'servicos') {
                document.getElementById('tab-content').innerHTML = renderServicosTab();
            } else if (tabName === 'produtos') {
                document.getElementById('tab-content').innerHTML = renderProdutosTab();
            } else if (tabName === 'marceneiros') {
                document.getElementById('tab-content').innerHTML = renderMarceneirosTab();
            } else if (tabName === 'pagamentos') {
                document.getElementById('tab-content').innerHTML = renderPagamentosTab();
            }
        });
    });
}

function renderServicosTab() {
    let servicosFiltrados = state.servicos;

    if (state.filtroAdmin === 'pago') {
        servicosFiltrados = state.servicos.filter(s => s.pago);
    } else {
        servicosFiltrados = state.servicos.filter(s => !s.pago);
        if (state.filtroAdmin !== 'todos') {
            servicosFiltrados = servicosFiltrados.filter(s => s.status === state.filtroAdmin);
        }
    }

    if (servicosFiltrados.length === 0) {
        return `
            <div class="empty-state">
                <div class="empty-state-icon">📋</div>
                <p>Nenhum serviço encontrado para este filtro</p>
                <button class="btn btn-primary mt-md" onclick="openNovoServicoModal()">Criar primeiro serviço</button>
            </div>
        `;
    }

    // Agrupar por marceneiro
    const grupos = {};
    for (const servico of servicosFiltrados) {
        const nome = servico.marceneiro?.nome || 'Sem Marceneiro';
        const id = servico.marceneiro_id || 'sem-marceneiro';
        if (!grupos[id]) grupos[id] = { nome, servicos: [] };
        grupos[id].servicos.push(servico);
    }

    return `
        <div class="service-list">
            ${Object.entries(grupos).map(([grupoId, grupo]) => `
                <div class="marceneiro-group" id="grupo-${grupoId}">
                    <div class="marceneiro-group-header" onclick="toggleGrupoMarceneiro('${grupoId}')">
                        <div class="marceneiro-group-info">
                            <span class="marceneiro-group-avatar">${grupo.nome.charAt(0).toUpperCase()}</span>
                            <span class="marceneiro-group-name">👷 ${grupo.nome}</span>
                            <span class="marceneiro-group-count">${grupo.servicos.length} serviço${grupo.servicos.length !== 1 ? 's' : ''}</span>
                        </div>
                        <span class="marceneiro-group-arrow" id="arrow-${grupoId}">▼</span>
                    </div>
                    <div class="marceneiro-group-body" id="body-${grupoId}">
                        ${grupo.servicos.map(servico => renderServicoCard(servico, true)).join('')}
                    </div>
                </div>
            `).join('')}
        </div>
    `;
}

window.toggleGrupoMarceneiro = function (grupoId) {
    const body = document.getElementById(`body-${grupoId}`);
    const arrow = document.getElementById(`arrow-${grupoId}`);
    if (!body) return;
    const isOpen = !body.classList.contains('collapsed');
    body.classList.toggle('collapsed', isOpen);
    arrow.textContent = isOpen ? '▶' : '▼';
};

function renderMarceneirosTab() {
    return `
        <div class="marceneiro-grid">
            ${(state.saldosMarceneiros || []).map(m => `
                <div class="card marceneiro-card" onclick="openMarceneiroModal('${m.id}')">
                    <div class="marceneiro-avatar">${m.nome.charAt(0)}</div>
                    <div class="marceneiro-name">${m.nome}</div>
                    <div class="marceneiro-balance ${m.saldo >= 0 ? 'positive' : 'negative'}">
                        ${formatarMoeda(m.saldo)}
                    </div>
                </div>
            `).join('')}
        </div>
    `;
}

function renderProdutosTab() {
    if (state.produtosPendentes.length === 0) {
        return `
            <div class="empty-state">
                <div class="empty-state-icon">📦</div>
                <p>Nenhum produto pendente</p>
                <button class="btn btn-primary mt-md" onclick="openNovoProdutoModal()">Cadastrar primeiro produto</button>
            </div>
        `;
    }

    const prioridadeBadge = {
        alta: '<span class="badge badge-prioridade-alta">Alta</span>',
        media: '<span class="badge badge-prioridade-media">Média</span>',
        baixa: '<span class="badge badge-prioridade-baixa">Baixa</span>'
    };

    return `
        <div class="mb-md">
            <button class="btn btn-primary btn-block" onclick="openNovoProdutoModal()">
                ➕ Cadastrar Produto
            </button>
        </div>
        <div class="service-list">
            ${state.produtosPendentes.map(produto => `
                <div class="card service-card produto-card">
                    ${produto.foto_url ? `<img src="${produto.foto_url}" class="service-image" alt="Foto do produto">` : ''}
                    
                    <div class="service-header">
                        <div class="service-title">${produto.nome_produto}</div>
                        ${prioridadeBadge[produto.prioridade]}
                    </div>
                    
                    ${produto.descricao ? `<p class="text-muted">${produto.descricao}</p>` : ''}
                    
                    <div class="service-meta">
                        <div class="service-meta-item">📅 ${formatarData(produto.criado_em)}</div>
                    </div>
                    
                    <div class="service-actions mt-md">
                        <button class="btn btn-primary" onclick="openAtribuirMarceneiroModal('${produto.id}')">
                            👷 Atribuir ao Marceneiro
                        </button>
                    </div>
                    
                    <div class="service-actions mt-sm">
                        <button class="btn btn-secondary btn-sm" onclick="openEditarProdutoModal('${produto.id}')">✏️ Editar</button>
                        <button class="btn btn-danger btn-sm" onclick="handleExcluirProduto('${produto.id}')">🗑️ Excluir</button>
                    </div>
                </div>
            `).join('')}
        </div>
    `;
}

function renderPagamentosTab() {
    const container = `
        <div class="service-list">
            <button class="btn btn-primary btn-block" onclick="openNovoPagamentoModal()">
                💰 Registrar Pagamento
            </button>
            <div class="mt-md" id="pagamentos-lista">
                <div class="empty-state"><div class="spinner"></div></div>
            </div>
        </div>
    `;

    setTimeout(async () => {
        const listaDiv = document.getElementById('pagamentos-lista');
        if (!listaDiv) return;
        try {
            const pagamentos = await api.getPagamentos();
            if (pagamentos.length === 0) {
                listaDiv.innerHTML = '<div class="empty-state"><p>Nenhum pagamento registrado</p></div>';
                return;
            }
            listaDiv.innerHTML = pagamentos.map(p => `
                <div class="card service-card" style="margin-bottom: var(--space-md);">
                    <div class="service-header">
                        <div class="service-title">${p.marceneiro?.nome || 'Marceneiro'}</div>
                        <span class="badge badge-concluido">Pago</span>
                    </div>
                    <p class="text-muted">${p.observacao || 'Pagamento semanal'}</p>
                    <div class="service-meta">
                        <div class="service-meta-item">📅 ${formatarData(p.data)}</div>
                    </div>
                    <div class="service-value" style="color: var(--danger);">-${formatarMoeda(p.valor)}</div>
                    <div class="service-actions">
                        <button class="btn btn-secondary btn-sm" onclick="openEditarPagamentoModal('${p.id}')">✏️ Editar</button>
                        <button class="btn btn-danger btn-sm" onclick="handleExcluirPagamento('${p.id}')">🗑️ Excluir</button>
                    </div>
                </div>
            `).join('');
        } catch (error) {
            listaDiv.innerHTML = '<div class="empty-state"><p>Erro ao carregar pagamentos</p></div>';
        }
    }, 50);

    return container;
}

// ========== DASHBOARD MARCENEIRO ==========

function renderMarceneiroDashboard() {
    const resumo = state.resumoFinanceiro || { totalServicos: 0, totalPagamentos: 0, saldo: 0 };
    const saldoClass = resumo.saldo >= 0 ? 'positive' : 'negative';

    document.getElementById('app').innerHTML = `
        <header class="header">
            <div class="header-title">🪵 Serraria</div>
            <div class="header-user">
                ${state.servicosNovos > 0 ? `<span class="badge badge-novo">${state.servicosNovos}</span>` : ''}
                <button class="header-avatar" onclick="handleLogout()">${state.usuario.nome.charAt(0)}</button>
            </div>
        </header>
        
        <div class="dashboard">
            <div class="dashboard-header">
                <div class="welcome-text">Olá,</div>
                <div class="welcome-name">${state.usuario.nome}</div>
            </div>
            
            <div class="card finance-card">
                <div class="finance-row">
                    <span class="finance-label">Serviços concluídos</span>
                    <span class="finance-value positive">${formatarMoeda(resumo.totalServicos)}</span>
                </div>
                <div class="finance-row">
                    <span class="finance-label">Pagamentos recebidos</span>
                    <span class="finance-value">${formatarMoeda(resumo.totalPagamentos)}</span>
                </div>
                <div class="finance-row">
                    <span class="finance-label"><strong>Saldo</strong></span>
                    <span class="finance-value ${saldoClass}"><strong>${formatarMoeda(resumo.saldo)}</strong></span>
                </div>
            </div>
            
            <div class="tabs">
                <button class="tab active" data-tab="pendentes">Pendentes</button>
                <button class="tab" data-tab="andamento">Em Andamento</button>
                <button class="tab" data-tab="concluidos">Concluídos</button>
                <button class="tab" data-tab="pagos">Pagos (Histórico)</button>
            </div>
            
            <div id="tab-content">
                ${renderServicosMarceneiroTab('pendente')}
            </div>
        </div>
        
        <div id="modal-container"></div>
    `;

    // Event listeners das tabs
    document.querySelectorAll('.tab').forEach(tab => {
        tab.addEventListener('click', (e) => {
            document.querySelectorAll('.tab').forEach(t => t.classList.remove('active'));
            e.target.classList.add('active');

            const tabName = e.target.dataset.tab;
            let status = 'pendente';
            if (tabName === 'andamento') status = 'andamento';
            if (tabName === 'concluidos') status = 'concluido';
            if (tabName === 'pagos') status = 'pago';

            document.getElementById('tab-content').innerHTML = renderServicosMarceneiroTab(status);
        });
    });
}

function renderServicosMarceneiroTab(status) {
    let servicos;
    
    if (status === 'pago') {
        servicos = state.servicos.filter(s => s.pago);
    } else {
        servicos = state.servicos.filter(s => s.status === status && !s.pago);
    }

    if (servicos.length === 0) {
        const mensagens = {
            pendente: 'Nenhum serviço pendente',
            andamento: 'Nenhum serviço em andamento',
            concluido: 'Nenhum serviço concluído (aguardando pagamento)',
            pago: 'Nenhum serviço pago no histórico'
        };

        return `
            <div class="empty-state">
                <div class="empty-state-icon">✨</div>
                <p>${mensagens[status]}</p>
            </div>
        `;
    }

    return `
        <div class="service-list">
            ${servicos.map(servico => renderServicoCard(servico, false)).join('')}
        </div>
    `;
}

// ========== COMPONENTES ==========

function renderServicoCard(servico, isAdmin) {
    const statusBadge = {
        pendente: '<span class="badge badge-pendente">Pendente</span>',
        andamento: '<span class="badge badge-andamento">Em Andamento</span>',
        concluido: servico.pago ? '<span class="badge" style="background: rgba(160, 160, 184, 0.15); color: #a0a0b8; border: 1px solid rgba(160, 160, 184, 0.4);">✔ Pago</span>' : '<span class="badge badge-concluido">Concluído</span>'
    };

    const novoClass = !servico.visualizado && !isAdmin ? 'novo' : '';

    let actions = '';
    if (!isAdmin) {
        if (servico.status === 'pendente') {
            actions = `
                <div class="service-actions">
                    <button class="btn btn-primary" onclick="iniciarServico('${servico.id}')">▶ Iniciar</button>
                </div>
            `;
        } else if (servico.status === 'andamento') {
            actions = `
                <div class="service-actions">
                    <button class="btn btn-success" onclick="concluirServico('${servico.id}')">✓ Concluir</button>
                </div>
            `;
        }
    }

    return `
        <div class="card service-card ${novoClass}" onclick="marcarVisualizado('${servico.id}')">
            ${servico.foto_url ? `<img src="${servico.foto_url}" class="service-image" alt="Foto do serviço">` : ''}
            
            <div class="service-header">
                <div class="service-title">${servico.titulo}</div>
                ${statusBadge[servico.status]}
            </div>
            
            ${servico.descricao ? `<p class="text-muted">${servico.descricao}</p>` : ''}
            
            <div class="service-meta">
                ${isAdmin ? `<div class="service-meta-item">👷 ${servico.marceneiro?.nome || 'N/A'}</div>` : ''}
                <div class="service-meta-item">📅 ${formatarData(servico.prazo)}</div>
            </div>
            
            <div class="service-value">${formatarMoeda(servico.valor)}</div>
            
            ${actions}
            ${isAdmin && servico.status === 'concluido' && !servico.pago ? `
                <div class="service-actions mt-sm">
                    <button class="btn btn-success btn-block" onclick="handleMarcarComoPago('${servico.id}')">✔ Prestar Conta</button>
                </div>
            ` : ''}
            ${isAdmin ? `
                <div class="service-actions mt-sm">
                    <button class="btn btn-secondary btn-sm" onclick="openEditarServicoModal('${servico.id}')">✏️ Editar</button>
                    ${!servico.pago ? `<button class="btn btn-danger btn-sm" onclick="handleExcluirServico('${servico.id}')">🗑️ Excluir</button>` : ''}
                </div>
            ` : ''}
        </div>
    `;
}

// ========== MODAIS ==========

function openNovoServicoModal() {
    const marceneirosOptions = state.marceneiros.map(m =>
        `<option value="${m.id}">${m.nome}</option>`
    ).join('');

    document.getElementById('modal-container').innerHTML = `
        <div class="modal-overlay" onclick="closeModal(event)">
            <div class="modal" onclick="event.stopPropagation()">
                <div class="modal-header">
                    <div class="modal-title">Novo Serviço</div>
                    <button class="modal-close" onclick="closeModal()">&times;</button>
                </div>
                
                
                <form id="servico-form">
                    <input type="hidden" id="servico-id">
                    <div class="modal-body">
                        <div class="form-group">
                            <label class="form-label">Título *</label>
                            <input type="text" class="form-input" id="titulo" required placeholder="Ex: Mesa de madeira">
                        </div>
                        
                        <div class="form-group">
                            <label class="form-label">Descrição</label>
                            <textarea class="form-textarea" id="descricao" placeholder="Detalhes do serviço..."></textarea>
                        </div>
                        
                        <div class="form-group">
                            <label class="form-label">Marceneiro *</label>
                            <select class="form-select" id="marceneiro_id" required>
                                <option value="">Selecione...</option>
                                ${marceneirosOptions}
                            </select>
                        </div>
                        
                        <div class="form-group">
                            <label class="form-label">Valor (R$) *</label>
                            <input type="number" class="form-input" id="valor" required placeholder="0,00" step="0.01" min="0">
                        </div>
                        
                        <div class="form-group">
                            <label class="form-label">Prazo *</label>
                            <input type="date" class="form-input" id="prazo" required>
                        </div>
                        
                        <div class="form-group">
                            <label class="form-label">Foto do Projeto</label>
                            <div id="image-upload-container">
                                <label class="image-upload" id="image-upload">
                                    <input type="file" accept="image/*" onchange="handleImageUpload(event)">
                                    <div class="image-upload-icon">📷</div>
                                    <div class="image-upload-text">Clique para adicionar foto</div>
                                </label>
                            </div>
                        </div>
                    </div>
                    
                    <div class="modal-footer">
                        <button type="submit" class="btn btn-primary btn-block" id="btn-salvar">
                            Salvar Serviço
                        </button>
                    </div>
                </form>
            </div>
        </div>
    `;

    document.getElementById('servico-form').addEventListener('submit', handleSalvarServico);
}

function openNovoPagamentoModal() {
    const marceneirosOptions = state.marceneiros.map(m =>
        `<option value="${m.id}">${m.nome}</option>`
    ).join('');

    document.getElementById('modal-container').innerHTML = `
        <div class="modal-overlay" onclick="closeModal(event)">
            <div class="modal" onclick="event.stopPropagation()">
                <div class="modal-header">
                    <div class="modal-title">Registrar Pagamento</div>
                    <button class="modal-close" onclick="closeModal()">&times;</button>
                </div>
                
                <form id="pagamento-form">
                    <div class="modal-body">
                        <div class="form-group">
                            <label class="form-label">Marceneiro *</label>
                            <select class="form-select" id="marceneiro_id" required>
                                <option value="">Selecione...</option>
                                ${marceneirosOptions}
                            </select>
                        </div>
                        
                        <div class="form-group">
                            <label class="form-label">Valor (R$) *</label>
                            <input type="number" class="form-input" id="valor" required placeholder="0,00" step="0.01" min="0">
                        </div>
                        
                        <div class="form-group">
                            <label class="form-label">Data *</label>
                            <input type="date" class="form-input" id="data" required value="${new Date().toISOString().split('T')[0]}">
                        </div>
                        
                        <div class="form-group">
                            <label class="form-label">Observação</label>
                            <input type="text" class="form-input" id="observacao" placeholder="Ex: Pagamento semanal">
                        </div>
                    </div>
                    
                    <div class="modal-footer">
                        <button type="submit" class="btn btn-primary btn-block">
                            💰 Registrar Pagamento
                        </button>
                    </div>
                </form>
            </div>
        </div>
    `;

    document.getElementById('pagamento-form').addEventListener('submit', handleSalvarPagamento);
}

function openNovoProdutoModal() {
    document.getElementById('modal-container').innerHTML = `
        <div class="modal-overlay" onclick="closeModal(event)">
            <div class="modal" onclick="event.stopPropagation()">
                <div class="modal-header">
                    <div class="modal-title">Cadastrar Produto</div>
                    <button class="modal-close" onclick="closeModal()">&times;</button>
                </div>
                
                <form id="produto-form">
                    <input type="hidden" id="produto-id">
                    <div class="modal-body">
                        <div class="form-group">
                            <label class="form-label">Nome do Produto *</label>
                            <input type="text" class="form-input" id="nome_produto" required placeholder="Ex: Mesa de madeira">
                        </div>
                        
                        <div class="form-group">
                            <label class="form-label">Descrição</label>
                            <textarea class="form-textarea" id="descricao_produto" placeholder="Detalhes do produto..."></textarea>
                        </div>
                        
                        <div class="form-group">
                            <label class="form-label">Prioridade *</label>
                            <select class="form-select" id="prioridade" required>
                                <option value="media">Média</option>
                                <option value="alta">Alta</option>
                                <option value="baixa">Baixa</option>
                            </select>
                        </div>
                        
                        <div class="form-group">
                            <label class="form-label">Foto do Produto</label>
                            <div id="produto-image-upload-container">
                                <label class="image-upload" id="produto-image-upload">
                                    <input type="file" accept="image/*" onchange="handleProdutoImageUpload(event)">
                                    <div class="image-upload-icon">📷</div>
                                    <div class="image-upload-text">Clique para adicionar foto</div>
                                </label>
                            </div>
                        </div>
                    </div>
                    
                    <div class="modal-footer">
                        <button type="submit" class="btn btn-primary btn-block" id="btn-salvar-produto">
                            Salvar Produto
                        </button>
                    </div>
                </form>
            </div>
        </div>
    `;

    document.getElementById('produto-form').addEventListener('submit', handleSalvarProduto);
}

function openEditarProdutoModal(id) {
    const produto = state.produtosPendentes.find(p => p.id === id);
    if (!produto) return;

    openNovoProdutoModal();

    document.querySelector('.modal-title').textContent = 'Editar Produto';
    document.getElementById('btn-salvar-produto').textContent = 'Atualizar Produto';

    document.getElementById('produto-id').value = produto.id;
    document.getElementById('nome_produto').value = produto.nome_produto;
    document.getElementById('descricao_produto').value = produto.descricao || '';
    document.getElementById('prioridade').value = produto.prioridade;

    if (produto.foto_url) {
        document.getElementById('produto-image-upload-container').innerHTML = `
            <div class="image-preview">
                <img src="${produto.foto_url}" alt="Preview">
                <div class="text-sm text-center text-muted mt-xs">Foto atual</div>
            </div>
            <div class="mt-xs">
                <label class="image-upload" style="height: auto; padding: 10px;">
                    <input type="file" accept="image/*" onchange="handleProdutoImageUpload(event)">
                    <div class="text-sm">Alterar foto</div>
                </label>
            </div>
        `;
    }
}

function openAtribuirMarceneiroModal(produtoId) {
    const produto = state.produtosPendentes.find(p => p.id === produtoId);
    if (!produto) return;

    const marceneirosOptions = state.marceneiros.map(m =>
        `<option value="${m.id}">${m.nome}</option>`
    ).join('');

    document.getElementById('modal-container').innerHTML = `
        <div class="modal-overlay" onclick="closeModal(event)">
            <div class="modal" onclick="event.stopPropagation()">
                <div class="modal-header">
                    <div class="modal-title">Atribuir ao Marceneiro</div>
                    <button class="modal-close" onclick="closeModal()">&times;</button>
                </div>
                
                <form id="atribuir-form">
                    <input type="hidden" id="produto_id_converter" value="${produtoId}">
                    <div class="modal-body">
                        <div class="card" style="background: #2a2a3e; padding: 1rem; margin-bottom: 1rem;">
                            <div style="font-size: 0.875rem; color: #a0a0b0; margin-bottom: 0.5rem;">Produto selecionado:</div>
                            <div style="font-weight: 600; color: #fff;">${produto.nome_produto}</div>
                            ${produto.descricao ? `<div style="font-size: 0.875rem; color: #a0a0b0; margin-top: 0.25rem;">${produto.descricao}</div>` : ''}
                        </div>
                        
                        <div class="form-group">
                            <label class="form-label">Marceneiro *</label>
                            <select class="form-select" id="marceneiro_id_atribuir" required>
                                <option value="">Selecione...</option>
                                ${marceneirosOptions}
                            </select>
                        </div>
                        
                        <div class="form-group">
                            <label class="form-label">Valor (R$) *</label>
                            <input type="number" class="form-input" id="valor_atribuir" required placeholder="0,00" step="0.01" min="0">
                        </div>
                        
                        <div class="form-group">
                            <label class="form-label">Prazo *</label>
                            <input type="date" class="form-input" id="prazo_atribuir" required>
                        </div>
                    </div>
                    
                    <div class="modal-footer">
                        <button type="submit" class="btn btn-primary btn-block">
                            ✓ Criar Serviço e Atribuir
                        </button>
                    </div>
                </form>
            </div>
        </div>
    `;

    document.getElementById('atribuir-form').addEventListener('submit', handleConverterProduto);
}

function closeModal(event) {
    if (event && event.target !== event.currentTarget) return;
    document.getElementById('modal-container').innerHTML = '';
}

// ========== HANDLERS ==========

let imagemSelecionada = null;

window.handleImageUpload = function (event) {
    const file = event.target.files[0];
    if (!file) return;

    imagemSelecionada = file;

    const reader = new FileReader();
    reader.onload = function (e) {
        document.getElementById('image-upload-container').innerHTML = `
            <div class="image-preview">
                <img src="${e.target.result}" alt="Preview">
                <button type="button" class="image-preview-remove" onclick="removeImage()">×</button>
            </div>
        `;
    };
    reader.readAsDataURL(file);
};

window.removeImage = function () {
    imagemSelecionada = null;
    document.getElementById('image-upload-container').innerHTML = `
        <label class="image-upload" id="image-upload">
            <input type="file" accept="image/*" onchange="handleImageUpload(event)">
            <div class="image-upload-icon">📷</div>
            <div class="image-upload-text">Clique para adicionar foto</div>
        </label>
    `;
};

async function handleSalvarServico(e) {
    e.preventDefault();

    const btn = document.getElementById('btn-salvar');
    btn.disabled = true;
    btn.textContent = 'Salvando...';

    try {
        const id = document.getElementById('servico-id').value;
        const dados = {
            titulo: document.getElementById('titulo').value,
            descricao: document.getElementById('descricao').value,
            marceneiro_id: document.getElementById('marceneiro_id').value,
            valor: document.getElementById('valor').value,
            prazo: document.getElementById('prazo').value
        };

        let foto_url = null;
        if (imagemSelecionada) {
            foto_url = await api.uploadImagem(imagemSelecionada);
            dados.foto_url = foto_url;
        }

        if (id) {
            await api.atualizarServico(id, dados);
        } else {
            dados.foto_url = foto_url; // Para criação, se houver foto
            await api.criarServico(dados);
        }

        imagemSelecionada = null;
        closeModal();
        await carregarDados();
        renderDashboard();
    } catch (error) {
        console.error('Erro ao salvar:', error);
        alert('Erro ao salvar serviço. Tente novamente.');
        btn.disabled = false;
        btn.textContent = 'Salvar Serviço';
    }
}

async function handleSalvarPagamento(e) {
    e.preventDefault();

    const btn = e.target.querySelector('button[type="submit"]');
    btn.disabled = true;
    btn.textContent = 'Salvando...';

    try {
        await api.criarPagamento({
            marceneiro_id: document.getElementById('marceneiro_id').value,
            valor: document.getElementById('valor').value,
            data: document.getElementById('data').value,
            observacao: document.getElementById('observacao').value
        });

        closeModal();
        await carregarDados();
        renderDashboard();
    } catch (error) {
        console.error('Erro ao salvar:', error);
        alert('Erro ao registrar pagamento. Tente novamente.');
        btn.disabled = false;
        btn.textContent = '💰 Registrar Pagamento';
    }
}

// ========== HANDLERS PRODUTOS PENDENTES ==========

let imagemProdutoSelecionada = null;

window.handleProdutoImageUpload = function (event) {
    const file = event.target.files[0];
    if (!file) return;

    imagemProdutoSelecionada = file;

    const reader = new FileReader();
    reader.onload = function (e) {
        document.getElementById('produto-image-upload-container').innerHTML = `
            <div class="image-preview">
                <img src="${e.target.result}" alt="Preview">
                <button type="button" class="image-preview-remove" onclick="removeProdutoImage()">×</button>
            </div>
        `;
    };
    reader.readAsDataURL(file);
};

window.removeProdutoImage = function () {
    imagemProdutoSelecionada = null;
    document.getElementById('produto-image-upload-container').innerHTML = `
        <label class="image-upload" id="produto-image-upload">
            <input type="file" accept="image/*" onchange="handleProdutoImageUpload(event)">
            <div class="image-upload-icon">📷</div>
            <div class="image-upload-text">Clique para adicionar foto</div>
        </label>
    `;
};

async function handleSalvarProduto(e) {
    e.preventDefault();

    const btn = document.getElementById('btn-salvar-produto');
    btn.disabled = true;
    btn.textContent = 'Salvando...';

    try {
        const id = document.getElementById('produto-id').value;
        const dados = {
            nome_produto: document.getElementById('nome_produto').value,
            descricao: document.getElementById('descricao_produto').value,
            prioridade: document.getElementById('prioridade').value
        };

        let foto_url = null;
        if (imagemProdutoSelecionada) {
            foto_url = await api.uploadImagem(imagemProdutoSelecionada);
            dados.foto_url = foto_url;
        }

        if (id) {
            await api.atualizarProdutoPendente(id, dados);
        } else {
            await api.criarProdutoPendente(dados);
        }

        imagemProdutoSelecionada = null;
        closeModal();
        await carregarDados();
        renderDashboard();
    } catch (error) {
        console.error('Erro ao salvar produto:', error);
        alert('Erro ao salvar produto. Tente novamente.');
        btn.disabled = false;
        btn.textContent = id ? 'Atualizar Produto' : 'Salvar Produto';
    }
}

window.handleExcluirProduto = async function (id) {
    if (!confirm('Tem certeza que deseja excluir este produto?')) return;

    try {
        await api.deleteProdutoPendente(id);
        await carregarDados();
        renderDashboard();
    } catch (error) {
        console.error('Erro ao excluir produto:', error);
        alert('Erro ao excluir produto. Tente novamente.');
    }
};

async function handleConverterProduto(e) {
    e.preventDefault();

    const btn = e.target.querySelector('button[type="submit"]');
    btn.disabled = true;
    btn.textContent = 'Convertendo...';

    try {
        const produtoId = document.getElementById('produto_id_converter').value;
        const dadosServico = {
            marceneiro_id: document.getElementById('marceneiro_id_atribuir').value,
            valor: document.getElementById('valor_atribuir').value,
            prazo: document.getElementById('prazo_atribuir').value
        };

        await api.converterProdutoEmServico(produtoId, dadosServico);

        closeModal();
        await carregarDados();
        renderDashboard();
    } catch (error) {
        console.error('Erro ao converter produto:', error);
        alert('Erro ao converter produto em serviço. Tente novamente.');
        btn.disabled = false;
        btn.textContent = '✓ Criar Serviço e Atribuir';
    }
}

// Exportar funções globais
window.openNovoProdutoModal = openNovoProdutoModal;
window.openEditarProdutoModal = openEditarProdutoModal;
window.openAtribuirMarceneiroModal = openAtribuirMarceneiroModal;

window.iniciarServico = async function (id) {
    try {
        await api.atualizarStatus(id, 'andamento');
        await carregarDados();
        renderDashboard();
    } catch (error) {
        console.error('Erro:', error);
        alert('Erro ao atualizar status');
    }
};

window.concluirServico = async function (id) {
    try {
        await api.atualizarStatus(id, 'concluido');
        await carregarDados();
        renderDashboard();
    } catch (error) {
        console.error('Erro:', error);
        alert('Erro ao atualizar status');
    }
};

window.handleMarcarComoPago = async function (id) {
    if (!confirm('Deseja marcar este serviço como Acertado/Pago? Ele será movido para o histórico.')) return;
    try {
        await api.marcarServicoComoPago(id);
        await carregarDados();
        renderDashboard();
    } catch (error) {
        console.error('Erro:', error);
        alert('Erro ao marcar serviço como pago');
    }
};

window.marcarVisualizado = async function (id) {
    const servico = state.servicos.find(s => s.id === id);
    if (servico && !servico.visualizado && state.usuario.tipo !== 'admin') {
        try {
            await api.marcarComoVisualizado(id);
            servico.visualizado = true;
            state.servicosNovos = Math.max(0, state.servicosNovos - 1);
        } catch (error) {
            console.error('Erro:', error);
        }
    }
};

window.handleLogout = async function () {
    try {
        await api.logout();
        state.usuario = null;
        renderLogin();
    } catch (error) {
        console.error('Erro ao sair:', error);
    }
};

window.closeModal = closeModal;
window.openNovoServicoModal = openNovoServicoModal;
window.openNovoPagamentoModal = openNovoPagamentoModal;

// ========== EDITAR / EXCLUIR PAGAMENTO ==========

window.openEditarPagamentoModal = async function (id) {
    // Buscar dados do pagamento
    let pagamento;
    try {
        const pagamentos = await api.getPagamentos();
        pagamento = pagamentos.find(p => p.id === id);
    } catch (e) {
        alert('Erro ao buscar pagamento');
        return;
    }
    if (!pagamento) return;

    const marceneirosOptions = state.marceneiros.map(m =>
        `<option value="${m.id}" ${m.id === pagamento.marceneiro_id ? 'selected' : ''}>${m.nome}</option>`
    ).join('');

    document.getElementById('modal-container').innerHTML = `
        <div class="modal-overlay" onclick="closeModal(event)">
            <div class="modal" onclick="event.stopPropagation()">
                <div class="modal-header">
                    <div class="modal-title">Editar Pagamento</div>
                    <button class="modal-close" onclick="closeModal()">&times;</button>
                </div>
                
                <form id="editar-pagamento-form">
                    <input type="hidden" id="pagamento-edit-id" value="${pagamento.id}">
                    <div class="modal-body">
                        <div class="form-group">
                            <label class="form-label">Marceneiro *</label>
                            <select class="form-select" id="edit-marceneiro_id" required>
                                <option value="">Selecione...</option>
                                ${marceneirosOptions}
                            </select>
                        </div>
                        
                        <div class="form-group">
                            <label class="form-label">Valor (R$) *</label>
                            <input type="number" class="form-input" id="edit-valor" required placeholder="0,00" step="0.01" min="0" value="${pagamento.valor}">
                        </div>
                        
                        <div class="form-group">
                            <label class="form-label">Data *</label>
                            <input type="date" class="form-input" id="edit-data" required value="${pagamento.data}">
                        </div>
                        
                        <div class="form-group">
                            <label class="form-label">Observação</label>
                            <input type="text" class="form-input" id="edit-observacao" placeholder="Ex: Pagamento semanal" value="${pagamento.observacao || ''}">
                        </div>
                    </div>
                    
                    <div class="modal-footer">
                        <button type="submit" class="btn btn-primary btn-block" id="btn-atualizar-pag">
                            ✅ Atualizar Pagamento
                        </button>
                    </div>
                </form>
            </div>
        </div>
    `;

    document.getElementById('editar-pagamento-form').addEventListener('submit', handleAtualizarPagamento);
};

async function handleAtualizarPagamento(e) {
    e.preventDefault();

    const btn = document.getElementById('btn-atualizar-pag');
    btn.disabled = true;
    btn.textContent = 'Salvando...';

    try {
        const id = document.getElementById('pagamento-edit-id').value;
        await api.atualizarPagamento(id, {
            marceneiro_id: document.getElementById('edit-marceneiro_id').value,
            valor: document.getElementById('edit-valor').value,
            data: document.getElementById('edit-data').value,
            observacao: document.getElementById('edit-observacao').value
        });

        closeModal();
        await carregarDados();
        renderDashboard();
    } catch (error) {
        console.error('Erro ao atualizar:', error);
        alert('Erro ao atualizar pagamento. Tente novamente.');
        btn.disabled = false;
        btn.textContent = '✅ Atualizar Pagamento';
    }
}

window.handleExcluirPagamento = async function (id) {
    if (!confirm('Tem certeza que deseja excluir este pagamento? Esta ação não pode ser desfeita.')) return;

    try {
        await api.deletePagamento(id);
        await carregarDados();
        renderDashboard();
    } catch (error) {
        console.error('Erro ao excluir:', error);
        alert('Erro ao excluir pagamento. Verifique as permissões no Supabase.');
    }
};

window.openEditarServicoModal = function (id) {
    const servico = state.servicos.find(s => s.id === id);
    if (!servico) return;

    openNovoServicoModal();

    // Atualizar título do modal
    document.querySelector('.modal-title').textContent = 'Editar Serviço';
    document.getElementById('btn-salvar').textContent = 'Atualizar Serviço';

    // Preencher campos
    document.getElementById('servico-id').value = servico.id;
    document.getElementById('titulo').value = servico.titulo;
    document.getElementById('descricao').value = servico.descricao || '';
    document.getElementById('marceneiro_id').value = servico.marceneiro_id; // Assume marceneiro_id changes are allowed
    document.getElementById('valor').value = servico.valor;
    if (servico.prazo) {
        document.getElementById('prazo').value = new Date(servico.prazo).toISOString().split('T')[0];
    }

    // Mostrar preview da imagem se existir
    if (servico.foto_url) {
        document.getElementById('image-upload-container').innerHTML = `
            <div class="image-preview">
                <img src="${servico.foto_url}" alt="Preview">
                <div class="text-sm text-center text-muted mt-xs">Foto atual</div>
                <!-- Nota: Não permitimos remover a foto atual facilmente nesta UI simplificada, apenas substituir -->
            </div>
            <div class="mt-xs">
                <label class="image-upload" id="image-upload" style="height: auto; padding: 10px;">
                    <input type="file" accept="image/*" onchange="handleImageUpload(event)">
                    <div class="text-sm">Alterar foto</div>
                </label>
            </div>
        `;
    }
};

window.handleExcluirServico = async function (id) {
    if (!confirm('Tem certeza que deseja excluir este serviço? Esta ação não pode ser desfeita.')) return;

    try {
        await api.deleteServico(id);
        await carregarDados();
        renderDashboard();
    } catch (error) {
        console.error('Erro ao excluir:', error);
        alert('Erro ao excluir serviço. Verifique se você executou o script de permissões no Supabase.');
    }
};

window.filtrarServicosAdmin = function (status) {
    state.filtroAdmin = status;
    renderDashboard();
};

// ========== UTILITÁRIOS ==========

function formatarMoeda(valor) {
    return new Intl.NumberFormat('pt-BR', {
        style: 'currency',
        currency: 'BRL'
    }).format(valor || 0);
}

function formatarData(data) {
    if (!data) return 'N/A';
    return new Intl.DateTimeFormat('pt-BR').format(new Date(data));
}

// Iniciar aplicação
init();
