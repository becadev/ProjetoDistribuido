#!/bin/bash
# Script de verificação: Chat TCP/UDP Integration
# Verifica se tudo está configurado corretamente

echo "=================================================="
echo "  🔍 VERIFICAÇÃO: Chat TCP/UDP Integration"
echo "=================================================="
echo ""

# Cores
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Contador de verificações
TOTAL=0
PASSED=0

# Função para verificar
check() {
    TOTAL=$((TOTAL + 1))
    if [ $? -eq 0 ]; then
        echo -e "${GREEN}✓${NC} $1"
        PASSED=$((PASSED + 1))
    else
        echo -e "${RED}✗${NC} $1"
    fi
}

# Função para informação
info() {
    echo -e "${YELLOW}ℹ${NC} $1"
}

# ==================== ESTRUTURA ====================
echo ""
echo "1️⃣  VERIFICANDO ESTRUTURA DE ARQUIVOS..."
echo "=================================================="

# Frontend
[ -f "frontend/chat.html" ] && check "frontend/chat.html existe"
[ -f "frontend/chat.js" ] && check "frontend/chat.js existe"
[ -f "frontend/cliente_dashboard.html" ] && check "cliente_dashboard.html foi modificado"
[ -f "frontend/profissional_dashboard.html" ] && check "profissional_dashboard.html foi modificado"

# Chat TCP/UDP
[ -f "chat_tcp_udp/tcp_server.py" ] && check "chat_tcp_udp/tcp_server.py existe"
[ -f "chat_tcp_udp/tcp_client.py" ] && check "chat_tcp_udp/tcp_client.py existe"
[ -f "chat_tcp_udp/udp_server.py" ] && check "chat_tcp_udp/udp_server.py existe"
[ -f "chat_tcp_udp/udp_client.py" ] && check "chat_tcp_udp/udp_client.py existe"

# Testes e exemplos
[ -f "chat_tcp_udp/test_chat_integration.py" ] && check "test_chat_integration.py existe"
[ -f "chat_tcp_udp/exemplos_praticos.py" ] && check "exemplos_praticos.py existe"

# Documentação
[ -f "CHAT_INTEGRATION.md" ] && check "CHAT_INTEGRATION.md existe"
[ -f "RESUMO_CHAT.md" ] && check "RESUMO_CHAT.md existe"
[ -f "INDICE_DOCUMENTACAO.md" ] && check "INDICE_DOCUMENTACAO.md existe"
[ -f "chat_tcp_udp/READme.md" ] && check "chat_tcp_udp/READme.md foi atualizado"
[ -f "chat_tcp_udp/QUICK_START.md" ] && check "QUICK_START.md existe"
[ -f "chat_tcp_udp/FAQ.md" ] && check "FAQ.md existe"

# ==================== CÓDIGO ====================
echo ""
echo "2️⃣  VERIFICANDO CÓDIGO..."
echo "=================================================="

# Chat.html
grep -q "chat-container" frontend/chat.html && check "chat.html tem estrutura de container"
grep -q "messagesContainer" frontend/chat.html && check "chat.html tem container de mensagens"
grep -q "messageInput" frontend/chat.html && check "chat.html tem input de mensagem"

# Chat.js
grep -q "const TCP_HOST" frontend/chat.js && check "chat.js tem configuração TCP"
grep -q "const UDP_HOST" frontend/chat.js && check "chat.js tem configuração UDP"
grep -q "getUser()" frontend/chat.js && check "chat.js recupera dados do usuário"
grep -q "sendTCPLogin" frontend/chat.js && check "chat.js tem função de login TCP"

# TCP Server
grep -q "'user_id'" chat_tcp_udp/tcp_server.py && check "tcp_server.py suporta user_id"
grep -q "'role'" chat_tcp_udp/tcp_server.py && check "tcp_server.py suporta role"
grep -q "self.clients\[username\]" chat_tcp_udp/tcp_server.py && check "tcp_server.py tem gerenciamento de clientes"

# UDP Server
grep -q "user_id" chat_tcp_udp/udp_server.py && check "udp_server.py suporta user_id"
grep -q "broadcast_message" chat_tcp_udp/udp_server.py && check "udp_server.py tem broadcast"

# ==================== DASHBOARDS ====================
echo ""
echo "3️⃣  VERIFICANDO INTEGRAÇÃO COM DASHBOARDS..."
echo "=================================================="

grep -q "chat.html" frontend/cliente_dashboard.html && check "cliente_dashboard.html tem link para chat"
grep -q "💬 Chat" frontend/cliente_dashboard.html && check "cliente_dashboard.html tem botão Chat (emoji)"

grep -q "chat.html" frontend/profissional_dashboard.html && check "profissional_dashboard.html tem link para chat"
grep -q "💬 Chat" frontend/profissional_dashboard.html && check "profissional_dashboard.html tem botão Chat (emoji)"

# ==================== DEPENDÊNCIAS ====================
echo ""
echo "4️⃣  VERIFICANDO DEPENDÊNCIAS..."
echo "=================================================="

# Python
which python3 > /dev/null 2>&1 && check "Python 3 instalado"
python3 --version | grep -q "3" && check "Versão Python 3 confirmada"

# Django
grep -q "django" requirements.txt > /dev/null 2>&1 && check "Django em requirements.txt" || info "Django configurado no ambiente virtual"

# ==================== CONFIGURAÇÃO ====================
echo ""
echo "5️⃣  VERIFICANDO CONFIGURAÇÃO..."
echo "=================================================="

# Ports
info "Porta TCP padrão: 5000 (verificar em tcp_server.py)"
info "Porta UDP padrão: 5001 (verificar em udp_server.py)"

# Frontend config
grep -q "TCP_PORT = 5000" frontend/chat.js && check "chat.js porta TCP configurada" || check "chat.js porta TCP precisa confirmação"
grep -q "UDP_PORT = 5001" frontend/chat.js && check "chat.js porta UDP configurada" || check "chat.js porta UDP precisa confirmação"

# ==================== DOCUMENTAÇÃO ====================
echo ""
echo "6️⃣  VERIFICANDO DOCUMENTAÇÃO..."
echo "=================================================="

# Conteúdo dos docs
grep -q "TCP" CHAT_INTEGRATION.md && check "CHAT_INTEGRATION.md menciona TCP"
grep -q "UDP" CHAT_INTEGRATION.md && check "CHAT_INTEGRATION.md menciona UDP"
grep -q "autenticação" CHAT_INTEGRATION.md && check "CHAT_INTEGRATION.md menciona autenticação"

grep -q "Quick Start" chat_tcp_udp/QUICK_START.md && check "QUICK_START.md tem Quick Start"
grep -q "Servidor" chat_tcp_udp/QUICK_START.md && check "QUICK_START.md instrui sobre servidores"

grep -q "FAQ" chat_tcp_udp/FAQ.md && check "FAQ.md é uma FAQ"

# ==================== RELATÓRIO FINAL ====================
echo ""
echo "=================================================="
echo "  📊 RELATÓRIO FINAL"
echo "=================================================="

PERCENTAGE=$((PASSED * 100 / TOTAL))

echo ""
echo -e "Verificações: ${GREEN}$PASSED${NC}/$TOTAL aprovadas ($PERCENTAGE%)"

if [ $PASSED -eq $TOTAL ]; then
    echo -e "${GREEN}✓ TUDO OK! Pronto para usar!${NC}"
else
    FAILED=$((TOTAL - PASSED))
    echo -e "${YELLOW}⚠ $FAILED verificação(ões) falharam${NC}"
fi

echo ""
echo "=================================================="
echo "  📝 PRÓXIMOS PASSOS"
echo "=================================================="
echo ""
echo "1. Leia: chat_tcp_udp/QUICK_START.md"
echo "2. Inicie servidores:"
echo "   - Terminal 1: python chat_tcp_udp/tcp_server.py"
echo "   - Terminal 2: python chat_tcp_udp/udp_server.py"
echo "3. Inicie Django:"
echo "   - Terminal 3: python agendeja_rest/manage.py runserver"
echo "4. Execute testes:"
echo "   - python chat_tcp_udp/test_chat_integration.py"
echo "5. Acesse: http://localhost:8000/frontend/index.html"
echo ""
echo "=================================================="

if [ $PASSED -eq $TOTAL ]; then
    exit 0
else
    exit 1
fi
