from fastapi import FastAPI, WebSocket, Request, WebSocketDisconnect
from fastapi.responses import JSONResponse
from fastapi.middleware.cors import CORSMiddleware
import requests
import asyncio
import threading
from starlette.concurrency import run_in_threadpool
from zeep import Client
import pika
import json
from datetime import datetime
from pathlib import Path

from mq_consumer import start_mq_consumer
from chat_persistence import load_room_messages, save_message

app = FastAPI(title="API Gateway - AgendeJá")

# ===== INICIALIZA CONSUMER RABBITMQ NO STARTUP =====
@app.on_event("startup")
def startup_event():
    loop = asyncio.get_event_loop()
    thread = threading.Thread(
        target=start_mq_consumer,
        args=(loop, broadcast_message),
        daemon=True
    )
    thread.start()

# ===== CONFIGURAÇÕES =====
REST_URL = "http://localhost:8001"
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

# ===== MENSAGERIA COM RABBITMQ =====
def enviar_mensagem_mq(evento, dados):
    connection = pika.BlockingConnection(
        pika.ConnectionParameters(host='localhost')
    )
    channel = connection.channel()
    channel.queue_declare(queue='agendamentos')

    payload = json.dumps({
        "evento": evento,
        "dados": dados
    })

    channel.basic_publish(
        exchange='',
        routing_key='agendamentos',
        body=payload
    )

    connection.close()

# ===== HATEOAS ROOT =====
@app.get("/", tags=["Gateway"])
def gateway_root():
    return {
        "message": "API Gateway funcionando",
        "_links": {
            "self": "/",
            "servicos": "/servicos",
            "clientes": "/clientes",
            "agendar": "/agendar",
            "disponibilidade": "/disponibilidade?data=YYYY-MM-DD&servico_id=ID",
            "cancelar": "/cancelar",
            "listarAgendamentos": "/listarAgendamentos",
            "websocket": "/ws",
            "chat_messages": "/chat/messages?room=ROOM_ID",
        }
    }

# ===== ROTAS REST (DJANGO) =====
@app.get("/servicos", tags=["Serviços"])
def listar_servicos():
    resp = requests.get(f"{REST_URL}/servicos/")
    return resp.json()

@app.get("/servicos/{profissional_id}", tags=["Serviços"])
def listar_servicos_profissional(profissional_id: int):
    resp = requests.get(f"{REST_URL}/servicos/?profissional={profissional_id}")
    return resp.json()

@app.post("/servicos", tags=["Serviços"])
async def criar_servico(request: Request):
    data = await request.json()
    resp = requests.post(f"{REST_URL}/servicos/", json=data)
    return resp.json()

@app.delete("/servicos/{servico_id}", tags=["Serviços"])
def deletar_servico(servico_id: int):
    resp = requests.delete(f"{REST_URL}/servicos/{servico_id}/")
    return {"sucesso": resp.status_code == 204}

@app.get("/clientes", tags=["Clientes"])
def listar_clientes():
    resp = requests.get(f"{REST_URL}/clientes/")
    return resp.json()

@app.post("/register", tags=["Usuários"])
async def register(request: Request):
    data = await request.json()
    resp = requests.post(f"{REST_URL}/register/", json=data)
    return resp.json()

@app.post("/login", tags=["Usuários"])
async def login(request: Request):
    data = await request.json()
    resp = requests.post(f"{REST_URL}/login/", json=data)
    return resp.json()

# ===== ROTAS SOAP (AGENDAMENTOS) =====
@app.get("/disponibilidade", tags=["Agendamentos"])
def disponibilidade(data: str, servico_id: int):
    resposta = soap_client.service.consultarDisponibilidade(data, servico_id)
    return {"data": data, "servico_id": servico_id, "horarios_disponiveis": resposta.split(",") if resposta and not resposta.startswith("Erro") else []}

@app.post("/agendar", tags=["Agendamentos"])
async def agendar(clienteId: int, servicoId: int, data: str, horaInicio: str):
    resposta = await run_in_threadpool(
        lambda: soap_client.service.agendarServico(
            clienteId, servicoId, data, horaInicio
        )
    )

    enviar_mensagem_mq(
        "novo_agendamento",
        {
            "clienteId": clienteId,
            "servicoId": servicoId,
            "data": data,
            "horaInicio": horaInicio
        }
    )

    return {"mensagem": resposta}

@app.delete("/cancelar", tags=["Agendamentos"])
async def cancelar(agendamentoId: int):
    resposta = await run_in_threadpool(
        lambda: (soap_client.service.cancelarAgendamento(agendamentoId))
    )

    enviar_mensagem_mq(
        "agendamento_cancelado",
        {
            "agendamentoId": agendamentoId
        }
    )

    return {"mensagem": resposta}

@app.get("/listarAgendamentos", tags=["Agendamentos"])
def listar_agendamentos():
    resposta = soap_client.service.listarAgendamentos()
    agendamentos = json.loads(resposta)
    return {"agendamentos": agendamentos}

# ===== ENDPOINTS DE CHAT E PERSISTÊNCIA =====
@app.get("/chat/messages", tags=["Chat"])
async def get_chat_messages(room: str):
    """Retorna histórico de mensagens de uma sala"""
    messages = load_room_messages(room)
    return messages

@app.post("/chat/messages", tags=["Chat"])
async def save_chat_message(request: Request):
    """Salva uma mensagem de chat"""
    try:
        data = await request.json()
        room = data.get('room')
        
        if not room:
            return JSONResponse({"error": "room obrigatória"}, status_code=400)
        
        message = {
            'user_id': data.get('user_id'),
            'username': data.get('username'),
            'text': data.get('text'),
            'room': room,
            'timestamp': data.get('timestamp', datetime.now().isoformat())
        }
        
        save_message(room, message)
        
        return {"status": "ok", "message": message}
    except Exception as e:
        return JSONResponse({"error": str(e)}, status_code=500)

# ===== WEBSOCKET E BROADCAST =====
class ConnectionManager:
    """Gerencia conexões WebSocket e broadcast de mensagens"""
    def __init__(self):
        self.active_connections = []
        self.notifications_enabled = {}  # {user_id: bool}
    
    async def connect(self, websocket: WebSocket):
        await websocket.accept()
        self.active_connections.append(websocket)
        print(f"[WS] Conectado. Total: {len(self.active_connections)}")
    
    def disconnect(self, websocket: WebSocket):
        if websocket in self.active_connections:
            self.active_connections.remove(websocket)
            print(f"[WS] Desconectado. Total: {len(self.active_connections)}")
    
    async def broadcast_to_all(self, message: dict):
        """Envia para TODOS os clientes WebSocket"""
        disconnected = []
        for ws in self.active_connections:
            try:
                await ws.send_json(message)
            except Exception as e:
                print(f"[WS] Erro ao enviar: {e}")
                disconnected.append(ws)
        
        for ws in disconnected:
            self.disconnect(ws)

manager = ConnectionManager()
connected_clients = []  # compatibilidade com mq_consumer

@app.websocket("/ws")
async def websocket_endpoint(websocket: WebSocket):
    await manager.connect(websocket)
    connected_clients.append(websocket)
    
    try:
        while True:
            msg = await websocket.receive_text()
            message = json.loads(msg)
            
            # Se for mensagem de chat, salvar e fazer broadcast
            if message.get('type') == 'chat_message':
                room = message.get('room')
                if room:
                    save_message(room, message)
                    # Adicionar indicador de notificação
                    message['new_notification'] = True
                    await manager.broadcast_to_all(message)
            else:
                # Outros eventos, apenas fazer broadcast
                await manager.broadcast_to_all(message)
    
    except WebSocketDisconnect:
        manager.disconnect(websocket)
        if websocket in connected_clients:
            connected_clients.remove(websocket)

async def broadcast_message(msg):
    """Função chamada pelo RabbitMQ consumer para enviar eventos para WebSocket"""
    try:
        if isinstance(msg, str):
            message = json.loads(msg)
        else:
            message = msg
        
        print(f"[RabbitMQ→WS] Evento: {message.get('evento', '?')}")
        # Adicionar flag de notificação para o chat
        message['from_rabbitmq'] = True
        message['new_notification'] = True
        
        await manager.broadcast_to_all(message)
    except Exception as e:
        print(f"[WS ERROR] Erro ao processar RabbitMQ: {e}")
