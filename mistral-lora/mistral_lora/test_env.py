import torch
import logging
from pathlib import Path
import psutil
import GPUtil
from transformers import AutoTokenizer, AutoModelForCausalLM
from transformers.modeling_utils import PreTrainedModel
from transformers.tokenization_utils import PreTrainedTokenizer
from transformers.utils.quantization_config import BitsAndBytesConfig
from peft import LoraConfig, get_peft_model, prepare_model_for_kbit_training, PeftModel, PeftMixedModel
import bitsandbytes as bnb
from typing import Union

# Настройка логирования
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

def test_environment():
    logger.info("Starting environment test...")
    
    # Проверка Python и PyTorch
    logger.info(f"Python version: {torch.__version__}")
    logger.info(f"PyTorch version: {torch.__version__}")
    logger.info(f"BitsAndBytes version: {bnb.__version__}")
    
    # Проверка CUDA
    logger.info(f"CUDA available: {torch.cuda.is_available()}")
    if torch.cuda.is_available():
        logger.info(f"CUDA version: {torch.cuda.get_device_capability(0)}")
        logger.info(f"GPU device: {torch.cuda.get_device_name(0)}")
    
    # Проверка памяти
    memory = psutil.virtual_memory()
    logger.info(f"Total RAM: {memory.total / (1024**3):.2f} GB")
    logger.info(f"Available RAM: {memory.available / (1024**3):.2f} GB")
    
    try:
        # Проверка загрузки модели
        logger.info("Testing model loading...")
        model_name = "mistralai/Mistral-7B-v0.1"
        
        # Загрузка токенизатора
        logger.info("Loading tokenizer...")
        tokenizer: PreTrainedTokenizer = AutoTokenizer.from_pretrained(
            model_name,
            trust_remote_code=True,
            padding_side="right"
        )
        tokenizer.pad_token = tokenizer.eos_token
        
        # Загрузка модели в режиме 8-bit с использованием bitsandbytes
        logger.info("Loading model in 8-bit mode...")
        quantization_config = BitsAndBytesConfig(
            load_in_8bit=True,
            llm_int8_threshold=6.0,
            llm_int8_has_fp16_weight=False,
            bnb_4bit_compute_dtype=torch.float16,
            bnb_4bit_use_double_quant=True,
            bnb_4bit_quant_type="nf4"
        )
        
        base_model: PreTrainedModel = AutoModelForCausalLM.from_pretrained(
            model_name,
            quantization_config=quantization_config,
            device_map="auto",
            torch_dtype=torch.float16,
            trust_remote_code=True
        )
        
        # Настройка LoRA
        logger.info("Configuring LoRA...")
        lora_config = LoraConfig(
            r=16,
            lora_alpha=32,
            target_modules=["q_proj", "k_proj", "v_proj", "o_proj"],
            lora_dropout=0.05,
            bias="none",
            task_type="CAUSAL_LM"
        )
        
        # Подготовка модели
        logger.info("Preparing model for training...")
        prepared_model = prepare_model_for_kbit_training(base_model)
        model: Union[PeftModel, PeftMixedModel] = get_peft_model(prepared_model, lora_config)
        
        logger.info("Environment test completed successfully!")
        
    except Exception as e:
        logger.error(f"Error during testing: {str(e)}")
        raise

if __name__ == "__main__":
    test_environment()
    