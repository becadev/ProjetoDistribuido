from rest_framework import viewsets, status
from rest_framework.decorators import api_view
from rest_framework.response import Response
from django.contrib.auth import authenticate
from django.db import connection
from .models import Servico, Cliente, Profissional, Usuario
from .serializers import ServicoSerializer, ClienteSerializer, ProfissionalSerializer, UsuarioSerializer

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

# @api_view(['GET'])
# def meus_agendamentos(request):
#     """
#     Retorna agendamentos do cliente (da tabela SOAP agendamento)
#     Esperado: ?user_id=123 ou no corpo JSON
#     """
#     user_id = request.GET.get('user_id') or request.data.get('user_id')

#     if not user_id:
#         return Response({'erro': 'user_id é obrigatório'}, status=status.HTTP_400_BAD_REQUEST)

#     try:
#         # Buscar o cliente pelo user_id
#         usuario = Usuario.objects.get(id=user_id)
#         cliente = usuario.cliente

#         # Consulta a tabela agendamento do SOAP
#         with connection.cursor() as cursor:
#             cursor.execute("""
#                 SELECT a.id, a.cliente_id, a.servico_id, a.data, a.hora_inicio, a.hora_fim, a.status,
#                        s.nome as servico_nome, p.usuario_id as profissional_usuario_id,
#                        pu.nome as profissional_nome
#                 FROM agendamento a
#                 LEFT JOIN servicos_servico s ON a.servico_id = s.id
#                 LEFT JOIN servicos_profissional p ON s.profissional_id = p.id
#                 LEFT JOIN servicos_usuario pu ON p.usuario_id = pu.id
#                 WHERE a.cliente_id = %s AND a.status = 'Confirmado'
#                 ORDER BY a.data, a.hora_inicio
#             """, [cliente.id])

#             columns = [col[0] for col in cursor.description]
#             agendamentos = [
#                 dict(zip(columns, row))
#                 for row in cursor.fetchall()
#             ]

#         return Response(agendamentos)

#     except Usuario.DoesNotExist:
#         return Response({'erro': 'Usuário não encontrado'}, status=status.HTTP_404_NOT_FOUND)
#     except Cliente.DoesNotExist:
#         return Response({'erro': 'Perfil de cliente não encontrado'}, status=status.HTTP_400_BAD_REQUEST)
#     except Exception as e:
#         return Response({'erro': str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
