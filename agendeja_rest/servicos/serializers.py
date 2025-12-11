from rest_framework import serializers
from .models import Servico, Cliente, Profissional, Usuario

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


class ServicoSerializer(serializers.ModelSerializer):
    profissional = ProfissionalSerializer(read_only=True)
    profissional_id = serializers.IntegerField(write_only=True)
    profissional_nome = serializers.CharField(source='profissional.usuario.nome', read_only=True)

    class Meta:
        model = Servico
        fields = ['id', 'nome', 'descricao', 'duracao_min', 'preco', 'profissional', 'profissional_id', 'imagem_url', 'ativo', 'profissional_nome']
        
    def create(self, validated_data):
        profissional_id = validated_data.pop('profissional_id')
        try:
            profissional = Profissional.objects.get(id=profissional_id)
            servico = Servico.objects.create(profissional=profissional, **validated_data)
            return servico
        except Profissional.DoesNotExist:
            raise serializers.ValidationError("Profissional não encontrado")