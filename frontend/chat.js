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
    
    // Carregar salas
    loadRooms();
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
        user_id: currentUser.id,
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
    fetch(`${DJANGO_API}/meus-agendamentos/?user_id=${currentUser.id}`, {
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

        agendamentos.forEach(agendamento => {
            if (agendamento.profissional_usuario_id && agendamento.profissional_nome) {
                if (!profissionaisUnicos.has(agendamento.profissional_usuario_id)) {
                    profissionaisUnicos.set(agendamento.profissional_usuario_id, {
                        id: `cliente_${currentUser.id}_profissional_${agendamento.profissional_usuario_id}`,
                        name: `Chat com ${agendamento.profissional_nome}`,
                        description: `Conversar sobre seus agendamentos`,
                        profissional_id: agendamento.profissional_usuario_id,
                        profissional_nome: agendamento.profissional_nome,
                        participants: 1
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

    // Para profissionais: buscar conversas ativas (salas que contenham mensagens)
    const conversas = [];
    const messageKeys = Object.keys(localStorage).filter(key => key.startsWith('chat_messages_'));

    messageKeys.forEach(key => {
        const roomId = key.replace('chat_messages_', '');
        // Se a sala contém o ID do profissional, é uma conversa com cliente
        if (roomId.includes(`_profissional_${currentUser.id}`)) {
            const messages = JSON.parse(localStorage.getItem(key) || '[]');
            if (messages.length > 0) {
                const lastMessage = messages[messages.length - 1];
                const clienteId = roomId.split('_')[1]; // cliente_{clienteId}_profissional_{profissionalId}

                conversas.push({
                    id: roomId,
                    name: `Conversa com Cliente ${clienteId}`,
                    description: `Última mensagem: ${lastMessage.text.substring(0, 50)}...`,
                    participants: 2,
                    lastMessage: lastMessage
                });
            }
        }
    });

    // Se não há conversas ativas, mostrar sala vazia
    if (conversas.length === 0) {
        conversas.push({
            id: 'profissional_geral',
            name: 'Aguardando conversas',
            description: 'Nenhuma conversa ativa com clientes',
            participants: 1
        });
    }

    displayRooms(conversas);
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

    rooms.forEach(room => {
        const roomEl = document.createElement('div');
        roomEl.className = 'room-item';
        roomEl.innerHTML = `
            <div class="room-name">${room.name}</div>
            <div class="room-description">${room.description}</div>
            <div class="room-participants">${room.participants || 1} participante(s)</div>
        `;

        roomEl.addEventListener('click', () => selectRoom(room));
        roomsContainer.appendChild(roomEl);
    });
}

function selectRoom(room) {
    currentRoom = room;
    
    // Atualizar UI
    document.querySelectorAll('.room-item').forEach(el => {
        el.classList.remove('active');
    });
    event.target.closest('.room-item').classList.add('active');
    
    // Atualizar cabeçalho
    document.getElementById('currentRoomName').textContent = room.name;
    
    // Limpar mensagens
    document.getElementById('messagesContainer').innerHTML = '';
    
    // Habilitar input
    document.getElementById('messageInput').disabled = false;
    document.getElementById('sendBtn').disabled = false;
    
    // Enviar request TCP para entrar na sala
    sendTCPJoinRoom(room);
    
    // Registrar no UDP
    sendUDPRegister(room);
    
    // Carregar histórico
    loadMessageHistory();
}

function sendTCPJoinRoom(room) {
    const data = {
        type: 'join_room',
        username: currentUser.username,
        room: room.id,
        user_id: currentUser.id
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
        user_id: currentUser.id
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
}

// ===== MENSAGENS =====
function sendMessage() {
    const input = document.getElementById('messageInput');
    const text = input.value.trim();
    
    if (!text || !currentRoom) return;
    
    const message = {
        type: 'message',
        username: currentUser.username,
        user_id: currentUser.id,
        text: text,
        room: currentRoom.id,
        timestamp: new Date().toISOString()
    };
    
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
    
    // Salvar histórico localmente
    if (!messageHistory[message.room]) {
        messageHistory[message.room] = [];
    }
    messageHistory[message.room].push(message);
    
    localStorage.setItem(
        `chat_messages_${message.room}`,
        JSON.stringify(messageHistory[message.room])
    );
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
    
    msgEl.innerHTML = `
        <div>
            ${!isOwn ? `<div class="message-author">${message.username}</div>` : ''}
            <div class="message-bubble">
                ${escapeHtml(message.text)}
            </div>
            <div class="message-meta">${time}</div>
        </div>
    `;
    
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
    container.innerHTML = '<div style="text-align: center; color: #999; padding: 20px;">Carregando histórico...</div>';
    
    // Solicitar ao servidor TCP
    const data = {
        type: 'get_history',
        username: currentUser.username,
        room: currentRoom.id,
        user_id: currentUser.id
    };
    
    console.log('[TCP] Solicitando histórico:', data);
    
    // Simular carregamento de histórico
    setTimeout(() => {
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
            const isOwn = msg.username === currentUser.username;
            displayMessage(msg, isOwn);
        });
    }, 300);
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
