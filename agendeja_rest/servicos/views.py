from rest_framework import viewsets, status
from rest_framework.decorators import api_view
from rest_framework.response import Response
from django.contrib.auth import authenticate
from .models import Servico, Cliente, Profissional, Usuario
from .serializers import ServicoSerializer, ClienteSerializer, ProfissionalSerializer, UsuarioSerializer

class ServicoViewSet(viewsets.ModelViewSet):
    queryset = Servico.objects.all()
    serializer_class = ServicoSerializer

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
