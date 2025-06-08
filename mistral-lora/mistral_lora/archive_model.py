import os
import shutil
import datetime
import argparse
from pathlib import Path

def archive_model(
    model_dir="./exported_model",
    output_dir="./model_archives",
    keep_archives=3
):
    # Создаем директорию для архивов если её нет
    os.makedirs(output_dir, exist_ok=True)
    
    # Генерируем имя архива с датой
    timestamp = datetime.datetime.now().strftime("%Y%m%d_%H%M%S")
    archive_name = f"mistral_model_{timestamp}"
    archive_path = os.path.join(output_dir, archive_name)
    
    print(f"Creating archive of model from {model_dir}...")
    
    # Создаем архив
    shutil.make_archive(archive_path, 'zip', model_dir)
    
    # Удаляем старые архивы, оставляя только последние keep_archives
    archives = sorted(
        [f for f in os.listdir(output_dir) if f.endswith('.zip')],
        key=lambda x: os.path.getctime(os.path.join(output_dir, x)),
        reverse=True
    )
    
    for old_archive in archives[keep_archives:]:
        os.remove(os.path.join(output_dir, old_archive))
        print(f"Removed old archive: {old_archive}")
    
    print(f"\nArchive created successfully: {archive_name}.zip")
    print(f"Location: {os.path.abspath(archive_path)}.zip")
    
    # Создаем скрипт для скачивания
    create_download_script(output_dir, archive_name)

def create_download_script(output_dir, archive_name):
    script_content = f"""#!/bin/bash

# Скрипт для скачивания модели через SSH
# Использование: ./download_model.sh <remote_host> <remote_user> <remote_path>

if [ "$#" -ne 3 ]; then
    echo "Usage: ./download_model.sh <remote_host> <remote_user> <remote_path>"
    exit 1
fi

REMOTE_HOST=$1
REMOTE_USER=$2
REMOTE_PATH=$3

echo "Downloading model archive from {archive_name}.zip..."
scp $REMOTE_USER@$REMOTE_HOST:$REMOTE_PATH/{archive_name}.zip .

if [ $? -eq 0 ]; then
    echo "Download completed successfully!"
    echo "Archive saved as: {archive_name}.zip"
else
    echo "Download failed!"
    exit 1
fi
"""
    
    script_path = os.path.join(output_dir, "download_model.sh")
    with open(script_path, "w") as f:
        f.write(script_content)
    
    # Делаем скрипт исполняемым
    os.chmod(script_path, 0o755)
    print(f"\nDownload script created: {script_path}")
    print("\nTo download the model, use:")
    print(f"cd {output_dir}")
    print("./download_model.sh <remote_host> <remote_user> <remote_path>")

if __name__ == "__main__":
    parser = argparse.ArgumentParser(description="Archive exported model for download")
    parser.add_argument("--model-dir", default="./exported_model", help="Path to exported model directory")
    parser.add_argument("--output-dir", default="./model_archives", help="Path to output directory for archives")
    parser.add_argument("--keep-archives", type=int, default=3, help="Number of recent archives to keep")
    
    args = parser.parse_args()
    archive_model(args.model_dir, args.output_dir, args.keep_archives) 