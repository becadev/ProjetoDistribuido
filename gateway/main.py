from fastapi import FastAPI, WebSocket
from fastapi.responses import JSONResponse
from fastapi.middleware.cors import CORSMiddleware
import requests
from zeep import Client #interpreta automaticamente o WSDL
#zeep é uma biblioteca Python para consumir serviços web SOAP. Ela facilita a comunicação com APIs SOAP,
# permitindo que os desenvolvedores façam chamadas de serviço e manipulem respostas de forma simples
app = FastAPI(title="API Gateway - AgendeJá")

# ---------------------------------------------------------------------
# CONFIGURAÇÕES DO SISTEMA
# ---------------------------------------------------------------------
REST_URL = "http://localhost:5001"    # Django REST
SOAP_WSDL = "http://localhost:8088/soap/agendamento?wsdl"

soap_client = Client(SOAP_WSDL)

# CORS (para frontend) CORS é uma regra de segurança dos navegadores 
# que controla quais sites podem acessar uma API.
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ---------------------------------------------------------------------
# HATEOAS - Endpoint raiz do Gateway - 
# HATEOAS é um padrão de APIs REST onde cada resposta indica 
# os próximos caminhos possíveis da aplicação, através de links.
# ---------------------------------------------------------------------
@app.get("/")
def gateway_root():
    return {
        "message": "API Gateway funcionando",
        "_links": {
            "self": "/",
            "servicos": "/servicos",
            "clientes": "/clientes",
            "agendar": "/agendar",
            "disponibilidade": "/disponibilidade?data=YYYY-MM-DD",
            "cancelar": "/cancelar",
            "listarAgendamentos": "/listarAgendamentos",
            #"websocket": "/ws",
        }
    }

# ---------------------------------------------------------------------
# ROTAS REST (repasse para Django)
# ---------------------------------------------------------------------
@app.get("/servicos")
def listar_servicos():
    resp = requests.get(f"{REST_URL}/servicos/")
    return resp.json()

@app.get("/clientes")
def listar_clientes():
    resp = requests.get(f"{REST_URL}/clientes/")
    return resp.json()


# ---------------------------------------------------------------------
# ROTAS SOAP (agendamentos)
# ---------------------------------------------------------------------
@app.get("/disponibilidade")
def disponibilidade(data: str):
    resposta = soap_client.service.consultarDisponibilidade(data)
    return {"data": data, "horarios_disponiveis": resposta.split(",")}

@app.post("/agendar")
def agendar(clienteId: int, servicoId: int, data: str, horaInicio: str):
    resposta = soap_client.service.agendarServico(
        clienteId, servicoId, data, horaInicio
    )

    # Envia notificação WebSocket
    # for ws in connected_websockets:
    #     ws.send_text(f"Novo agendamento: {data} às {horaInicio}")

    return {"mensagem": resposta}

@app.delete("/cancelar")
def cancelar(agendamentoId: int):
    resposta = soap_client.service.cancelarAgendamento(agendamentoId)
    return {"mensagem": resposta}

@app.get("/listarAgendamentos")
def listar_agendamentos():
    resposta = soap_client.service.listarAgendamentos()
    import json
    agendamentos = json.loads(resposta)
    return {"agendamentos": agendamentos}

# ---------------------------------------------------------------------
# SERVIÇO WEBSOCKET (notificações)
# ---------------------------------------------------------------------
connected_websockets = []

@app.websocket("/ws")
async def websocket_endpoint(websocket: WebSocket):
    await websocket.accept()
    connected_websockets.append(websocket)

    try:
        while True:
            await websocket.receive_text()
    except:
        connected_websockets.remove(websocket)

