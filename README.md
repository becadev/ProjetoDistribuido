# 🔷 AgendeJá - Sistema Distribuído (REST + SOAP + WebSocket + API Gateway)

Este projeto implementa uma arquitetura distribuída contendo:

- 🟦 **REST (Django)** → serviços, clientes, catálogo  
- 🟧 **SOAP (Java JAX-WS)** → agendamentos  
- 🟩 **WebSocket (FastAPI)** → notificações em tempo real  
- 🟥 **API Gateway (FastAPI)** → unifica REST + SOAP + WS com HATEOAS  

# 📌 1. Conceitos principais

### ✔ REST
REST é um estilo moderno de API baseado em HTTP e JSON.
Utilizado aqui com Django REST Framework.

### ✔ SOAP
SOAP é um protocolo mais rígido baseado em XML + WSDL.
Utilizado aqui com Java 21 + JAX-WS (lib externa, pois JAX-WS só vai até Java 8).

### ✔ WebSocket
Canal bidirecional para notificações em tempo real.

### ✔ API Gateway
Camada central que unifica tudo:

- recebe requisições do cliente web  
- chama REST (Django)  
- chama SOAP (Java)  
- expõe WebSocket  
- retorna tudo em JSON  
- implementa HATEOAS  


                     ┌──────────────────┐
                     │  Cliente Web     │
                     │  (HTML/JS)       │
                     └────────┬─────────┘
                              │
                              ▼
                     ┌──────────────────┐
                     │  API Gateway     │
                     │   (FastAPI)      │
                     │   c/ HATEOAS     │
                     └────────┬─────────┘
            REST             SOAP                        WEBSOCKET
      ┌────────────────┐ ┌────────────────┐         ┌──────────────────┐
      │ Django REST    │ │ JAX-WS SOAP    │         │    FastAPI WS    │
      │ Serviços       │ │ Agendamentos   │ ◄────▶  |    Notificações │
      └────────────────┘ └────────────────┘         └──────────────────┘


# 📌 2. Como rodar o projeto
py -3.11 -m venv venv

venv\Scripts\activate

pip install -r requirements.txt

Abra 3 terminais e ative o ambiente virtual nos três, após isso em cada prompt rode cada ponto abaixo (rest (django), soap (java) e gateway (fast api)).

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

### Rodar:

cd gateway
uvicorn main:app --reload --port 8000
(Uvicorn é o servidor de aplicação do fast api) 

### Swagger:

http://localhost:8000/docs


---

## 🟩 2.4 Cliente Web (Frontend)

### Abra no navegador:

frontend/index.html

---

# 📌 3. Endpoints do Gateway

| Tipo | Método | Endpoint | Função |
|------|--------|----------|--------|
| HATEOAS   | GET  | `/` | Lista links do sistema |
| REST      | GET  | `/servicos` | Lista serviços |
| REST      | GET  | `/clientes` | Lista clientes |
| SOAP      | GET  | `/disponibilidade?data=YYYY-MM-DD` | Retorna horários |
| SOAP      | POST | `/agendar` | Agenda serviço |
| SOAP      | DELETE | `/cancelar` | Cancelar agendamento |
| SOAP      | GET  | `/listarAgendamentos` | Listar agendamento |
| WebSocket | WS   | `/ws` | Notificações |

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

- Python 3.11 + FastAPI  
- Django REST Framework  
- Java 21 + JAX-WS RI 2.3.5  
- Zeep (cliente SOAP) 
- HTML + JS (frontend)  

# 6. Requisitos
- Arquitetura que integra REST (Django) e SOAP (Java JAX-WS)
- Servidor SOAP → Java
- Cliente SOAP → Python (Zeep)
- Gateway → Python FastAPI
- Cliente Web (HTML e CSS)
