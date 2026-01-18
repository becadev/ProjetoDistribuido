# Chat com TCP e UDP

Uma estrutura completa de chat que utiliza **TCP** para comunicação confiável e **UDP** para mensagens em tempo real.

**🔗 Integrado com o sistema de autenticação do projeto Agende Já**

## Arquitetura

### TCP (Confiável)
- **Servidor TCP** (`tcp_server.py`)
  - Autenticação de usuários com dados completos (user_id, role, profile_id)
  - Gerenciamento de salas
  - Armazenamento de histórico de mensagens
  - Recuperação de dados de salas

- **Cliente TCP** (`tcp_client.py`)
  - Efetua login no servidor
  - Entra/sai de salas
  - Solicita histórico de mensagens
  - Lista usuários em salas

### UDP (Rápido - Sem Garantia)
- **Servidor UDP** (`udp_server.py`)
  - Broadcast de mensagens em tempo real
  - Notificações de digitação
  - Gerenciamento de clientes registrados
  - Múltiplas salas simultâneas

- **Cliente UDP** (`udp_client.py`)
  - Envio/recebimento de mensagens rápidas
  - Notificação quando está digitando
  - Troca dinâmica de salas
  - Sem necessidade de conexão persistente

## Como Usar

### 1. Inicie os servidores

```bash
# Terminal 1 - Servidor TCP
python tcp_server.py

# Terminal 2 - Servidor UDP
python udp_server.py
```

### 2. Inicie os clientes

```bash
# Terminal 3+ - Cliente (escolha um ou ambos para testar)
python tcp_client.py
python udp_client.py
```

## Fluxo de Funcionamento

1. **Conexão Inicial (TCP)**
   - Cliente conecta ao servidor TCP com autenticação
   - TCP valida e mantém conexão persistente
   - Dados do usuário são recebidos do sistema de autenticação

2. **Entrada em Sala (TCP)**
   - Cliente entra em uma sala via TCP
   - Servidor TCP registra o usuário
   - Cliente pode solicitar histórico de mensagens

3. **Chat em Tempo Real (UDP)**
   - Cliente registra seu endereço no servidor UDP
   - Mensagens são enviadas via UDP (broadcast)
   - Todas as mensagens chegam em tempo real sem latência

4. **Persistência (TCP)**
   - Mensagens são armazenadas no servidor TCP
   - Novos usuários recebem histórico via TCP

## Protocolos e Formatos

### TCP - Login (com dados de autenticação)
```json
{
  "type": "login",
  "username": "usuario",
  "user_id": 123,
  "role": "cliente",
  "profile_id": 456
}
```

### TCP - Resposta de Login
```json
{
  "type": "login_success",
  "message": "Bem-vindo usuario!",
  "user_id": 123,
  "role": "cliente"
}
```

### TCP - Entrar em Sala
```json
{
  "type": "join_room",
  "room": "geral",
  "user_id": 123
}
```

### TCP - Histórico
```json
{
  "type": "get_history",
  "room": "geral"
}
```

### UDP - Registrar Cliente
```json
{
  "type": "register",
  "username": "usuario",
  "room": "geral",
  "user_id": 123
}
```

### UDP - Mensagem
```json
{
  "type": "message",
  "username": "usuario",
  "user_id": 123,
  "text": "Olá!",
  "room": "geral"
}
```

### UDP - Digitando
```json
{
  "type": "typing",
  "username": "usuario",
  "room": "geral"
}
```

## Características

✅ **Comunicação Confiável (TCP)**
- Garantia de entrega
- Autenticação com dados do usuário
- Histórico persistente
- Gerenciamento de salas

✅ **Comunicação Rápida (UDP)**
- Baixa latência
- Broadcast em tempo real
- Notificações de digitação
- Múltiplas salas

✅ **Escalabilidade**
- Suporte a múltiplos clientes simultaneamente
- Múltiplas salas de chat
- Registro de mensagens por sala

✅ **Integração com Django**
- Dados do usuário (user_id, role, profile_id)
- Autenticação unificada
- Salas específicas por tipo de usuário (cliente/profissional)

## Requisitos

- Python 3.6+
- Nenhuma biblioteca externa necessária (usa apenas `socket` e `threading`)

## Portas Padrão

- **TCP**: 5000
- **UDP**: 5001

Você pode alterar as portas editando os arquivos ou passando como argumentos ao iniciar os servidores.

## Integração com Frontend

### Chat Web (`frontend/chat.html`)

O frontend web foi desenvolvido para integração completa:

- **Autenticação Automática**: Usa dados do usuário logado
- **Interface Moderna**: Design responsivo e intuitivo
- **Múltiplas Salas**: Navegação entre salas
- **Persistência**: LocalStorage para backup local
- **Real-time**: UDP para mensagens instantâneas
- **Histórico**: TCP para recuperação de mensagens

### Como Acessar

1. Faça login no sistema
2. Clique no botão "💬 Chat" no dashboard
3. Automaticamente conecta com suas credenciais

## Testes

Execute o script de teste para verificar integração:

```bash
python test_chat_integration.py
```

Este script testa:
- Cliente único
- Múltiplos clientes (cliente + profissional)
- Fluxo de autenticação integrado

## Documentação Completa

Para integração completa com Django, veja: [CHAT_INTEGRATION.md](../CHAT_INTEGRATION.md)
