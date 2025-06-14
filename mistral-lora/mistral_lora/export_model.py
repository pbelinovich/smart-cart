import os
import torch
from transformers import AutoTokenizer, AutoModelForCausalLM
from peft import PeftModel

def export_model(
    base_model_name="mistralai/Mistral-7B-v0.1",
    adapter_path="./output",
    output_path="./exported_model_new"
):
    # Создаем директорию для экспорта
    os.makedirs(output_path, exist_ok=True)
    
    # Загружаем базовую модель и токенизатор
    print("Loading base model and tokenizer...")
    tokenizer = AutoTokenizer.from_pretrained(base_model_name)
    model = AutoModelForCausalLM.from_pretrained(
        base_model_name,
        torch_dtype=torch.float16,
        device_map="auto",
        low_cpu_mem_usage=True
    )
    
    # Загружаем LoRA адаптеры
    print("Loading LoRA adapters...")
    model = PeftModel.from_pretrained(model, adapter_path)
    
    # Объединяем веса адаптеров с базовой моделью
    print("Merging adapters with base model...")
    model = model.merge_and_unload()  # type: ignore
    
    # Оптимизация модели для инференса
    print("Optimizing model for inference...")
    model.eval()  # Переводим модель в режим инференса
    
    # Сохраняем объединенную модель
    print(f"Saving merged model to {output_path}...")
    model.save_pretrained(
        output_path,
        max_shard_size="2GB",  # Разбиваем модель на части по 2GB
        safe_serialization=True
    )
    tokenizer.save_pretrained(output_path)
    
    print("Model export completed successfully!")

if __name__ == "__main__":
    export_model() 