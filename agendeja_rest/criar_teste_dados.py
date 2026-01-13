"""
Script para criar dados de teste no banco SQLite do SOAP
Execute via: python manage.py shell < criar_teste_dados.py
"""

import sqlite3
from datetime import datetime, timedelta

# Conectar ao banco de dados
conn = sqlite3.connect('db.sqlite3')
cursor = conn.cursor()

print("="*60)
print("CRIANDO DADOS DE TESTE PARA CHAT")
print("="*60)

# 1. Criar usuários se não existirem
print("\n[1] Verificando/Criando Usuários...")

usuarios = [
    ('cliente1', 'senha123', 'cliente1@test.com', 'João Cliente'),
    ('profissional1', 'senha123', 'prof1@test.com', 'Maria Profissional'),
]

for username, password, email, nome in usuarios:
    cursor.execute("SELECT id FROM servicos_usuario WHERE username = ?", (username,))
    if not cursor.fetchone():
        cursor.execute("""
            INSERT INTO servicos_usuario 
            (username, password, email, nome, telefone, is_staff, is_active, date_joined, last_login)
            VALUES (?, ?, ?, ?, '1111111111', 0, 1, ?, NULL)
        """, (username, password, email, nome, datetime.now().isoformat()))
        print(f"  ✓ Usuário criado: {username} (ID: {cursor.lastrowid})")
    else:
        print(f"  → Usuário já existe: {username}")

conn.commit()

# 2. Criar clientes e profissionais
print("\n[2] Verificando/Criando Perfis...")

cursor.execute("SELECT id FROM servicos_usuario WHERE username = 'cliente1'")
cliente_user_id = cursor.fetchone()[0]

cursor.execute("SELECT id FROM servicos_usuario WHERE username = 'profissional1'")
prof_user_id = cursor.fetchone()[0]

# Cliente
cursor.execute("SELECT id FROM servicos_cliente WHERE usuario_id = ?", (cliente_user_id,))
if not cursor.fetchone():
    cursor.execute("""
        INSERT INTO servicos_cliente (usuario_id, cpf)
        VALUES (?, '12345678901')
    """, (cliente_user_id,))
    cliente_id = cursor.lastrowid
    print(f"  ✓ Cliente criado (ID: {cliente_id})")
else:
    cursor.execute("SELECT id FROM servicos_cliente WHERE usuario_id = ?", (cliente_user_id,))
    cliente_id = cursor.fetchone()[0]
    print(f"  → Cliente já existe (ID: {cliente_id})")

# Profissional
cursor.execute("SELECT id FROM servicos_profissional WHERE usuario_id = ?", (prof_user_id,))
if not cursor.fetchone():
    cursor.execute("""
        INSERT INTO servicos_profissional (usuario_id, cnpj, especialidade)
        VALUES (?, '12345678901234', 'Cortes de Cabelo')
    """, (prof_user_id,))
    prof_id = cursor.lastrowid
    print(f"  ✓ Profissional criado (ID: {prof_id})")
else:
    cursor.execute("SELECT id FROM servicos_profissional WHERE usuario_id = ?", (prof_user_id,))
    prof_id = cursor.fetchone()[0]
    print(f"  → Profissional já existe (ID: {prof_id})")

conn.commit()

# 3. Criar serviço
print("\n[3] Verificando/Criando Serviços...")

cursor.execute("SELECT id FROM servicos_servico WHERE nome = 'Corte de Cabelo'")
if not cursor.fetchone():
    cursor.execute("""
        INSERT INTO servicos_servico 
        (nome, descricao, duracao_min, preco, profissional_id, ativo)
        VALUES ('Corte de Cabelo', 'Corte profissional', 30, 50.00, ?, 1)
    """, (prof_id,))
    servico_id = cursor.lastrowid
    print(f"  ✓ Serviço criado (ID: {servico_id})")
else:
    cursor.execute("SELECT id FROM servicos_servico WHERE nome = 'Corte de Cabelo'")
    servico_id = cursor.fetchone()[0]
    print(f"  → Serviço já existe (ID: {servico_id})")

conn.commit()

# 4. Criar agendamento
print("\n[4] Verificando/Criando Agendamentos...")

amanha = (datetime.now() + timedelta(days=1)).date()
hora_inicio = "14:00:00"
hora_fim = "14:30:00"

cursor.execute("""
    SELECT id FROM agendamento 
    WHERE cliente_id = ? AND servico_id = ? AND data = ? AND status = 'Confirmado'
""", (cliente_id, servico_id, amanha.isoformat()))

if not cursor.fetchone():
    cursor.execute("""
        INSERT INTO agendamento 
        (cliente_id, servico_id, data, hora_inicio, hora_fim, status)
        VALUES (?, ?, ?, ?, ?, 'Confirmado')
    """, (cliente_id, servico_id, amanha.isoformat(), hora_inicio, hora_fim))
    agendamento_id = cursor.lastrowid
    print(f"  ✓ Agendamento criado (ID: {agendamento_id})")
    print(f"    Data: {amanha}")
    print(f"    Hora: {hora_inicio} - {hora_fim}")
else:
    print(f"  → Agendamento já existe")

conn.commit()

# 5. Exibir dados criados
print("\n[5] Resumo dos Dados de Teste:")
print("-" * 60)

cursor.execute("SELECT id, username, nome, email FROM servicos_usuario WHERE username LIKE '%cliente%' OR username LIKE '%profissional%'")
usuarios = cursor.fetchall()
for usuario_id, username, nome, email in usuarios:
    print(f"  Usuário: {username} (ID: {usuario_id})")
    print(f"    Nome: {nome}")
    print(f"    Email: {email}")

print("")
cursor.execute("""
    SELECT a.id, c.usuario_id as cliente_user_id, pu.nome as profissional_nome, 
           p.usuario_id as profissional_user_id, s.nome as servico_nome, 
           a.data, a.hora_inicio, a.status
    FROM agendamento a
    LEFT JOIN servicos_cliente c ON a.cliente_id = c.id
    LEFT JOIN servicos_servico s ON a.servico_id = s.id
    LEFT JOIN servicos_profissional p ON s.profissional_id = p.id
    LEFT JOIN servicos_usuario pu ON p.usuario_id = pu.id
    WHERE a.status = 'Confirmado'
""")

agendamentos = cursor.fetchall()
for agend in agendamentos:
    agend_id, cliente_user_id, prof_nome, prof_user_id, servico_nome, data, hora, status = agend
    print(f"  Agendamento ID: {agend_id}")
    print(f"    Cliente (User ID): {cliente_user_id}")
    print(f"    Profissional: {prof_nome} (User ID: {prof_user_id})")
    print(f"    Serviço: {servico_nome}")
    print(f"    Data: {data} às {hora}")
    print(f"    Status: {status}")

print("\n" + "="*60)
print("TESTES DE API DISPONÍVEIS:")
print("="*60)
print(f"\nPara cliente (user_id={cliente_user_id}):")
print(f"  curl http://localhost:8001/meus-agendamentos/?user_id={cliente_user_id}")
print(f"\nPara profissional (profissional_id={prof_user_id}):")
print(f"  curl http://localhost:8001/meus-agendamentos/?profissional_id={prof_user_id}")
print("\n" + "="*60)

conn.close()

print("\n✓ Dados de teste criados com sucesso!")
print("\nPróximos passos:")
print("1. Inicie o servidor Django: python manage.py runserver 0.0.0.0:8001")
print("2. Abra o frontend: http://localhost:5500/frontend/login.html")
print("3. Faça login com:")
print("   - Cliente: usuario 'cliente1', senha 'senha123'")
print("   - Profissional: usuario 'profissional1', senha 'senha123'")
print("4. Clique em 'Abrir Chat' e veja as salas aparecerem!")
