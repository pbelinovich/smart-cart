import os
import torch
from datasets import load_dataset, concatenate_datasets
from peft import LoraConfig, get_peft_model, prepare_model_for_kbit_training
from transformers import AutoTokenizer, AutoModelForCausalLM, TrainingArguments, Trainer, \
    DataCollatorForLanguageModeling
from tqdm import tqdm
import psutil
import GPUtil
from torch.cuda.amp import autocast, GradScaler
from pathlib import Path
import json
import logging
from datetime import datetime

# Настройка логирования
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(levelname)s - %(message)s',
    handlers=[
        logging.FileHandler(f'training_{datetime.now().strftime("%Y%m%d_%H%M%S")}.log'),
        logging.StreamHandler()
    ]
)

# Параметры
MODEL_NAME = "mistralai/Mistral-7B-v0.1"
DATASET_PATH = "./data/converted"
OUTPUT_DIR = "./output"
PROMPT_PATH = "../../backend/src/shared/parse-products.json"
BATCH_SIZE = 8  # Увеличен размер батча для RTX 4090
GRADIENT_ACCUMULATION_STEPS = 8  # Увеличена градиентная аккумуляция
EPOCHS = 3
LEARNING_RATE = 2e-5
MAX_LENGTH = 512
WARMUP_STEPS = 100
WEIGHT_DECAY = 0.01
SAVE_STEPS = 100  # Сохраняем чекпоинты чаще
LOGGING_STEPS = 10

# Загружаем промпт из JSON файла
def load_prompt():
    try:
        with open(PROMPT_PATH, 'r', encoding='utf-8') as f:
            data = json.load(f)
            return data['prompt']
    except Exception as e:
        raise Exception(f"Failed to load prompt from {PROMPT_PATH}: {e}")

# Загружаем промпт
TRAINING_PROMPT = load_prompt()

# Загружаем все JSONL файлы из директории
def load_all_jsonl_files(directory):
    datasets = []
    for filename in os.listdir(directory):
        if filename.endswith('.jsonl'):
            file_path = os.path.join(directory, filename)
            dataset = load_dataset('json', data_files=file_path)
            datasets.append(dataset['train'])
    return concatenate_datasets(datasets)

# Функция для токенизации данных
def tokenize_function(examples):
    # Форматируем входные данные
    inputs = [TRAINING_PROMPT.replace('${input}', input_text) for input_text in examples['input']]
    
    # Форматируем выходные данные как JSON
    outputs = [json.dumps(output, ensure_ascii=False) for output in examples['output']]
    
    # Объединяем вход и выход
    combined_texts = [f"{input_text}{output_text}" for input_text, output_text in zip(inputs, outputs)]
    
    # Токенизируем
    return tokenizer(
        combined_texts,
        padding="max_length",
        truncation=True,
        max_length=512,
        return_tensors="pt"
    )

# Проверка CUDA и оптимизация
device = "cuda" if torch.cuda.is_available() else "cpu"
if device == "cuda":
    torch.backends.cuda.matmul.allow_tf32 = True
    torch.backends.cudnn.benchmark = True
    torch.backends.cudnn.allow_tf32 = True
    # Оптимизация памяти
    torch.cuda.empty_cache()
    torch.cuda.set_per_process_memory_fraction(0.9)  # Оставляем 10% памяти для системы

# Загрузка токенизатора и модели
tokenizer = AutoTokenizer.from_pretrained(MODEL_NAME, trust_remote_code=True)
model = AutoModelForCausalLM.from_pretrained(
    MODEL_NAME,
    torch_dtype=torch.float16,
    device_map="auto",
    use_cache=False,
    low_cpu_mem_usage=True
)

# Настройка LoRA
lora_config = LoraConfig(
    r=16,
    lora_alpha=32,
    target_modules=["q_proj", "k_proj", "v_proj", "o_proj"],
    lora_dropout=0.05,
    bias="none",
    task_type="CAUSAL_LM"
)

# Подготовка модели
model = prepare_model_for_kbit_training(model)
model = get_peft_model(model, lora_config)

# Загрузка и подготовка данных
print("Loading datasets...")
dataset = load_all_jsonl_files(DATASET_PATH)
print(f"Total examples: {len(dataset)}")

# Токенизация данных
print("Tokenizing data...")
tokenized_dataset = dataset.map(
    tokenize_function,
    batched=True,
    remove_columns=dataset.column_names
)

# Оптимизированные аргументы обучения
training_args = TrainingArguments(
    output_dir=OUTPUT_DIR,
    per_device_train_batch_size=BATCH_SIZE,
    gradient_accumulation_steps=GRADIENT_ACCUMULATION_STEPS,
    num_train_epochs=EPOCHS,
    learning_rate=LEARNING_RATE,
    warmup_steps=WARMUP_STEPS,
    weight_decay=WEIGHT_DECAY,
    logging_dir=f"{OUTPUT_DIR}/logs",
    logging_steps=LOGGING_STEPS,
    save_steps=SAVE_STEPS,
    save_total_limit=3,  # Храним 3 последних чекпоинта
    fp16=True,
    report_to="tensorboard",
    optim="adamw_torch_fused",
    lr_scheduler_type="cosine",
    dataloader_num_workers=4,
    dataloader_pin_memory=True,
    gradient_checkpointing=True,
    remove_unused_columns=True,
    group_by_length=True,  # Группировка по длине для эффективности
    ddp_find_unused_parameters=False,
    torch_compile=True,  # Включаем torch.compile для оптимизации
)

# Data collator
data_collator = DataCollatorForLanguageModeling(
    tokenizer=tokenizer,
    mlm=False
)

class OptimizedTrainer(Trainer):
    def __init__(self, *args, **kwargs):
        super().__init__(*args, **kwargs)
        self.scaler = GradScaler()
        self.start_time = datetime.now()
        
    def training_step(self, model, inputs):
        self._current_step += 1
        with autocast():
            loss = super().training_step(model, inputs)
        return loss

    def train(self, *args, **kwargs):
        self._current_step = 0
        total_steps = int(
            len(self.train_dataset) / 
            (training_args.per_device_train_batch_size * training_args.gradient_accumulation_steps)
        ) * training_args.num_train_epochs
        
        logging.info(f"Starting training with {total_steps} total steps")
        logging.info(f"Batch size: {training_args.per_device_train_batch_size}")
        logging.info(f"Gradient accumulation steps: {training_args.gradient_accumulation_steps}")
        logging.info(f"Effective batch size: {training_args.per_device_train_batch_size * training_args.gradient_accumulation_steps}")
        
        with tqdm(total=total_steps, desc="Training Progress") as pbar:
            self.add_callback(
                lambda _: pbar.update(1)
            )
            return super().train(*args, **kwargs)

    def log_metrics(self, split, metrics, epoch=None):
        super().log_metrics(split, metrics, epoch)
        if split == "train":
            # Логируем использование ресурсов
            gpu = GPUtil.getGPUs()[0]
            metrics["gpu_memory_used"] = gpu.memoryUsed
            metrics["gpu_utilization"] = gpu.load * 100
            metrics["cpu_percent"] = psutil.cpu_percent()
            metrics["ram_percent"] = psutil.virtual_memory().percent
            
            # Логируем время обучения
            elapsed_time = datetime.now() - self.start_time
            metrics["elapsed_time"] = str(elapsed_time)
            
            # Логируем в файл
            logging.info(f"Step {self._current_step}: Loss={metrics.get('loss', 'N/A'):.4f}, "
                        f"GPU Memory={metrics['gpu_memory_used']}MB, "
                        f"GPU Util={metrics['gpu_utilization']:.1f}%, "
                        f"RAM={metrics['ram_percent']}%")

# Запуск обучения
trainer = OptimizedTrainer(
    model=model,
    args=training_args,
    train_dataset=tokenized_dataset,
    tokenizer=tokenizer,
    data_collator=data_collator
)

trainer.train()

# Сохранение модели
print("Saving model...")
trainer.save_model()
tokenizer.save_pretrained(OUTPUT_DIR)
