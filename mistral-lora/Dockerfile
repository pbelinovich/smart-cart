FROM nvidia/cuda:12.8.0-cudnn-devel-ubuntu22.04

RUN apt-get update && apt-get install -y --no-install-recommends \
    python3 python3-venv python3-pip python3-dev git curl build-essential \
    ca-certificates openssl libssl-dev libffi-dev python3-setuptools \
    libjpeg-dev libpng-dev \
    && apt-get clean \
    && rm -rf /var/lib/apt/lists/* /tmp/* /var/tmp/*

RUN curl -sSL https://install.python-poetry.org | python3 - \
    && ln -s /root/.local/bin/poetry /usr/local/bin/poetry

ENV PATH="/root/.local/bin:$PATH" \
    PYTHONUNBUFFERED=1 \
    PYTHONDONTWRITEBYTECODE=1 \
    CUDA_HOME=/usr/local/cuda \
    TORCH_CUDA_ARCH_LIST="8.9" \
    PYTORCH_CUDA_ALLOC_CONF="max_split_size_mb:512" \
    PYTORCH_NO_CUDA_MEMORY_CACHING=1 \
    TRANSFORMERS_CACHE="/tmp/transformers_cache"

WORKDIR /app
COPY . /app

# Создаем и активируем виртуальное окружение
RUN python3 -m venv /app/venv
ENV PATH="/app/venv/bin:$PATH"

# Устанавливаем зависимости
RUN . /app/venv/bin/activate \
    && pip install --no-cache-dir torch torchvision torchaudio --index-url https://download.pytorch.org/whl/cu121 \
    && poetry config virtualenvs.create false \
    && poetry install --no-interaction --no-ansi --no-cache \
    && python3 -c "import torch; print(f'PyTorch version: {torch.__version__}, CUDA available: {torch.cuda.is_available()}, CUDA version: {torch.version.cuda if torch.cuda.is_available() else \"N/A\"}')" \
    && rm -rf /root/.cache/pip /root/.cache/poetry /tmp/* /var/tmp/*

# Создаем тестовый скрипт
RUN echo '#!/bin/bash\n\
    source /app/venv/bin/activate\n\
    echo "=== Environment Test ==="\n\
    echo "Python version:"\n\
    python3 --version\n\
    echo "\nPyTorch version:"\n\
    python3 -c "import torch; print(torch.__version__)"\n\
    echo "\nCUDA status:"\n\
    python3 -c "import torch; print(f\"CUDA available: {torch.cuda.is_available()}\")"\n\
    echo "\nInstalled packages:"\n\
    poetry show\n\
    echo "\nMemory usage:"\n\
    free -h\n\
    echo "\n=== Test Complete ==="\n\
    exec bash' > /app/test_env.sh && chmod +x /app/test_env.sh

# Запускаем тестовый скрипт при старте
CMD ["/app/test_env.sh"]