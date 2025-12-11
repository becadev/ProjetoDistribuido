from fastapi import FastAPI, WebSocket, Request
from fastapi.responses import JSONResponse
from fastapi.middleware.cors import CORSMiddleware
import requests
import asyncio
from starlette.concurrency import run_in_threadpool
from zeep import Client
import pika # biblioteca que implementa o protocolo AMQP para comunicação com RabbitMQ, serve como cliente para enviar mensagens para o broker.
import json

app = FastAPI(title="API Gateway - AgendeJá")

# ---------------------------------------------------------------------
# CONFIGURAÇÕES
# ---------------------------------------------------------------------
REST_URL = "http://localhost:5001"
SOAP_WSDL = "http://localhost:8088/soap/agendamento?wsdl"

soap_client = Client(SOAP_WSDL)

# CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ---------------------------------------------------------------------
# Mensageria com RabbitMQ (o gateway só vai publicar e não vai esperar mensagens e nem gerenciar filas)
# ---------------------------------------------------------------------
def enviar_mensagem_mq(evento, dados):
    connection = pika.BlockingConnection(
        pika.ConnectionParameters(host='localhost')
    ) # cria conexão com o RabbitMQ
    channel = connection.channel() # cria um canal de comunicação

    # garante que a fila existe
    channel.queue_declare(queue='agendamentos')

    payload = json.dumps({
        "evento": evento,
        "dados": dados
    }) # cria o payload da mensagem em formato JSON

    channel.basic_publish(
        exchange='',
        routing_key='agendamentos',
        body=payload
    ) # publica a mensagem na fila 'agendamentos'

    connection.close()

# ---------------------------------------------------------------------
# HATEOAS ROOT
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
            "websocket": "/ws",
        }
    }

# ---------------------------------------------------------------------
# ROTAS REST (para Django)
# ---------------------------------------------------------------------
@app.get("/servicos")
def listar_servicos():
    resp = requests.get(f"{REST_URL}/servicos/")
    return resp.json()

@app.post("/servicos")
async def criar_servico(request: Request):
    data = await request.json()
    resp = requests.post(f"{REST_URL}/servicos/", json=data)
    return resp.json()

@app.delete("/servicos/{servico_id}")
def deletar_servico(servico_id: int):
    resp = requests.delete(f"{REST_URL}/servicos/{servico_id}/")
    return {"sucesso": resp.status_code == 204}

@app.get("/clientes")
def listar_clientes():
    resp = requests.get(f"{REST_URL}/clientes/")
    return resp.json()

@app.post("/register")
async def register(request: Request):
    data = await request.json()
    resp = requests.post(f"{REST_URL}/register/", json=data)
    return resp.json()

@app.post("/login")
async def login(request: Request):
    data = await request.json()
    resp = requests.post(f"{REST_URL}/login/", json=data)
    return resp.json()

# ---------------------------------------------------------------------
# ROTAS SOAP (agendamentos)
# ---------------------------------------------------------------------
@app.get("/disponibilidade")
def disponibilidade(data: str):
    resposta = soap_client.service.consultarDisponibilidade(data)
    return {"data": data, "horarios_disponiveis": resposta.split(",")}

@app.post("/agendar")
async def agendar(clienteId: int, servicoId: int, data: str, horaInicio: str):

    # SOAP rodando em thread pois é bloqueante
    resposta = await run_in_threadpool( #await run_in_threadpool(lambda: soap_client.service.agendarServico(...)) porque chamadas Zeep são bloqueantes (síncronas). Se rodássemos diretamente bloquearíamos o loop async.
        lambda: soap_client.service.agendarServico(
            clienteId, servicoId, data, horaInicio
        )
    )

    # versão utilizando apenas websocket
    # após a resposta da api soap, ele dispara a notificação por meio do websocket
    # asyncio.create_task(
    #     broadcast_message(
    #         f"Novo agendamento: {data} às {horaInicio} (Serviço {servicoId}, Cliente {clienteId})"
    #     )
    # )

    #versão utilizando mensageria + websocket
    # chama a função que envia a mensagem para o RabbitMQ com os dados do novo agendamento
    enviar_mensagem_mq(
        "novo_agendamento", #evento
        { #dados
            "clienteId": clienteId,
            "servicoId": servicoId,
            "data": data,
            "horaInicio": horaInicio
        }
    )

    return {"mensagem": resposta}


@app.delete("/cancelar")
async def cancelar(agendamentoId: int):
    resposta = await run_in_threadpool(
        lambda: (soap_client.service.cancelarAgendamento(agendamentoId))
    )
    
    # versão utilizando apenas websocket
    # asyncio.create_task(
    #     broadcast_message(
    #         f"O agendamento {agendamentoId} foi cancelado"
    #     )
    # )

    # versão utilizando mensageria + websocket
    enviar_mensagem_mq(
        "agendamento_cancelado",
        {
            "agendamentoId": agendamentoId
        }
    )

    return {"mensagem": resposta}


@app.get("/listarAgendamentos")
def listar_agendamentos():
    resposta = soap_client.service.listarAgendamentos()
    import json
    agendamentos = json.loads(resposta)
    return {"agendamentos": agendamentos}


# ---------------------------------------------------------------------
# SERVIÇO WEBSOCKET 
# ---------------------------------------------------------------------
connected_websockets = set() # conjunto de conexoes, o uso do set evita duplicatas

@app.websocket("/ws")
async def websocket_endpoint(websocket: WebSocket):
    await websocket.accept()
    connected_websockets.add(websocket) # aguarda todos os clientes conectados

    try:
        while True: 
            await websocket.receive_text()   # mantém a conexão aberta
    except:
        connected_websockets.remove(websocket) # se o cliente desconectar ou a internet cair, o servito remove a conexão para evitar comunicações mortas


async def broadcast_message(message: str):
    dead_ws = [] # onde serão guardados conexões quebradas que serão removidas

    for ws in connected_websockets:
        try:
            await ws.send_text(message) # envia mensagem para todos clientes conectados
        except:
            dead_ws.append(ws)  # se essa conexão falhar ele entende que ela é uma conexão quebrada e então já a adiciona na lista que será deletada
    # isso evita tentar enviar mensagens para conexões inexistentes.
    # remover websockets quebrados
    for ws in dead_ws:
        connected_websockets.remove(ws)
