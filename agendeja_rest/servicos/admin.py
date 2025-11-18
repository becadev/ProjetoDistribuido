from django.contrib import admin

from .models import Servico, Cliente

# Register your models here.
admin.site.register(Servico)
admin.site.register(Cliente)