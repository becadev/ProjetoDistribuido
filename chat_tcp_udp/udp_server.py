import socket
import threading
import json
from datetime import datetime

class UDPServer:
    """
    Servidor UDP para enviar mensagens rápidas do chat.
    Responsável por: broadcast de mensagens, notificações em tempo real.
    Sem garantia de entrega, mas com baixa latência.
    """
    
    def __init__(self, host='localhost', port=5001):
        self.host = host
        self.port = port
        self.socket = socket.socket(socket.AF_INET, socket.SOCK_DGRAM)
        self.clients = {}  # {username: (addr, room)}
        self.rooms = {}  # {room_name: [usernames]}
        self.lock = threading.Lock()
    
    def start(self):
        """Inicia o servidor UDP"""
        self.socket.bind((self.host, self.port))
        print(f"[UDP SERVER] Aguardando mensagens em {self.host}:{self.port}")
        
        try:
            while True:
                data, addr = self.socket.recvfrom(1024)
                thread = threading.Thread(
                    target=self.handle_message,
                    args=(data, addr),
                    daemon=True
                )
                thread.start()
        except KeyboardInterrupt:
            self.close()
    
    def handle_message(self, data, addr):
        """Processa mensagens UDP recebidas"""
        try:
            message = json.loads(data.decode('utf-8'))
            msg_type = message.get('type')
            
            if msg_type == 'register':
                self.register_client(
                    message['username'], 
                    addr, 
                    message.get('room', 'general'),
                    message.get('user_id')
                )
            
            elif msg_type == 'message':
                self.broadcast_message(message)
            
            elif msg_type == 'typing':
                self.broadcast_typing(message)
            
            elif msg_type == 'unregister':
                self.unregister_client(message['username'])
        
        except Exception as e:
            print(f"[UDP ERROR] {e}")
    
    def register_client(self, username, addr, room='general', user_id=None):
        """Registra um cliente UDP para receber mensagens"""
        with self.lock:
            self.clients[username] = {
                'addr': addr,
                'room': room,
                'user_id': user_id
            }
            
            if room not in self.rooms:
                self.rooms[room] = []
            
            if username not in self.rooms[room]:
                self.rooms[room].append(username)
            
            print(f"[UDP] {username} (ID: {user_id}) registrado em {addr} (sala: {room})")
    
    def unregister_client(self, username):
        """Remove um cliente do registro"""
        with self.lock:
            if username in self.clients:
                addr, room_data = self.clients[username]['addr'], self.clients[username]['room']
                del self.clients[username]
                
                if room_data in self.rooms and username in self.rooms[room_data]:
                    self.rooms[room_data].remove(username)
                
                print(f"[UDP] {username} desregistrado")
    
    def broadcast_message(self, message):
        """Envia mensagem para todos em uma sala (broadcast)"""
        room = message.get('room', 'general')
        
        with self.lock:
            if room in self.rooms:
                msg_data = {
                    'type': 'message',
                    'username': message['username'],
                    'user_id': message.get('user_id'),
                    'text': message['text'],
                    'room': room,
                    'timestamp': datetime.now().isoformat()
                }
                
                payload = json.dumps(msg_data).encode('utf-8')
                
                for username in self.rooms[room]:
                    if username in self.clients:
                        client_addr = self.clients[username]['addr']
                        try:
                            self.socket.sendto(payload, client_addr)
                        except Exception as e:
                            print(f"[UDP ERROR] Falha ao enviar para {username}: {e}")
    
    def broadcast_typing(self, message):
        """Notifica quando um usuário está digitando"""
        room = message.get('room', 'general')
        
        with self.lock:
            if room in self.rooms:
                msg_data = {
                    'type': 'typing',
                    'user_id': message.get('user_id'),
                    'room': room
                }
                
                payload = json.dumps(msg_data).encode('utf-8')
                
                for username in self.rooms[room]:
                    if username != message['username'] and username in self.clients:
                        client_addr = self.clients[username]['addr']
                        try:
                            self.socket.sendto(payload, client_addr)
                        except Exception as e:
                            print(f"[UDP ERROR] Falha ao enviar notificação para {username}")
    
    def change_room(self, username, new_room):
        """Move um cliente para outra sala"""
        with self.lock:
            old_room = self.clients[username]['room']
            if old_room == self.clients[username]['room']:
                user_id = self.clients[username]['user_id']
                
                # Remove da sala anterior
                if old_room in self.rooms and username in self.rooms[old_room]:
                    self.rooms[old_room].remove(username)
                
                # Adiciona à nova sala
                if new_room not in self.rooms:
                    self.rooms[new_room] = []
                
                self.rooms[new_room].append(username)
                self.clients[username]['room'] = new_room
                
                print(f"[UDP] {username} (ID: {user_id}")
                print(f"[UDP] {username} movido de {old_room} para {new_room}")
    
    def close(self):
        """Fecha o servidor"""
        self.socket.close()
        print("[UDP SERVER] Servidor encerrado")


if __name__ == '__main__':
    server = UDPServer()
    server.start()
