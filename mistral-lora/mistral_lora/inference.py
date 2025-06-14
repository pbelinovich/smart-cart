import sys
import torch
from transformers import AutoTokenizer, AutoModelForCausalLM
import gc
import json
import os
from fastapi import FastAPI, Request
from pydantic import BaseModel
from typing import Optional, Any
import uvicorn

app = FastAPI()
model_path = os.path.join(os.path.dirname(__file__), "../model")

# Глобальные переменные для хранения модели и токенизатора
model_ref: dict[str, Any] = {"model": None, "tokenizer": None, "device": None}

# Конфигурация через переменные окружения
class Config:
    # Пути
    PROMPT_PATH = os.getenv('PROMPT_PATH', os.path.join(os.path.dirname(os.path.dirname(os.path.dirname(__file__))), "backend/src/shared/parse-products.json"))

class PromptRequest(BaseModel):
    prompt: str
    device: Optional[str] = "auto"
    max_new_tokens: Optional[int] = 200
    temperature: Optional[float] = 0.1
    top_p: Optional[float] = 1.0

def load_model(device="auto"):
    print("Loading model and tokenizer...", file=sys.stderr)

    # Определяем устройство
    if device == "auto":
        if torch.cuda.is_available():
            gpu_memory = torch.cuda.get_device_properties(0).total_memory
            print(f"Available GPU memory: {gpu_memory / 1024 ** 3:.2f} GB", file=sys.stderr)
            if gpu_memory < 16 * 1024 ** 3:
                device = "cpu"
                print("Using CPU for inference due to limited GPU memory", file=sys.stderr)
            else:
                device = "cuda"
        else:
            device = "cpu"
            print("Using CPU for inference (no GPU available)", file=sys.stderr)

    # Загрузка токенизатора и модели
    tokenizer = AutoTokenizer.from_pretrained(model_path, local_files_only=True)
    model = AutoModelForCausalLM.from_pretrained(
        model_path,
        # torch_dtype=torch.float16 if device == "cuda" else torch.float32,
        torch_dtype=torch.float16, # только float16, на float32 нужно ~26–28 VRAM на видеокарте
        device_map="auto",
        low_cpu_mem_usage=True,
        local_files_only=True
    )

    # Перевод модели в режим eval
    model.eval()

    # Сохраняем ссылки для shutdown
    model_ref["model"] = model
    model_ref["tokenizer"] = tokenizer
    model_ref["device"] = device
    return model, tokenizer, device


def generate_text(prompt, model, tokenizer, device, max_length, temperature, top_p):
    # prompt теперь приходит уже с промптом, ничего не добавляем
    inputs = tokenizer(
        prompt,
        return_tensors="pt",
        truncation=True,
        max_length=512,
        add_special_tokens=False
    )
    if device == "cuda":
        inputs = {k: v.cuda() for k, v in inputs.items()}

    with torch.no_grad():
        with torch.cuda.amp.autocast(enabled=(device == "cuda")):
            outputs = model.generate(
                **inputs,
                # num_return_sequences=1,
                # do_sample=False,  # строгий вывод
                temperature=temperature,
                top_p=top_p,
                max_new_tokens=max_length,
                pad_token_id=tokenizer.pad_token_id,
                eos_token_id=tokenizer.eos_token_id,
                # use_cache=True
            )

    # Получаем полный ответ
    response = tokenizer.decode(outputs[0], skip_special_tokens=True)

    # Очистка памяти
    del outputs
    del inputs
    gc.collect()
    if device == "cuda":
        torch.cuda.empty_cache()

    return response


def optimize_model_for_requests(device="auto"):
    try:
        # Загружаем модель один раз при старте
        model, tokenizer, device = load_model(device)
    except Exception as e:
        print(f"Error loading model: {e}")
        raise e

    def generate_with_cleanup(prompt, device, max_length, temperature, top_p):
        return generate_text(prompt, model, tokenizer, device, max_length, temperature, top_p)

    return generate_with_cleanup


# Создаем оптимизированную функцию
generate = optimize_model_for_requests()

# Загружаем промпт из JSON файла
def load_prompt():
    try:
        with open(Config.PROMPT_PATH, 'r', encoding='utf-8') as f:
            data = json.load(f)
            return data['prompt'].strip()
    except Exception as e:
        raise Exception(f"Failed to load prompt from {Config.PROMPT_PATH}: {e}")

# Загружаем промпт
TRAINING_PROMPT = load_prompt()

@app.post("/generate")
async def generate_api(req: PromptRequest):
    prompt = f"<s> [INST] ### Инструкция:\n{TRAINING_PROMPT}\n\n### Ввод:\n{req.prompt.strip()} [/INST] </s>"
    print("--------------------------------")
    print("prompt")
    print(prompt)
    print("--------------------------------")
    return generate(prompt, req.device, req.max_new_tokens, req.temperature, req.top_p)

@app.on_event("shutdown")
def shutdown_event():
    print("Shutdown: выгружаю модель и очищаю память...", file=sys.stderr)
    model = model_ref.get("model")
    tokenizer = model_ref.get("tokenizer")
    device = model_ref.get("device")
    try:
        if model is not None:
            del model
        if tokenizer is not None:
            del tokenizer
        gc.collect()
        if device == "cuda" and torch.cuda.is_available():
            torch.cuda.empty_cache()
            torch.cuda.ipc_collect()
        print("Модель и ресурсы успешно выгружены.", file=sys.stderr)
    except Exception as e:
        print(f"Ошибка при выгрузке модели: {e}", file=sys.stderr)

if __name__ == "__main__":
    uvicorn.run("inference:app", host="0.0.0.0", port=6012)
