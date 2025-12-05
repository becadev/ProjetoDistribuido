# 🔷 AgendeJá - Sistema Distribuído (REST + SOAP + WebSocket + API Gateway)

Este projeto implementa uma arquitetura distribuída contendo:

- 🟦 **REST (Django)** → serviços, clientes, catálogo  
- 🟧 **SOAP (Java JAX-WS)** → agendamentos  
- 🟥 **API Gateway (FastAPI)** → unifica REST + SOAP + WS com HATEOAS  

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
                              ▼ Notificações
                        [WebSocket Push]        


# 📌 2. Como rodar o projeto
py -3.11 -m venv venv

venv\Scripts\activate

pip install -r requirements.txt

Abra 4 terminais e ative o ambiente virtual nos quatro, após isso em cada prompt rode cada ponto abaixo (rest (django), soap (java), gateway (fast api) e frontend).

## 🔵 2.1 API REST (Django)

cd agendeja_rest

python manage.py migrate

python manage.py runserver 5001

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

java -cp "../lib/*;." com.agendeja.soap.Server

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

**Exemplo de uso no JavaScript:**
```javascript
const ws = new WebSocket('ws://localhost:8000/ws');

ws.onopen = () => {
    console.log('Conectado ao WebSocket');
};

ws.onmessage = (event) => {
    console.log('Notificação recebida:', event.data);
    // Atualizar UI com nova notificação
};

ws.onclose = () => {
    console.log('Desconectado do WebSocket');
};
```


---

## 🟩 2.4 Cliente Web (Frontend)

### Rode em outro terminal:

```bash
cd frontend
python -m http.server 5500
```

### Acessar no navegador:

http://localhost:5500/index.html

**Páginas disponíveis:**
- `index.html` - Página inicial (landing page)
- `login.html` - Login de usuários
- `register.html` - Cadastro de Cliente ou Profissional
- `cliente_dashboard.html` - Dashboard do Cliente
- `profissional_dashboard.html` - Dashboard do Profissional

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

---

# 📌 4. WSDL

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

# ✔ 5. Tecnologias usadas

- Python 3.11 + FastAPI + WebSocket
- Django REST Framework  
- Java 21 + JAX-WS RI 2.3.5  
- Zeep (cliente SOAP para Python)
- HTML + CSS + JavaScript (frontend)
- SQLite (banco de dados compartilhado)

# 📌 6. Funcionalidades WebSocket

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

# 📌 7. Requisitos do Projeto
- ✅ Arquitetura que integra REST (Django) e SOAP (Java JAX-WS)
- ✅ Servidor SOAP → Java
- ✅ Cliente SOAP → Python (Zeep)
- ✅ Gateway → Python FastAPI
- ✅ Cliente Web (HTML, CSS e JavaScript)
- ✅ WebSocket para notificações em tempo real
- ✅ HATEOAS (Hypermedia as the Engine of Application State)
- ✅ Autenticação e autorização com roles (Cliente/Profissional)
- ✅ Banco de dados compartilhado entre REST e SOAP
