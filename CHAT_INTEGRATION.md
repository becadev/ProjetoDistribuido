# Integração do Chat TCP/UDP com Sistema de Agendamento

## 📋 Visão Geral

O chat foi integrado ao projeto de agendamento, permitindo comunicação entre clientes e profissionais. O sistema utiliza:

- **TCP**: Armazenamento confiável de mensagens e gerenciamento de salas
- **UDP**: Entrega rápida de mensagens em tempo real
- **Autenticação**: Integrada com o sistema de login do projeto

## 🏗️ Arquitetura da Integração

### Frontend

#### `chat.html`
Interface de chat moderna com:
- Sidebar para navegação entre salas
- Área de mensagens com suporte a histórico
- Input para enviar mensagens
- Notificações de digitação
- Criação de novas salas
- Status de conexão

#### `chat.js`
Lógica JavaScript que:
- Recupera dados do usuário do `localStorage` (já autenticado)
- Se conecta aos servidores TCP/UDP
- Gerencia salas e mensagens
- Sincroniza com o servidor
- Oferece persistência local de mensagens

### Backend

#### `tcp_server.py` (Adaptado)
Alterações principais:
```python
# Agora recebe dados completos do usuário autenticado:
{
    'type': 'login',
    'username': 'usuario',
    'user_id': 123,
    'role': 'cliente' ou 'profissional',
    'profile_id': 456
}

# Armazena cliente com mais informações:
self.clients[username] = {
    'socket': socket,
    'addr': addr,
    'user_id': user_id,
    'role': role,
    'connected_rooms': []
}
```

#### `udp_server.py` (Adaptado)
Alterações principais:
```python
# Registra cliente com informações do usuário:
def register_client(self, username, addr, room, user_id=None)

# Broadcast inclui user_id:
{
    'type': 'message',
    'username': 'usuario',
    'user_id': 123,
    'text': 'Olá!',
    'room': 'geral',
    'timestamp': '2026-01-13T10:30:00'
}
```

### Dashboards

Ambos os dashboards (cliente e profissional) foram atualizados com:
- Botão "💬 Chat" no header
- Link para `chat.html`
- Mantém usuário autenticado no localStorage

## 🔐 Fluxo de Autenticação

```
1. Usuário faz login em login.html
   └─ POST /login
      └─ Retorna: { sucesso, username, user_id, role, profile_id, ... }
      └─ Salva em localStorage: localStorage.setItem('user', JSON.stringify(result))

2. Usuário é redirecionado para dashboard (cliente ou profissional)

3. Usuário clica em "💬 Chat"
   └─ Navega para chat.html

4. Chat.js inicia:
   └─ Recupera usuário de localStorage
   └─ Envia login TCP com dados do usuário
   └─ Inicia conexão UDP com user_id
   └─ Carrega salas disponíveis
```

## 💬 Como Usar o Chat

### Iniciando os Servidores

```bash
# Terminal 1 - Servidor TCP
cd /home/becadev/DSD/ProjetoDistribuido/chat_tcp_udp
python tcp_server.py

# Terminal 2 - Servidor UDP
cd /home/becadev/DSD/ProjetoDistribuido/chat_tcp_udp
python udp_server.py
```

### Acessando o Chat

1. **Navegue para o projeto**:
   ```bash
   cd /home/becadev/DSD/ProjetoDistribuido
   ```

2. **Inicie o servidor Django** (se não estiver rodando):
   ```bash
   python agendeja_rest/manage.py runserver
   ```

3. **Acesse o frontend**:
   - http://localhost:8000/frontend/index.html (ou seu caminho local)

4. **Faça login**:
   - Use suas credenciais de cliente ou profissional
   - Será redirecionado para o dashboard

5. **Clique no botão "💬 Chat"**:
   - Será levado para a interface de chat
   - Já autenticado com seus dados

## 📁 Estrutura de Salas

### Salas Padrão

- **Cliente**:
  - `geral`: Sala geral para comunicação com profissionais

- **Profissional**:
  - `profissionais`: Comunicação com clientes

### Criar Novas Salas

Clique em "**+ Nova Sala**" para:
- Definir nome (será convertido para ID)
- Adicionar descrição (opcional)
- Adicionar participantes

Exemplo:
```
Nome: Chat com João Silva
ID: chat_com_joao_silva
Descrição: Agendamento de serviço
```

## 🔄 Fluxo de Mensagens

### Envio de Mensagem

```
1. Usuário digita mensagem no input
2. Pressiona Enter ou clica em "Enviar"
3. Notificação de digitação via UDP

4. Envio simultâneo:
   - UDP: Broadcast para sala (entrega rápida)
   - TCP: Armazena no servidor (persistência)

5. Mensagem exibida localmente e salva em localStorage

6. Outros usuários recebem via UDP (tempo real)
```

### Histórico de Mensagens

```
1. Clique em "📋 Histórico"
2. Solicitação TCP para servidor
3. Servidor retorna todas as mensagens da sala
4. Exibidas com timestamps
5. Persistidas em localStorage como backup
```

## 💾 Persistência de Dados

### localStorage

O frontend usa localStorage para persistência local:

```javascript
// Mensagens da sala
localStorage.getItem('chat_messages_geral')

// Salas cadastradas
localStorage.getItem('chat_rooms')

// Dados do usuário
localStorage.getItem('user')

// Status TCP
localStorage.getItem('tcp_logged_in')
```

### Servidor TCP

O servidor TCP mantém em memória:
```python
self.clients          # Usuários conectados
self.rooms            # Salas e participantes
self.message_history  # Histórico de mensagens
```

## 🔌 Integração com Django

### Próximos Passos (Recomendado)

Para uma integração completa com Django, considere:

1. **Criar API REST para Chat**:
   ```python
   # servicos/views.py
   @api_view(['POST'])
   def criar_mensagem(request):
       # Salvar mensagem no banco de dados
       pass
   ```

2. **Model de Mensagens**:
   ```python
   class Mensagem(models.Model):
       de_usuario = ForeignKey(Usuario, ...)
       para_usuario = ForeignKey(Usuario, ...)
       sala = CharField(max_length=100)
       texto = TextField()
       criada_em = DateTimeField(auto_now_add=True)
   ```

3. **Model de Salas**:
   ```python
   class SalaChat(models.Model):
       nome = CharField(max_length=100)
       criada_por = ForeignKey(Usuario, ...)
       participantes = ManyToManyField(Usuario)
       criada_em = DateTimeField(auto_now_add=True)
   ```

## 🚀 Características Atuais

✅ **Implementado**:
- [x] Autenticação integrada com login do projeto
- [x] Interface visual moderna e responsiva
- [x] Suporte a múltiplas salas
- [x] Comunicação TCP (confiável) + UDP (rápida)
- [x] Histórico de mensagens
- [x] Notificações de digitação
- [x] Persistência local (localStorage)
- [x] Logout seguro

⏳ **Futuro**:
- [ ] Integração com banco de dados Django
- [ ] Busca de mensagens
- [ ] Anexo de arquivos
- [ ] Emojis e formatação
- [ ] Notificações push
- [ ] WebSocket para real-time puro
- [ ] Grupos de profissionais
- [ ] Avaliações pós-chat

## 🐛 Troubleshooting

### Chat não conecta

```
1. Verifique se os servidores TCP/UDP estão rodando
2. Confirme localhost:5000 (TCP) e localhost:5001 (UDP)
3. Verifique se o usuário está autenticado (localStorage)
```

### Mensagens não aparecem

```
1. Verifique se entrou em uma sala
2. Confirme que a sala existe
3. Verifique console do browser (F12)
4. Limpe localStorage se necessário
```

### Histórico vazio

```
1. Salas novas não têm histórico
2. localStorage foi limpo? Recarregue a página
3. Espere a requisição TCP completar
```

## 📞 Contato

Para questões sobre a integração, consulte:
- Documentação TCP/UDP: [chat_tcp_udp/READme.md](../chat_tcp_udp/READme.md)
- Código chat.js: [frontend/chat.js](../frontend/chat.js)
- Código chat.html: [frontend/chat.html](../frontend/chat.html)
