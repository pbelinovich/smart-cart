import json
import argparse
from pathlib import Path
from typing import Dict, List, Any, Tuple

def validate_price_category(category: str) -> bool:
    """Проверяет, что ценовая категория соответствует допустимым значениям"""
    valid_categories = {"popular", "cheapest", "mostExpensive"}
    return category in valid_categories

def validate_quantity(quantity: str) -> bool:
    """Проверяет, что количество является положительным целым числом в строковом формате"""
    try:
        num = int(quantity)
        return num > 0
    except ValueError:
        return False

def validate_product(product: Dict[str, Any]) -> Tuple[bool, str]:
    """Проверяет структуру и содержимое продукта"""
    # Проверяем наличие всех необходимых полей
    required_fields = {"name", "quantity", "priceCategory"}
    if not all(field in product for field in required_fields):
        return False, f"Отсутствуют обязательные поля. Требуются: {required_fields}"
    
    # Проверяем типы полей
    if not isinstance(product["name"], str):
        return False, "Поле 'name' должно быть строкой"
    if not isinstance(product["quantity"], str):
        return False, "Поле 'quantity' должно быть строкой"
    if not isinstance(product["priceCategory"], str):
        return False, "Поле 'priceCategory' должно быть строкой"
    
    # Проверяем содержимое полей
    if not product["name"].strip():
        return False, "Поле 'name' не может быть пустым"
    if not validate_quantity(product["quantity"]):
        return False, "Поле 'quantity' должно быть положительным целым числом в строковом формате"
    if not validate_price_category(product["priceCategory"]):
        return False, f"Поле 'priceCategory' должно быть одним из значений: popular, cheapest, mostExpensive"
    
    return True, ""

def validate_data(input_file: str) -> Tuple[bool, List[str]]:
    """
    Проверяет валидность данных в JSONL файле
    Возвращает кортеж (успешность валидации, список ошибок)
    """
    errors = []
    line_number = 0
    
    try:
        with open(input_file, 'r', encoding='utf-8') as f:
            for line in f:
                line_number += 1
                if not line.strip():
                    continue
                
                try:
                    data = json.loads(line)
                    
                    # Проверяем наличие обязательных полей верхнего уровня
                    if not isinstance(data, dict):
                        errors.append(f"Строка {line_number}: Данные должны быть объектом")
                        continue
                    
                    if "input" not in data:
                        errors.append(f"Строка {line_number}: Отсутствует поле 'input'")
                        continue
                    
                    if "output" not in data:
                        errors.append(f"Строка {line_number}: Отсутствует поле 'output'")
                        continue
                    
                    # Проверяем тип и содержимое input
                    if not isinstance(data["input"], str):
                        errors.append(f"Строка {line_number}: Поле 'input' должно быть строкой")
                        continue
                    
                    if not data["input"].strip():
                        errors.append(f"Строка {line_number}: Поле 'input' не может быть пустым")
                        continue
                    
                    # Проверяем тип и содержимое output
                    if not isinstance(data["output"], list):
                        errors.append(f"Строка {line_number}: Поле 'output' должно быть списком")
                        continue
                    
                    if not data["output"]:
                        errors.append(f"Строка {line_number}: Список 'output' не может быть пустым")
                        continue
                    
                    # Проверяем каждый продукт в output
                    for i, product in enumerate(data["output"]):
                        is_valid, error_msg = validate_product(product)
                        if not is_valid:
                            errors.append(f"Строка {line_number}, продукт {i + 1}: {error_msg}")
                
                except json.JSONDecodeError as e:
                    errors.append(f"Строка {line_number}: Ошибка JSON: {str(e)}")
                    continue
                except Exception as e:
                    errors.append(f"Строка {line_number}: Неожиданная ошибка: {str(e)}")
                    continue
    
    except Exception as e:
        errors.append(f"Ошибка при чтении файла: {str(e)}")
    
    return len(errors) == 0, errors

def main():
    parser = argparse.ArgumentParser(description='Валидация данных для обучения Mistral')
    parser.add_argument('input_file', help='Путь к JSONL файлу для проверки')
    
    args = parser.parse_args()
    
    print(f"Начинаем валидацию данных...")
    print(f"Файл: {args.input_file}")
    
    is_valid, errors = validate_data(args.input_file)
    
    if is_valid:
        print("✅ Валидация успешно пройдена!")
    else:
        print("❌ Обнаружены ошибки:")
        for error in errors:
            print(f"  - {error}")

if __name__ == "__main__":
    main() 