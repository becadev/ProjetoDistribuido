"""
Modulo para persistencia de mensagens de chat
Armazena em JSON local - simples e eficiente
"""

import json
from pathlib import Path
from datetime import datetime

CHAT_STORAGE_DIR = Path("./chat_data")
CHAT_STORAGE_DIR.mkdir(exist_ok=True)

def get_chat_file(room_id):
    """Retorna caminho do arquivo de uma sala"""
    return CHAT_STORAGE_DIR / f"{room_id}.json"

def load_room_messages(room_id):
    """Carrega mensagens de uma sala"""
    file_path = get_chat_file(room_id)
    if file_path.exists():
        try:
            with open(file_path, 'r', encoding='utf-8') as f:
                return json.load(f)
        except:
            return []
    return []

def save_message(room_id, message):
    """Salva uma mensagem em uma sala"""
    messages = load_room_messages(room_id)
    messages.append(message)
    file_path = get_chat_file(room_id)
    with open(file_path, 'w', encoding='utf-8') as f:
        json.dump(messages, f, ensure_ascii=False, indent=2)
