import socket
import threading
import json
import sys

class TCPClient:
    """
    Cliente TCP para comunicação confiável com o servidor.
    Responsável por: login, entrar em salas, recuperar histórico.
    """
    
    def __init__(self, username, host='localhost', port=5000):
        self.username = username
        self.host = host
        self.port = port
        self.socket = socket.socket(socket.AF_INET, socket.SOCK_STREAM)
        self.connected = False
    
    def connect(self):
        """Conecta ao servidor TCP"""
        try:
            self.socket.connect((self.host, self.port))
            self.connected = True
            
            # Envia login
            login_msg = {
                'type': 'login',
                'username': self.username
            }
            self.socket.send(json.dumps(login_msg).encode('utf-8'))
            
            # Recebe confirmação
            response = self.socket.recv(1024).decode('utf-8')
            data = json.loads(response)
            
            if data['type'] == 'login_success':
                print(f"[TCP] {data['message']}")
                
                # Inicia thread para receber mensagens
                receive_thread = threading.Thread(
                    target=self.receive_messages,
                    daemon=True
                )
                receive_thread.start()
                return True
        
        except Exception as e:
            print(f"[TCP ERROR] Falha ao conectar: {e}")
            return False
    
    def receive_messages(self):
        """Recebe mensagens do servidor"""
        while self.connected:
            try:
                data = self.socket.recv(1024).decode('utf-8')
                if not data:
                    break
                
                message = json.loads(data)
                self.process_server_message(message)
            
            except Exception as e:
                print(f"[TCP ERROR] {e}")
                break
    
    def process_server_message(self, message):
        """Processa mensagens recebidas do servidor"""
        msg_type = message.get('type')
        
        if msg_type == 'history':
            self.display_history(message)
        elif msg_type == 'room_users':
            self.display_room_users(message)
    
    def join_room(self, room):
        """Entra em uma sala de chat"""
        msg = {
            'type': 'join_room',
            'room': room
        }
        try:
            self.socket.send(json.dumps(msg).encode('utf-8'))
            print(f"[TCP] Entrando na sala: {room}")
        except Exception as e:
            print(f"[TCP ERROR] {e}")
    
    def leave_room(self, room):
        """Sai de uma sala"""
        msg = {
            'type': 'leave_room',
            'room': room
        }
        try:
            self.socket.send(json.dumps(msg).encode('utf-8'))
            print(f"[TCP] Saindo da sala: {room}")
        except Exception as e:
            print(f"[TCP ERROR] {e}")
    
    def get_history(self, room):
        """Solicita histórico de uma sala"""
        msg = {
            'type': 'get_history',
            'room': room
        }
        try:
            self.socket.send(json.dumps(msg).encode('utf-8'))
        except Exception as e:
            print(f"[TCP ERROR] {e}")
    
    def get_room_users(self, room):
        """Solicita lista de usuários em uma sala"""
        msg = {
            'type': 'get_users',
            'room': room
        }
        try:
            self.socket.send(json.dumps(msg).encode('utf-8'))
        except Exception as e:
            print(f"[TCP ERROR] {e}")
    
    def create_room(self, room):
        """Cria uma nova sala"""
        msg = {
            'type': 'create_room',
            'room': room
        }
        try:
            self.socket.send(json.dumps(msg).encode('utf-8'))
            print(f"[TCP] Sala criada: {room}")
        except Exception as e:
            print(f"[TCP ERROR] {e}")
    
    def display_history(self, message):
        """Exibe histórico de mensagens"""
        print(f"\n=== Histórico da sala '{message['room']}' ===")
        if message['messages']:
            for msg in message['messages']:
                print(f"{msg['username']}: {msg['text']} ({msg['timestamp']})")
        else:
            print("Sem mensagens nesta sala.")
        print()
    
    def display_room_users(self, message):
        """Exibe usuários em uma sala"""
        print(f"\n=== Usuários em '{message['room']}' ===")
        for user in message['users']:
            print(f"  - {user}")
        print()
    
    def close(self):
        """Desconecta do servidor"""
        self.connected = False
        self.socket.close()
        print("[TCP] Desconectado do servidor")


# Exemplo de uso
if __name__ == '__main__':
    username = input("Digite seu nome de usuário: ")
    client = TCPClient(username)
    
    if client.connect():
        print("\n--- Comandos disponíveis ---")
        print("1. join <room> - Entrar em uma sala")
        print("2. leave <room> - Sair de uma sala")
        print("3. create <room> - Criar uma sala")
        print("4. history <room> - Ver histórico")
        print("5. users <room> - Ver usuários")
        print("6. quit - Sair")
        print("----------------------------\n")
        
        while True:
            try:
                command = input("> ").strip()
                
                if command.startswith('join '):
                    room = command.split(' ', 1)[1]
                    client.join_room(room)
                
                elif command.startswith('leave '):
                    room = command.split(' ', 1)[1]
                    client.leave_room(room)
                
                elif command.startswith('create '):
                    room = command.split(' ', 1)[1]
                    client.create_room(room)
                
                elif command.startswith('history '):
                    room = command.split(' ', 1)[1]
                    client.get_history(room)
                
                elif command.startswith('users '):
                    room = command.split(' ', 1)[1]
                    client.get_room_users(room)
                
                elif command == 'quit':
                    break
                
                else:
                    print("Comando desconhecido")
            
            except KeyboardInterrupt:
                break
        
        client.close()
    else:
        print("Falha ao conectar ao servidor TCP")
