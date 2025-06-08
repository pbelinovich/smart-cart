import json

with open("./data/deepseek.jsonl", "r", encoding="utf-8") as f:
    for i, line in enumerate(f, 1):
        try:
            json.loads(line)
        except Exception as e:
            print(f"❌ Ошибка в строке {i}: {e}")
            break
    
    print(f"✅ Все строки проверены успешно")