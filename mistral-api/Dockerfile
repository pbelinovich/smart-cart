FROM --platform=linux/arm64 python:3.10-slim

# Системные пакеты
RUN apt-get update && apt-get install -y \
    build-essential \
    git \
    curl \
    && rm -rf /var/lib/apt/lists/*

# Poetry
ENV POETRY_VERSION=1.8.2
RUN curl -sSL https://install.python-poetry.org | python3 -
ENV PATH="/root/.local/bin:$PATH"
ENV POETRY_VIRTUALENVS_CREATE=false

# Кэш HuggingFace моделей в известную папку
ENV TRANSFORMERS_CACHE=/app/model

# Рабочая директория
WORKDIR /app

# Копируем зависимости
COPY pyproject.toml poetry.lock ./
RUN poetry install --no-root --only main

# Копируем проект
COPY . .

# Копируем твою дообученную модель внутрь контейнера
#COPY ./model /app/.hf_cache/mistral-lora

# Удалим мусор после установки (по желанию)
RUN rm -rf /root/.cache /tmp/* ~/.cache ~/.npm /var/lib/apt/lists/*

# Открываем порт
EXPOSE 6012

# Запускаем API
CMD ["poetry", "run", "uvicorn", "inference:app", "--host", "0.0.0.0", "--port", "6012"]