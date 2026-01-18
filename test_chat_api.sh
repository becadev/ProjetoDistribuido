#!/bin/bash
# Script para testar a API de agendamentos

API_URL="http://localhost:8001"

echo "==============================================="
echo "TESTE DE API - AGENDAMENTOS"
echo "==============================================="

# Teste 1: Verificar se o servidor está rodando
echo ""
echo "[1] Testando conexão com servidor..."
if curl -s -o /dev/null -w "%{http_code}" "$API_URL/login/" | grep -q "405"; then
    echo "✓ Servidor Django respondendo em $API_URL"
else
    echo "✗ Servidor Django NÃO respondendo"
    echo "  Inicie com: cd agendeja_rest && python manage.py runserver 0.0.0.0:8001"
    exit 1
fi

# Teste 2: Listar usuários (para encontrar IDs)
echo ""
echo "[2] Buscando usuários registrados..."
curl -s "$API_URL/usuarios/" | python3 -m json.tool | head -30

# Teste 3: Testar endpoint de agendamentos (cliente)
echo ""
echo "[3] Testando /meus-agendamentos/?user_id=2 (cliente)..."
echo "    Buscar por user_id (cliente logado como usuario id 2)"
curl -s "$API_URL/meus-agendamentos/?user_id=2" | python3 -m json.tool

# Teste 4: Testar endpoint de agendamentos (profissional)
echo ""
echo "[4] Testando /meus-agendamentos/?profissional_id=1 (profissional)..."
echo "    Buscar por profissional_id (profissional logado como usuario id 1)"
curl -s "$API_URL/meus-agendamentos/?profissional_id=1" | python3 -m json.tool

echo ""
echo "==============================================="
echo "FIM DOS TESTES"
echo "==============================================="
echo ""
echo "Notas:"
echo "- Substitua os IDs (user_id=2, profissional_id=1) pelos seus usuários"
echo "- Verifique se existem agendamentos confirmados no banco"
echo "- Para adicionar dados de teste:"
echo "  python manage.py shell"
echo "  > execute: exec(open('criar_teste_dados.py').read())"
