import json

def convert_price_category(category):
    """Convert price category from string to number."""
    category_map = {
        'cheapest': 1,
        'popular': 0,
        'mostExpensive': 2
    }
    return category_map.get(category, 0)

def convert_format(data):
    """
    Convert data from format:
    { input: string; output: { name: string; quantity: string; priceCategory: 'cheapest' | 'popular' | 'mostExpensive' }[] }
    to format:
    ["строка ввода пользователя", [["название товара", количество (целое число), ценовая категория (число)]]]
    """
    # Extract input string
    input_str = data['input']
    
    # Convert output items
    output_items = []
    for item in data['output']:
        converted_item = [
            item['name'],
            int(item['quantity']),
            convert_price_category(item['priceCategory'])
        ]
        output_items.append(converted_item)
    
    return [input_str, output_items]

def process_jsonl_files():
    """Process input JSONL file and create new JSONL file with converted format."""
    input_file = './data/train_eggs_old.jsonl'
    output_file = './data/eggs.jsonl'
    
    with open(input_file, 'r', encoding='utf-8') as f_in, \
         open(output_file, 'w', encoding='utf-8') as f_out:
        for line in f_in:
            # Parse JSON from each line
            data = json.loads(line.strip())
            # Convert format
            converted_data = convert_format(data)
            # Write converted data to new file
            f_out.write(json.dumps(converted_data, ensure_ascii=False) + '\n')

if __name__ == "__main__":
    process_jsonl_files() 