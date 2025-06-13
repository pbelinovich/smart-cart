import sys
import torch
from transformers import AutoTokenizer, AutoModelForCausalLM
import gc
import json
import os
from fastapi import FastAPI, Request
from pydantic import BaseModel
from typing import Optional
import uvicorn

app = FastAPI()
model_path = os.path.join(os.path.dirname(__file__), "pretrained/model")

class PromptRequest(BaseModel):
    prompt: str
    device: Optional[str] = "auto"
    max_new_tokens: Optional[int] = 200
    temperature: Optional[float] = 0.7
    top_p: Optional[float] = 0.95

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

    return model, tokenizer, device


def generate_text(prompt, model, tokenizer, device, max_length=300, temperature=0.7, top_p=0.9):
    inputs = tokenizer(prompt, return_tensors="pt", truncation=True, max_length=max_length)
    if device == "cuda":
        inputs = {k: v.cuda() for k, v in inputs.items()}

    with torch.no_grad():
        with torch.cuda.amp.autocast(enabled=(device == "cuda")):
            outputs = model.generate(
                **inputs,
                max_length=max_length,
                num_return_sequences=1,
                temperature=temperature,
                top_p=top_p,
                do_sample=True,
                pad_token_id=tokenizer.eos_token_id,
                use_cache=True
            )

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

@app.post("/generate")
async def generate_api(req: PromptRequest):
    return generate(req.prompt, req.device, req.max_new_tokens, req.temperature, req.top_p)

if __name__ == "__main__":
    uvicorn.run("inference:app", host="0.0.0.0", port=6012)
