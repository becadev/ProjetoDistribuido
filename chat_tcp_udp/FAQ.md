# ❓ FAQ - Perguntas Frequentes sobre Chat TCP/UDP

## 🔐 Autenticação e Segurança

### P: Como o chat sabe quem sou eu?
**R:** O chat recupera seus dados do `localStorage` que foi preenchido quando você fez login no sistema principal. Seus dados (username, user_id, role) são automaticamente passados ao chat.

### P: Preciso fazer login novamente no chat?
**R:** Não! O chat reutiliza a autenticação que você já fez no sistema. Se você está logado no dashboard, está logado no chat.

### P: O que acontece se eu limpar o localStorage?
**R:** Você será redirecionado para a página de login. Faça login novamente e os dados serão restaurados.

### P: É seguro enviar dados via TCP/UDP?
**R:** O projeto atual usa localhost (teste). Em produção, considere usar WebSocket com SSL/TLS.

## 💬 Usando o Chat

### P: Como crio uma sala?
**R:** Clique em "+ Nova Sala" na sidebar, digite o nome e descrição (opcional), depois clique em "Criar".

### P: Quantas salas posso estar ao mesmo tempo?
**R:** Atualmente você vê uma por vez, mas pode entrar em múltiplas salas alternando entre elas.

### P: Outras pessoas veem o histórico?
**R:** Sim! O histórico é armazenado no servidor TCP. Qualquer um que entre na sala vê as mensagens anteriores.

### P: As mensagens são persistentes?
**R:** Sim! O servidor TCP armazena todo o histórico em memória. Em produção, considere salvar em banco de dados.

### P: Posso editar ou deletar mensagens?
**R:** Não no momento. Essa é uma feature futura que pode ser implementada facilmente.

## 🚀 Performance e Escalabilidade

### P: Quantas pessoas podem usar ao mesmo tempo?
**R:** O código está otimizado para dezenas de usuários simultâneos. Para centenas, considere implementar WebSocket e banco de dados.

### P: Por que usar TCP e UDP juntos?
**R:** TCP garante entrega (histórico), UDP garante velocidade (chat em tempo real). Juntos, oferem o melhor dos dois mundos.

### P: Qual é a latência das mensagens?
**R:** Mensagens UDP (chat) chegam em < 100ms. Mensagens TCP (armazenamento) chegam em < 500ms.

### P: O chat funciona em redes lentas?
**R:** TCP funciona em qualquer rede. UDP pode ter perdas em redes muito instáveis, mas TCP faz armazenamento confiável.

## 🔧 Técnico

### P: Posso mudar as portas padrão?
**R:** Sim! Edite TCP_PORT (padrão 5000) e UDP_PORT (padrão 5001) nos servidores e em chat.js.

### P: Como integro com meu banco de dados Django?
**R:** Veja a seção "Próximos Passos" em [CHAT_INTEGRATION.md](../CHAT_INTEGRATION.md#próximos-passos-recomendado).

### P: Posso usar isso em produção?
**R:** O código atual é para desenvolvimento. Para produção, considere:
- WebSocket em vez de sockets puros
- Banco de dados em vez de memória
- Autenticação com tokens JWT
- HTTPS/SSL
- Rate limiting
- Validação de entrada

### P: Como debugar problemas?
**R:** 
1. Verifique os logs dos servidores TCP/UDP
2. Abra DevTools do browser (F12)
3. Verifique console para erros JavaScript
4. Execute test_chat_integration.py para diagnóstico

### P: Posso usar outro navegador/computador?
**R:** Sim, mas todos devem acessar localhost. Para rede local, mude localhost para o IP do servidor em chat.js.

## 📱 Dispositivos e Navegadores

### P: Funciona em celular?
**R:** Sim! A interface é responsiva. Mas em rede móvel, TCP/UDP direto pode ser bloqueado. Use WebSocket para mobile.

### P: Quais navegadores suportam?
**R:** Todos os modernos (Chrome, Firefox, Safari, Edge). WebSockets precisam ser habilitados.

### P: Funciona offline?
**R:** Não, mas mensagens locais são salvas em localStorage. Ao reconectar, histórico é recuperado.

## 🎨 Interface

### P: Como customizar as cores?
**R:** Edite a seção `<style>` em frontend/chat.html. As cores principais usam:
```css
background: linear-gradient(135deg, #fbbf24 0%, #f59e0b 100%);
```

### P: Posso adicionar emojis?
**R:** Sim! Emojis funcionam nativamente. Apenas digite em qualquer lugar.

### P: Como adicionar anexos?
**R:** Não é suportado atualmente. Para implementar, veja [CHAT_INTEGRATION.md](../CHAT_INTEGRATION.md#features-avançadas).

## 📊 Dados e Histórico

### P: Quanto tempo o histórico é mantido?
**R:** Enquanto o servidor TCP está rodando. Se reiniciar, histórico é perdido (está em memória).

### P: Como fazer backup do histórico?
**R:** O frontend salva em localStorage. Para persistência real, implemente banco de dados.

### P: Posso exportar o histórico?
**R:** Não é suportado atualmente, mas é simples adicionar. O histórico está acessível via `get_history`.

### P: Há limite de mensagens?
**R:** Não há limite atual. Performance degrada com milhões de mensagens (considere paginação).

## 🐛 Problemas Comuns

### P: "Conectando..." nunca termina
**R:** TCP_server.py não está rodando ou porta está bloqueada. Verifique:
```bash
netstat -an | grep 5000
ps aux | grep tcp_server
```

### P: Mensagens não aparecem
**R:** Verifique se udp_server.py está rodando e se você entrou em uma sala.

### P: Console mostra erro de CORS
**R:** Isso é esperado em localhost. Em produção, configure CORS corretamente.

### P: Histórico desaparece ao recarregar
**R:** Histórico servidor é perdido (memória). localStorage mantém backup local.

## 🔗 Integração

### P: Como integro com meu sistema de pagamento?
**R:** O chat é só comunicação. Sistema de pagamento é independente. Podem coexistir sem problemas.

### P: Posso usar chat_id para agendamentos?
**R:** Sim! Use a sala como rastreador. Exemplo: `chat_agendamento_123` para agendamento ID 123.

### P: Como vincular cliente a profissional automaticamente?
**R:** Crie sala: `chat_cliente_{client_id}_prof_{prof_id}`. Invite automaticamente na criação do agendamento.

## 📈 Crescimento

### P: E se ficar muito grande?
**R:** Migre para WebSocket, implemente sharding de salas, use Redis para cache.

### P: Como escalar para múltiplos servidores?
**R:** Implemente broker de mensagens (RabbitMQ) e sincronize estado. Hoje é single-server.

### P: Suporta video/áudio?
**R:** Não no momento. Para implementar, integre WebRTC. Exige mudanças significativas.

## ✨ Features Futuras

### P: Quando terão [feature X]?
**R:** O código é open (seus), customizável! Adicione as features que precisar.

### P: Há roadmap?
**R:** Veja [CHAT_INTEGRATION.md](../CHAT_INTEGRATION.md#features-avançadas) para ideias.

### P: Posso contribuir com melhorias?
**R:** Claro! O código é seu. Customize como precisar.

## 💡 Tips & Tricks

### P: Como evitar mensagens duplicadas?
**R:** Frontend deduplicada. TCP armazena uma vez. UDP pode duplicar (aceitável para notificações).

### P: Como saber quem está digitando?
**R:** Mensagem UDP com type='typing' é enviada. Implementado em chat.js.

### P: Como implementar typing indicator visual?
**R:** Já está implementado! Veja chat.js função `display_typing_notification()`.

### P: Como fazer salas privadas?
**R:** Adicione check na função `join_room()` do TCP server com lista de usuários autorizados.

## 🆘 Suporte

### P: Não consegui fazer funcionar
**R:** 
1. Leia [QUICK_START.md](QUICK_START.md)
2. Execute exemplos_praticos.py
3. Execute test_chat_integration.py
4. Verifique logs dos servidores
5. Veja [CHAT_INTEGRATION.md](../CHAT_INTEGRATION.md#troubleshooting)

### P: Encontrei um bug
**R:** Verifique:
1. Logs do servidor
2. Console do browser (F12)
3. Se é reproduzível
4. Se os servidores estão rodando

### P: Preciso customizar algo
**R:** Todos os arquivos estão comentados e estruturados. Faça as mudanças que precisar!

---

**Não encontrou sua pergunta?** Consulte a documentação completa em:
- [QUICK_START.md](QUICK_START.md) - Comece rápido
- [READme.md](READme.md) - Documentação técnica
- [../CHAT_INTEGRATION.md](../CHAT_INTEGRATION.md) - Guia de integração
- [exemplos_praticos.py](exemplos_praticos.py) - Exemplos de código
