from django.contrib import admin
from django.urls import path, include
from rest_framework import routers
from servicos.views import ServicoViewSet, ClienteViewSet, ProfissionalViewSet, UsuarioViewSet, register, login_view, meus_agendamentos, chat_messages

router = routers.DefaultRouter()
router.register(r'servicos', ServicoViewSet)
router.register(r'clientes', ClienteViewSet)
router.register(r'profissionais', ProfissionalViewSet)
router.register(r'usuarios', UsuarioViewSet)

urlpatterns = [
    path('admin/', admin.site.urls),
    path('register/', register, name='register'),
    path('login/', login_view, name='login'),
    path('meus-agendamentos/', meus_agendamentos, name='meus_agendamentos'),
    path('chat/messages/', chat_messages, name='chat_messages'),
    path('', include(router.urls)),
]
