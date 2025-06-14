import os
import torch
from transformers import AutoTokenizer, AutoModelForCausalLM
from peft import PeftModel

def export_model(
    base_model_name="mistralai/Mistral-7B-v0.1",
    adapter_path="./output",
    output_path="./model"
):
    # Создаем директорию для экспорта
    os.makedirs(output_path, exist_ok=True)
    
    # 1. Загружаем дообученный токенизатор
    print("Loading tokenizer from adapter_path...")
    tokenizer = AutoTokenizer.from_pretrained(adapter_path)
    
    # 2. Загружаем базовую модель
    print("Loading base model...")
    model = AutoModelForCausalLM.from_pretrained(
        base_model_name,
        torch_dtype=torch.float16,
        device_map="auto",
        low_cpu_mem_usage=True
    )
    
    # 3. Расширяем эмбеддинги под размер токенизатора
    print("Resizing model embeddings...")
    model.resize_token_embeddings(len(tokenizer))
    
    # 4. Загружаем LoRA адаптеры
    print("Loading LoRA adapters...")
    model = PeftModel.from_pretrained(model, adapter_path)
    
    # 5. Мержим и сохраняем
    print("Merging adapters with base model...")
    model = model.merge_and_unload()
    print("Optimizing model for inference...")
    model.eval()
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