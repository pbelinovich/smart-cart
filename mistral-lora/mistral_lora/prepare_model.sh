#!/bin/bash

# Скрипт для подготовки модели к скачиванию
# Использование: ./prepare_model.sh

echo "Starting model preparation process..."

# Проверяем наличие Python
if ! command -v python3 &> /dev/null; then
    echo "Python 3 is not installed. Please install it first."
    exit 1
fi

# Проверяем наличие необходимых директорий
if [ ! -d "./exported_model" ]; then
    echo "Running model export..."
    python3 export_model.py
else
    echo "Model already exported. Skipping export step."
fi

# Архивируем модель
echo "Archiving model..."
python3 archive_model.py

# Выводим инструкции
echo "
Model preparation completed!

To download the model to your local machine:

1. Navigate to the model_archives directory:
   cd model_archives

2. Use the download script:
   ./download_model.sh <remote_host> <remote_user> <remote_path>

Example:
   ./download_model.sh example.com username /path/to/model_archives

The script will download the latest model archive to your current directory.
" 