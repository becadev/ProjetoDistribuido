// ===== CONFIGURAÇÕES TCP/UDP =====
const TCP_HOST = 'localhost';
const TCP_PORT = 5000;
const UDP_HOST = 'localhost';
const UDP_PORT = 5001;
const DJANGO_API = 'http://localhost:8001';

// ===== ESTADO DO CHAT =====
let currentUser = null;
let currentRoom = null;
let tcpSocket = null;
let udpSocket = null;
let messageHistory = {};
let connectedRooms = [];
let typingTimeout = null;
let lastMessageCount = 0;  // Controlar se há novas mensagens
let pollingInterval = null;  // Para polling de novas mensagens

// ===== INICIALIZAÇÃO =====
document.addEventListener('DOMContentLoaded', () => {
    currentUser = getUser();
    
    if (!currentUser) {
        window.location.href = 'login.html';
        return;
    }

    // Atualizar informações do usuário
    document.getElementById('userDisplayName').textContent = currentUser.username;
    
    // Inicializar conexão TCP
    initTCPConnection();
    
    // Simular conexão UDP (em produção seria WebSocket)
    initUDPSimulation();
    
    // Carregar salas uma única vez
    loadRooms();
    
    // Listener para storage (detecta mudanças de outras abas e notificações de mensagens)
    window.addEventListener('storage', (event) => {
        console.log('[CHAT] Storage event detectado:', event.key);
        
        // Se mudança em notificação de nova mensagem, carregar mensagens
        if (event.key && event.key.startsWith('chat_new_message_')) {
            const roomId = event.key.replace('chat_new_message_', '');
            console.log(`[CHAT] Nova mensagem na sala ${roomId}`);
            
            // Apenas recarregar se estamos nessa sala
            if (currentRoom && currentRoom.id === roomId) {
                console.log('[CHAT] Recarregando histórico de mensagens...');
                loadMessageHistoryFromServer();
            }
        }
        
        // Se mudança em notificação de nova sala, recarregar salas
        if (event.key && event.key.startsWith('chat_notification_')) {
            console.log('[CHAT] Notificação de sala detectada, recarregando salas...');
            loadRooms();
        }
    });
});

// ===== TCP CONNECTION =====
function initTCPConnection() {
    try {
        // Simular conexão TCP (na prática, seria via WebSocket ou HTTP polling)
        console.log('[TCP] Tentando conectar ao servidor TCP...');
        
        // Enviar login TCP
        sendTCPLogin();
        
        updateConnectionStatus('Conectado', true);
    } catch (error) {
        console.error('[TCP ERROR]', error);
        updateConnectionStatus('Desconectado', false);
    }
}

function sendTCPLogin() {
    const loginData = {
        type: 'login',
        username: currentUser.username,
        user_id: currentUser.usuario_id,
        role: currentUser.role,
        profile_id: currentUser.profile_id
    };
    
    // Simular envio TCP (em produção seria via WebSocket)
    console.log('[TCP] Enviando login:', loginData);
    localStorage.setItem('tcp_logged_in', JSON.stringify(loginData));
}

// ===== UDP SIMULATION =====
function initUDPSimulation() {
    console.log('[UDP] Inicializando comunicação UDP simulada...');
    // Em produção, seria uma conexão WebSocket para simular UDP
    updateConnectionStatus('Conectado', true);
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
        roomEl.innerHTML = `
            <div class="room-name">${room.name}</div>
            <div class="room-description">${room.description || ''}</div>
            <div class="room-participants">${room.participants || 1} participante(s)</div>
        `;

        roomEl.addEventListener('click', () => selectRoom(room));
        roomsContainer.appendChild(roomEl);
    });
}

function selectRoom(room) {
    // Parar polling da sala anterior
    stopPollingMessages();
    
    currentRoom = room;
    
    // Atualizar UI
    document.querySelectorAll('.room-item').forEach(el => {
        el.classList.remove('active');
    });
    event.target.closest('.room-item').classList.add('active');
    
    // Atualizar cabeçalho
    document.getElementById('currentRoomName').textContent = room.name;
    
    // Limpar mensagens e resetar histórico local para recarregar do servidor
    document.getElementById('messagesContainer').innerHTML = '';
    messageHistory[currentRoom.id] = [];
    
    // Habilitar input
    document.getElementById('messageInput').disabled = false;
    document.getElementById('sendBtn').disabled = false;
    
    // Enviar request TCP para entrar na sala
    sendTCPJoinRoom(room);
    
    // Registrar no UDP
    sendUDPRegister(room);
    
    // Carregar histórico
    loadMessageHistory();
    
    // Iniciar polling de novas mensagens
    startPollingMessages();
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
        type: 'message',
        username: currentUser.username,
        user_id: currentUser.usuario_id,
        text: text,
        room: currentRoom.id,
        timestamp: new Date().toISOString()
    };
    
    // Adicionar ao histórico local ANTES de exibir (para evitar duplicação no polling)
    if (!messageHistory[message.room]) {
        messageHistory[message.room] = [];
    }
    messageHistory[message.room].push(message);
    
    // Exibir mensagem localmente
    displayMessage(message, true);
    
    // Enviar via UDP (rápido)
    sendUDPMessage(message);
    
    // Enviar via TCP (armazenar)
    sendTCPMessage(message);
    
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
    fetch(`${DJANGO_API}/chat/messages/`, {
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
    
    fetch(`${DJANGO_API}/chat/messages/?room=${currentRoom.id}`, {
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
        
        // Inicializar histórico da sala se não existir
        if (!messageHistory[currentRoom.id]) {
            messageHistory[currentRoom.id] = [];
        }
        
        const historicoAtual = messageHistory[currentRoom.id];
        
        if (messages.length === 0) {
            if (historicoAtual.length === 0) {
                container.innerHTML = `
                    <div class="empty-state">
                        <h3>Sem mensagens</h3>
                        <p>Este é o início da conversa</p>
                    </div>
                `;
            }
            return;
        }
        
        // Se é a primeira vez (histórico vazio), renderizar tudo
        if (historicoAtual.length === 0) {
            container.innerHTML = '';
            messages.forEach(msg => {
                historicoAtual.push(msg);
                const isOwn = msg.user_id === currentUser.usuario_id;
                displayMessage(msg, isOwn);
            });
            console.log(`[CHAT] Carregadas ${messages.length} mensagens iniciais`);
            return;
        }
        
        // Se há mais mensagens no servidor que no histórico local
        if (messages.length > historicoAtual.length) {
            // Pegar apenas as novas mensagens (do final)
            const novasMensagens = messages.slice(historicoAtual.length);
            
            novasMensagens.forEach(msg => {
                historicoAtual.push(msg);
                const isOwn = msg.user_id === currentUser.usuario_id;
                displayMessage(msg, isOwn);
            });
            
            console.log(`[CHAT] Adicionadas ${novasMensagens.length} mensagens novas`);
        }
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
window.createRoom = createRoom;
window.logoutChat = logoutChat;
