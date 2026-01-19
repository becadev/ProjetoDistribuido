# 🔷 AgendeJá - Sistema Distribuído (REST + SOAP + WebSocket + Mensageria + API Gateway)

Este projeto implementa uma arquitetura distribuída contendo:

- 🟦 **REST (Django)** → serviços, clientes, catálogo  
- 🟧 **SOAP (Java JAX-WS)** → agendamentos  
- 🟥 **API Gateway (FastAPI)** → unifica REST + SOAP + WS com HATEOAS  
- 🟪 **Mensageria (RabbitMQ)** → comunicação assíncrona entre serviços
- 🟫 **Socket TCP/UDP** → chat em tempo real entre clientes e profissionais 

# 📌 1. Conceitos principais

### ✔ REST
REST é um estilo moderno de API baseado em HTTP e JSON.
Utilizado aqui com Django REST Framework.

### ✔ SOAP
SOAP é um protocolo mais rígido baseado em XML + WSDL.
Utilizado aqui com Java 21 + JAX-WS (lib externa, pois JAX-WS só vai até Java 8).

### ✔ API Gateway
Camada central que unifica tudo:

- recebe requisições do cliente web  
- chama REST (Django)  
- chama SOAP (Java)  
- retorna tudo em JSON  
- implementa HATEOAS
- fornece conexões WebSocket para notificações em tempo real

### ✔ WebSocket
WebSocket permite comunicação bidirecional em tempo real entre cliente e servidor.
Utilizado aqui no API Gateway (FastAPI) para:

- Notificações instantâneas de novos agendamentos
- Atualizações automáticas de disponibilidade
- Comunicação full-duplex sem polling

### ✔ Mensageria (RabbitMQ)
Sistema de filas de mensagens assíncronas baseado no protocolo AMQP.
Utilizado aqui para:

- Desacoplamento entre serviços (produtor e consumidor independentes)
- Comunicação assíncrona de eventos de agendamento
- Garantia de entrega de mensagens mesmo se o consumidor estiver offline
- Integração entre API Gateway (produtor) e notificações WebSocket (consumidor)  

### ✔ Socket TCP/UDP (Chat)
Comunicação via sockets para chat em tempo real entre clientes e profissionais.

**TCP (Transmission Control Protocol):**
- Protocolo orientado à conexão com garantia de entrega
- Utilizado para: autenticação, gerenciamento de salas, histórico de mensagens
- Porta padrão: 5000

**UDP (User Datagram Protocol):**
- Protocolo sem conexão, mais rápido mas sem garantia de entrega
- Utilizado para: broadcast de mensagens em tempo real, notificações de digitação
- Porta padrão: 5001  


                     ┌──────────────────┐
                     │  Cliente Web     │
                     │  (HTML/JS)       │
                     └────────┬─────────┘
                              │ HTTP + WebSocket
                              ▼
                     ┌──────────────────┐
                     │  API Gateway     │
                     │   (FastAPI)      │
                     │ HATEOAS + WS     │
                     └────────┬─────────┘
                  REST        │        SOAP                       
            ┌────────────────┐│┌────────────────┐         
            │ Django REST    │││ JAX-WS SOAP    │        
            │ Serviços       │││ Agendamentos   │ 
            └────────────────┘│└────────────────┘
                              │
                              ▼ Publica eventos
                     ┌──────────────────┐
                     │   RabbitMQ       │
                     │   (Mensageria)   │
                     └────────┬─────────┘
                              │ Consome eventos
                              ▼
                     ┌──────────────────┐
                     │  MQ Consumer     │
                     │  (Python)        │
                     └────────┬─────────┘
                              │
                              ▼ Notificações
                        [WebSocket Push]        


## 🟫 Arquitetura do Chat TCP/UDP


    ┌─────────────────┐         ┌─────────────────┐
    │  Cliente Web    │         │  Cliente Web    │
    │  (chat.html)    │         │  (chat.html)    │
    └────────┬────────┘         └────────┬────────┘
             │                           │
             │ HTTP (REST)               │ HTTP (REST)
             │                           │
             ▼                           ▼
    ┌──────────────────────────────────────────────┐
    │              API Gateway (FastAPI)           │
    │         WebSocket + Persistência JSON        │
    └──────────────────────────────────────────────┘
             │                           │
     TCP (5000)                   UDP (5001)
     Confiável                    Rápido
             │                           │
             ▼                           ▼
    ┌─────────────────┐         ┌─────────────────┐
    │   TCP Server    │◄───────►│   UDP Server    │
    │   (Python)      │         │   (Python)      │
    │                 │         │                 │
    │ • Autenticação  │         │ • Broadcast     │
    │ • Salas         │         │ • Notificações  │
    │ • Histórico     │         │ • Baixa latência│
    └─────────────────┘         └─────────────────┘        


# 📌 2. Como rodar o projeto

## 🔧 Pré-requisitos

- Python 3.11
- Java 21 (JDK)
- RabbitMQ Server instalado e rodando
  - Windows: https://www.rabbitmq.com/install-windows.html
  - Ou via Docker: `docker run -d --name rabbitmq -p 5672:5672 -p 15672:15672 rabbitmq:3-management`

## 🚀 Instalação

python -m venv venv

venv\Scripts\activate

pip install -r requirements.txt

Abra 5 terminais e ative o ambiente virtual, depois rode cada serviço abaixo:

1. **REST (Django)**
2. **SOAP (Java)** 
3. **Gateway (FastAPI)**
4. **Consumer (Mensageria)**
5. **Frontend (HTTP Server)**

## 🔵 2.1 API REST (Django)

cd agendeja_rest

python manage.py migrate

<!-- python manage.py runserver 5001 -->
python manage.py runserver 0.0.0.0:8001  // para o funcionamento do chat

#### Crie o super user para cadastrar serviços e clientes pelo admin

Endpoints:

- http://localhost:5001/servicos  
- http://localhost:5001/clientes  
- http://localhost:5001/admin  

---

## 🟧 2.2 Servidor SOAP (Java 21 com JAX-WS)

JAX-WS foi removido após o Java 8 → por isso incluí as dependências em `/lib`.
(é a tecnologia projetada para criar web service em SOAP, gera automaticamente o WSDL e permite compatibilidade com o cliente)

### Compilar:

cd soap/src
javac -cp "../lib/*" com/agendeja/soap/*.java

### Rodar:

java -cp "../lib/*;." com.agendeja.soap.Server (windows)
java -cp "../lib/*:." com.agendeja.soap.Server (linux)

### Acessar WSDL:

http://localhost:8088/soap/agendamento?wsdl

---

## 🔴 2.3 API Gateway (FastAPI)

✔ Traduz SOAP → JSON  
✔ Integra REST  
✔ Exibe documentação Swagger  
✔ Implementa HATEOAS
✔ Fornece conexões WebSocket para notificações em tempo real

### Rodar:

cd gateway
uvicorn main:app --host 0.0.0.0 --port 8000 --reload
(Uvicorn é o servidor de aplicação do fast api, rodamos com host para permitir que outros hosts acessem a api.) 

### Swagger:

http://localhost:8000/docs

### WebSocket:

ws://localhost:8000/ws

---

## 🟩 2.4 Consumidor de Mensageria (RabbitMQ)

Consome eventos da fila RabbitMQ e envia notificações via WebSocket.

### Rodar:

```bash
cd gateway/mq
python consumer.py
```

### O que faz:

1. Conecta ao RabbitMQ na fila `agendamentos`
2. Escuta eventos de agendamento (criação/cancelamento)
3. Transforma a mensagem e envia para clientes WebSocket conectados

**Eventos consumidos:**
- `novo_agendamento` → notifica novo agendamento
- `agendamento_cancelado` → notifica cancelamento

---


## 🟦 2.5 Cliente Web (Frontend)

### Rode em outro terminal:

```bash
cd frontend
python -m http.server 5500
```

--- 

## 🟧 2.6 Servidor  socket TCP/UDP (Python)

Sistema de chat em tempo real utilizando protocolos TCP e UDP para comunicação entre clientes e profissionais.

### Componentes:

| Servidor | Porta | Protocolo | Responsabilidade |
|----------|-------|-----------|------------------|
| TCP Server | 5000 | TCP | Autenticação, gerenciamento de salas, histórico |
| UDP Server | 5001 | UDP | Broadcast de mensagens, notificações de digitação |

### Terminal 1 - TCP Server:

```bash
cd chat_tcp_udp
python tcp_server.py
```

### Terminal 2 - UDP Server:

```bash
cd chat_tcp_udp
python udp_server.py
```

### Funcionalidades do TCP Server:
- **Autenticação**: Validação de usuários com username, user_id e role
- **Gerenciamento de Salas**: Criar, entrar e sair de salas de chat
- **Histórico de Mensagens**: Armazenamento e recuperação de mensagens anteriores
- **Lista de Usuários**: Consultar usuários conectados em uma sala

### Funcionalidades do UDP Server:
- **Broadcast de Mensagens**: Envio rápido para todos os usuários de uma sala
- **Notificações de Digitação**: Indicador em tempo real de quem está digitando
- **Baixa Latência**: Ideal para mensagens que precisam de velocidade

### Formato das Mensagens TCP:

```json
{
  "type": "login",
  "username": "joao.silva",
  "user_id": 42,
  "role": "cliente"
}
```

```json
{
  "type": "join_room",
  "room": "cliente_42_profissional_1"
}
```

### Formato das Mensagens UDP:

```json
{
  "type": "message",
  "username": "joao.silva",
  "user_id": 42,
  "text": "Olá, gostaria de agendar um serviço",
  "room": "cliente_42_profissional_1"
}
```

```json
{
  "type": "typing",
  "username": "joao.silva",
  "room": "cliente_42_profissional_1"
}
```

---

### Acessar no navegador:

http://localhost:5500/index.html

**Páginas disponíveis:**
- `index.html` - Página inicial (landing page)
- `login.html` - Login de usuários
- `register.html` - Cadastro de Cliente ou Profissional
- `cliente_dashboard.html` - Dashboard do Cliente
- `profissional_dashboard.html` - Dashboard do Profissional
- `chat.html` - Chat em tempo real entre clientes e profissionais

---

# 📌 3. Endpoints do Gateway

| Tipo | Método | Endpoint | Função |
|------|--------|----------|--------|
| HATEOAS   | GET  | `/` | Lista links do sistema |
| REST      | GET  | `/servicos` | Lista serviços |
| REST      | POST | `/servicos` | Cadastra novo serviço |
| REST      | DELETE | `/servicos/{id}` | Deleta serviço |
| REST      | GET  | `/clientes` | Lista clientes |
| REST      | POST | `/register` | Registra novo usuário (Cliente/Profissional) |
| REST      | POST | `/login` | Autentica usuário |
| SOAP      | GET  | `/disponibilidade?data=YYYY-MM-DD` | Retorna horários |
| SOAP      | POST | `/agendar` | Agenda serviço |
| SOAP      | DELETE | `/cancelar` | Cancelar agendamento |
| SOAP      | GET  | `/listarAgendamentos` | Listar agendamento |
| WebSocket | WS   | `/ws` | Conexão para notificações em tempo real |
| Chat | GET  | `/chat/rooms/{user_id}` | Lista salas de chat do usuário |
| Chat | GET  | `/chat/messages/{room_id}` | Histórico de mensagens da sala |
| Chat | POST | `/chat/send` | Envia mensagem na sala |

---

# 📌 4. Arquitetura de Mensageria

## 🔄 Fluxo de Eventos

1. **Cliente** faz agendamento via frontend
2. **API Gateway** recebe requisição HTTP POST `/agendar`
3. **Gateway** chama serviço SOAP para criar agendamento
4. **Gateway** publica evento na fila RabbitMQ (`agendamentos`)
5. **Consumer** consome evento da fila
6. **Consumer** envia notificação via WebSocket para todos os clientes conectados
7. **Frontend** recebe notificação e atualiza interface em tempo real

## 📨 Formato da Mensagem

```json
{
  "evento": "agendamento_realizado",
  "dados": {
    "cliente_id": 1,
    "servico_id": 2,
    "data": "2025-12-10",
    "hora_inicio": "14:00"
  }
}
```

## 🛠️ Tecnologias

- **Broker**: RabbitMQ (AMQP 0-9-1)
- **Cliente Python**: Pika 1.3.1
- **Fila**: `agendamentos` (persistente)
- **Padrão**: Publish/Subscribe

---

# 📌 5. WSDL

O WSDL é gerado automaticamente pelo servidor SOAP em:

http://localhost:8088/soap/agendamento?wsdl

### Principais tags:

- `<definitions>` – início do WSDL  
- `<types>` – schemas XML  
- `<message>` – mensagens de entrada e saída  
- `<portType>` – operações expostas  
- `<binding>` – formato SOAP/HTTP  
- `<service>` – endereço final do serviço  

---

# ✔ 6. Tecnologias usadas

- Python 3.11 + FastAPI + WebSocket
- Django REST Framework  
- Java 21 + JAX-WS RI 2.3.5  
- Zeep (cliente SOAP para Python)
- RabbitMQ (Message Broker AMQP)
- Pika (cliente RabbitMQ para Python)
- HTML + CSS + JavaScript (frontend)
- SQLite (banco de dados compartilhado)

# 📌 7. Funcionalidades de Mensageria

## 🔔 Sistema de Eventos Assíncronos

### Vantagens da Mensageria:
- **Desacoplamento**: Gateway e Consumer funcionam independentemente
- **Escalabilidade**: Múltiplos consumidores podem processar mensagens em paralelo
- **Confiabilidade**: Mensagens são persistidas na fila mesmo se o consumidor estiver offline
- **Resiliência**: Se o consumidor falhar, as mensagens não são perdidas

### Eventos Publicados:
1. **novo_agendamento** - Quando novo agendamento é criado
2. **agendamento_cancelado** - Quando agendamento é cancelado

### Fluxo Técnico:
```
API Gateway → RabbitMQ Queue → Consumer → WebSocket → Cliente Web
   (Produtor)    (Broker)      (Consumidor)  (Push)    (Notificação)
```

### Gerenciamento RabbitMQ:
- Interface administrativa: http://localhost:15672
- Usuário padrão: `guest` / `guest`
- Monitoramento de filas, mensagens e consumidores

---

# 📌 8. Funcionalidades WebSocket

O WebSocket está integrado ao API Gateway e permite:

### 🔔 Notificações em tempo real
- Quando um novo agendamento é criado, todos os clientes conectados recebem notificação instantânea
- Não é necessário fazer polling (requisições repetidas) para verificar atualizações
- Comunicação bidirecional: servidor pode enviar mensagens sem que o cliente solicite

### 🔌 Como funcionar
1. Cliente estabelece conexão WebSocket com `ws://localhost:8000/ws`
2. Servidor mantém lista de conexões ativas
3. Ao criar agendamento via `/agendar`, servidor envia notificação para todos os clientes conectados
4. Frontend pode atualizar automaticamente a lista de agendamentos

### 📋 Implementação
- **Servidor**: FastAPI com suporte nativo a WebSocket
- **Cliente**: JavaScript nativo (`new WebSocket()`)
- **Protocolo**: WS (WebSocket) sobre HTTP  

# 📌 9. Requisitos do Projeto
- ✅ Arquitetura que integra REST (Django) e SOAP (Java JAX-WS)
- ✅ Servidor SOAP → Java
- ✅ Cliente SOAP → Python (Zeep)
- ✅ Gateway → Python FastAPI
- ✅ Cliente Web (HTML, CSS e JavaScript)
- ✅ WebSocket para notificações em tempo real
- ✅ Mensageria assíncrona com RabbitMQ
- ✅ HATEOAS (Hypermedia as the Engine of Application State)
- ✅ Autenticação e autorização com roles (Cliente/Profissional)
- ✅ Banco de dados compartilhado entre REST e SOAP
- ✅ Arquitetura orientada a eventos (Event-Driven Architecture)
- ✅ Chat em tempo real com TCP/UDP

---
