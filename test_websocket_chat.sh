#!/bin/bash
# Script para testar comunicação WebSocket do Chat

echo "=========================================="
echo "  TESTE DE CHAT EM TEMPO REAL"
echo "=========================================="
echo ""

# Cores
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

echo -e "${YELLOW}1. Verificando se Gateway está rodando...${NC}"
if curl -s http://localhost:8000/ > /dev/null; then
    echo -e "${GREEN}✓ Gateway está online${NC}"
else
    echo -e "${RED}✗ Gateway OFFLINE - Inicie com: uvicorn gateway/main.py --reload${NC}"
    exit 1
fi

echo ""
echo -e "${YELLOW}2. Testando WebSocket...${NC}"
echo ""

# Criar arquivo Python para testar WebSocket
cat > /tmp/test_ws.py << 'EOF'
import asyncio
import websockets
import json
import sys

async def test_websocket():
    try:
        uri = "ws://localhost:8000/ws"
        print(f"Conectando a {uri}...")
        
        async with websockets.connect(uri) as websocket:
            print("✓ Conectado com sucesso!")
            
            # Enviar login
            login_msg = {
                "type": "user_login",
                "username": "teste",
                "user_id": 123,
                "role": "cliente"
            }
            
            await websocket.send(json.dumps(login_msg))
            print(f"→ Enviado: {login_msg['type']}")
            
            # Receber resposta
            response = await asyncio.wait_for(websocket.recv(), timeout=3)
            print(f"← Recebido: {response}")
            
            # Enviar join room
            join_msg = {
                "type": "user_join",
                "username": "teste",
                "user_id": 123,
                "room": "geral"
            }
            
            await websocket.send(json.dumps(join_msg))
            print(f"→ Enviado: {join_msg['type']}")
            
            # Enviar mensagem
            msg = {
                "type": "chat_message",
                "username": "teste",
                "user_id": 123,
                "text": "Olá! Teste de WebSocket 🚀",
                "room": "geral",
                "timestamp": "2026-01-18T10:00:00Z"
            }
            
            await websocket.send(json.dumps(msg))
            print(f"→ Enviado: {msg['type']}")
            print(f"  Conteúdo: '{msg['text']}'")
            
            # Aguardar broadcasts
            print("\nAguardando broadcasts...")
            for i in range(3):
                try:
                    broadcast = await asyncio.wait_for(websocket.recv(), timeout=2)
                    print(f"← Recebido broadcast {i+1}: {broadcast[:100]}...")
                except asyncio.TimeoutError:
                    print("  (timeout)")
                    break
            
            print("\n✓ Teste concluído com sucesso!")
            
    except Exception as e:
        print(f"✗ Erro: {e}")
        sys.exit(1)

asyncio.run(test_websocket())
EOF

python /tmp/test_ws.py

echo ""
echo "=========================================="
echo -e "${GREEN}Status: Teste Concluído${NC}"
echo "=========================================="
echo ""
echo "📝 Próximas etapas:"
echo "  1. Abra chat.html em 2 abas diferentes"
echo "  2. Faça login com contas diferentes"
echo "  3. Selecione a mesma sala em ambas"
echo "  4. Envie uma mensagem"
echo "  5. A mensagem deve aparecer instantaneamente na outra aba ✨"
echo ""
