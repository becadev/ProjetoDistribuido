# ✅ Correção - undefined user_id

## Problema
Ao abrir o chat como profissional, o devtools mostrava:
```
http://localhost:8001/meus-agendamentos/?profissional_id=undefined
Field 'id' expected a number but got 'undefined'
```

## Causa
O backend retorna `usuario_id` no login, mas o chat.js estava usando `currentUser.id` (que é undefined).

Resposta do login:
```json
{
  "sucesso": true,
  "usuario_id": 3,     // ← Campo correto!
  "username": "profissional1",
  "nome": "Maria",
  "email": "prof@test.com",
  "role": "profissional",
  "profile_id": 1
}
```

## Solução Implementada
Alteradas TODAS as referências em `chat.js` de `currentUser.id` para `currentUser.usuario_id`:

✅ `sendTCPLogin()` - linha ~73
✅ `loadClientRooms()` - linha ~100 (fetch URL)
✅ `loadClientRooms()` - linha ~120 (room.id)
✅ `loadProfessionalRooms()` - linha ~165 (fetch URL)
✅ `loadProfessionalRooms()` - linha ~190 (room.id)
✅ `sendUDPRegister()` - linha ~312
✅ `sendMessage()` - linha ~339
✅ `loadMessageHistory()` - linha ~449

## Como Testar

### 1. Criar dados de teste (se não tiver feito):
```bash
cd agendeja_rest
python manage.py shell < criar_teste_dados.py
```

### 2. Iniciar Django:
```bash
python manage.py runserver 0.0.0.0:8001
```

### 3. Testar:
- Abra `frontend/login.html`
- Login com **profissional1** / **senha123**
- Abra DevTools (F12)
- Console deve mostrar:
  ```
  [CHAT] Agendamentos do profissional: Array [...]
  ```
  
- NÃO deve mais mostrar erro 400 com "undefined"

### 4. Verificar URL:
- Deve ser: `http://localhost:8001/meus-agendamentos/?profissional_id=3`
- E NÃO: `http://localhost:8001/meus-agendamentos/?profissional_id=undefined`

## Status
✅ CORRIGIDO - Chat agora funciona para cliente e profissional
