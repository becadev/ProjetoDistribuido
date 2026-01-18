// ===== CONFIGURAÇÕES =====
const DJANGO_API = 'http://localhost:8001';
const GATEWAY_API = 'http://localhost:8000';
const WS_URL = 'ws://localhost:8000/ws';

// ===== ESTADO DO CHAT =====
let currentUser = null;
let currentRoom = null;
let wsSocket = null;  // WebSocket para tempo real
let messageHistory = {};
let connectedRooms = [];
let typingTimeout = null;
let unreadMessages = {};  // {room_id: count}
let pollingInterval = null;  // compatibilidade com funções antigas

// ===== ESTADO DE NOTIFICAÇÕES =====
let notificationsList = [];  // fila de notificações globais
let totalNotifications = 0;  // contador total

// ===== INICIALIZAÇÃO =====
document.addEventListener('DOMContentLoaded', () => {
    currentUser = getUser();
    
    if (!currentUser) {
        window.location.href = 'login.html';
        return;
    }

    document.getElementById('userDisplayName').textContent = currentUser.username;
    
    // PRIORIDADE: Conectar WebSocket para tempo real
    initWebSocket();
    
    // Carregar salas
    loadRooms();
});

// ===== WEBSOCKET E NOTIFICAÇÕES EM TEMPO REAL =====
function initWebSocket() {
    try {
        console.log('[WS] Conectando a', WS_URL);
        wsSocket = new WebSocket(WS_URL);
        
        wsSocket.onopen = () => {
            console.log('[WS] Conectado!');
            updateConnectionStatus('Online', true);
            
            // Enviar identificação do usuário
            wsSocket.send(JSON.stringify({
                type: 'user_login',
                username: currentUser.username,
                user_id: currentUser.usuario_id,
                role: currentUser.role
            }));
        };
        
        wsSocket.onmessage = (event) => {
            try {
                const message = JSON.parse(event.data);
                handleWebSocketMessage(message);
            } catch (e) {
                console.error('[WS] Erro ao processar:', e);
            }
        };
        
        wsSocket.onerror = (error) => {
            console.error('[WS] Erro:', error);
            updateConnectionStatus('Erro', false);
        };
        
        wsSocket.onclose = () => {
            console.log('[WS] Desconectado');
            updateConnectionStatus('Offline', false);
            
            // Reconectar em 3 segundos
            setTimeout(initWebSocket, 3000);
        };
    } catch (e) {
        console.error('[WS] Falha ao conectar:', e);
    }
}

function messageAlreadyStored(roomId, message) {
    const history = messageHistory[roomId] || [];
    return history.some(m =>
        m.timestamp === message.timestamp &&
        m.user_id === message.user_id &&
        m.text === message.text
    );
}

function handleWebSocketMessage(message) {
    const type = message.type;
    
    // Chat em tempo real
    if (type === 'chat_message') {
        const isOwn = message.user_id === currentUser.usuario_id;
        const roomId = message.room;

        const alreadyStored = messageAlreadyStored(roomId, message);

        if (!messageHistory[roomId]) {
            messageHistory[roomId] = [];
        }

        // Evita duplicar mensagens já exibidas
        if (!alreadyStored) {
            messageHistory[roomId].push(message);
        }
        
        // Se é uma mensagem nova (não do usuário atual)
        if (!isOwn && message.new_notification) {
            showNotification(message);
        }
        
        // Se está na sala, exibir a mensagem
        if (currentRoom && currentRoom.id === message.room) {
            // Apenas exibe se ainda não exibiu
            if (!alreadyStored) {
                displayMessage(message, isOwn);
            }
            clearRoomNotification(message.room);
        } else if (!isOwn) {
            // Se não está na sala, marcar como não lida
            setRoomNotification(message.room);
        }
    }
    
    // Eventos de agendamento do RabbitMQ
    if (message.from_rabbitmq) {
        console.log('[WS] Evento:', message.evento);
        showSystemNotification(message);
    }
}

// ===== SINO DE NOTIFICAÇÃO =====
function showNotification(message) {
    const room = message.room;
    
    // Marcar sala como tendo notificação
    setRoomNotification(room);
    
    // Mostrar sino visual
    const badge = document.querySelector(`[data-room-id="${room}"] .notification-badge`);
    if (badge) {
        badge.style.display = 'block';
        badge.textContent = (unreadMessages[room] || 0) + 1;
    }
    
    // Adicionar ao contador global de notificações
    addNotification({
        type: 'message',
        title: `Mensagem de ${message.username}`,
        message: message.text.substring(0, 50) + (message.text.length > 50 ? '...' : ''),
        room: room,
        timestamp: message.timestamp
    });
    
    // Som de notificação
    playNotificationSound();
    
    // Toast para nova mensagem
    showToast(
        `💬 ${message.username}`,
        message.text.substring(0, 60) + (message.text.length > 60 ? '...' : ''),
        'info',
        4000
    );
}

function setRoomNotification(roomId) {
    unreadMessages[roomId] = (unreadMessages[roomId] || 0) + 1;
    
    const roomEl = document.querySelector(`[data-room-id="${roomId}"]`);
    if (roomEl) {
        roomEl.classList.add('has-notification');
        
        let badge = roomEl.querySelector('.notification-badge');
        if (!badge) {
            badge = document.createElement('span');
            badge.className = 'notification-badge';
            roomEl.appendChild(badge);
        }
        badge.textContent = unreadMessages[roomId];
        badge.style.display = 'block';
    }
}

function clearRoomNotification(roomId) {
    unreadMessages[roomId] = 0;
    
    const roomEl = document.querySelector(`[data-room-id="${roomId}"]`);
    if (roomEl) {
        roomEl.classList.remove('has-notification');
        const badge = roomEl.querySelector('.notification-badge');
        if (badge) {
            badge.style.display = 'none';
        }
    }
}

function showSystemNotification(message) {
    // Notificação de evento do sistema (agendamento, cancelamento, etc)
    const evento = message.evento;
    let title = 'Nova Notificação';
    let body = evento;
    let toastType = 'info';
    
    if (evento === 'novo_agendamento') {
        title = '📅 Novo Agendamento';
        body = `${message.dados.data} às ${message.dados.horaInicio}`;
        toastType = 'success';
        
        // Se for profissional responsável, enviar notificação especial
        if (currentUser.role === 'profissional') {
            const isResponsible = (message.dados.profissional_id === currentUser.usuario_id) || 
                                  (message.dados.profissionalId === currentUser.usuario_id);
            if (isResponsible) {
                title = '🎯 Cliente Agendou com Você!';
                body = `${message.dados.cliente_nome || 'Cliente'} agendou para ${message.dados.data} às ${message.dados.horaInicio}`;
                toastType = 'success';
            }
        }
    } else if (evento === 'agendamento_cancelado') {
        title = '❌ Agendamento Cancelado';
        body = `ID: ${message.dados.agendamentoId}`;
        toastType = 'warning';
    }
    
    // Mostrar toast (sempre visível)
    showToast(title, body, toastType, 6000);
    
    // Adicionar ao contador de notificações
    addNotification({
        type: evento,
        title: title,
        message: body,
        timestamp: new Date().toISOString(),
        data: message.dados
    });
    
    // Tocar som
    playNotificationSound();
    
    // Notificação do navegador (se permissão concedida)
    if ('Notification' in window && Notification.permission === 'granted') {
        new Notification(title, { body });
    }
    
    console.log(`[NOTIF] ${title}: ${body}`);
}

function playNotificationSound() {
    // Som simples (usando Web Audio API ou HTML5 Audio)
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
        // Se falhar, silenciosamente continuar
    }
}

// ===== SISTEMA DE TOAST (notificações visuais) =====
/**
 * Cria e exibe um toast (notificação visual no canto superior direito)
 * tipos: 'success', 'error', 'info', 'warning'
 */
function showToast(title, message, type = 'info', duration = 5000) {
    const container = document.getElementById('toastContainer');
    
    const toast = document.createElement('div');
    toast.className = `toast ${type}`;
    
    // Escolher ícone baseado no tipo
    let icon = '💬';
    if (type === 'success') icon = '✅';
    else if (type === 'error') icon = '❌';
    else if (type === 'warning') icon = '⚠️';
    else if (type === 'info') icon = 'ℹ️';
    
    toast.innerHTML = `
        <div class="toast-icon">${icon}</div>
        <div class="toast-content">
            <div class="toast-title">${escapeHtml(title)}</div>
            <div class="toast-message">${escapeHtml(message)}</div>
        </div>
        <div class="toast-close" onclick="removeToast(this)">×</div>
    `;
    
    container.appendChild(toast);
    
    // Auto-remove após duration
    if (duration > 0) {
        setTimeout(() => {
            removeToast(toast);
        }, duration);
    }
}

function removeToast(toastEl) {
    if (!toastEl) return;
    
    toastEl.classList.add('removing');
    setTimeout(() => {
        if (toastEl.parentNode) {
            toastEl.parentNode.removeChild(toastEl);
        }
    }, 400);
}

/**
 * Incrementa contador de notificações e atualiza sino
 */
function addNotification(notification) {
    totalNotifications++;
    notificationsList.push(notification);
    updateNotificationBell();
}

/**
 * Atualiza o sino com o contador total
 */
function updateNotificationBell() {
    const counter = document.getElementById('notificationCounter');
    if (!counter) return;
    
    if (totalNotifications > 0) {
        counter.textContent = totalNotifications > 99 ? '99+' : totalNotifications;
        counter.classList.add('active');
    } else {
        counter.classList.remove('active');
    }
}

/**
 * Limpa o contador de notificações quando o usuário vê o painel
 */
function clearNotifications() {
    totalNotifications = 0;
    notificationsList = [];
    updateNotificationBell();
    showToast('Notificações', 'Todas as notificações foram limpas', 'info', 2000);
}

/**
 * Toggle do painel de notificações (futuro)
 */
function toggleNotificationPanel() {
    console.log('[NOTIF] Abrindo painel de notificações');
    clearNotifications();
    // Aqui podia abrir um modal com histórico de notificações
}

// ===== TCP CONNECTION (mantido para compatibilidade) =====
function initTCPConnection() {
    console.log('[TCP] (mantido para compatibilidade)');
}

function sendTCPLogin() {
    console.log('[TCP] (mantido para compatibilidade)');
}

// ===== UDP SIMULATION (mantido para compatibilidade) =====
function initUDPSimulation() {
    console.log('[UDP] (mantido para compatibilidade)');
}

// ===== SALAS =====
function loadRooms() {
    const roomsContainer = document.getElementById('roomsContainer');

    if (currentUser.role === 'cliente') {
        // Para clientes: carregar agendamentos e criar salas baseadas nos profissionais
        loadClientRooms();
    } else if (currentUser.role === 'profissional') {
        // Para profissionais: sala geral para receber mensagens de clientes
        loadProfessionalRooms();
    } else {
        // Fallback
        showDefaultRooms();
    }
}

function loadClientRooms() {
    const roomsContainer = document.getElementById('roomsContainer');
    roomsContainer.innerHTML = '<div style="padding: 20px; text-align: center;">Carregando salas...</div>';

    // Buscar agendamentos do cliente
    fetch(`${DJANGO_API}/meus-agendamentos/?user_id=${currentUser.usuario_id}`, {
        method: 'GET',
        headers: {
            'Content-Type': 'application/json'
        }
    })
    .then(response => {
        if (!response.ok) {
            throw new Error('Erro ao carregar agendamentos');
        }
        return response.json();
    })
    .then(agendamentos => {
        const rooms = [];

        // Criar uma sala para cada profissional único nos agendamentos
        const profissionaisUnicos = new Map();

        console.log('[CHAT] Agendamentos do cliente:', agendamentos);

        agendamentos.forEach(agendamento => {
            if (agendamento.profissional_usuario_id && agendamento.profissional_nome) {
                if (!profissionaisUnicos.has(agendamento.profissional_usuario_id)) {
                    profissionaisUnicos.set(agendamento.profissional_usuario_id, {
                        id: `cliente_${currentUser.usuario_id}_profissional_${agendamento.profissional_usuario_id}`,
                        name: `Chat com ${agendamento.profissional_nome}`,
                        description: `Conversar sobre seus agendamentos`,
                        profissional_id: agendamento.profissional_usuario_id,
                        profissional_nome: agendamento.profissional_nome,
                        participants: 2  // Cliente + Profissional
                    });
                }
            }
        });

        // Converter Map para array
        rooms.push(...profissionaisUnicos.values());

        displayRooms(rooms);
    })
    .catch(error => {
        console.error('Erro ao carregar agendamentos:', error);
        // Fallback para sala geral
        const fallbackRooms = [{
            id: 'geral',
            name: 'Sala Geral',
            description: 'Conversa geral com profissionais',
            participants: 1
        }];
        displayRooms(fallbackRooms);
    });
}

function loadProfessionalRooms() {
    const roomsContainer = document.getElementById('roomsContainer');
    roomsContainer.innerHTML = '<div style="padding: 20px; text-align: center;">Carregando conversas...</div>';

    // Buscar agendamentos do profissional
    fetch(`${DJANGO_API}/meus-agendamentos/?profissional_id=${currentUser.usuario_id}`, {
        method: 'GET',
        headers: {
            'Content-Type': 'application/json'
        }
    })
    .then(response => {
        if (!response.ok) {
            throw new Error('Erro ao carregar agendamentos');
        }
        return response.json();
    })
    .then(agendamentos => {
        const rooms = [];

        // Criar uma sala para cada cliente único nos agendamentos
        const clientesUnicos = new Map();

        console.log('[CHAT] Agendamentos do profissional:', agendamentos);

        agendamentos.forEach(agendamento => {
            if (agendamento.cliente_usuario_id && agendamento.cliente_nome) {
                if (!clientesUnicos.has(agendamento.cliente_usuario_id)) {
                    clientesUnicos.set(agendamento.cliente_usuario_id, {
                        id: `cliente_${agendamento.cliente_usuario_id}_profissional_${currentUser.usuario_id}`,
                        name: `Chat com ${agendamento.cliente_nome}`,
                        description: `Conversar sobre agendamentos`,
                        cliente_id: agendamento.cliente_usuario_id,
                        cliente_nome: agendamento.cliente_nome,
                        participants: 2
                    });
                }
            }
        });

        // Converter Map para array
        rooms.push(...clientesUnicos.values());

        displayRooms(rooms);
    })
    .catch(error => {
        console.error('Erro ao carregar agendamentos:', error);
        // Mostrar mensagem de nenhum agendamento
        const emptyRooms = [{
            id: 'vazio',
            name: 'Nenhum agendamento',
            description: 'Aguardando clientes com agendamentos marcados',
            participants: 1
        }];
        displayRooms(emptyRooms);
    });
}

function showDefaultRooms() {
    const rooms = [{
        id: 'geral',
        name: 'Sala Geral',
        description: 'Conversa geral',
        participants: 1
    }];

    displayRooms(rooms);
}

function displayRooms(rooms) {
    const roomsContainer = document.getElementById('roomsContainer');

    if (rooms.length === 0) {
        roomsContainer.innerHTML = `
            <div style="padding: 20px; text-align: center; color: #999;">
                ${currentUser.role === 'cliente' ? 'Nenhum agendamento encontrado' : 'Nenhuma sala disponível'}
            </div>
        `;
        return;
    }

    roomsContainer.innerHTML = '';
    console.log('[CHAT] Exibindo', rooms.length, 'salas:', rooms);

    rooms.forEach(room => {
        const roomEl = document.createElement('div');
        roomEl.className = 'room-item';
        roomEl.setAttribute('data-room-id', room.id);
        roomEl.innerHTML = `
            <div class="room-name">${room.name}</div>
            <div class="room-description">${room.description || ''}</div>
            <div class="room-participants">${room.participants || 1} participante(s)</div>
        `;

        roomEl.addEventListener('click', (event) => selectRoom(room, event));
        roomsContainer.appendChild(roomEl);
    });
}

function selectRoom(room, event) {
    currentRoom = room;
    
    // Limpar notificação desta sala
    clearRoomNotification(room.id);
    
    // Atualizar UI
    document.querySelectorAll('.room-item').forEach(el => {
        el.classList.remove('active');
    });
    const target = (event && (event.currentTarget || event.target)) || document.querySelector(`[data-room-id="${room.id}"]`);
    if (target) {
        target.classList.add('active');
    }
    
    // Atualizar cabeçalho
    document.getElementById('currentRoomName').textContent = room.name;
    
    // Limpar container
    document.getElementById('messagesContainer').innerHTML = '';
    messageHistory[currentRoom.id] = [];
    
    // Habilitar input
    document.getElementById('messageInput').disabled = false;
    document.getElementById('sendBtn').disabled = false;
    
    // Carregar histórico do servidor
    loadMessageHistory();
}

function sendTCPJoinRoom(room) {
    const data = {
        type: 'join_room',
        username: currentUser.username,
        room: room.id,
        user_id: currentUser.usuario_id
    };
    
    console.log('[TCP] Entrando na sala:', data);
    
    // Simular armazenamento
    if (!connectedRooms.includes(room.id)) {
        connectedRooms.push(room.id);
    }
}

function sendUDPRegister(room) {
    const data = {
        type: 'register',
        username: currentUser.username,
        room: room.id,
        user_id: currentUser.usuario_id
    };
    
    console.log('[UDP] Registrado na sala:', data);
}

function sendTCPLeaveRoom(room) {
    const data = {
        type: 'leave_room',
        username: currentUser.username,
        room: room.id
    };
    
    console.log('[TCP] Saindo da sala:', data);
    connectedRooms = connectedRooms.filter(r => r !== room.id);
    
    // Parar polling quando sair da sala
    stopPollingMessages();
}

// ===== MENSAGENS =====
function sendMessage() {
    const input = document.getElementById('messageInput');
    const text = input.value.trim();
    
    if (!text || !currentRoom) return;
    
    const message = {
        type: 'chat_message',
        username: currentUser.username,
        user_id: currentUser.usuario_id,
        text: text,
        room: currentRoom.id,
        timestamp: new Date().toISOString()
    };
    
    // Adicionar ao histórico local e exibir imediatamente
    if (!messageHistory[message.room]) {
        messageHistory[message.room] = [];
    }
    messageHistory[message.room].push(message);
    displayMessage(message, true);

    // Priorizar envio via WebSocket; fallback para API HTTP
    if (wsSocket && wsSocket.readyState === WebSocket.OPEN) {
        wsSocket.send(JSON.stringify(message));
    } else {
        sendMessageToServer(message);
    }
    
    // Limpar input
    input.value = '';
    input.focus();
    
    // Remover notificação de digitação
    clearTimeout(typingTimeout);
}

function sendUDPMessage(message) {
    console.log('[UDP] Enviando mensagem:', message);
    
    // Simular broadcast para outras abas/clientes
    broadcastMessage(message);
}

function sendTCPMessage(message) {
    console.log('[TCP] Armazenando mensagem:', message);
    
    // Salvar no servidor via API
    sendMessageToServer(message);
    
    // Salvar no localStorage como fallback
    localStorage.setItem(
        `chat_messages_${message.room}`,
        JSON.stringify(messageHistory[message.room])
    );
    
    // Notificar o outro lado que há mensagens nesta sala
    const notification = {
        room: message.room,
        timestamp: message.timestamp,
        sender_id: message.user_id,
        sender_name: message.username
    };
    localStorage.setItem(`chat_notification_${message.room}`, JSON.stringify(notification));
}

function sendMessageToServer(message) {
    fetch(`${GATEWAY_API}/chat/messages`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({
            room: message.room,
            username: message.username,
            user_id: message.user_id,
            text: message.text,
            timestamp: message.timestamp
        })
    })
    .then(response => {
        if (!response.ok) throw new Error('Erro ao enviar mensagem');
        console.log('[API] Mensagem enviada com sucesso');
        
        // Notificar outras abas que há nova mensagem
        const notificationKey = `chat_new_message_${message.room}`;
        const timestamp = new Date().getTime();
        localStorage.setItem(notificationKey, timestamp);
        
        // Limpar notificação após 100ms para permitir múltiplas notificações
        setTimeout(() => {
            localStorage.removeItem(notificationKey);
        }, 100);
    })
    .catch(error => {
        console.error('[API ERROR] Erro ao enviar mensagem:', error);
    });
}

function broadcastMessage(message) {
    // Simular broadcast (em produção seria via UDP real)
    const event = new CustomEvent('udp-message', { detail: message });
    window.dispatchEvent(event);
}

function displayMessage(message, isOwn = false) {
    const container = document.getElementById('messagesContainer');
    
    // Limpar estado vazio
    if (container.querySelector('.empty-state')) {
        container.innerHTML = '';
    }
    
    const msgEl = document.createElement('div');
    msgEl.className = `message ${isOwn ? 'own' : 'other'}`;
    
    const time = new Date(message.timestamp).toLocaleTimeString('pt-BR', {
        hour: '2-digit',
        minute: '2-digit'
    });
    
    // Criar wrapper para conteúdo (autor, bolha, horário)
    const contentWrapper = document.createElement('div');
    contentWrapper.style.display = 'flex';
    contentWrapper.style.flexDirection = 'column';
    contentWrapper.style.gap = '2px';
    contentWrapper.style.alignItems = isOwn ? 'flex-end' : 'flex-start';
    
    if (!isOwn) {
        const author = document.createElement('div');
        author.className = 'message-author';
        author.textContent = message.username;
        contentWrapper.appendChild(author);
    }
    
    const bubble = document.createElement('div');
    bubble.className = 'message-bubble';
    bubble.textContent = message.text;
    contentWrapper.appendChild(bubble);
    
    const meta = document.createElement('div');
    meta.className = 'message-meta';
    meta.textContent = time;
    contentWrapper.appendChild(meta);
    
    msgEl.appendChild(contentWrapper);
    container.appendChild(msgEl);
    container.scrollTop = container.scrollHeight;
}

function handleMessageKeyPress(e) {
    if (e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault();
        sendMessage();
    }
}

// ===== HISTÓRICO =====
function loadMessageHistory() {
    if (!currentRoom) return;
    
    const container = document.getElementById('messagesContainer');
    
    // Só mostra "Carregando..." se não houver histórico
    if (!messageHistory[currentRoom.id] || messageHistory[currentRoom.id].length === 0) {
        container.innerHTML = '<div style="text-align: center; color: #999; padding: 20px;">Carregando histórico...</div>';
    }
    
    // Carregar do servidor
    loadMessageHistoryFromServer();
}

function loadMessageHistoryFromServer() {
    if (!currentRoom) return;
    
    fetch(`${GATEWAY_API}/chat/messages?room=${currentRoom.id}`, {
        method: 'GET',
        headers: {
            'Content-Type': 'application/json'
        }
    })
    .then(response => {
        if (!response.ok) throw new Error('Erro ao carregar mensagens');
        return response.json();
    })
    .then(messages => {
        const container = document.getElementById('messagesContainer');
        
        if (!Array.isArray(messages)) {
            console.error('[CHAT] Resposta não é array:', messages);
            return;
        }
        
        // Renderiza sempre a partir do servidor para manter consistência
        messageHistory[currentRoom.id] = [];
        container.innerHTML = '';

        if (messages.length === 0) {
            container.innerHTML = `
                <div class="empty-state">
                    <h3>Sem mensagens</h3>
                    <p>Este é o início da conversa</p>
                </div>
            `;
            return;
        }

        messages.forEach(msg => {
            messageHistory[currentRoom.id].push(msg);
            const isOwn = msg.user_id === currentUser.usuario_id;
            displayMessage(msg, isOwn);
        });

        console.log(`[CHAT] Carregadas ${messages.length} mensagens do servidor`);
    })
    .catch(error => {
        console.error('[API ERROR]', error);
    });
}

function loadMessageHistoryLocal() {
    if (!currentRoom) return;
    
    const container = document.getElementById('messagesContainer');
    const savedMessages = JSON.parse(
        localStorage.getItem(`chat_messages_${currentRoom.id}`) || '[]'
    );
    
    container.innerHTML = '';
    
    if (savedMessages.length === 0) {
        container.innerHTML = `
            <div class="empty-state">
                <h3>Sem mensagens</h3>
                <p>Este é o início da conversa</p>
            </div>
        `;
        return;
    }
    
    savedMessages.forEach(msg => {
        const isOwn = msg.user_id === currentUser.usuario_id;
        displayMessage(msg, isOwn);
    });
}

// ===== POLLING DE MENSAGENS =====
function startPollingMessages() {
    // Parar polling anterior se existir
    if (pollingInterval) {
        clearInterval(pollingInterval);
    }
    
    console.log('[CHAT] Iniciando polling de mensagens');
    
    // Verificar imediatamente
    loadMessageHistoryFromServer();
    
    // Iniciar novo polling a cada 1 segundo
    pollingInterval = setInterval(() => {
        if (currentRoom) {
            loadMessageHistoryFromServer();
        }
    }, 1000);
}

function stopPollingMessages() {
    if (pollingInterval) {
        clearInterval(pollingInterval);
        pollingInterval = null;
        console.log('[CHAT] Polling de mensagens parado');
    }
}

// ===== SALAS =====
function showCreateRoomModal() {
    document.getElementById('createRoomModal').classList.add('show');
}

function closeCreateRoomModal() {
    document.getElementById('createRoomModal').classList.remove('show');
    document.getElementById('newRoomName').value = '';
    document.getElementById('newRoomDescription').value = '';
}

function createNewRoom() {
    const name = document.getElementById('newRoomName').value.trim();
    const description = document.getElementById('newRoomDescription').value.trim();
    
    if (!name) {
        alert('Digite um nome para a sala');
        return;
    }
    
    const roomId = name.toLowerCase().replace(/\s+/g, '_');
    
    const newRoom = {
        id: roomId,
        name: name,
        description: description,
        created_by: currentUser.username,
        created_at: new Date().toISOString(),
        participants: 1
    };
    
    // Salvar sala
    const savedRooms = JSON.parse(localStorage.getItem('chat_rooms') || '[]');
    savedRooms.push(newRoom);
    localStorage.setItem('chat_rooms', JSON.stringify(savedRooms));
    
    // Enviar request TCP
    console.log('[TCP] Criando sala:', newRoom);
    
    closeCreateRoomModal();
    loadRooms();
    
    alert('Sala criada com sucesso!');
}

// ===== UTILIDADES =====
function updateConnectionStatus(status, connected) {
    const statusEl = document.getElementById('connectionStatus');
    if (statusEl) {
        statusEl.textContent = status;
        statusEl.className = connected ? '' : 'offline';
    }
}

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

function logoutChat() {
    if (confirm('Sair do chat?')) {
        // Sair de todas as salas
        connectedRooms.forEach(room => {
            sendTCPLeaveRoom({ id: room });
        });
        
        logout();
    }
}

function voltarAoDash() {
    console.log('[CHAT] Voltando ao dashboard...');
    console.log('[CHAT] currentUser:', currentUser);
    
    // Parar polling de mensagens
    if (typeof stopPollingMessages === 'function') {
        stopPollingMessages();
    }
    
    // Sair de todas as salas
    if (connectedRooms && connectedRooms.length > 0) {
        connectedRooms.forEach(room => {
            sendTCPLeaveRoom({ id: room });
        });
    }
    
    // Redirecionar baseado na role do usuário
    if (currentUser && currentUser.role === 'profissional') {
        console.log('[CHAT] Redirecionando para profissional_dashboard.html');
        window.location.href = 'profissional_dashboard.html';
    } else {
        console.log('[CHAT] Redirecionando para cliente_dashboard.html');
        window.location.href = 'cliente_dashboard.html';
    }
}

// ===== LISTENER PARA MENSAGENS UDP (simuladas) =====
window.addEventListener('udp-message', (e) => {
    const message = e.detail;
    
    // Só exibir se está na mesma sala
    if (currentRoom && message.room === currentRoom.id) {
        const isOwn = message.username === currentUser.username;
        if (!isOwn) {
            displayMessage(message, false);
        }
    }
});

// ===== LISTENER PARA FECHAR MODAL =====
document.addEventListener('click', (e) => {
    const modal = document.getElementById('createRoomModal');
    if (e.target === modal) {
        closeCreateRoomModal();
    }
});

// ===== NOTIFICAÇÃO DE DIGITAÇÃO =====
document.getElementById('messageInput')?.addEventListener('input', () => {
    if (!currentRoom) return;
    
    clearTimeout(typingTimeout);
    
    // Enviar notificação de digitação
    const data = {
        type: 'typing',
        username: currentUser.username,
        room: currentRoom.id
    };
    
    console.log('[UDP] Notificando digitação:', data);
    
    // Limpar notificação após 3 segundos de inatividade
    typingTimeout = setTimeout(() => {
        console.log('[UDP] Digitação finalizada');
    }, 3000);
});

// ===== EXPOR FUNÇÕES GLOBALMENTE =====
window.voltarAoDash = voltarAoDash;
window.sendMessage = sendMessage;
window.handleMessageKeyPress = handleMessageKeyPress;
window.showCreateRoomModal = showCreateRoomModal;
window.closeCreateRoomModal = closeCreateRoomModal;
window.createNewRoom = createNewRoom;
window.logoutChat = logoutChat;
window.toggleNotificationPanel = toggleNotificationPanel;
window.removeToast = removeToast;
