# ProjetoDistribuido




``` scss
                 ┌─────────────────────────────┐
                 │         CLIENTE WEB         │
                 │           (React)           │
                 └─────────────┬───────────────┘
                               │
                     (Requisições HTTP JSON)
                               │
                   ┌───────────▼───────────┐
                   │     API GATEWAY       │
                   │      (FastAPI )       │
                   │ Integra REST + SOAP   │
                   │ Implementa HATEOAS    │
                   └─────────┬─────────────┘
           ┌─────────────────┼─────────────────────┐
           │                                       │
┌──────────▼───────────┐                   ┌────────▼───────────┐
│     REST SERVICE     │                   │    SOAP SERVICE    │
│ 	     (Node )       │                   │ 	   (Java)       │
│ Catálogo, CRUD, etc. │                   │ Agendamento, Regras│
└──────────────────────┘                   └────────────────────┘
```


# Regras e Implementação do Projeto

## Regras e Como o Projeto Cumpre

| Regra | Como seu projeto cumpre |
|-------|--------------------------|
| **API Gateway** | Centraliza o acesso dos serviços REST e SOAP (ex: `/gateway/modelos`, `/gateway/agendar`) |
| **HATEOAS** | Gateway retorna links como `{ "_links": { "self": "/gateway/modelos/1", "agendar": "/gateway/agendar/1" } }` |
| **2 APIs internas** | REST → modelos, preços e fotos; SOAP → agendamentos e disponibilidade |
| **Servidor SOAP** | Implementado em Java (JAX-WS), com métodos de agendamento |
| **Cliente Web** | React / HTML acessa o Gateway |
| **Cliente externo** | Python (biblioteca *zeep*) testa o serviço SOAP |
| **Documentação** | Swagger (Gateway) e SOAP-UI (SOAP Service) |

---

## Fluxo da Aplicação

1. O cliente abre o site e visualiza os modelos → **REST**.  
2. O cliente escolhe modelo, data e hora → **Gateway chama SOAP**.  
3. O SOAP valida disponibilidade e grava no banco.  
4. O Gateway retorna resposta com **HATEOAS**:

```json
{
  "mensagem": "Agendamento confirmado",
  "_links": {
    "self": "/gateway/agendamento/22",
    "cancelar": "/gateway/agendamento/22/cancelar",
    "modelos": "/gateway/modelos"
  }
}
```

---

# Justificativas Técnicas

| Tipo | Responsável por | Justificativa |
|------|-----------------|---------------|
| **REST API** | CRUD simples e dados públicos | Mais leve e rápido para listagem e operações simples |
| **SOAP API** | Regras complexas (agendamento, disponibilidade) | Protocolo estruturado com contrato (WSDL) |
| **Gateway** | Unifica REST + SOAP + HATEOAS | Interface única para o cliente web |

---

# Endpoints do Gateway

| Endpoint | Ação | Internamente chama |
|----------|------|--------------------|
| **GET /gateway/catalogo** | Lista serviços | REST `/catalogo` |
| **POST /gateway/servicos** | Cria serviço | REST `/servicos` |
| **GET /gateway/disponibilidade?data=** | Lista horários | SOAP `consultarDisponibilidade` |
| **POST /gateway/agendar** | Agenda serviço | SOAP `agendarServico` |
| **DELETE /gateway/agendamento/{id}** | Cancela | SOAP `cancelarAgendamento` |

---

# Métodos SOAP

| Método | Função | Entrada | Saída |
|--------|--------|---------|--------|
| **consultarDisponibilidade(data)** | Horários livres | Data | Lista de horários |
| **agendarServico(cliente, servicoId, data, horaInicio)** | Agenda serviço | Cliente + serviço + data + hora | Confirmação / erro |
| **cancelarAgendamento(id)** | Cancela agendamento | ID | Confirmação |
| **listarAgendamentos(clienteId)** | Histórico do cliente | ID cliente | Lista de agendamentos |

---

# REST API (Serviços e Preços)

```
GET /catalogo  
GET /servicos/{id}  
GET /modelos/categoria/{tipo}
```

---

# SOAP API (Agendamentos)

- consultarDisponibilidade(data)  
- agendarServico(cliente, data, modelo)  
- cancelarAgendamento(id)

---

# Modelo de Dados

## 1. Cliente

| Campo | Tipo | Descrição |
|-------|------|------------|
| id | INT (PK) | Identificador |
| nome | VARCHAR(100) | Nome completo |
| telefone | VARCHAR(20) | Telefone / WhatsApp |
| email | VARCHAR(100) | Opcional |
| data_cadastro | DATETIME | Data de criação |

---

## 2. Serviço

| Campo | Tipo | Descrição |
|-------|------|------------|
| id | INT (PK) | Identificador |
| nome | VARCHAR(100) | Nome do serviço |
| descricao | TEXT | Detalhes |
| duracao_min | INT | Duração em minutos |
| preco | DECIMAL(10,2) | Valor |
| imagem_url | VARCHAR(255) | URL da imagem |
| ativo | BOOLEAN | Disponível? |

---

## 3. Agendamento

| Campo | Tipo | Descrição |
|-------|------|------------|
| id | INT (PK) | Identificador |
| cliente_id | INT (FK) | Cliente |
| servico_id | INT (FK) | Serviço |
| data | DATE | Dia |
| hora_inicio | TIME | Início |
| hora_fim | TIME | Fim calculado |
| status | ENUM('Confirmado','Cancelado','Concluído') | Estado |
| observacoes | TEXT | Observações |

