from django.contrib import admin
from django.urls import path, include
from rest_framework import routers
from servicos.views import ServicoViewSet, ClienteViewSet

router = routers.DefaultRouter()
router.register(r'servicos', ServicoViewSet)
router.register(r'clientes', ClienteViewSet)

urlpatterns = [
    path('admin/', admin.site.urls),
    path('', include(router.urls)),
]
