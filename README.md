# Smart Cart Bot

An AI-powered Telegram bot for comparing grocery prices across multiple retailers. The only service capable of finding the cheapest or most popular products simply by user query, automatically comparing prices across various retailers and assembling optimal shopping carts.

## 🎯 Goal

Create a completely free service that helps users find the cheapest products and assemble optimal shopping carts without manually comparing prices across different stores.

## ✨ Features

- **AI Natural Language Parsing** - Transforms natural language queries into structured JSON data
- **Automatic Price Comparison** - Compares prices across multiple retailers (Pyaterochka, Magnit, Dixy, Crossroads)
- **Intelligent Cart Assembly** - Forms optimal carts with the best price selection
- **Easy Product Replacement** - Replace items in assembled carts effortlessly
- **Multi-City Support** - Supports multiple cities with automatic price updates
- **Impulse Purchase Prevention** - Focused interface to prevent impulsive purchases

## 🏗️ Architecture

### Microservices Architecture

The application is built using a microservices architecture with clear separation of data processing layers and user interaction.

#### Backend Service
Independent data processing service that can be connected to any platform (web, mobile, Telegram bot).

- AI model integration and inference
- Retailer API integration and data processing
- Price comparison algorithms
- Database management and caching
- REST API for external integrations

#### Telegram Bot Service
Lightweight service that acts as a bridge between users and the backend.

- Telegram Bot API integration
- User interaction management
- Message processing and validation
- Real-time status updates via Server-Sent Events (SSE)
- Error handling and user feedback

#### AI Services
- **Mistral API Service** - FastAPI-based service for running fine-tuned Mistral 7B model inference
- **Mistral LoRA Service** - Model fine-tuning service using LoRA (Low-Rank Adaptation) technique

### Inter-Service Communication

Communication between services via REST API and Server-Sent Events (SSE) for instant status updates.

- REST API for main operations
- SSE for tracking cart assembly status
- SSE for tracking city change status
- Error status broadcasting
- User progress tracking
- Seamless service coordination

## 🛠️ Technology Stack

- **Backend**: Node.js, TypeScript, Express, RavenDB, SSE
- **Bot**: Node.js, TypeScript, Telegraf, Express
- **AI Services**: Python, FastAPI, PyTorch, Transformers, PEFT, Accelerate
- **Database**: RavenDB (NoSQL document database)
- **Build Tools**: Webpack, Babel, TypeScript
- **Testing**: Jest
- **Code Quality**: ESLint, Prettier

## 🚀 Quick Start

### Prerequisites

- Node.js ^18.0.0
- Python ^3.10
- npm or yarn
- Git

### Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/your-username/smart-cart.git
   cd smart-cart
   ```

2. **Install backend dependencies**
   ```bash
   cd backend
   npm install
   ```

3. **Install bot dependencies**
   ```bash
   cd ../bot
   npm install
   ```

4. **Install AI service dependencies**
   ```bash
   cd ../mistral-api
   poetry install

   cd ../mistral-lora
   poetry install
   ```

### Configuration

Create environment files for each service:

**Backend (.env)**
```env
NODE_ENV=development
RAVENDB_URL=your_ravendb_connection_string
MISTRAL_API_URL=http://localhost:6012
# Add other required environment variables
```

**Bot (.env)**
```env
NODE_ENV=development
TELEGRAM_BOT_TOKEN=your_telegram_bot_token
BACKEND_API_URL=http://localhost:3000
# Add other required environment variables
```

**AI Services (.env)**
```env
# Mistral API configuration
MODEL_PATH=./pretrained/model
# Add other AI service configurations
```

### Running the Application

1. **Start AI Inference Service**
   ```bash
   cd mistral-api
   python inference.py
   ```
   Service will be available at `http://localhost:6012`

2. **Start Backend Service**
   ```bash
   cd backend
   npm run build
   npm start
   ```
   Service will be available at `http://localhost:3000`

3. **Start Telegram Bot**
   ```bash
   cd bot
   npm run build
   npm start
   ```

### Development

- **Backend Development**: `cd backend && npm run start` (with hot reload)
- **Bot Development**: `cd bot && npm run start` (with hot reload)
- **AI Model Training**: Use scripts in `mistral-lora/` directory
- **Testing**: `npm test` in respective service directories
- **Linting**: `npm run lint` in respective service directories

## 📁 Project Structure

```
smart-cart/
├── backend/                    # Backend service
│   ├── src/
│   │   ├── business-logic/     # Business logic layer
│   │   │   ├── ai/            # AI integration
│   │   │   ├── internal/      # Internal business logic
│   │   │   ├── marketplaces/  # Retailer integrations
│   │   │   └── common/        # Common utilities
│   │   ├── foundation/        # Core infrastructure
│   │   ├── repositories/      # Data access layer
│   │   ├── server/           # API and server setup
│   │   └── shared/           # Shared utilities
│   └── package.json
├── bot/                       # Telegram bot service
│   ├── src/
│   │   ├── business-logic/    # Bot-specific logic
│   │   ├── foundation/        # Bot infrastructure
│   │   ├── repositories/      # Bot data access
│   │   └── server/           # Bot server setup
│   └── package.json
├── mistral-api/              # AI inference service
│   ├── inference.py          # FastAPI inference server
│   └── pyproject.toml
├── mistral-lora/             # Model fine-tuning service
│   ├── data/                 # Training data
│   ├── mistral_lora/         # Training scripts
│   └── pyproject.toml
└── README.md
```

## 🔧 API Reference

### Backend API Endpoints

#### Products
- `POST /api/products-request` - Parse natural language query into products
- `GET /api/products-request/:id` - Get products request status

#### Carts
- `POST /api/cart` - Create shopping cart
- `GET /api/cart/:id` - Get cart by ID
- `PUT /api/cart/:id/product` - Update product in cart

#### Cities
- `POST /api/change-city-request` - Request city change
- `PUT /api/change-city-request/:id/select` - Select city

#### Users
- `POST /api/user` - Create user
- `GET /api/user/telegram/:id` - Get user by Telegram ID

### AI Service API

#### Inference
- `POST /generate` - Generate text using fine-tuned Mistral model

## 🤖 AI Model Details

The system uses a fine-tuned Mistral 7B model for natural language processing:

- **Base Model**: Mistral 7B
- **Fine-tuning**: LoRA (Low-Rank Adaptation)
- **Training Data**: Custom dataset for product parsing
- **Inference**: Optimized for CPU/GPU with automatic device selection
- **API**: FastAPI-based REST service

## 🌍 Multi-City Support

The system supports multiple cities with automatic price updates and location-based pricing.

## 📊 Monitoring & Logging

- Winston-based logging system
- Structured logs for all services
- Error tracking and monitoring
- Performance metrics collection

## 🧪 Testing

Run tests for each service:

```bash
# Backend tests
cd backend && npm test

# Bot tests
cd bot && npm test
```

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 👤 Author

**Pavel Belinovich** - *Initial work* - [pbelinovich](https://github.com/pbelinovich)

## 🙏 Acknowledgments

- Mistral AI for the base model
- Hugging Face for the transformers library
- Telegram for the Bot API
- All contributors and users of the Smart Cart Bot
