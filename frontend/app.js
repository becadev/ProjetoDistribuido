const API = "http://localhost:8000";

// ===== UTILITY FUNCTIONS =====
function showMessage(containerId, message, type = 'info') {
    const el = document.getElementById(containerId);
    if (!el) return;
    if (type === 'error') {
        el.innerHTML = `<div class="text-red-600 font-bold">${message}</div>`;
    } else if (type === 'loading') {
        el.innerHTML = `<div class="msg-loading"><i class="spinner"></i><span class="msg-info">${message}</span></div>`;
    } else {
        el.innerHTML = message;
    }
}

function makeCardHtml(content) {
    return `<div class="p-3 border border-gray-200 rounded-md bg-gray-50 text-sm mb-2">${content}</div>`;
}

// ===== AUTH FUNCTIONS =====
function getUser() {
    const userStr = localStorage.getItem('user');
    return userStr ? JSON.parse(userStr) : null;
}

function logout() {
    localStorage.removeItem('user');
    window.location.href = 'login.html';
}

function checkAuth(requiredRole) {
    const user = getUser();
    if (!user || (requiredRole && user.role !== requiredRole)) {
        window.location.href = 'login.html';
        return null;
    }
    return user;
}

// ===== SERVICOS =====
async function carregarServicos(containerId = 'servicos', selectId = 'servicoId') {
    const container = containerId;
    showMessage(container, 'Carregando serviços...', 'loading');
    try {
        const r = await fetch(`${API}/servicos`);
        if (!r.ok) throw new Error(`Falha ao carregar serviços: ${r.status}`);
        const data = await r.json();
        
        const div = document.getElementById(container);
        const select = selectId ? document.getElementById(selectId) : null;
        
        div.innerHTML = '';
        if (select) {
            select.innerHTML = "<option value=''>Selecione...</option>";
        }
        
        if (!Array.isArray(data) || data.length === 0) {
            div.innerHTML = makeCardHtml('Nenhum serviço encontrado.');
            return;
        }
        
        data.forEach(s => {
            div.innerHTML += `<div class="card">
                <strong>${s.nome} - Profissional ${s.profissional_nome || 'Desconhecido'}</strong> - R$ ${s.preco} - ${s.duracao_min} min<br>
                ${s.descricao || ''}
            </div>`;
            if (select) {
                select.innerHTML += `<option value="${s.id}">${s.nome}</option>`;
            }
        });
    } catch (err) {
        console.error(err);
        showMessage(container, 'Falha ao carregar serviços.', 'error');
    }
}

async function carregarServicosProfissional() {
    try {
        const user = getUser();
        if (!user || !user.profile_id) {
            throw new Error('Usuário não encontrado');
        }

        // Usar a rota correta que espera profissional_id como parâmetro
        const r = await fetch(`${API}/servicos/${user.profile_id}`);
        if (!r.ok) {
            console.error('Erro na requisição:', r.status, r.statusText);
            throw new Error(`Falha ao carregar serviços: ${r.status}`);
        }
        
        const data = await r.json();
        console.log('Dados recebidos:', data); // Debug
        
        const div = document.getElementById('servicos');
        if (!div) return; // Se não existe o elemento, sair silenciosamente
        
        div.innerHTML = '';
        
        if (!data || data.length === 0) {
            div.innerHTML = "<p>Nenhum serviço cadastrado.</p>";
        } else {
            data.forEach(s => {
                div.innerHTML += `<div class="card">
                    <strong>${s.nome}</strong> - R$ ${s.preco} - ${s.duracao_min} min<br>
                    ${s.descricao}<br>
                    <button class="btn btn-danger" onclick="deletarServico(${s.id})">Excluir</button>
                </div>`;
            });
        }
    } catch (err) {
        console.error('Erro ao carregar serviços:', err);
        const div = document.getElementById('servicos');
        if (div) {
            div.innerHTML = `<p>Erro ao carregar serviços: ${err.message}</p>`;
        }
    }
}

async function deletarServico(id) {
    if (!confirm('Deseja realmente excluir este serviço?')) return;
    try {
        const response = await fetch(`${API}/servicos/${id}`, { method: 'DELETE' });
        if (response.ok) {
            alert('Serviço excluído com sucesso!');
            carregarServicosProfissional();
        } else {
            alert('Erro ao excluir serviço');
        }
    } catch (error) {
        alert('Erro de conexão: ' + error.message);
    }
}

// ===== CLIENTES =====
async function carregarClientes() {
    const container = 'clientes';
    showMessage(container, 'Carregando clientes...', 'loading');
    try {
        const r = await fetch(`${API}/clientes`);
        if (!r.ok) throw new Error(`Falha: ${r.status}`);
        const data = await r.json();
        
        const el = document.getElementById(container);
        el.innerHTML = '';
        
        if (!Array.isArray(data) || data.length === 0) {
            el.innerHTML = makeCardHtml('Nenhum cliente encontrado.');
            return;
        }
        
        data.forEach(c => {
            const content = `<strong>${c.nome || 'Nome não disponível'}</strong><br>CPF: ${c.cpf}<br>Email: ${c.email || 'N/A'}<br>Telefone: ${c.telefone || 'N/A'}`;
            el.innerHTML += makeCardHtml(content);
        });
    } catch (err) {
        console.error(err);
        showMessage(container, 'Falha ao carregar clientes.', 'error');
    }
}

// ===== DISPONIBILIDADE =====
async function consultarDisponibilidade() {
    const container = 'disponibilidade';
    const servicoId = document.getElementById('servicoId').value;
    if (!servicoId) {
        showMessage(container, 'Escolha um serviço.', 'error');
        return;
    }
    const dataVal = document.getElementById('data').value;
    if (!dataVal) {
        showMessage(container, 'Escolha uma data.', 'error');
        return;
    }
    
    showMessage(container, 'Consultando...', 'loading');
    try {
        const r = await fetch(`${API}/disponibilidade?data=${encodeURIComponent(dataVal)}&servico_id=${servicoId}`);
        if (!r.ok) throw new Error(`Falha: ${r.status}`);
        const json = await r.json();
        
        const lista = json.horarios_disponiveis && json.horarios_disponiveis.length 
            ? json.horarios_disponiveis.join(', ') 
            : 'Nenhum horário disponível';
        showMessage(container, `<div class='card'><b>Horários disponíveis:</b> ${lista}</div>`);
    } catch (err) {
        console.error(err);
        showMessage(container, 'Falha ao consultar.', 'error');
    }
}

// ===== AGENDAMENTOS =====
async function agendar() {
    const user = getUser();
    if (!user) return;
    
    const clienteId = user.profile_id;
    const servicoId = document.getElementById('servicoIdAgendamento').value;
    const dataAg = document.getElementById('dataAgendamento').value;
    const hora = document.getElementById('hora').value;

    if (!servicoId || !dataAg || !hora) {
        alert('Preencha todos os campos.');
        return;
    }

    try {
        const url = `${API}/agendar?clienteId=${clienteId}&servicoId=${servicoId}&data=${dataAg}&horaInicio=${hora}`;
        const r = await fetch(url, { method: 'POST' });
        if (!r.ok) throw new Error('Falha ao agendar');
        
        const json = await r.json();
        alert(json.mensagem || 'Agendamento realizado!');
        listarAgendamentos();
    } catch (err) {
        console.error(err);
        alert('Erro ao agendar.');
    }
}

async function cancelar() {
    const agendamentoId = document.getElementById('agendamentoId').value;
    if (!agendamentoId) {
        alert('Informe o ID do agendamento.');
        return;
    }
    
    try {
        const url = `${API}/cancelar?agendamentoId=${agendamentoId}`;
        const r = await fetch(url, { method: 'DELETE' });
        if (!r.ok) throw new Error('Falha ao cancelar');
        
        const json = await r.json();
        alert(json.mensagem || 'Cancelamento realizado.');
        listarAgendamentos();
    } catch (err) {
        console.error(err);
        alert('Erro ao cancelar.');
    }
}

async function listarAgendamentos() {
    const container = 'agendamentos';
    const user = getUser();
    
    try {
        const r = await fetch(`${API}/listarAgendamentos`);
        if (!r.ok) throw new Error('Falha ao listar');
        const json = await r.json();
        
        const div = document.getElementById(container);
        div.innerHTML = '';
        
        let agendamentos = json.agendamentos || [];
        
        // Garantir que agendamentos é um array
        if (!Array.isArray(agendamentos)) {
            console.error('agendamentos não é um array:', agendamentos);
            div.innerHTML = '<p>Erro: formato de dados inválido.</p>';
            return;
        }
        
        // Se for cliente, filtrar apenas os seus
        if (user && user.role === 'cliente') {
            agendamentos = agendamentos.filter(a => a.cliente_id == user.profile_id);
        }
        
        if (user && user.role === 'profissional') {
            // Filtrar agendamentos dos serviços do profissional
            agendamentos = agendamentos.filter(a => a.profissional_id == user.profile_id);
        }
        
        if (agendamentos.length === 0) {
            div.innerHTML = '<p>Nenhum agendamento encontrado.</p>';
        } else {
            agendamentos.forEach(a => {
                div.innerHTML += `<div class="card">
                    <strong>ID:</strong> ${a.id}<br>
                    ${user && user.role === 'profissional' ? `<strong>Cliente:</strong> ${a.cliente_nome || 'ID ' + a.cliente_id}<br>` : ''}
                    <strong>Serviço:</strong> ${a.servico_nome || 'ID ' + a.servico_id}<br>
                    <strong>Data:</strong> ${a.data} às ${a.hora_inicio}<br>
                    <strong>Status:</strong> ${a.status}
                </div>`;
            });
        }
    } catch (err) {
        console.error(err);
        if (document.getElementById(container)) {
            document.getElementById(container).innerHTML = '<p>Erro ao carregar agendamentos.</p>';
        }
    }
}

// ===== INIT (for index.html) =====
function init() {
    const map = [
        ['btnCarregarServicos', carregarServicos],
        ['btnCarregarClientes', carregarClientes],
        ['btnConsultarDisponibilidade', consultarDisponibilidade],
        ['btnAgendar', agendar],
        ['btnCancelar', cancelar],
        ['btnListarAgendamentos', listarAgendamentos]
    ];
    map.forEach(([id, fn]) => {
        const el = document.getElementById(id);
        if (el) el.addEventListener('click', fn);
    });
}

// Auto-init if buttons exist
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
} else {
    init();
}

// Export all functions to window for onclick handlers
window.logout = logout;
window.checkAuth = checkAuth;
window.getUser = getUser;
window.carregarServicos = carregarServicos;
window.carregarServicosProfissional = carregarServicosProfissional;
window.deletarServico = deletarServico;
window.carregarClientes = carregarClientes;
window.consultarDisponibilidade = consultarDisponibilidade;
window.agendar = agendar;
window.cancelar = cancelar;
window.listarAgendamentos = listarAgendamentos;

window.app = {
    carregarServicos,
    carregarServicosProfissional,
    deletarServico,
    carregarClientes,
    consultarDisponibilidade,
    agendar,
    cancelar,
    listarAgendamentos,
    logout,
    checkAuth,
    getUser
};
