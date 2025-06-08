import json
import random
import glob
import os
from pathlib import Path

def convert_delimiters(text):
    """Convert commas to random delimiters (dot or newline)"""
    # Split by comma and clean whitespace
    parts = [part.strip() for part in text.split(',')]
    
    # Randomly choose delimiter for each position
    delimiters = []
    for _ in range(len(parts) - 1):
        delimiter = random.choice(['.', '\n'])
        delimiters.append(delimiter)
    
    # Join parts with chosen delimiters
    result = parts[0]
    for part, delimiter in zip(parts[1:], delimiters):
        if delimiter == '\n':
            result += delimiter + part  # No space after newline
        else:
            result += delimiter + ' ' + part  # Keep space after dot
    
    return result

def process_files():
    # Get all jsonl files from the converted directory
    data_dir = Path('mistral_lora/data/converted')
    input_files = list(data_dir.glob('*.jsonl'))
    
    # List to store all records
    all_records = []
    
    # Read all records from input files
    for file_path in input_files:
        with open(file_path, 'r', encoding='utf-8') as f:
            for line in f:
                if line.strip():
                    all_records.append(json.loads(line))
    
    # Calculate number of records to convert (30%)
    num_records = int(len(all_records) * 0.3)
    
    # Randomly select records
    selected_records = random.sample(all_records, num_records)
    
    # Convert delimiters in selected records
    converted_records = []
    for record in selected_records:
        converted_record = record.copy()
        converted_record['input'] = convert_delimiters(record['input'])
        converted_records.append(converted_record)
    
    # Write converted records to new file
    output_file = data_dir / 'delimiters.jsonl'
    with open(output_file, 'w', encoding='utf-8') as f:
        for record in converted_records:
            f.write(json.dumps(record, ensure_ascii=False) + '\n')
    
    print(f"Processed {len(selected_records)} records")
    print(f"Output written to {output_file}")

if __name__ == '__main__':
    process_files()