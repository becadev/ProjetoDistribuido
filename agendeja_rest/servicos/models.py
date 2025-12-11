from django.db import models
from django.contrib.auth.models import AbstractUser

class Usuario(AbstractUser):
    telefone = models.CharField(max_length=20, blank=True)
    email = models.EmailField(unique=True)
    nome = models.CharField(max_length=100)

    def __str__(self):
        return self.username

class Cliente(models.Model):
    usuario = models.OneToOneField(Usuario, on_delete=models.CASCADE, related_name='cliente')
    cpf = models.CharField(max_length=14, unique=True)

    def __str__(self):
        return self.usuario.nome
    
class Profissional(models.Model):
    usuario = models.OneToOneField(Usuario, on_delete=models.CASCADE, related_name='profissional')
    especialidade = models.CharField(max_length=100, blank=True)
    cnpj = models.CharField(max_length=18, unique=True)

    def __str__(self):
        return self.usuario.nome
    
# um serviço é relacionado a um profissional
class Servico(models.Model):
    nome = models.CharField(max_length=100)
    descricao = models.TextField(blank=True)
    duracao_min = models.IntegerField()
    preco = models.DecimalField(max_digits=10, decimal_places=2)
    profissional = models.ForeignKey(Profissional, on_delete=models.CASCADE, related_name='servicos')

    imagem_url = models.CharField(max_length=255, blank=True)
    ativo = models.BooleanField(default=True)

    def __str__(self):
        return self.nome



