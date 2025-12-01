from django.contrib import admin
from django.urls import path, include
from rest_framework import routers
from servicos.views import ServicoViewSet, ClienteViewSet, ProfissionalViewSet, UsuarioViewSet, register, login_view

router = routers.DefaultRouter()
router.register(r'servicos', ServicoViewSet)
router.register(r'clientes', ClienteViewSet)
router.register(r'profissionais', ProfissionalViewSet)
router.register(r'usuarios', UsuarioViewSet)

urlpatterns = [
    path('admin/', admin.site.urls),
    path('register/', register, name='register'),
    path('login/', login_view, name='login'),
    path('', include(router.urls)),
]
