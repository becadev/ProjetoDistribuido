# 🚀 Guia Rápido: Chat TCP/UDP

Comece a usar o chat em menos de 5 minutos!

## ⚡ Quick Start (5 minutos)

### Passo 1: Inicie os Servidores (2 minutos)

```bash
# Abra 2 terminais na pasta chat_tcp_udp
cd /home/becadev/DSD/ProjetoDistribuido/chat_tcp_udp

# Terminal 1
python tcp_server.py
# Saída esperada: [TCP SERVER] Aguardando conexões em localhost:5000

# Terminal 2
python udp_server.py
# Saída esperada: [UDP SERVER] Aguardando mensagens em localhost:5001
```

✅ Servidores rodando!

### Passo 2: Inicie o Django (1 minuto)

```bash
# Terminal 3
cd /home/becadev/DSD/ProjetoDistribuido
python agendeja_rest/manage.py runserver
# Saída esperada: Starting development server at http://127.0.0.1:8000/
```

✅ Django rodando!

### Passo 3: Use o Chat (2 minutos)

1. Abra http://localhost:8000/frontend/index.html
2. Clique em **"Entrar"** ou **"Cadastrar"**
3. Faça login com credenciais
4. Clique em **"💬 Chat"** no dashboard
5. Pronto! Chat funcionando! 🎉

## 📋 O que você pode fazer

- ✅ **Chat em Tempo Real**: Mensagens aparecem instantaneamente
- ✅ **Múltiplas Salas**: Crie ou entre em diferentes salas
- ✅ **Histórico**: Veja mensagens anteriores
- ✅ **Digitação**: Saiba quando outros estão digitando

## 🔧 Configuração (Opcional)

Para alterar portas padrão, edite:

```python
# tcp_server.py
TCP_HOST = 'localhost'
TCP_PORT = 5000  # Mudar aqui

# udp_server.py
UDP_HOST = 'localhost'
UDP_PORT = 5001  # Mudar aqui

# frontend/chat.js
const TCP_HOST = 'localhost';
const TCP_PORT = 5000;    // Atualizar
const UDP_HOST = 'localhost';
const UDP_PORT = 5001;    // Atualizar
```

## 🧪 Testar Antes de Usar

Execute o script de teste:

```bash
cd /home/becadev/DSD/ProjetoDistribuido/chat_tcp_udp
python test_chat_integration.py
```

Testa automaticamente:
- ✅ Cliente único
- ✅ Múltiplos clientes
- ✅ Autenticação

## 📚 Ver Exemplos Práticos

```bash
cd /home/becadev/DSD/ProjetoDistribuido/chat_tcp_udp
python exemplos_praticos.py
```

Mostra:
- Fluxo de autenticação
- Operações TCP
- Operações UDP
- Conversa completa cliente-profissional

## ❌ Se algo der errado

### "Erro de conexão TCP"
```
1. Verifique se tcp_server.py está rodando
2. Verifique porta 5000 disponível: netstat -an | grep 5000
3. Restart do tcp_server.py
```

### "Mensagens não chegam"
```
1. Verifique se udp_server.py está rodando
2. Verifique porta 5001 disponível: netstat -an | grep 5001
3. Reload do browser (Ctrl+R ou Cmd+R)
```

### "Histórico vazio"
```
1. Salas novas não têm histórico anterior
2. Envie uma mensagem (será armazenada)
3. Recarregue a página
```

### "Login não persiste no chat"
```
1. Verifique localStorage: F12 > Application > localStorage
2. Confirme que 'user' está lá com dados corretos
3. Limpe cache: Ctrl+Shift+Delete
```

## 📖 Documentação Completa

- **Guia de Integração**: [../CHAT_INTEGRATION.md](../CHAT_INTEGRATION.md)
- **Documentação Técnica**: [READme.md](READme.md)
- **Resumo Geral**: [../RESUMO_CHAT.md](../RESUMO_CHAT.md)
- **Exemplos Práticos**: [exemplos_praticos.py](exemplos_praticos.py)

## 🎯 Próximos Passos

Após familiarizar-se com o básico:

1. **Crie suas próprias salas**
2. **Teste em múltiplos navegadores/abas**
3. **Leia a documentação completa**
4. **Considere integração com banco de dados**

## 💬 Precisa de ajuda?

1. Verifique os logs dos servidores (mostram o que está acontecendo)
2. Abra DevTools do navegador (F12) para ver erros
3. Veja [CHAT_INTEGRATION.md](../CHAT_INTEGRATION.md) seção Troubleshooting
4. Execute exemplos práticos para entender fluxos

## ✨ Pronto!

Você tem tudo funcionando. Agora explore e divirta-se! 🚀

---

**Dúvidas?** Veja a documentação completa em [../CHAT_INTEGRATION.md](../CHAT_INTEGRATION.md)
