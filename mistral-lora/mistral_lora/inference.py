import sys
import torch
from transformers import AutoTokenizer, AutoModelForCausalLM
import gc


def load_model(model_path="./exported_model", device="auto"):
    print("Loading model and tokenizer...")

    # Определяем устройство
    if device == "auto":
        if torch.cuda.is_available():
            gpu_memory = torch.cuda.get_device_properties(0).total_memory
            print(f"Available GPU memory: {gpu_memory / 1024 ** 3:.2f} GB")
            if gpu_memory < 16 * 1024 ** 3:
                device = "cpu"
                print("Using CPU for inference due to limited GPU memory")
            else:
                device = "cuda"
        else:
            device = "cpu"
            print("Using CPU for inference (no GPU available)")

    # Загрузка токенизатора и модели
    tokenizer = AutoTokenizer.from_pretrained(model_path)
    model = AutoModelForCausalLM.from_pretrained(
        model_path,
        torch_dtype=torch.float16 if device == "cuda" else torch.float32,
        device_map="auto" if device == "cuda" else None,
        low_cpu_mem_usage=True
    )

    # Перевод модели в режим eval
    model.eval()
    if device == "cuda":
        model = model.cuda()

    return model, tokenizer, device


def generate_text(prompt, model, tokenizer, device, max_length=256):
    inputs = tokenizer(prompt, return_tensors="pt", truncation=True, max_length=max_length)
    if device == "cuda":
        inputs = {k: v.cuda() for k, v in inputs.items()}

    with torch.no_grad():
        with torch.cuda.amp.autocast(enabled=(device == "cuda")):
            outputs = model.generate(
                **inputs,
                max_length=max_length,
                num_return_sequences=1,
                temperature=0.7,
                top_p=0.9,
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


def optimize_model_for_requests(model_path="./exported_model", device="auto"):
    # Загружаем модель один раз при старте
    model, tokenizer, device = load_model(model_path, device)

    def generate_with_cleanup(prompt):
        return generate_text(prompt, model, tokenizer, device)

    return generate_with_cleanup


# Создаем оптимизированную функцию
generate = optimize_model_for_requests()

if __name__ == "__main__":
    if len(sys.argv) < 2:
        print("Please provide a prompt as an argument")
        sys.exit(1)

    prompt = sys.argv[1]
    response = generate(prompt)
    print(response)
