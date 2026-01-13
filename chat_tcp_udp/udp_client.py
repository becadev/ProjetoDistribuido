import socket
import threading
import json
from datetime import datetime

class UDPClient:
    """
    Cliente UDP para comunicação rápida de mensagens do chat.
    Responsável por: enviar/receber mensagens em tempo real, notificações de digitação.
    Sem garantia de entrega, mas com baixa latência.
    """
    
    def __init__(self, username, host='localhost', port=5001):
        self.username = username
        self.host = host
        self.port = port
        self.socket = socket.socket(socket.AF_INET, socket.SOCK_DGRAM)
        self.socket.setsockopt(socket.SOL_SOCKET, socket.SO_REUSEADDR, 1)
        self.current_room = 'general'
        self.running = False
    
    def register(self, room='general'):
        """Se registra no servidor UDP"""
        self.current_room = room
        msg = {
            'type': 'register',
            'username': self.username,
            'room': room
        }
        try:
            self.socket.sendto(
                json.dumps(msg).encode('utf-8'),
                (self.host, self.port)
            )
            print(f"[UDP] Registrado na sala: {room}")
        except Exception as e:
            print(f"[UDP ERROR] Falha ao registrar: {e}")
    
    def start_listening(self):
        """Inicia a escuta de mensagens UDP"""
        self.running = True
        self.socket.bind(('', 0))  # Bind a uma porta aleatória
        self.local_port = self.socket.getsockname()[1]
        
        listen_thread = threading.Thread(
            target=self.listen_messages,
            daemon=True
        )
        listen_thread.start()
        print(f"[UDP] Escutando na porta {self.local_port}")
    
    def listen_messages(self):
        """Escuta mensagens recebidas do servidor"""
        while self.running:
            try:
                data, addr = self.socket.recvfrom(1024)
                message = json.loads(data.decode('utf-8'))
                self.process_message(message)
            except Exception as e:
                if self.running:
                    print(f"[UDP ERROR] {e}")
    
    def process_message(self, message):
        """Processa mensagens recebidas"""
        msg_type = message.get('type')
        
        if msg_type == 'message':
            self.display_message(message)
        
        elif msg_type == 'typing':
            self.display_typing_notification(message)
    
    def send_message(self, text):
        """Envia uma mensagem"""
        msg = {
            'type': 'message',
            'username': self.username,
            'text': text,
            'room': self.current_room
        }
        try:
            self.socket.sendto(
                json.dumps(msg).encode('utf-8'),
                (self.host, self.port)
            )
        except Exception as e:
            print(f"[UDP ERROR] Falha ao enviar: {e}")
    
    def notify_typing(self):
        """Notifica que está digitando"""
        msg = {
            'type': 'typing',
            'username': self.username,
            'room': self.current_room
        }
        try:
            self.socket.sendto(
                json.dumps(msg).encode('utf-8'),
                (self.host, self.port)
            )
        except Exception as e:
            print(f"[UDP ERROR] {e}")
    
    def change_room(self, room):
        """Muda para outra sala"""
        self.current_room = room
        self.register(room)
    
    def display_message(self, message):
        """Exibe uma mensagem recebida"""
        username = message['username']
        text = message['text']
        timestamp = message.get('timestamp', '')
        
        print(f"\n[{timestamp}] {username}: {text}")
        print(f"{self.username}> ", end='', flush=True)
    
    def display_typing_notification(self, message):
        """Exibe notificação de digitação"""
        username = message['username']
        print(f"\n[DIGITANDO] {username} está digitando...")
        print(f"{self.username}> ", end='', flush=True)
    
    def close(self):
        """Encerra a conexão"""
        self.running = False
        msg = {
            'type': 'unregister',
            'username': self.username
        }
        try:
            self.socket.sendto(
                json.dumps(msg).encode('utf-8'),
                (self.host, self.port)
            )
        except:
            pass
        self.socket.close()
        print("[UDP] Desconectado")


# Exemplo de uso
if __name__ == '__main__':
    username = input("Digite seu nome de usuário: ")
    room = input("Digite a sala (padrão: general): ").strip() or 'general'
    
    client = UDPClient(username)
    client.start_listening()
    client.register(room)
    
    import time
    time.sleep(0.5)  # Aguarda o bind
    
    print("\n--- Chat UDP (tempo real) ---")
    print("Digite suas mensagens (Ctrl+C para sair)")
    print("Comandos:")
    print("  /room <nome> - Trocar de sala")
    print("  /quit - Sair")
    print("----------------------------\n")
    
    try:
        while True:
            text = input(f"{username}> ").strip()
            
            if text.startswith('/room '):
                new_room = text.split(' ', 1)[1]
                client.change_room(new_room)
            
            elif text == '/quit':
                break
            
            elif text:
                client.notify_typing()
                time.sleep(0.1)
                client.send_message(text)
    
    except KeyboardInterrupt:
        print("\n")
    
    finally:
        client.close()
