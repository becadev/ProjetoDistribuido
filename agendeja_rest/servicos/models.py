from django.db import models

class Servico(models.Model):
    nome = models.CharField(max_length=100)
    descricao = models.TextField(blank=True)
    duracao_min = models.IntegerField()
    preco = models.DecimalField(max_digits=10, decimal_places=2)
    imagem_url = models.CharField(max_length=255, blank=True)
    ativo = models.BooleanField(default=True)

    def __str__(self):
        return self.nome


class Cliente(models.Model):
    nome = models.CharField(max_length=100)
    telefone = models.CharField(max_length=20)
    email = models.CharField(max_length=100, blank=True)

    def __str__(self):
        return self.nome
