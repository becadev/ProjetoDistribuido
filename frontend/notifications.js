/**
 * Sistema centralizado de notificações
 * Funciona em qualquer página do aplicativo
 * Gerencia apenas UI (sino, toasts) - WebSocket gerenciado externamente
 */

// ===== ESTADO GLOBAL =====
let globalNotificationCount = 0;
let currentUserGlobal = null;

// ===== SVG ICONS =====
const SVG_ICONS = {
    bell: `<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"></path><path d="M13.73 21a2 2 0 0 1-3.46 0"></path></svg>`,
    
    messageSquare: `<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"></path></svg>`,
    
    calendar: `<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect><line x1="16" y1="2" x2="16" y2="6"></line><line x1="8" y1="2" x2="8" y2="6"></line><line x1="3" y1="10" x2="21" y2="10"></line></svg>`,
    
    check: `<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"></polyline></svg>`,
    
    alertCircle: `<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"></circle><line x1="12" y1="8" x2="12" y2="12"></line><line x1="12" y1="16" x2="12.01" y2="16"></line></svg>`,
    
    info: `<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"></circle><line x1="12" y1="16" x2="12" y2="12"></line><line x1="12" y1="8" x2="12.01" y2="8"></line></svg>`,
    
    x: `<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>`
};

// ===== INICIALIZAÇÃO =====
/**
 * Inicializar sistema de notificações
 * Chamar ao carregar qualquer página
 */
function initNotifications() {
    currentUserGlobal = getUser();
    
    if (!currentUserGlobal) {
        console.log('[NOTIF] Usuário não autenticado');
        return;
    }
    
    console.log('[NOTIF] Inicializando sistema de notificações (UI apenas)');
    
    // Restaurar contador do localStorage
    restoreNotificationCount();
    
    // Criar container de toast se não existir
    ensureToastContainer();
    
    // Criar sino se não existir
    ensureBell();
}

function ensureToastContainer() {
    if (!document.getElementById('toastContainer')) {
        const container = document.createElement('div');
        container.id = 'toastContainer';
        container.className = 'toast-container';
        document.body.appendChild(container);
    }
}

function ensureBell() {
    // Verificar se sino já existe
    if (document.getElementById('globalNotificationBell')) {
        return;
    }
    
    // Se estiver em chat, não criar (já existe lá)
    if (window.location.pathname.includes('chat.html')) {
        return;
    }
    
    // Criar sino para outras páginas
    const bell = document.createElement('div');
    bell.id = 'globalNotificationBell';
    bell.className = 'global-notification-bell';
    bell.innerHTML = `
        <button class="notification-bell-btn" onclick="toggleNotificationPanel()">
            ${SVG_ICONS.bell}
            <span class="notification-counter" id="notificationCounter">0</span>
        </button>
    `;
    
    // Adicionar ao body com posição fixa
    document.body.appendChild(bell);
    
    // Atualizar contador
    updateNotificationBellUI();
}

// ===== FUNÇÕES PÚBLICAS PARA RECEBER NOTIFICAÇÕES =====
/**
 * Processar mensagens de notificação (chamada por código externo que gerencia WebSocket)
 * Esta função é chamada por QUALQUER mensagem WebSocket recebida
 */
function handleNotificationMessage(message) {
    if (!currentUserGlobal) {
        currentUserGlobal = getUser();
    }
    
    // N processar mensagens vazias
    if (!message) return;
    
    console.log('[NOTIF-HANDLER] Recebido:', message.type || message.evento, 'Página:', window.location.pathname);
    
    // Eventos de agendamento (com ou sem from_rabbitmq)
    // n depender exclusivamente de from_rabbitmq
    if (message.evento) {
        console.log('[NOTIF-HANDLER] Evento de agendamento detectado:', message.evento);
        handleSchedulingNotification(message);
        return; // Não processar como chat message
    }
    
    // Mensagens de chat (qualquer pagina q  não seja chat.html)
    if (message.type === 'chat_message') {
        handleChatNotification(message);
    }
}

/**
 * Processar notificação de agendamento
 */
function handleSchedulingNotification(message) {
    const evento = message.evento;
    let title = 'Notificação';
    let description = '';
    let type = 'info';
    let icon = 'info';
    let shouldNotify = false;
    
    if (evento === 'novo_agendamento') {
        // Profissional recebe notificação quando cliente agenda
        if (currentUserGlobal.role === 'profissional') {
            // Flexível: aceita diferentes nomes de campo
            const isResponsible = 
                (message.dados.profissional_id === currentUserGlobal.usuario_id) ||
                (message.dados.profissionalId === currentUserGlobal.usuario_id) ||
                (message.dados.profissional_usuario_id === currentUserGlobal.usuario_id);
            
            if (isResponsible) {
                title = 'Novo Agendamento!';
                const horario = message.dados.horaInicio || message.dados.hora || 'Horário não definido';
                const data = message.dados.data || 'Data não definida';
                description = `${data} às ${horario}`;
                type = 'success';
                icon = 'calendar';
                shouldNotify = true;
            }
        } 
        // Cliente pode receber confirmação (opcional)
        else if (currentUserGlobal.role === 'cliente') {
            const isOwn = 
                message.dados.cliente_usuario_id === currentUserGlobal.usuario_id ||
                message.dados.clienteId === currentUserGlobal.usuario_id;
            
            if (isOwn) {
                title = 'Agendamento Confirmado';
                description = 'Seu agendamento foi confirmado';
                type = 'success';
                icon = 'check';
                shouldNotify = true;
            }
        }
    } 
    else if (evento === 'agendamento_cancelado') {
        // Ambos recebem notificação de cancelamento
        title = 'Agendamento Cancelado';
        description = `ID: ${message.dados.agendamentoId}`;
        type = 'warning';
        icon = 'alertCircle';
        shouldNotify = true;
    }
    
    // Mostrar notificação apenas se relevante
    if (shouldNotify && title) {
        showNotificationToast(title, description, type, icon);
        incrementNotificationCount();
        console.log(`[NOTIF-SCHED] ${title}: ${description}`);
    }
}

/**
 * Processar notificação de chat
 */
function handleChatNotification(message) {
    // Só processar se não estiver na página do chat
    if (window.location.pathname.includes('chat.html')) {
        return;
    }
    
    if (message.user_id === currentUserGlobal.usuario_id) {
        return; // Não notificar mensagens próprias
    }
    
    showNotificationToast(
        `Mensagem de ${message.username}`,
        message.text.substring(0, 50) + (message.text.length > 50 ? '...' : ''),
        'info',
        'messageSquare'
    );
    
    incrementNotificationCount();
}

// ===== UI DE NOTIFICAÇÕES =====
/**
 * Mostrar toast de notificação
 */
function showNotificationToast(title, message, type = 'info', iconKey = 'info') {
    const container = document.getElementById('toastContainer');
    if (!container) return;
    
    const toast = document.createElement('div');
    toast.className = `toast ${type}`;
    
    const icon = SVG_ICONS[iconKey] || SVG_ICONS.info;
    
    toast.innerHTML = `
        <div class="toast-icon">${icon}</div>
        <div class="toast-content">
            <div class="toast-title">${escapeHtml(title)}</div>
            <div class="toast-message">${escapeHtml(message)}</div>
        </div>
        <div class="toast-close" onclick="removeNotificationToast(this)">
            ${SVG_ICONS.x}
        </div>
    `;
    
    container.appendChild(toast);
    
    // Auto-remove após 5 segundos
    setTimeout(() => {
        removeNotificationToast(toast);
    }, 5000);
}

function removeNotificationToast(toastEl) {
    if (!toastEl) return;
    
    toastEl.classList.add('removing');
    setTimeout(() => {
        if (toastEl.parentNode) {
            toastEl.parentNode.removeChild(toastEl);
        }
    }, 400);
}

/**
 * Incrementar contador de notificações
 */
function incrementNotificationCount() {
    globalNotificationCount++;
    saveNotificationCount();
    updateNotificationBellUI();
    playNotificationSound();
}

/**
 * Atualizar UI do sino
 */
function updateNotificationBellUI() {
    const counter = document.getElementById('notificationCounter');
    if (!counter) return;
    
    if (globalNotificationCount > 0) {
        counter.textContent = globalNotificationCount > 99 ? '99+' : globalNotificationCount;
        counter.style.display = 'flex';
    } else {
        counter.style.display = 'none';
    }
}

/**
 * Toggler do painel de notificações
 * Só marca como lidas se houver notificações
 */
function toggleNotificationPanel() {
    if (globalNotificationCount === 0) {
        // Nenhuma notificação nova
        showNotificationToast('Notificações', 'Nenhuma nova notificação', 'info', 'info');
        return;
    }
    
    // Marcar como lidas
    globalNotificationCount = 0;
    saveNotificationCount();
    updateNotificationBellUI();
    showNotificationToast('Notificações', 'Marcadas como lidas', 'success', 'check');
}

/**
 * Persistência de contador em localStorage
 */
function saveNotificationCount() {
    localStorage.setItem('notificationCount', globalNotificationCount.toString());
}

function restoreNotificationCount() {
    const saved = localStorage.getItem('notificationCount');
    if (saved) {
        globalNotificationCount = parseInt(saved, 10);
    }
}

// ===== UTILITÁRIOS =====
function escapeHtml(text) {
    const map = {
        '&': '&amp;',
        '<': '&lt;',
        '>': '&gt;',
        '"': '&quot;',
        "'": '&#039;'
    };
    return text.replace(/[&<>"']/g, m => map[m]);
}

function playNotificationSound() {
    try {
        const audioContext = new (window.AudioContext || window.webkitAudioContext)();
        const oscillator = audioContext.createOscillator();
        const gainNode = audioContext.createGain();
        
        oscillator.connect(gainNode);
        gainNode.connect(audioContext.destination);
        
        oscillator.frequency.value = 800;
        oscillator.type = 'sine';
        
        gainNode.gain.setValueAtTime(0.3, audioContext.currentTime);
        gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.1);
        
        oscillator.start(audioContext.currentTime);
        oscillator.stop(audioContext.currentTime + 0.1);
    } catch (e) {
        // Silenciosamente continuar se falhar
    }
}

// ===== EXPOR GLOBALMENTE =====
window.initNotifications = initNotifications;
window.toggleNotificationPanel = toggleNotificationPanel;
window.removeNotificationToast = removeNotificationToast;
window.showNotificationToast = showNotificationToast;
window.handleNotificationMessage = handleNotificationMessage; // Expor para uso externo

// Inicializar quando documento estiver pronto
document.addEventListener('DOMContentLoaded', initNotifications);
