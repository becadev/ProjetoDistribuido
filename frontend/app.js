const API = "http://localhost:8000";

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

function showModal(title, message, isSuccess = true) {
    const modal = document.getElementById('modal');
    const t = document.getElementById('modalTitle');
    const m = document.getElementById('modalMessage');
    if (!modal || !t || !m) return;
    t.textContent = title || (isSuccess ? 'Sucesso' : 'Aviso');
    m.textContent = message || '';
    modal.classList.add('open');
    modal.setAttribute('aria-hidden', 'false');
}

function closeModal() {
    const modal = document.getElementById('modal');
    if (!modal) return;
    modal.classList.remove('open');
    modal.setAttribute('aria-hidden', 'true');
}

function makeCardHtml(content) {
    return `<div class="p-3 border border-gray-200 rounded-md bg-gray-50 text-sm mb-2">${content}</div>`;
}

function formatErrorMessage(err) {
    if (!err) return 'Erro desconhecido.';
    const raw = (err.message || String(err)).toString();
    // Detect common network/browser error texts (in English) and map to Portuguese
    if (/failed to fetch/i.test(raw) || /networkerror/i.test(raw) || /network request failed/i.test(raw)) {
        return 'Erro de rede: não foi possível conectar ao servidor. Verifique se o backend está em execução e se o endereço está correto.';
    }
    if (/timeout/i.test(raw)) return 'Tempo de conexão esgotado. Tente novamente.';
    // Remove repetitive technical prefixes like TypeError:
    return raw.replace(/^TypeError:\s*/i, 'Erro: ');
}

async function carregarServicos() {
    const container = 'servicos';
    showMessage(container, 'Carregando serviços...', 'loading');
    try {
        const r = await fetch(`${API}/servicos`);
        if (!r.ok) throw new Error(`Falha ao carregar serviços: ${r.status} ${r.statusText}`);
        const data = await r.json();
        const el = document.getElementById(container);
        el.innerHTML = '';
        if (!Array.isArray(data) || data.length === 0) {
            el.innerHTML = makeCardHtml('Nenhum serviço encontrado.');
            return;
        }
        data.forEach(s => {
            const content = `ID: ${s.id} - ${s.nome} - R$ ${s.preco} - Tempo: ${s.duracao_min} min`;
            el.innerHTML += makeCardHtml(content);
        });
    } catch (err) {
        console.error(err);
        showMessage(container, 'Falha ao carregar serviços. Tente novamente.', 'error');
    }
}

async function carregarClientes() {
    const container = 'clientes';
    showMessage(container, 'Carregando clientes...', 'loading');
    try {
        const r = await fetch(`${API}/clientes`);
        if (!r.ok) throw new Error(`Falha ao carregar clientes: ${r.status} ${r.statusText}`);
        const data = await r.json();
        const el = document.getElementById(container);
        el.innerHTML = '';
        if (!Array.isArray(data) || data.length === 0) {
            el.innerHTML = makeCardHtml('Nenhum cliente encontrado.');
            return;
        }
        data.forEach(c => {
            const content = `ID: ${c.id} - ${c.nome}`;
            el.innerHTML += makeCardHtml(content);
        });
    } catch (err) {
        console.error(err);
        showMessage(container, 'Falha ao carregar clientes. Tente novamente.', 'error');
    }
}

async function consultarDisponibilidade() {
    const container = 'disponibilidade';
    const dataVal = document.getElementById('data').value;
    if (!dataVal) { showMessage(container, 'Escolha uma data antes de buscar.', 'error'); return; }
    showMessage(container, 'Consultando disponibilidade...', 'loading');
    try {
        const r = await fetch(`${API}/disponibilidade?data=${encodeURIComponent(dataVal)}`);
        if (!r.ok) throw new Error(`Falha na consulta: ${r.status} ${r.statusText}`);
        const json = await r.json();
        if (!json.horarios_disponiveis || !Array.isArray(json.horarios_disponiveis)) {
            showMessage(container, 'Resposta inesperada do servidor.', 'error');
            return;
        }
        const lista = json.horarios_disponiveis.length ? json.horarios_disponiveis.join(', ') : 'Nenhum horário disponível';
        showMessage(container, `<b>Horários disponíveis:</b> ${lista}`);
    } catch (err) {
        console.error(err);
        showMessage(container, 'Falha ao consultar disponibilidade. Tente novamente.', 'error');
    }
}

async function agendar() {
    const container = 'resultadoAgendar';
    const clienteId = document.getElementById('clienteId').value;
    const servicoId = document.getElementById('servicoId').value;
    const dataAg = document.getElementById('dataAgendamento').value;
    const hora = document.getElementById('hora').value;

    if (!clienteId || !servicoId || !dataAg || !hora) {
        showModal('Erro', 'Preencha todos os campos para agendar.', false);
        return;
    }

    showMessage(container, 'Enviando solicitação de agendamento...', 'loading');
    try {
        const url = `${API}/agendar?clienteId=${encodeURIComponent(clienteId)}&servicoId=${encodeURIComponent(servicoId)}&data=${encodeURIComponent(dataAg)}&horaInicio=${encodeURIComponent(hora)}`;
        const r = await fetch(url, { method: 'POST' });
        if (!r.ok) {
            let text = await r.text();
            throw new Error(`Falha ao agendar: ${r.status} ${r.statusText} ${text}`);
        }
        const json = await r.json();
        showModal('Agendamento', json.mensagem || 'Agendamento realizado com sucesso.', true);
    } catch (err) {
        console.error(err);
        showModal('Erro', 'Falha ao agendar. Tente novamente.', false);
    }
}

async function cancelar() {
    const container = 'resultadoCancelar';
    const agendamentoId = document.getElementById('agendamentoId').value;
    if (!agendamentoId) { showModal('Erro', 'Informe o ID do agendamento a ser cancelado.', false); return; }
    showMessage(container, 'Enviando solicitação de cancelamento...', 'loading');
    try {
        const url = `${API}/cancelar?agendamentoId=${encodeURIComponent(agendamentoId)}`;
        const r = await fetch(url, { method: 'DELETE' });
        if (!r.ok) {
            let text = await r.text();
            throw new Error(`Falha ao cancelar: ${r.status} ${r.statusText} ${text}`);
        }
        const json = await r.json();
        showModal('Cancelamento', json.mensagem || 'Cancelamento realizado.', true);
    } catch (err) {
        console.error(err);
        showModal('Erro', 'Falha ao cancelar. Tente novamente.', false);
    }
}

async function listarAgendamentos() {
    const container = 'agendamentos';
    showMessage(container, 'Carregando agendamentos...', 'loading');
    try {
        const r = await fetch(`${API}/listarAgendamentos`);
        if (!r.ok) throw new Error(`Falha ao listar agendamentos: ${r.status} ${r.statusText}`);
        const json = await r.json();
        const el = document.getElementById(container);
        el.innerHTML = '<h3 class="font-medium">Agendamentos:</h3>';
        if (!json.agendamentos || json.agendamentos.length === 0) {
            el.innerHTML += makeCardHtml('Nenhum agendamento encontrado.');
            return;
        }
        json.agendamentos.forEach(a => {
            const content = `ID: ${a.id} - Cliente: ${a.cliente_nome || a.cliente_id} - Serviço: ${a.servico_nome || a.servico_id} - Data: ${a.data} - Hora Início: ${a.hora_inicio}`;
            el.innerHTML += makeCardHtml(content);
        });
    } catch (err) {
        console.error(err);
        showMessage(container, 'Falha ao listar agendamentos. Tente novamente.', 'error');
    }
}

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

    // Modal event bindings
    const modalClose = document.getElementById('modalCloseBtn');
    const modalOk = document.getElementById('modalOk');
    const modalOverlay = document.getElementById('modalOverlay');
    if (modalClose) modalClose.addEventListener('click', closeModal);
    if (modalOk) modalOk.addEventListener('click', closeModal);
    if (modalOverlay) modalOverlay.addEventListener('click', closeModal);
}

init();

// Export for debugging in console (optional)
window.app = {
    carregarServicos,
    carregarClientes,
    consultarDisponibilidade,
    agendar,
    cancelar,
    listarAgendamentos
};
