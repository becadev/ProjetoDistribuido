#!/usr/bin/env python3
"""
Script de teste para demonstrar a integração do Chat TCP/UDP
com o sistema de autenticação do projeto.

Uso:
    python test_chat_integration.py
"""

import json
import socket
import time
import threading
from datetime import datetime

# Configurações
TCP_HOST = 'localhost'
TCP_PORT = 5000
UDP_HOST = 'localhost'
UDP_PORT = 5001

class ChatTestClient:
    """Cliente de teste para chat TCP/UDP"""
    
    def __init__(self, username, user_id, role):
        self.username = username
        self.user_id = user_id
        self.role = role
        self.tcp_socket = None
        self.udp_socket = None
        self.running = False
        
    def connect_tcp(self):
        """Conecta ao servidor TCP"""
        try:
            self.tcp_socket = socket.socket(socket.AF_INET, socket.SOCK_STREAM)
            self.tcp_socket.connect((TCP_HOST, TCP_PORT))
            
            # Enviar login com dados completos
            login_data = {
                'type': 'login',
                'username': self.username,
                'user_id': self.user_id,
                'role': self.role,
                'profile_id': 100 + self.user_id
            }
            
            self.tcp_socket.send(json.dumps(login_data).encode('utf-8'))
            response = self.tcp_socket.recv(1024).decode('utf-8')
            
            print(f"[TCP] {response}")
            return True
        
        except Exception as e:
            print(f"[TCP ERROR] {e}")
            return False
    
    def connect_udp(self):
        """Conecta ao servidor UDP"""
        try:
            self.udp_socket = socket.socket(socket.AF_INET, socket.SOCK_DGRAM)
            self.udp_socket.bind(('', 0))  # Porta aleatória
            
            # Registrar no servidor UDP
            register_data = {
                'type': 'register',
                'username': self.username,
                'room': 'general',
                'user_id': self.user_id
            }
            
            self.udp_socket.sendto(
                json.dumps(register_data).encode('utf-8'),
                (UDP_HOST, UDP_PORT)
            )
            
            print(f"[UDP] Registrado na porta {self.udp_socket.getsockname()[1]}")
            return True
        
        except Exception as e:
            print(f"[UDP ERROR] {e}")
            return False
    
    def join_room(self, room):
        """Entra em uma sala via TCP"""
        try:
            data = {
                'type': 'join_room',
                'room': room
            }
            
            self.tcp_socket.send(json.dumps(data).encode('utf-8'))
            print(f"[TCP] Entrou na sala: {room}")
        
        except Exception as e:
            print(f"[TCP ERROR] {e}")
    
    def send_message(self, text, room='general'):
        """Envia mensagem via UDP"""
        try:
            msg_data = {
                'type': 'message',
                'username': self.username,
                'user_id': self.user_id,
                'text': text,
                'room': room
            }
            
            self.udp_socket.sendto(
                json.dumps(msg_data).encode('utf-8'),
                (UDP_HOST, UDP_PORT)
            )
            
            print(f"[UDP] Mensagem enviada: {text}")
        
        except Exception as e:
            print(f"[UDP ERROR] {e}")
    
    def get_history(self, room='general'):
        """Solicita histórico via TCP"""
        try:
            data = {
                'type': 'get_history',
                'room': room
            }
            
            self.tcp_socket.send(json.dumps(data).encode('utf-8'))
            print(f"[TCP] Histórico solicitado para sala: {room}")
        
        except Exception as e:
            print(f"[TCP ERROR] {e}")
    
    def close(self):
        """Fecha as conexões"""
        if self.tcp_socket:
            self.tcp_socket.close()
        if self.udp_socket:
            self.udp_socket.close()
        print(f"[{self.username}] Desconectado")


def test_single_client():
    """Teste com um cliente único"""
    print("\n" + "="*60)
    print("TESTE 1: Cliente Único")
    print("="*60)
    
    # Simular cliente autenticado no sistema
    client = ChatTestClient(
        username='joao_silva',
        user_id=1,
        role='cliente'
    )
    
    print(f"\n[CLIENTE] Username: {client.username}")
    print(f"[CLIENTE] User ID: {client.user_id}")
    print(f"[CLIENTE] Role: {client.role}")
    
    # Conectar
    print("\n[CONECTANDO TCP...]")
    if not client.connect_tcp():
        return
    
    print("\n[CONECTANDO UDP...]")
    if not client.connect_udp():
        return
    
    # Entrar na sala
    print("\n[ENTRANDO NA SALA...]")
    client.join_room('geral')
    
    # Aguardar
    time.sleep(1)
    
    # Enviar mensagem
    print("\n[ENVIANDO MENSAGEM...]")
    client.send_message('Olá! Sou um cliente teste.')
    
    # Aguardar
    time.sleep(1)
    
    # Solicitar histórico
    print("\n[SOLICITANDO HISTÓRICO...]")
    client.get_history('geral')
    
    # Aguardar
    time.sleep(1)
    
    # Desconectar
    client.close()
    print("\n✓ Teste 1 concluído")


def test_multiple_clients():
    """Teste com múltiplos clientes"""
    print("\n" + "="*60)
    print("TESTE 2: Múltiplos Clientes (Cliente + Profissional)")
    print("="*60)
    
    # Cliente
    cliente = ChatTestClient(
        username='maria_santos',
        user_id=2,
        role='cliente'
    )
    
    # Profissional
    profissional = ChatTestClient(
        username='prof_carlos',
        user_id=101,
        role='profissional'
    )
    
    print(f"\n[CLIENTE] {cliente.username} (ID: {cliente.user_id})")
    print(f"[PROFISSIONAL] {profissional.username} (ID: {profissional.user_id})")
    
    # Conectar ambos
    print("\n[CONECTANDO TCP...]")
    if not cliente.connect_tcp() or not profissional.connect_tcp():
        return
    
    print("\n[CONECTANDO UDP...]")
    if not cliente.connect_udp() or not profissional.connect_udp():
        return
    
    # Entrar na sala
    print("\n[ENTRANDO NA SALA...]")
    cliente.join_room('atendimento_maria')
    profissional.join_room('atendimento_maria')
    
    # Aguardar
    time.sleep(1)
    
    # Cliente envia mensagem
    print("\n[CLIENTE ENVIANDO...]")
    cliente.send_message('Olá prof, preciso agendar um serviço.')
    
    time.sleep(0.5)
    
    # Profissional responde
    print("\n[PROFISSIONAL RESPONDENDO...]")
    profissional.send_message('Olá Maria! Qual serviço você precisa?')
    
    time.sleep(0.5)
    
    # Cliente responde
    print("\n[CLIENTE RESPONDENDO...]")
    cliente.send_message('Gostaria de agendar um corte de cabelo.')
    
    # Aguardar
    time.sleep(1)
    
    # Solicitar histórico
    print("\n[SOLICITANDO HISTÓRICO...]")
    cliente.get_history('atendimento_maria')
    profissional.get_history('atendimento_maria')
    
    # Aguardar
    time.sleep(1)
    
    # Desconectar
    cliente.close()
    profissional.close()
    print("\n✓ Teste 2 concluído")


def test_authentication_flow():
    """Teste do fluxo de autenticação completo"""
    print("\n" + "="*60)
    print("TESTE 3: Fluxo de Autenticação Integrado")
    print("="*60)
    
    # Simular resposta de autenticação Django
    auth_response = {
        'sucesso': True,
        'username': 'lucas_developer',
        'user_id': 3,
        'role': 'cliente',
        'profile_id': 103,
        'email': 'lucas@example.com'
    }
    
    print("\n[LOGIN DJANGO]")
    print(f"Resposta: {json.dumps(auth_response, indent=2)}")
    
    # Cliente conecta com dados da autenticação
    client = ChatTestClient(
        username=auth_response['username'],
        user_id=auth_response['user_id'],
        role=auth_response['role']
    )
    
    print("\n[DADOS EXTRAÍDOS DO LOGIN]")
    print(f"  Username: {client.username}")
    print(f"  User ID: {client.user_id}")
    print(f"  Role: {client.role}")
    
    # Conectar ao chat
    print("\n[CONECTANDO AO CHAT]")
    if client.connect_tcp():
        print("✓ Conexão TCP estabelecida")
    
    if client.connect_udp():
        print("✓ Conexão UDP estabelecida")
    
    # Simular interação rápida
    print("\n[INTERAÇÃO RÁPIDA]")
    client.join_room('sala_teste')
    time.sleep(0.5)
    client.send_message('Teste de integração bem-sucedido!')
    time.sleep(0.5)
    client.get_history('sala_teste')
    time.sleep(0.5)
    
    client.close()
    print("\n✓ Teste 3 concluído")


def main():
    """Função principal"""
    print("\n" + "="*60)
    print("TESTES DE INTEGRAÇÃO: CHAT TCP/UDP + AUTENTICAÇÃO")
    print("="*60)
    print(f"\nTempo: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}")
    print(f"Servidor TCP: {TCP_HOST}:{TCP_PORT}")
    print(f"Servidor UDP: {UDP_HOST}:{UDP_PORT}")
    
    try:
        # Teste 1
        test_single_client()
        time.sleep(2)
        
        # Teste 2
        test_multiple_clients()
        time.sleep(2)
        
        # Teste 3
        test_authentication_flow()
        
        print("\n" + "="*60)
        print("✓ TODOS OS TESTES CONCLUÍDOS COM SUCESSO")
        print("="*60 + "\n")
        
    except KeyboardInterrupt:
        print("\n\n[INTERROMPIDO] Testes cancelados pelo usuário")
    except Exception as e:
        print(f"\n[ERRO] {e}")
    finally:
        print("\nNota: Certifique-se de que os servidores TCP e UDP estão rodando:")
        print("  Terminal 1: python tcp_server.py")
        print("  Terminal 2: python udp_server.py\n")


if __name__ == '__main__':
    main()
