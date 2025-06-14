import os
import torch
from datasets import load_dataset, concatenate_datasets
from peft import LoraConfig, get_peft_model, prepare_model_for_kbit_training
from transformers import AutoTokenizer, AutoModelForCausalLM
from transformers.utils.quantization_config import BitsAndBytesConfig
from transformers.training_args import TrainingArguments
from transformers.trainer import Trainer
from transformers.data.data_collator import DataCollatorForLanguageModeling
from tqdm import tqdm
import psutil
import GPUtil
from torch.cuda.amp import autocast
from pathlib import Path
import json
import logging
from datetime import datetime, timedelta
from typing import Sized
import time
import shutil
import glob

# Конфигурация через переменные окружения
class Config:
    # Пути
    MODEL_NAME = os.getenv('MODEL_NAME', "mistralai/Mistral-7B-Instruct-v0.3")
    # MODEL_NAME = os.getenv('MODEL_NAME', os.path.join(os.path.dirname(os.path.dirname(__file__)), "exported_model/model"))
    DATASET_PATH = os.getenv('DATASET_PATH', os.path.join(os.path.dirname(os.path.dirname(__file__)), "data/converted"))
    OUTPUT_DIR = os.getenv('OUTPUT_DIR', os.path.join(os.path.dirname(os.path.dirname(__file__)), "output_new"))
    PROMPT_PATH = os.getenv('PROMPT_PATH', os.path.join(os.path.dirname(os.path.dirname(os.path.dirname(__file__))), "backend/src/shared/parse-products.json"))
    TRANSFORMERS_CACHE = os.getenv('TRANSFORMERS_CACHE', "/tmp/transformers_cache")
    
    # Параметры обучения
    BATCH_SIZE = int(os.getenv('BATCH_SIZE', "4"))
    GRADIENT_ACCUMULATION_STEPS = int(os.getenv('GRADIENT_ACCUMULATION_STEPS', "16"))
    EPOCHS = int(os.getenv('EPOCHS', "2"))
    LEARNING_RATE = float(os.getenv('LEARNING_RATE', "1e-5"))
    MAX_LENGTH = int(os.getenv('MAX_LENGTH', "2048"))
    WARMUP_STEPS = int(os.getenv('WARMUP_STEPS', "50"))
    WEIGHT_DECAY = float(os.getenv('WEIGHT_DECAY', "0.01"))
    SAVE_STEPS = int(os.getenv('SAVE_STEPS', "100"))
    LOGGING_STEPS = int(os.getenv('LOGGING_STEPS', "10"))
    MAX_GRAD_NORM = float(os.getenv('MAX_GRAD_NORM', "2.0"))
    
    # LoRA параметры
    LORA_R = int(os.getenv('LORA_R', "16"))
    LORA_ALPHA = int(os.getenv('LORA_ALPHA', "8"))
    LORA_DROPOUT = float(os.getenv('LORA_DROPOUT', "0.05"))
    
    # Параметры кэша
    CACHE_CLEAN_INTERVAL = int(os.getenv('CACHE_CLEAN_INTERVAL', "3600"))  # 1 час
    MAX_CACHE_SIZE_GB = int(os.getenv('MAX_CACHE_SIZE_GB', "10"))
    
    # Параметры мониторинга
    MONITOR_DISK_INTERVAL = int(os.getenv('MONITOR_DISK_INTERVAL', "60"))  # 1 минута
    LOG_RETENTION_DAYS = int(os.getenv('LOG_RETENTION_DAYS', "7"))
    
    # Параметры GPU
    TORCH_CUDA_ARCH_LIST = os.getenv('TORCH_CUDA_ARCH_LIST', "8.9")
    PYTORCH_CUDA_ALLOC_CONF = os.getenv('PYTORCH_CUDA_ALLOC_CONF', "max_split_size_mb:1024")
    PYTORCH_NO_CUDA_MEMORY_CACHING = int(os.getenv('PYTORCH_NO_CUDA_MEMORY_CACHING', "1"))

print("Config:")
print(Config.__dict__)

# Настройка логирования
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(levelname)s - %(message)s',
    handlers=[
        logging.FileHandler(f'training_{datetime.now().strftime("%Y%m%d_%H%M%S")}.log'),
        logging.StreamHandler()
    ]
)

def get_disk_usage(path):
    """Получение информации об использовании диска"""
    usage = psutil.disk_usage(path)
    return {
        'total': usage.total / (1024**3),  # GB
        'used': usage.used / (1024**3),    # GB
        'free': usage.free / (1024**3),    # GB
        'percent': usage.percent
    }

def get_disk_io():
    """Получение статистики ввода/вывода диска"""
    try:
        io = psutil.disk_io_counters()
        if io is None:
            return {
                'read_bytes': 0,
                'write_bytes': 0,
                'read_count': 0,
                'write_count': 0
            }
        return {
            'read_bytes': io.read_bytes / (1024**2),  # MB
            'write_bytes': io.write_bytes / (1024**2),  # MB
            'read_count': io.read_count,
            'write_count': io.write_count
        }
    except Exception as e:
        logging.error(f"Error getting disk IO stats: {e}")
        return {
            'read_bytes': 0,
            'write_bytes': 0,
            'read_count': 0,
            'write_count': 0
        }

def clean_transformers_cache(cache_dir, max_size_gb=Config.MAX_CACHE_SIZE_GB):
    """Очистка кэша transformers при превышении размера"""
    try:
        current_size = sum(os.path.getsize(f) for f in glob.glob(os.path.join(cache_dir, '**'), recursive=True)) / (1024**3)
        if current_size > max_size_gb:
            logging.info(f"Cleaning transformers cache. Current size: {current_size:.2f}GB")
            shutil.rmtree(cache_dir)
            os.makedirs(cache_dir, exist_ok=True)
            logging.info("Transformers cache cleaned successfully")
    except Exception as e:
        logging.error(f"Error cleaning transformers cache: {e}")

def clean_old_logs(log_dir, retention_days=Config.LOG_RETENTION_DAYS):
    """Очистка старых логов"""
    try:
        current_time = time.time()
        for log_file in glob.glob(os.path.join(log_dir, 'training_*.log')):
            file_time = os.path.getmtime(log_file)
            if (current_time - file_time) > (retention_days * 86400):
                os.remove(log_file)
                logging.info(f"Removed old log file: {log_file}")
    except Exception as e:
        logging.error(f"Error cleaning old logs: {e}")

class OptimizedTrainer(Trainer):
    def __init__(self, *args, **kwargs):
        super().__init__(*args, **kwargs)
        self.scaler = torch.cuda.amp.GradScaler()
        self.start_time = datetime.now()
        self.last_log_time = time.time()
        self.steps_since_last_log = 0
        self.total_tokens_processed = 0
        self.last_cache_clean_time = time.time()
        self.last_disk_io = get_disk_io()
        self._current_step = 0  # Initialize the step counter
        
    def training_step(self, model, inputs, num_items_in_batch=None):
        self._current_step += 1
        self.steps_since_last_log += 1
        
        # Проверка и очистка кэша
        current_time = time.time()
        if current_time - self.last_cache_clean_time > Config.CACHE_CLEAN_INTERVAL:
            clean_transformers_cache(Config.TRANSFORMERS_CACHE)
            self.last_cache_clean_time = current_time
        
        # Подсчет токенов в текущем батче
        if 'input_ids' in inputs:
            self.total_tokens_processed += inputs['input_ids'].numel()
        
        with autocast():
            loss = super().training_step(model, inputs)
        return loss

    def log_metrics(self, split, metrics, epoch=None):
        super().log_metrics(split, metrics)
        if split == "train":
            current_time = time.time()
            time_since_last_log = current_time - self.last_log_time
            
            # Получаем метрики GPU
            gpus = GPUtil.getGPUs()
            gpu_metrics = {}
            for i, gpu in enumerate(gpus):
                gpu_metrics[f"gpu_{i}_memory_used"] = gpu.memoryUsed
                gpu_metrics[f"gpu_{i}_memory_total"] = gpu.memoryTotal
                gpu_metrics[f"gpu_{i}_utilization"] = gpu.load * 100
                gpu_metrics[f"gpu_{i}_temperature"] = gpu.temperature
                gpu_metrics[f"gpu_{i}_power_draw"] = gpu.powerDraw
            
            # Получаем метрики CPU и RAM
            cpu_percent = psutil.cpu_percent(interval=None)
            ram = psutil.virtual_memory()
            swap = psutil.swap_memory()
            
            # Получаем метрики диска
            disk_usage = get_disk_usage('/')
            current_disk_io = get_disk_io()
            disk_io_delta = {
                'read_mb': (current_disk_io['read_bytes'] - self.last_disk_io['read_bytes']) / time_since_last_log,
                'write_mb': (current_disk_io['write_bytes'] - self.last_disk_io['write_bytes']) / time_since_last_log,
                'read_ops': (current_disk_io['read_count'] - self.last_disk_io['read_count']) / time_since_last_log,
                'write_ops': (current_disk_io['write_count'] - self.last_disk_io['write_count']) / time_since_last_log
            }
            self.last_disk_io = current_disk_io
            
            # Вычисляем скорость обучения
            steps_per_second = self.steps_since_last_log / time_since_last_log if time_since_last_log > 0 else 0
            tokens_per_second = self.total_tokens_processed / time_since_last_log if time_since_last_log > 0 else 0
            
            # Вычисляем оставшееся время
            elapsed_time = datetime.now() - self.start_time
            if steps_per_second > 0:
                remaining_steps = self.state.max_steps - self._current_step
                estimated_time_remaining = timedelta(seconds=remaining_steps / steps_per_second)
            else:
                estimated_time_remaining = timedelta(seconds=0)
            
            # Формируем расширенный лог
            log_message = (
                f"Step {self._current_step}:\n"
                f"Loss: {metrics.get('loss', 'N/A'):.4f}\n"
                f"Learning Rate: {metrics.get('learning_rate', 'N/A'):.2e}\n"
                f"Speed: {steps_per_second:.2f} steps/s, {tokens_per_second:.2f} tokens/s\n"
                f"Time: Elapsed={str(elapsed_time)}, Remaining={str(estimated_time_remaining)}\n"
                f"GPU Metrics:\n"
            )
            
            for i, gpu in enumerate(gpus):
                log_message += (
                    f"  GPU {i}:\n"
                    f"    Memory: {gpu.memoryUsed}MB/{gpu.memoryTotal}MB ({gpu.memoryUsed/gpu.memoryTotal*100:.1f}%)\n"
                    f"    Utilization: {gpu.load*100:.1f}%\n"
                    f"    Temperature: {gpu.temperature}°C\n"
                    f"    Power: {gpu.powerDraw}W\n"
                )
            
            log_message += (
                f"System Metrics:\n"
                f"  CPU Usage: {cpu_percent}%\n"
                f"  RAM: {ram.percent}% used ({ram.used/1024/1024/1024:.1f}GB/{ram.total/1024/1024/1024:.1f}GB)\n"
                f"  Swap: {swap.percent}% used ({swap.used/1024/1024/1024:.1f}GB/{swap.total/1024/1024/1024:.1f}GB)\n"
                f"Disk Metrics:\n"
                f"  Usage: {disk_usage['percent']}% used ({disk_usage['used']:.1f}GB/{disk_usage['total']:.1f}GB)\n"
                f"  IO Speed: {disk_io_delta['read_mb']:.1f}MB/s read, {disk_io_delta['write_mb']:.1f}MB/s write\n"
                f"  IO Operations: {disk_io_delta['read_ops']:.1f} ops/s read, {disk_io_delta['write_ops']:.1f} ops/s write\n"
            )
            
            # Логируем в файл
            logging.info(log_message)
            
            # Сбрасываем счетчики
            self.last_log_time = current_time
            self.steps_since_last_log = 0
            self.total_tokens_processed = 0

# Загружаем промпт из JSON файла
def load_prompt():
    try:
        with open(Config.PROMPT_PATH, 'r', encoding='utf-8') as f:
            data = json.load(f)
            return data['prompt']
    except Exception as e:
        raise Exception(f"Failed to load prompt from {Config.PROMPT_PATH}: {e}")

# Загружаем промпт
TRAINING_PROMPT = load_prompt()

# Загружаем все JSONL файлы из директории
def load_all_jsonl_files(directory):
    # Create directory if it doesn't exist
    os.makedirs(directory, exist_ok=True)
    
    # Check if directory is empty
    if not os.listdir(directory):
        raise Exception(f"No JSONL files found in {directory}. Please add your training data files to this directory.")
    
    datasets = []
    for filename in os.listdir(directory):
        if filename.endswith('.jsonl'):
            file_path = os.path.join(directory, filename)
            dataset = load_dataset('json', data_files=file_path)
            train_dataset = dataset['train']  # type: ignore
            datasets.append(train_dataset)
    return concatenate_datasets(datasets)

def tokenize_function(batch):
    results = {
        "input_ids": [],
        "attention_mask": [],
        "labels": []
    }

    for idx, (input_text, output_obj) in enumerate(zip(batch["input"], batch["output"])):
        print(f"\n=== Пример {idx+1} ===")
        output_text = json.dumps(output_obj, ensure_ascii=False)
        full_text = (
            f"[INST] ### Инструкция:\n{TRAINING_PROMPT}\n\n### Ввод:\n{input_text} [/INST]{output_text}"
        )
        print(f"full_text (символов): {len(full_text)}")
        print(f"full_text: {full_text}")
        tokenized = tokenizer(
            full_text,
            max_length=Config.MAX_LENGTH,
            truncation=True,
            add_special_tokens=True
        )
        print(f"tokenized input_ids (длина): {len(tokenized['input_ids'])}")
        print(f"tokenized input_ids (первые 30): {tokenized['input_ids'][:30]}")
        # Определяем длину токенизированной части до и включая [/INST]
        full_text_raw = (
            f"[INST] ### Инструкция:\n{TRAINING_PROMPT}\n\n### Ввод:\n{input_text} [/INST]"
        )
        print(f"full_text_raw (символов): {len(full_text_raw)}")
        print(f"full_text_raw: {full_text_raw}")
        inst_close_tokenized = tokenizer(
            full_text_raw,
            max_length=Config.MAX_LENGTH,
            truncation=True,
            add_special_tokens=False
        )
        print(f"inst_close_tokenized input_ids (длина): {len(inst_close_tokenized['input_ids'])}")
        print(f"inst_close_tokenized input_ids (последние 10): {inst_close_tokenized['input_ids'][-10:]}")
        inst_close_len = len(inst_close_tokenized["input_ids"])
        print(f"inst_close_len: {inst_close_len}")
        if inst_close_len >= Config.MAX_LENGTH - 10:
            print("Пропущен слишком длинный пример!")
            continue
        # Маскируем всё до и включая [/INST] как -100, остальное — реальные id
        labels = [-100] * inst_close_len + [
            tid if tid != tokenizer.pad_token_id else -100
            for tid in tokenized["input_ids"][inst_close_len:]
        ]
        labels = labels[:Config.MAX_LENGTH]
        if len(labels) < Config.MAX_LENGTH:
            labels += [-100] * (Config.MAX_LENGTH - len(labels))
        print(f"labels (длина): {len(labels)}")
        print(f"labels (первые 30): {labels[:30]}")
        print(f"labels (последние 30): {labels[-30:]}")
        print("labels (ответ):", labels[inst_close_len:inst_close_len+10])
        print("tokenized (ответ):", tokenized["input_ids"][inst_close_len:inst_close_len+10])
        results["input_ids"].append(tokenized["input_ids"])
        results["attention_mask"].append(tokenized["attention_mask"])
        results["labels"].append(labels)

    print("max label:", max([l for batch in results['labels'] for l in batch if l != -100]))
    print("vocab_size:", tokenizer.vocab_size)
    print("pad_token_id:", tokenizer.pad_token_id)

    for batch in results['labels']:
        for l in batch:
            if l != -100 and (l < 0 or l >= tokenizer.vocab_size):
                print("BAD LABEL:", l)

    return results

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
tokenizer = AutoTokenizer.from_pretrained(Config.MODEL_NAME, trust_remote_code=True)

# Configure tokenizer
# if tokenizer.pad_token is None or tokenizer.pad_token == tokenizer.eos_token or tokenizer.pad_token == tokenizer.bos_token:
    # tokenizer.add_special_tokens({'pad_token': '<pad>'})
    # tokenizer.pad_token = '<pad>'
    # tokenizer.pad_token_id = tokenizer.convert_tokens_to_ids('<pad>')

print("bos_token_id", tokenizer.bos_token_id)
print("eos_token_id", tokenizer.eos_token_id)
print("pad_token_id", tokenizer.pad_token_id)
print("pad_token", tokenizer.pad_token)

print("--------------------------------")
print("молоко, хлеб, сыр")
print(tokenizer("молоко, хлеб, сыр"))
print("--------------------------------")

# Configure 8-bit quantization
quantization_config = BitsAndBytesConfig(
    load_in_8bit=True,
    llm_int8_threshold=6.0,
    llm_int8_has_fp16_weight=False,
)

model = AutoModelForCausalLM.from_pretrained(
    Config.MODEL_NAME,
    quantization_config=quantization_config,
    device_map="auto",
    use_cache=False,
    low_cpu_mem_usage=True
)

# Настройка LoRA
lora_config = LoraConfig(
    r=Config.LORA_R,
    lora_alpha=Config.LORA_ALPHA,
    target_modules=["q_proj", "k_proj", "v_proj", "o_proj"],
    lora_dropout=Config.LORA_DROPOUT,
    bias="none",
    task_type="CAUSAL_LM"
)

# Подготовка модели
model = prepare_model_for_kbit_training(model)
model = get_peft_model(model, lora_config)

# Загрузка и подготовка данных
print("Loading datasets...")
dataset = load_all_jsonl_files(Config.DATASET_PATH)
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
    output_dir=Config.OUTPUT_DIR,
    per_device_train_batch_size=Config.BATCH_SIZE,
    gradient_accumulation_steps=Config.GRADIENT_ACCUMULATION_STEPS,
    num_train_epochs=Config.EPOCHS,
    learning_rate=Config.LEARNING_RATE,
    warmup_steps=Config.WARMUP_STEPS,
    weight_decay=Config.WEIGHT_DECAY,
    logging_dir=f"{Config.OUTPUT_DIR}/logs",
    logging_steps=Config.LOGGING_STEPS,
    save_steps=Config.SAVE_STEPS,
    save_total_limit=3,
    fp16=True,
    report_to="tensorboard",
    optim="adamw_torch_fused",
    lr_scheduler_type="cosine",
    dataloader_num_workers=2,
    dataloader_pin_memory=True,
    gradient_checkpointing=True,
    remove_unused_columns=True,
    group_by_length=True,
    ddp_find_unused_parameters=False,
    torch_compile=True,
    max_grad_norm=Config.MAX_GRAD_NORM,
)

# Data collator
data_collator = DataCollatorForLanguageModeling(
    tokenizer=tokenizer,
    mlm=False,
    pad_to_multiple_of=8
)

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
tokenizer.save_pretrained(Config.OUTPUT_DIR)
