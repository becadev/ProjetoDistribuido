# Guia de Configuração do Chat

## Mudanças Realizadas

1. **API Backend (Django)**
   - Descomentada e corrigida a função `meus_agendamentos()` em `servicos/views.py`
   - Agora suporta 2 modos:
     - `?user_id=123` - Cliente busca seus agendamentos com profissionais
     - `?profissional_id=123` - Profissional busca seus clientes com agendamentos
   - Adicionado CORS ao Django para aceitar requisições do frontend
   - Endpoint: `http://localhost:8001/meus-agendamentos/`

2. **Frontend (JavaScript)**
   - Adicionada URL do Django API em `chat.js`: `const DJANGO_API = 'http://localhost:8001'`
   - Implementada lógica de carregamento dinâmico de salas:
     - **Cliente**: Vê apenas salas de profissionais com agendamentos confirmados
     - **Profissional**: Vê apenas salas de clientes com agendamentos confirmados
   - Adicionado refresh automático de salas a cada 3 segundos
   - Adicionada notificação via localStorage para detectar novas mensagens
   - Adicionados console.log para debug

## Dados de Teste Necessários

Para testar o funcionamento:

1. **Certifique-se que há agendamentos na tabela `agendamento` do SOAP:**
   - A tabela deve ter pelo menos um agendamento com `status = 'Confirmado'`
   - Exemplo:
     ```sql
     INSERT INTO agendamento (cliente_id, servico_id, data, hora_inicio, hora_fim, status)
     VALUES (1, 1, '2026-01-15', '14:00:00', '15:00:00', 'Confirmado');
     ```

2. **Verificar que os dados estão relacionados:**
   - Cliente (id=1) → Usuario (id=2)
   - Profissional (id=1) → Usuario (id=3)
   - Servico (id=1) → Profissional (id=1)

## Como Executar

### 1. Iniciar o Django REST API:
```bash
cd agendeja_rest
python manage.py runserver 0.0.0.0:8001
```

### 2. Iniciar os Servidores TCP/UDP (opcional, para funcionalidade completa):
```bash
cd chat_tcp_udp
python tcp_server.py  # Em outro terminal
python udp_server.py  # Em outro terminal
```

### 3. Abrir o Chat no Frontend:
- Navegue até `frontend/chat.html`
- Faça login com uma conta de cliente
- Deve ver salas apenas dos profissionais com agendamentos

- Em outra aba/navegador, faça login com uma conta de profissional
- Deve ver salas apenas dos clientes com agendamentos

### 4. Testar Mensagens:
- Cliente envia mensagem → Profissional deve ver a sala aparecer automaticamente
- Profissional responde → Mensagem aparece para cliente em tempo real

## Estrutura das URLs de Agendamentos

```
GET /meus-agendamentos/?user_id=1
→ Retorna agendamentos do cliente com ID 1

GET /meus-agendamentos/?profissional_id=1
→ Retorna agendamentos do profissional com ID 1
```

## Resposta da API

```json
[
  {
    "id": 1,
    "cliente_id": 1,
    "servico_id": 1,
    "data": "2026-01-15",
    "hora_inicio": "14:00:00",
    "hora_fim": "15:00:00",
    "status": "Confirmado",
    "servico_nome": "Corte de Cabelo",
    "profissional_usuario_id": 3,
    "profissional_nome": "João Silva"
  }
]
```

## Troubleshooting

### "Carregando salas..." fica eternamente:
- Verifique o console (F12) para ver erros de requisição
- Verifique se Django está rodando em `http://localhost:8001`
- Verifique se há agendamentos confirmados no banco de dados

### CORS Error:
- Confirme que `corsheaders` está instalado
- Verifique se `CORS_ALLOWED_ORIGINS` está configurado em settings.py

### Salas não aparecem:
- Verifique se o usuário tem o role correto (cliente/profissional)
- Verifique os console.log para ver os agendamentos retornados

## Notas Importantes

- As salas são geradas automaticamente com base nos agendamentos do SOAP
- As mensagens são armazenadas em localStorage
- O refresh de 3 segundos permite que profissionais vejam novas salas quando cliente entra
- Quando cliente envia mensagem, profissional vê a sala reaparecer na lista
