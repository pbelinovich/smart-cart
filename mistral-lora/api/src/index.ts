import express from 'express';
import cors from 'cors';
import { PythonShell } from 'python-shell';
import dotenv from 'dotenv';
import winston from 'winston';

dotenv.config();

const app = express();
const port = process.env.PORT || 3000;

// Настройка логгера
const logger = winston.createLogger({
  level: 'info',
  format: winston.format.json(),
  transports: [
    new winston.transports.File({ filename: 'error.log', level: 'error' }),
    new winston.transports.File({ filename: 'combined.log' }),
  ],
});

if (process.env.NODE_ENV !== 'production') {
  logger.add(
    new winston.transports.Console({
      format: winston.format.simple(),
    })
  );
}

app.use(cors());
app.use(express.json());

// Функция для запуска Python-скрипта с моделью
async function runModelInference(prompt: string): Promise<string> {
  return new Promise((resolve, reject) => {
    const options = {
      mode: 'text',
      pythonPath: process.env.PYTHON_PATH || 'python3',
      pythonOptions: ['-u'],
      scriptPath: '../mistral_lora',
      args: [prompt],
    };

    PythonShell.run('inference.py', options)
      .then((results) => {
        resolve(results[0]);
      })
      .catch((err) => {
        logger.error('Error running model inference:', err);
        reject(err);
      });
  });
}

// Эндпоинт для генерации текста
app.post('/generate', async (req, res) => {
  try {
    const { prompt } = req.body;

    if (!prompt) {
      return res.status(400).json({ error: 'Prompt is required' });
    }

    logger.info('Received generation request:', { prompt });

    const response = await runModelInference(prompt);

    logger.info('Generation completed successfully');

    res.json({ response });
  } catch (error) {
    logger.error('Error in /generate endpoint:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Эндпоинт для проверки здоровья сервиса
app.get('/health', (req, res) => {
  res.json({ status: 'ok' });
});

app.listen(port, () => {
  logger.info(`Server is running on port ${port}`);
});
