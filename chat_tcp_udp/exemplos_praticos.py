#!/usr/bin/env python3
"""
EXEMPLOS PRÁTICOS: Como usar o Chat TCP/UDP integrado

Este arquivo contém exemplos de código para diferentes cenários
"""

import json
import socket
import time

# ============================================================================
# EXEMPLO 1: Cliente Django enviando dados para Chat
# ============================================================================

class ExemploAutenticacao:
    """
    Exemplo de como o sistema de login Django retorna dados
    que serão utilizados pelo chat
    """
    
    def exemplo_resposta_login(self):
        """Simula resposta do endpoint /login do Django"""
        
        # Resposta típica do Django
        resposta_django = {
            'sucesso': True,
            'username': 'joao.silva',
            'user_id': 42,
            'role': 'cliente',
            'profile_id': 1,
            'email': 'joao@example.com',
            'telefone': '(11) 98765-4321'
        }
        
        # Frontend salva no localStorage
        # localStorage.setItem('user', JSON.stringify(resposta_django))
        
        # Chat.js recupera e usa
        # const user = getUser(); // Retorna o JSON acima
        
        return resposta_django
    
    def exemplo_login_chat(self):
        """Simula cliente conectando ao Chat com dados do Django"""
        
        # Dados recuperados do localStorage
        user_data = self.exemplo_resposta_login()
        
        # Mensagem TCP Login
        tcp_login = {
            'type': 'login',
            'username': user_data['username'],      # joao.silva
            'user_id': user_data['user_id'],        # 42
            'role': user_data['role'],              # cliente
            'profile_id': user_data['profile_id']   # 1
        }
        
        return tcp_login


# ============================================================================
# EXEMPLO 2: Cliente Conectando ao TCP
# ============================================================================

class ExemploTCPClient:
    """Exemplos de operações TCP"""
    
    def conectar_tcp(self):
        """Conectar ao servidor TCP com autenticação"""
        
        # Dados do usuário logado
        login_data = {
            'type': 'login',
            'username': 'maria.santos',
            'user_id': 15,
            'role': 'cliente',
            'profile_id': 8
        }
        
        print("[EXEMPLO] Conectando ao TCP com dados:")
        print(json.dumps(login_data, indent=2))
        print()
    
    def entrar_sala(self):
        """Entrar em uma sala"""
        
        msg = {
            'type': 'join_room',
            'room': 'atendimento_maria'
        }
        
        print("[EXEMPLO] Entrando em sala:")
        print(json.dumps(msg, indent=2))
        print()
    
    def solicitar_historico(self):
        """Solicitar histórico de mensagens"""
        
        msg = {
            'type': 'get_history',
            'room': 'atendimento_maria'
        }
        
        print("[EXEMPLO] Solicitando histórico:")
        print(json.dumps(msg, indent=2))
        print()
        
        # Resposta típica do servidor
        resposta = {
            'type': 'history',
            'room': 'atendimento_maria',
            'messages': [
                {
                    'username': 'prof_carlos',
                    'text': 'Olá! Como posso ajudar?',
                    'timestamp': '2026-01-13T10:00:00'
                },
                {
                    'username': 'maria.santos',
                    'text': 'Preciso agendar um corte',
                    'timestamp': '2026-01-13T10:01:00'
                }
            ]
        }
        
        print("[EXEMPLO] Resposta do servidor:")
        print(json.dumps(resposta, indent=2))
        print()


# ============================================================================
# EXEMPLO 3: Cliente Conectando ao UDP
# ============================================================================

class ExemploUDPClient:
    """Exemplos de operações UDP"""
    
    def registrar_udp(self):
        """Registrar no servidor UDP"""
        
        msg = {
            'type': 'register',
            'username': 'maria.santos',
            'room': 'atendimento_maria',
            'user_id': 15
        }
        
        print("[EXEMPLO] Registrando no UDP:")
        print(json.dumps(msg, indent=2))
        print()
    
    def enviar_mensagem(self):
        """Enviar mensagem para sala"""
        
        msg = {
            'type': 'message',
            'username': 'maria.santos',
            'user_id': 15,
            'text': 'Olá! Tudo bem?',
            'room': 'atendimento_maria'
        }
        
        print("[EXEMPLO] Enviando mensagem UDP:")
        print(json.dumps(msg, indent=2))
        print()
        
        # Broadcast recebido por todos na sala
        print("[EXEMPLO] Broadcast recebido por outros clientes:")
        broadcast = {
            'type': 'message',
            'username': 'maria.santos',
            'user_id': 15,
            'text': 'Olá! Tudo bem?',
            'room': 'atendimento_maria',
            'timestamp': '2026-01-13T10:05:00'
        }
        print(json.dumps(broadcast, indent=2))
        print()
    
    def notificar_digitacao(self):
        """Notificar que está digitando"""
        
        msg = {
            'type': 'typing',
            'username': 'maria.santos',
            'user_id': 15,
            'room': 'atendimento_maria'
        }
        
        print("[EXEMPLO] Notificando digitação:")
        print(json.dumps(msg, indent=2))
        print()


# ============================================================================
# EXEMPLO 4: Fluxo Completo de Uma Conversa
# ============================================================================

class ExemploFluxoCompleto:
    """Exemplo de fluxo completo de conversa"""
    
    def fluxo_atendimento(self):
        """
        Fluxo completo:
        Cliente agende serviço e conversa com profissional via chat
        """
        
        print("\n" + "="*70)
        print("EXEMPLO: CLIENTE CONVERSA COM PROFISSIONAL APÓS AGENDAMENTO")
        print("="*70 + "\n")
        
        # PASSO 1: Cliente faz login
        print("1. CLIENTE FAZ LOGIN")
        print("-" * 70)
        print("POST /login")
        print("Body: { username: 'maria.santos', password: '***' }")
        print("\nResposta:")
        login_response = {
            'sucesso': True,
            'username': 'maria.santos',
            'user_id': 15,
            'role': 'cliente',
            'profile_id': 8,
            'email': 'maria@example.com'
        }
        print(json.dumps(login_response, indent=2))
        print()
        
        # PASSO 2: localStorage recebe dados
        print("2. DADOS SALVOS NO LOCALSTORAGE")
        print("-" * 70)
        print("localStorage.setItem('user', JSON.stringify(response))")
        print("Dados disponíveis no frontend até logout")
        print()
        
        # PASSO 3: Cliente clica em Chat
        print("3. CLIENTE CLICA EM BOTÃO CHAT")
        print("-" * 70)
        print("Navega para: frontend/chat.html")
        print()
        
        # PASSO 4: Chat.js conecta
        print("4. CHAT.JS INICIALIZA CONEXÃO")
        print("-" * 70)
        print("Recupera usuário de localStorage")
        print("Conecta ao TCP com:")
        tcp_login = {
            'type': 'login',
            'username': 'maria.santos',
            'user_id': 15,
            'role': 'cliente',
            'profile_id': 8
        }
        print(json.dumps(tcp_login, indent=2))
        print()
        print("Conecta ao UDP registrando:")
        udp_register = {
            'type': 'register',
            'username': 'maria.santos',
            'room': 'chat_agendamento_15',
            'user_id': 15
        }
        print(json.dumps(udp_register, indent=2))
        print()
        
        # PASSO 5: Cliente seleciona sala
        print("5. CLIENTE SELECIONA SALA DE CHAT")
        print("-" * 70)
        print("Sala: chat_agendamento_15")
        print("Descrição: Chat com Prof. Carlos (Corte de Cabelo)")
        print()
        
        # PASSO 6: Entra na sala (TCP)
        print("6. CLIENTE ENTRA NA SALA (TCP)")
        print("-" * 70)
        join_msg = {
            'type': 'join_room',
            'room': 'chat_agendamento_15'
        }
        print("Enviando:")
        print(json.dumps(join_msg, indent=2))
        print()
        
        # PASSO 7: Solicita histórico
        print("7. CLIENTE SOLICITA HISTÓRICO (TCP)")
        print("-" * 70)
        history_msg = {
            'type': 'get_history',
            'room': 'chat_agendamento_15'
        }
        print("Enviando:")
        print(json.dumps(history_msg, indent=2))
        print("\nRespostas anteriores carregadas...")
        print()
        
        # PASSO 8: Cliente envia mensagem
        print("8. CLIENTE ENVIA MENSAGEM (UDP)")
        print("-" * 70)
        client_msg = {
            'type': 'message',
            'username': 'maria.santos',
            'user_id': 15,
            'text': 'Olá Prof. Carlos! Gostaria de marcar um corte?',
            'room': 'chat_agendamento_15'
        }
        print("Enviando:")
        print(json.dumps(client_msg, indent=2))
        print("\nMensagem armazenada via TCP e broadcast via UDP")
        print()
        
        # PASSO 9: Profissional recebe
        print("9. PROFISSIONAL RECEBE MENSAGEM")
        print("-" * 70)
        prof_receives = {
            'type': 'message',
            'username': 'maria.santos',
            'user_id': 15,
            'text': 'Olá Prof. Carlos! Gostaria de marcar um corte?',
            'room': 'chat_agendamento_15',
            'timestamp': '2026-01-13T10:30:00'
        }
        print("Broadcast recebido:")
        print(json.dumps(prof_receives, indent=2))
        print()
        
        # PASSO 10: Profissional responde
        print("10. PROFISSIONAL RESPONDE")
        print("-" * 70)
        prof_msg = {
            'type': 'message',
            'username': 'prof_carlos',
            'user_id': 101,
            'text': 'Olá Maria! Claro! Qual horário você prefere?',
            'room': 'chat_agendamento_15'
        }
        print("Enviando:")
        print(json.dumps(prof_msg, indent=2))
        print()
        
        # PASSO 11: Cliente recebe e responde
        print("11. CLIENTE RECEBE E RESPONDE")
        print("-" * 70)
        client_reply = {
            'type': 'message',
            'username': 'maria.santos',
            'user_id': 15,
            'text': 'Sexta à tarde? Por volta das 15h?',
            'room': 'chat_agendamento_15'
        }
        print("Enviando:")
        print(json.dumps(client_reply, indent=2))
        print()
        
        # PASSO 12: Conversa continua
        print("12. CONVERSA CONTINUA...")
        print("-" * 70)
        print("Mensagens armazenadas no histórico (TCP)")
        print("Novos usuários podem recuperar histórico completo")
        print()
        
        print("="*70)
        print("✓ FLUXO COMPLETO DE CONVERSA CONCLUÍDO")
        print("="*70 + "\n")


# ============================================================================
# EXEMPLO 5: Dados Armazenados no Servidor
# ============================================================================

class ExemploServidorTCP:
    """Exemplos de dados armazenados no servidor TCP"""
    
    def estado_servidor(self):
        """Estado do servidor TCP após a conversa"""
        
        print("\n" + "="*70)
        print("EXEMPLO: ESTADO DO SERVIDOR TCP DURANTE CONVERSA")
        print("="*70 + "\n")
        
        # Clientes conectados
        print("CLIENTES CONECTADOS:")
        print("-" * 70)
        clients = {
            'maria.santos': {
                'user_id': 15,
                'role': 'cliente',
                'connected_rooms': ['chat_agendamento_15']
            },
            'prof_carlos': {
                'user_id': 101,
                'role': 'profissional',
                'connected_rooms': ['chat_agendamento_15']
            }
        }
        print(json.dumps(clients, indent=2))
        print()
        
        # Salas
        print("SALAS ATIVAS:")
        print("-" * 70)
        rooms = {
            'chat_agendamento_15': ['maria.santos', 'prof_carlos']
        }
        print(json.dumps(rooms, indent=2))
        print()
        
        # Histórico
        print("HISTÓRICO DA SALA:")
        print("-" * 70)
        history = {
            'chat_agendamento_15': [
                {
                    'username': 'maria.santos',
                    'text': 'Olá Prof. Carlos! Gostaria de marcar um corte?',
                    'timestamp': '2026-01-13T10:30:00'
                },
                {
                    'username': 'prof_carlos',
                    'text': 'Olá Maria! Claro! Qual horário você prefere?',
                    'timestamp': '2026-01-13T10:31:00'
                },
                {
                    'username': 'maria.santos',
                    'text': 'Sexta à tarde? Por volta das 15h?',
                    'timestamp': '2026-01-13T10:32:00'
                }
            ]
        }
        print(json.dumps(history, indent=2))
        print()


# ============================================================================
# MAIN
# ============================================================================

def main():
    """Executar todos os exemplos"""
    
    print("\n" + "="*70)
    print("EXEMPLOS PRÁTICOS: CHAT TCP/UDP INTEGRADO")
    print("="*70 + "\n")
    
    # Exemplo 1
    ex1 = ExemploAutenticacao()
    print("EXEMPLO 1: AUTENTICAÇÃO DO DJANGO")
    print("="*70)
    ex1.exemplo_resposta_login()
    ex1.exemplo_login_chat()
    
    # Exemplo 2
    ex2 = ExemploTCPClient()
    print("\nEXEMPLO 2: OPERAÇÕES TCP")
    print("="*70)
    ex2.conectar_tcp()
    ex2.entrar_sala()
    ex2.solicitar_historico()
    
    # Exemplo 3
    ex3 = ExemploUDPClient()
    print("\nEXEMPLO 3: OPERAÇÕES UDP")
    print("="*70)
    ex3.registrar_udp()
    ex3.enviar_mensagem()
    ex3.notificar_digitacao()
    
    # Exemplo 4
    ex4 = ExemploFluxoCompleto()
    ex4.fluxo_atendimento()
    
    # Exemplo 5
    ex5 = ExemploServidorTCP()
    ex5.estado_servidor()
    
    print("\n" + "="*70)
    print("✓ TODOS OS EXEMPLOS EXECUTADOS COM SUCESSO")
    print("="*70 + "\n")


if __name__ == '__main__':
    main()
