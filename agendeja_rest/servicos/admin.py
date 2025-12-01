from django.contrib import admin

from .models import Servico, Cliente, Profissional, Usuario

# Register your models here.
admin.site.register(Profissional)
admin.site.register(Usuario)
admin.site.register(Servico)
admin.site.register(Cliente)