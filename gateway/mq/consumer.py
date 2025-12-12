import pika
import json
import asyncio
import websockets

async def enviar_ws(msg):
    try:
        async with websockets.connect("ws://localhost:8000/ws") as ws: # conecta ao servidor websocket
            print("Consumer conectado ao gateway")
            await ws.send(msg) #envia mensagem
            print("Consumer enviou:", msg)
    except Exception as e:
        print("Erro ao enviar:", e)

def callback(ch, method, properties, body): #transforma o payload em string e usa o async pra abrir conexão com ws e enviar a mensagem
    dados = json.loads(body)
    print("Mensagem recebida do RabbitMQ:", dados)

    evento = dados["evento"]
    payload = dados["dados"]

    if evento == "novo_agendamento":
        msg = f"Novo agendamento: {payload}"
    else:
        msg = f"Agendamento cancelado: {payload}"

    asyncio.get_event_loop().create_task(enviar_ws(msg)) # agenda a execução da função assíncrona sem bloquear o loop, permitindo o servidor continuar atendendo requisições


def main(): #conecta ao RabbitMQ e consome a fila de agendamentos
    connection = pika.BlockingConnection(
        pika.ConnectionParameters('localhost')
    )
    channel = connection.channel()

    channel.queue_declare(queue='agendamentos')

    channel.basic_consume(
        queue='agendamentos',
        on_message_callback=callback, #chama callback pra cada mensagem 
        auto_ack=True
    )

    print("Consumidor esperando mensagens...")
    channel.start_consuming()

if __name__ == "__main__":
    main()
