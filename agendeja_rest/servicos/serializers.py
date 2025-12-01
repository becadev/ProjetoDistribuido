from rest_framework import serializers
from .models import Servico, Cliente, Profissional, Usuario

class ServicoSerializer(serializers.ModelSerializer):
    class Meta:
        model = Servico
        fields = '__all__'

class ClienteSerializer(serializers.ModelSerializer):
    nome = serializers.CharField(source='usuario.nome', read_only=True)
    telefone = serializers.CharField(source='usuario.telefone', read_only=True)
    email = serializers.EmailField(source='usuario.email', read_only=True)
    
    class Meta:
        model = Cliente
        fields = ['id', 'cpf', 'nome', 'telefone', 'email', 'usuario']

class ProfissionalSerializer(serializers.ModelSerializer):
    nome = serializers.CharField(source='usuario.nome', read_only=True)
    telefone = serializers.CharField(source='usuario.telefone', read_only=True)
    email = serializers.EmailField(source='usuario.email', read_only=True)
    
    class Meta:
        model = Profissional
        fields = ['id', 'cnpj', 'especialidade', 'nome', 'telefone', 'email', 'usuario']

class UsuarioSerializer(serializers.ModelSerializer):
    class Meta:
        model = Usuario
        fields = '__all__'
