# 🎯 Chat TCP/UDP - Integração Completa

> Chat em tempo real integrado ao sistema de agendamento **Agende Já**, usando **TCP** para confiabilidade e **UDP** para velocidade.

## 🚀 Quick Start

```bash
# 1. Inicie os servidores TCP/UDP
cd chat_tcp_udp
python tcp_server.py  # Terminal 1
python udp_server.py  # Terminal 2

# 2. Inicie o Django (Terminal 3)
cd ..
python agendeja_rest/manage.py runserver

# 3. Acesse
# http://localhost:8000/frontend/index.html
# Faça login → Clique em "💬 Chat"
```

**Pronto em 2 minutos!** ✨

## 📚 Documentação

| Documento | Propósito | Tempo |
|-----------|-----------|-------|
| [QUICK_START.md](chat_tcp_udp/QUICK_START.md) | Setup rápido | 5 min |
| [INDICE_DOCUMENTACAO.md](INDICE_DOCUMENTACAO.md) | Índice completo | 10 min |
| [RESUMO_CHAT.md](RESUMO_CHAT.md) | Visão geral | 10 min |
| [CHAT_INTEGRATION.md](CHAT_INTEGRATION.md) | Detalhado | 30 min |
| [chat_tcp_udp/FAQ.md](chat_tcp_udp/FAQ.md) | Perguntas comuns | 15 min |

## ✨ Características

✅ **Autenticação Integrada**
- Usa login do sistema existente
- Dados do usuário (user_id, role) automáticos
- Sem re-autenticação no chat

✅ **TCP + UDP**
- TCP: Histórico confiável
- UDP: Mensagens em tempo real
- Melhor dos dois mundos

✅ **Interface Moderna**
- Design responsivo
- Animações suaves
- Notificações de digitação

✅ **Múltiplas Salas**
- Crie salas personalizadas
- Navegação fácil
- Histórico persistente

✅ **Pronto para Produção**
- Código bem estruturado
- Documentação completa
- Testes inclusos

## 📁 Estrutura

```
ProjetoDistribuido/
├── frontend/
│   ├── chat.html              ← Interface web
│   ├── chat.js                ← Lógica JavaScript
│   ├── cliente_dashboard.html  ← (com botão Chat)
│   └── profissional_dashboard.html ← (com botão Chat)
├── chat_tcp_udp/
│   ├── tcp_server.py          ← Servidor TCP
│   ├── udp_server.py          ← Servidor UDP
│   ├── tcp_client.py          ← Cliente TCP
│   ├── udp_client.py          ← Cliente UDP
│   ├── test_chat_integration.py ← Testes
│   ├── exemplos_praticos.py   ← Exemplos
│   ├── QUICK_START.md         ← Setup rápido
│   └── FAQ.md                 ← Perguntas
├── CHAT_INTEGRATION.md        ← Integração
├── RESUMO_CHAT.md            ← Visão geral
├── INDICE_DOCUMENTACAO.md    ← Índice
└── verificar_chat.sh          ← Verificação
```

## 🔐 Autenticação

```
Login Django → localStorage → chat.js → TCP/UDP
```

Dados automaticamente passados:
- `username` - Nome do usuário
- `user_id` - ID único
- `role` - Cliente ou Profissional
- `profile_id` - ID do perfil

## 🎨 Interface

### Cliente
![Chat Interface](https://via.placeholder.com/400x300?text=Chat+Interface)

- Sidebar com salas
- Área de mensagens
- Input de texto
- Status de conexão
- Botão de histórico

### Responsivo
- Desktop ✓
- Tablet ✓
- Mobile ✓

## 📊 Protocolos

### TCP (Confiável)
```json
Login:
{
  "type": "login",
  "username": "usuario",
  "user_id": 123,
  "role": "cliente"
}

Entrar em Sala:
{
  "type": "join_room",
  "room": "geral"
}

Histórico:
{
  "type": "get_history",
  "room": "geral"
}
```

### UDP (Rápido)
```json
Mensagem:
{
  "type": "message",
  "username": "usuario",
  "user_id": 123,
  "text": "Olá!",
  "room": "geral"
}

Digitando:
{
  "type": "typing",
  "username": "usuario",
  "room": "geral"
}
```

## 🧪 Testes

```bash
# Teste de integração
python chat_tcp_udp/test_chat_integration.py

# Exemplos práticos
python chat_tcp_udp/exemplos_praticos.py

# Verificar setup
bash verificar_chat.sh
```

## 🔧 Configuração

Portas padrão:
- TCP: `localhost:5000`
- UDP: `localhost:5001`

Para alterar:
1. Edite `tcp_server.py` (TCP_PORT)
2. Edite `udp_server.py` (UDP_PORT)
3. Edite `frontend/chat.js` (TCP_PORT, UDP_PORT)

## 🚨 Troubleshooting

### "Conectando..." nunca termina
```bash
# Verificar se tcp_server.py está rodando
ps aux | grep tcp_server
# Ou verifique porta
netstat -an | grep 5000
```

### Mensagens não chegam
```bash
# Verificar se udp_server.py está rodando
ps aux | grep udp_server
# Ou recarregue o navegador (Ctrl+R)
```

### Mais ajuda
→ Veja [chat_tcp_udp/FAQ.md](chat_tcp_udp/FAQ.md)
→ Veja [CHAT_INTEGRATION.md](CHAT_INTEGRATION.md#troubleshooting)

## 🎯 Próximos Passos

1. **Comece**: [QUICK_START.md](chat_tcp_udp/QUICK_START.md)
2. **Entenda**: [RESUMO_CHAT.md](RESUMO_CHAT.md)
3. **Integre**: [CHAT_INTEGRATION.md](CHAT_INTEGRATION.md)
4. **Customize**: Edite arquivos conforme necessário

## 📈 Roadmap

- [ ] Integração com banco de dados Django
- [ ] WebSocket para real-time puro
- [ ] Anexo de arquivos
- [ ] Busca de mensagens
- [ ] Reações com emojis
- [ ] Video/Áudio
- [ ] Grupos de chat
- [ ] Avaliações pós-chat

## 📝 Licença

Código do projeto, customizável conforme necessário.

## 🤝 Contribuições

Customize e estenda conforme precisar! O código está estruturado para facilitar modificações.

## 📞 Suporte

- Documentação: [INDICE_DOCUMENTACAO.md](INDICE_DOCUMENTACAO.md)
- FAQ: [chat_tcp_udp/FAQ.md](chat_tcp_udp/FAQ.md)
- Integração: [CHAT_INTEGRATION.md](CHAT_INTEGRATION.md)

---

**Status**: ✅ Pronto para uso
**Versão**: 1.0
**Data**: 13 de janeiro de 2026

**Comece agora**: [QUICK_START.md](chat_tcp_udp/QUICK_START.md) 🚀
