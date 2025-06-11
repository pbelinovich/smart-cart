#!/usr/bin/env python3

import subprocess
import sys
import platform
import torch
import logging

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

def run_command(command):
    try:
        result = subprocess.run(command, shell=True, check=True, capture_output=True, text=True)
        return result.stdout.strip()
    except subprocess.CalledProcessError as e:
        logger.error(f"Error running command '{command}': {e}")
        return None

def check_cuda():
    logger.info("=== CUDA Information ===")
    # Check nvidia-smi
    nvidia_smi = run_command("nvidia-smi")
    if nvidia_smi:
        logger.info("NVIDIA-SMI output:")
        logger.info(nvidia_smi)
    else:
        logger.info("NVIDIA-SMI not available")

    # Check CUDA version
    cuda_version = run_command("nvcc --version")
    if cuda_version:
        logger.info("CUDA Compiler version:")
        logger.info(cuda_version)
    else:
        logger.info("CUDA Compiler not available")

def check_python():
    logger.info("\n=== Python Information ===")
    logger.info(f"Python version: {platform.python_version()}")
    logger.info(f"Python executable: {sys.executable}")

def check_pytorch():
    logger.info("\n=== PyTorch Information ===")
    logger.info(f"PyTorch version: {torch.__version__}")
    logger.info(f"CUDA available: {torch.cuda.is_available()}")
    if torch.cuda.is_available():
        logger.info(f"CUDA version: {torch.cuda.get_device_capability(0)}")
        logger.info(f"GPU device: {torch.cuda.get_device_name(0)}")
        logger.info(f"GPU capability: {torch.cuda.get_device_capability(0)}")

def check_system():
    logger.info("\n=== System Information ===")
    logger.info(f"OS: {platform.system()} {platform.release()}")
    logger.info(f"Architecture: {platform.machine()}")
    
    # Check memory
    try:
        import psutil
        memory = psutil.virtual_memory()
        logger.info(f"Total RAM: {memory.total / (1024**3):.2f} GB")
        logger.info(f"Available RAM: {memory.available / (1024**3):.2f} GB")
    except ImportError:
        logger.info("psutil not installed")

def main():
    logger.info("Starting system version check...")
    check_system()
    check_python()
    check_pytorch()
    check_cuda()
    logger.info("\nCheck complete!")

if __name__ == "__main__":
    main() 