import socket
import threading
import json
from datetime import datetime

class TCPServer:
    """
    Servidor TCP para gerenciar conexões confiáveis do chat.
    Responsável por: autenticação, registro de usuários, salas, histórico.
    """
    
    def __init__(self, host='localhost', port=5000):
        self.host = host
        self.port = port
        self.socket = socket.socket(socket.AF_INET, socket.SOCK_STREAM)
        self.clients = {}  # {username: (socket, addr)}
        self.rooms = {}  # {room_name: [usernames]}
        self.message_history = {}  # {room_name: [messages]}
        self.lock = threading.Lock()
        
    def start(self):
        """Inicia o servidor TCP"""
        self.socket.bind((self.host, self.port))
        self.socket.listen(5)
        print(f"[TCP SERVER] Aguardando conexões em {self.host}:{self.port}")
        
        try:
            while True:
                client_socket, addr = self.socket.accept()
                client_thread = threading.Thread(
                    target=self.handle_client,
                    args=(client_socket, addr),
                    daemon=True
                )
                client_thread.start()
        except KeyboardInterrupt:
            self.close()
    
    def handle_client(self, client_socket, addr):
        """Gerencia um cliente conectado"""
        username = None
        user_id = None
        user_role = None
        try:
            # Recebe dados de autenticação
            data = client_socket.recv(1024).decode('utf-8')
            message = json.loads(data)
            
            if message['type'] == 'login':
                username = message['username']
                user_id = message.get('user_id')
                user_role = message.get('role', 'cliente')
                
                with self.lock:
                    self.clients[username] = {
                        'socket': client_socket,
                        'addr': addr,
                        'user_id': user_id,
                        'role': user_role,
                        'connected_rooms': []
                    }
                
                response = {
                    'type': 'login_success',
                    'message': f'Bem-vindo {username}!',
                    'user_id': user_id,
                    'role': user_role
                }
                client_socket.send(json.dumps(response).encode('utf-8'))
                print(f"[TCP] {username} (ID: {user_id}, Role: {user_role}) conectado de {addr}")
                
                # Escuta mensagens do cliente
                self.receive_messages(client_socket, username)
        
        except Exception as e:
            print(f"[TCP ERROR] {e}")
        finally:
            if username:
                with self.lock:
                    if username in self.clients:
                        del self.clients[username]
                print(f"[TCP] {username} desconectado")
            client_socket.close()
    
    def receive_messages(self, client_socket, username):
        """Recebe mensagens confiáveis do cliente"""
        while True:
            try:
                data = client_socket.recv(1024).decode('utf-8')
                if not data:
                    break
                
                message = json.loads(data)
                self.process_message(message, username)
                
            except Exception as e:
                print(f"[TCP ERROR] {username}: {e}")
                break
    
    def process_message(self, message, username):
        """Processa diferentes tipos de mensagens"""
        msg_type = message.get('type')
        
        if msg_type == 'join_room':
            self.join_room(username, message['room'])
        
        elif msg_type == 'leave_room':
            self.leave_room(username, message['room'])
        
        elif msg_type == 'get_history':
            self.send_history(username, message['room'])
        
        elif msg_type == 'get_users':
            self.send_room_users(username, message['room'])
        
        elif msg_type == 'create_room':
            self.create_room(message['room'])
        
        elif msg_type == 'message':
            self.handle_chat_message(message, username)
    
    def join_room(self, username, room):
        """Adiciona usuário a uma sala"""
        with self.lock:
            if room not in self.rooms:
                self.rooms[room] = []
                self.message_history[room] = []
            
            if username not in self.rooms[room]:
                self.rooms[room].append(username)
                
                # Registrar sala no cliente
                if username in self.clients:
                    self.clients[username]['connected_rooms'].append(room)
                
                print(f"[TCP] {username} entrou na sala {room}")
    
    def leave_room(self, username, room):
        """Remove usuário de uma sala"""
        with self.lock:
            if room in self.rooms and username in self.rooms[room]:
                self.rooms[room].remove(username)
                print(f"[TCP] {username} saiu da sala {room}")
    
    def send_history(self, username, room):
        """Envia histórico de mensagens de uma sala"""
        with self.lock:
            if username in self.clients and room in self.message_history:
                client_socket = self.clients[username]['socket']
                response = {
                    'type': 'history',
                    'room': room,
                    'messages': self.message_history[room]
                }
                try:
                    client_socket.send(json.dumps(response).encode('utf-8'))
                except Exception as e:
                    print(f"[TCP ERROR] Falha ao enviar histórico para {username}: {e}")
    
    def send_room_users(self, username, room):
        """Envia lista de usuários em uma sala"""
        with self.lock:
            if username in self.clients and room in self.rooms:
                client_socket = self.clients[username]['socket']
                response = {
                    'type': 'room_users',
                    'room': room,
                    'users': self.rooms[room]
                }
                try:
                    client_socket.send(json.dumps(response).encode('utf-8'))
                except Exception as e:
                    print(f"[TCP ERROR] Falha ao enviar usuários para {username}: {e}")
    
    def create_room(self, room):
        """Cria uma nova sala de chat"""
        with self.lock:
            if room not in self.rooms:
                self.rooms[room] = []
                self.message_history[room] = []
                print(f"[TCP] Sala '{room}' criada")
    
    def save_message(self, room, username, text):
        """Salva mensagem no histórico"""
        with self.lock:
            if room in self.message_history:
                message = {
                    'username': username,
                    'text': text,
                    'timestamp': datetime.now().isoformat()
                }
                self.message_history[room].append(message)
    
    def close(self):
        """Fecha o servidor"""
        self.socket.close()
        print("[TCP SERVER] Servidor encerrado")


if __name__ == '__main__':
    server = TCPServer()
    server.start()
