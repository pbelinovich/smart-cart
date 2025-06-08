import json
import argparse
from pathlib import Path

def convert_price_category(category):
    """
    Конвертирует числовую ценовую категорию в текстовую
    0 -> "popular"
    1 -> "cheapest"
    2 -> "mostExpensive"
    """
    price_categories = {
        0: "popular",
        1: "cheapest",
        2: "mostExpensive"
    }
    return price_categories.get(category, "popular")  # по умолчанию "popular"

def convert_data(input_file: str, output_file: str):
    """
    Конвертирует данные из формата:
    ["строка ввода пользователя", [["название товара", количество, числовая_категория]]]
    в формат:
    {"input": "строка ввода пользователя", "output": [{"name": "название товара", "quantity": "количество", "priceCategory": "категория"}]}
    """
    # Создаем директорию для выходного файла, если она не существует
    Path(output_file).parent.mkdir(parents=True, exist_ok=True)
    
    # Открываем файлы
    with open(input_file, 'r', encoding='utf-8') as f_in, \
         open(output_file, 'w', encoding='utf-8') as f_out:
        
        # Читаем и обрабатываем каждую строку
        for line in f_in:
            if not line.strip():  # Пропускаем пустые строки
                continue
                
            try:
                # Парсим исходные данные
                user_input, products = json.loads(line)
                
                # Конвертируем продукты, заменяя числовые категории на текстовые
                converted_products = []
                for product in products:
                    name, quantity, category = product
                    text_category = convert_price_category(category)
                    converted_products.append({
                        "name": name,
                        "quantity": str(quantity),
                        "priceCategory": text_category
                    })
                
                # Создаем новую структуру данных
                new_data = {
                    "input": user_input,
                    "output": converted_products
                }
                
                # Записываем в новый файл
                f_out.write(json.dumps(new_data, ensure_ascii=False) + '\n')
                
            except json.JSONDecodeError as e:
                print(f"Ошибка при обработке строки: {line.strip()}")
                print(f"Ошибка: {str(e)}")
                continue
            except Exception as e:
                print(f"Неожиданная ошибка при обработке строки: {line.strip()}")
                print(f"Ошибка: {str(e)}")
                continue

def main():
    parser = argparse.ArgumentParser(description='Конвертация данных для обучения Mistral')
    parser.add_argument('input_file', help='Путь к исходному JSONL файлу')
    parser.add_argument('output_file', help='Путь к выходному JSONL файлу')
    
    args = parser.parse_args()
    
    print(f"Начинаем конвертацию данных...")
    print(f"Входной файл: {args.input_file}")
    print(f"Выходной файл: {args.output_file}")
    
    convert_data(args.input_file, args.output_file)
    
    print("Конвертация завершена!")

if __name__ == "__main__":
    main() 