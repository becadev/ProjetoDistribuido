import pika
import json
import asyncio

def start_mq_consumer(loop, broadcast_message):
    def callback(ch, method, properties, body):
        dados = json.loads(body)
        msg = json.dumps(dados)

        # envia para o loop do FastAPI
        asyncio.run_coroutine_threadsafe(
            broadcast_message(msg),
            loop
        )

    connection = pika.BlockingConnection(
        pika.ConnectionParameters(host='localhost')
    )
    channel = connection.channel()
    channel.queue_declare(queue='agendamentos')

    channel.basic_consume(
        queue='agendamentos',
        on_message_callback=callback,
        auto_ack=True
    )

    channel.start_consuming()