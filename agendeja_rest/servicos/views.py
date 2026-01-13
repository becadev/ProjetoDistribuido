from rest_framework import viewsets, status
from rest_framework.decorators import api_view
from rest_framework.response import Response
from django.contrib.auth import authenticate
from django.db import connection
from .models import Servico, Cliente, Profissional, Usuario
from .serializers import ServicoSerializer, ClienteSerializer, ProfissionalSerializer, UsuarioSerializer
import json
import os
from datetime import datetime

# Arquivo para armazenar mensagens do chat
CHAT_MESSAGES_FILE = os.path.join(os.path.dirname(__file__), 'chat_messages.json')

class ServicoViewSet(viewsets.ModelViewSet):
    queryset = Servico.objects.all()
    serializer_class = ServicoSerializer
    
    def get_queryset(self):
        queryset = Servico.objects.all()
        profissional_id = self.request.query_params.get('profissional', None)
        if profissional_id is not None:
            queryset = queryset.filter(profissional_id=profissional_id)
        return queryset

class ClienteViewSet(viewsets.ModelViewSet):
    queryset = Cliente.objects.all()
    serializer_class = ClienteSerializer

class ProfissionalViewSet(viewsets.ModelViewSet):
    queryset = Profissional.objects.all()
    serializer_class = ProfissionalSerializer

class UsuarioViewSet(viewsets.ModelViewSet):
    queryset = Usuario.objects.all()
    serializer_class = UsuarioSerializer

@api_view(['POST'])
def register(request):
    """
    Cadastro de usuário: cria Usuario + Cliente ou Profissional
    Esperado: {username, password, email, nome, telefone, tipo: 'cliente'|'profissional', cpf ou cnpj, especialidade?}
    """
    try:
        data = request.data
        tipo = data.get('tipo')  # 'cliente' ou 'profissional'
        
        # Criar usuário
        usuario = Usuario.objects.create_user(
            username=data.get('username'),
            password=data.get('password'),
            email=data.get('email'),
            nome=data.get('nome'),
            telefone=data.get('telefone', '')
        )
        
        # Criar perfil específico
        if tipo == 'cliente':
            Cliente.objects.create(
                usuario=usuario,
                cpf=data.get('cpf')
            )
            role = 'cliente'
        elif tipo == 'profissional':
            Profissional.objects.create(
                usuario=usuario,
                cnpj=data.get('cnpj'),
                especialidade=data.get('especialidade', '')
            )
            role = 'profissional'
        else:
            usuario.delete()
            return Response({'erro': 'Tipo inválido'}, status=status.HTTP_400_BAD_REQUEST)
        
        return Response({
            'sucesso': True,
            'usuario_id': usuario.id,
            'username': usuario.username,
            'role': role
        }, status=status.HTTP_201_CREATED)
        
    except Exception as e:
        return Response({'erro': str(e)}, status=status.HTTP_400_BAD_REQUEST)

@api_view(['POST'])
def login_view(request):
    """
    Login: retorna role (cliente/profissional) e dados do usuário
    Esperado: {username, password}
    """
    username = request.data.get('username')
    password = request.data.get('password')
    
    user = authenticate(username=username, password=password)
    
    if user is not None:
        # Verificar role
        role = None
        profile_id = None
        
        if hasattr(user, 'cliente'):
            role = 'cliente'
            profile_id = user.cliente.id
        elif hasattr(user, 'profissional'):
            role = 'profissional'
            profile_id = user.profissional.id
        
        return Response({
            'sucesso': True,
            'usuario_id': user.id,
            'username': user.username,
            'nome': user.nome,
            'email': user.email,
            'role': role,
            'profile_id': profile_id
        })
    else:
        return Response({
            'sucesso': False,
            'erro': 'Credenciais inválidas'
        }, status=status.HTTP_401_UNAUTHORIZED)

@api_view(['GET'])
def meus_agendamentos(request):
    """
    Retorna agendamentos do cliente ou do profissional (da tabela SOAP agendamento)
    Esperado: ?user_id=123 (para cliente) ou ?profissional_id=123 (para profissional)
    """
    user_id = request.GET.get('user_id')
    profissional_id = request.GET.get('profissional_id')

    try:
        if user_id:
            # Cliente buscando seus agendamentos com profissionais
            usuario = Usuario.objects.get(id=user_id)
            cliente = usuario.cliente

            with connection.cursor() as cursor:
                cursor.execute("""
                    SELECT a.id, a.cliente_id, a.servico_id, a.data, a.hora_inicio, a.hora_fim, a.status,
                           s.nome as servico_nome, p.usuario_id as profissional_usuario_id,
                           pu.nome as profissional_nome
                    FROM agendamento a
                    LEFT JOIN servicos_servico s ON a.servico_id = s.id
                    LEFT JOIN servicos_profissional p ON s.profissional_id = p.id
                    LEFT JOIN servicos_usuario pu ON p.usuario_id = pu.id
                    WHERE a.cliente_id = %s AND a.status = 'Confirmado'
                    ORDER BY a.data, a.hora_inicio
                """, [cliente.id])

                columns = [col[0] for col in cursor.description]
                agendamentos = [
                    dict(zip(columns, row))
                    for row in cursor.fetchall()
                ]

            return Response(agendamentos)

        elif profissional_id:
            # Profissional buscando seus clientes com agendamentos
            usuario = Usuario.objects.get(id=profissional_id)
            profissional = usuario.profissional

            with connection.cursor() as cursor:
                cursor.execute("""
                    SELECT DISTINCT a.id, a.cliente_id, a.servico_id, a.data, a.hora_inicio, a.hora_fim, a.status,
                           s.nome as servico_nome, c.usuario_id as cliente_usuario_id,
                           cu.nome as cliente_nome
                    FROM agendamento a
                    LEFT JOIN servicos_servico s ON a.servico_id = s.id
                    LEFT JOIN servicos_profissional p ON s.profissional_id = p.id
                    LEFT JOIN servicos_cliente c ON a.cliente_id = c.id
                    LEFT JOIN servicos_usuario cu ON c.usuario_id = cu.id
                    WHERE p.id = %s AND a.status = 'Confirmado'
                    ORDER BY a.data, a.hora_inicio
                """, [profissional.id])

                columns = [col[0] for col in cursor.description]
                agendamentos = [
                    dict(zip(columns, row))
                    for row in cursor.fetchall()
                ]

            return Response(agendamentos)
        else:
            return Response({'erro': 'Forneça user_id ou profissional_id'}, status=status.HTTP_400_BAD_REQUEST)

    except Usuario.DoesNotExist:
        return Response({'erro': 'Usuário não encontrado'}, status=status.HTTP_404_NOT_FOUND)
    except Cliente.DoesNotExist:
        return Response({'erro': 'Perfil de cliente não encontrado'}, status=status.HTTP_400_BAD_REQUEST)
    except Exception as e:
        return Response({'erro': str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

def _load_chat_messages():
    """Carrega mensagens do arquivo JSON"""
    if not os.path.exists(CHAT_MESSAGES_FILE):
        return {}
    try:
        with open(CHAT_MESSAGES_FILE, 'r') as f:
            return json.load(f)
    except:
        return {}

def _save_chat_messages(messages):
    """Salva mensagens no arquivo JSON"""
    with open(CHAT_MESSAGES_FILE, 'w') as f:
        json.dump(messages, f, indent=2)

@api_view(['GET', 'POST'])
def chat_messages(request):
    """
    GET: Retorna mensagens de uma sala específica
    POST: Salva uma nova mensagem
    
    Parâmetros GET: ?room=cliente_1_profissional_2
    Body POST: {
        "room": "cliente_1_profissional_2",
        "username": "cliente1",
        "user_id": 1,
        "text": "Olá!",
        "timestamp": "2026-01-13T10:30:00"
    }
    """
    try:
        if request.method == 'GET':
            room = request.GET.get('room')
            if not room:
                return Response({'erro': 'room é obrigatório'}, status=status.HTTP_400_BAD_REQUEST)
            
            messages = _load_chat_messages()
            room_messages = messages.get(room, [])
            return Response(room_messages)
        
        elif request.method == 'POST':
            data = request.data
            room = data.get('room')
            
            if not room:
                return Response({'erro': 'room é obrigatório'}, status=status.HTTP_400_BAD_REQUEST)
            
            message = {
                'username': data.get('username'),
                'user_id': data.get('user_id'),
                'text': data.get('text'),
                'timestamp': data.get('timestamp', datetime.now().isoformat())
            }
            
            messages = _load_chat_messages()
            if room not in messages:
                messages[room] = []
            
            messages[room].append(message)
            _save_chat_messages(messages)
            
            return Response({
                'sucesso': True,
                'message': 'Mensagem salva com sucesso',
                'data': message
            }, status=status.HTTP_201_CREATED)
    
    except Exception as e:
        return Response({'erro': str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
