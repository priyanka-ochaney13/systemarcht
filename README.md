# SystemArcht

SystemArcht is an AWS architecture planning and cost-estimation app. It combines regional, service-specific cost calculations with tools for designing, validating, and visualizing cloud architectures.

## Features

- Monthly cost estimates for AWS services, including Lambda, S3, API Gateway, DynamoDB, EC2, RDS, Cognito, CloudFront, CloudWatch, ElastiCache, SQS, Elastic Load Balancing, and Elastic Beanstalk.
- Architecture modeling and cost estimation across connected services.
- AI-assisted architecture generation and chat.
- Architecture validation and Mermaid diagram generation.
- A Next.js frontend backed by a FastAPI API.

## Architecture and data

- `backend/app/` contains the FastAPI routes, request/response models, and cost calculators.
- `backend/ai/` contains the AI, retrieval, and architecture workflows.
- `backend/pricing_data/` contains JSON pricing sources and configuration fallbacks. Keep this directory until you have verified MongoDB-only operation and no longer need local fallback or migration sources.
- The MongoDB database stores AWS SKU data in the `pricing` collection and application service settings in the `service_config` collection.
- `frontend/src/` contains the Next.js UI, API client, and application state.
- `FORMULAE.md` documents the cost-calculation formulas.

The pricing loader uses `PRICING_SOURCE=auto` by default: it reads a service's pricing from MongoDB when available and otherwise falls back to that service's JSON file. The service configuration loader similarly uses MongoDB when available and falls back to `backend/pricing_data/service_config.json`.

## Requirements

- Python 3.10 or newer
- Node.js and npm
- MongoDB connection if you want to use MongoDB pricing/configuration
- Provider credentials or a running local model for the AI features you use

## Run locally

Run the backend and frontend in **separate terminals**.

### 1. Configure and start the backend

In PowerShell:

```powershell
cd backend
py -m venv .venv
.\.venv\Scripts\Activate.ps1
python -m pip install -r requirements.txt
Copy-Item .env.example .env
```

Edit `backend/.env` and set the values you need:

```dotenv
MONGODB_URI=mongodb+srv://<username>:<password>@<cluster-host>/
MONGODB_DB=capstone
PRICING_SOURCE=auto
SERVICE_CONFIG_SOURCE=auto
```

Keep credentials private; do not commit `.env`. If you want to require MongoDB rather than allow JSON fallbacks, set both source settings to `mongo`:

```dotenv
PRICING_SOURCE=mongo
SERVICE_CONFIG_SOURCE=mongo
```

Start the API from the `backend` directory:

```powershell
uvicorn app.main:app --reload --reload-dir app
```

The `--reload-dir app` option keeps the development reloader focused on application code rather than watching the virtual environment.

The API is available at:

- Health check: <http://localhost:8000/health>
- Interactive API docs: <http://localhost:8000/docs>
- Root service information: <http://localhost:8000/>

### 2. Start the frontend

In a second PowerShell terminal:

```powershell
cd frontend
npm ci
npm run dev
```

Open <http://localhost:3000>. The frontend uses `http://localhost:8000/api` as its default API base URL. To use a different backend URL, set `NEXT_PUBLIC_API_URL` before starting the Next.js server, for example:

```powershell
$env:NEXT_PUBLIC_API_URL = "http://localhost:8000/api"
npm run dev
```

### macOS/Linux command equivalents

Backend setup:

```bash
cd backend
python3 -m venv .venv
source .venv/bin/activate
python -m pip install -r requirements.txt
cp .env.example .env
uvicorn app.main:app --reload --reload-dir app
```

Frontend setup in a separate terminal:

```bash
cd frontend
npm ci
npm run dev
```

## MongoDB data migration

Set `MONGODB_URI` and `MONGODB_DB` in `backend/.env` first. Run migration commands from the `backend` directory.

To upload or refresh one AWS service's pricing data from its JSON file:

```powershell
python -m scripts.migrate_to_mongo cognito
```

Replace `cognito` with the service filename without `.json`, for example `lambda` or `s3`. The pricing migration replaces the existing documents for that service, so run it only when you intend to refresh that service's MongoDB data.

To upload `service_config.json` to the `service_config` collection:

```powershell
python -m scripts.migrate_service_config_to_mongo
```

To compare a service's MongoDB pricing index with the JSON source:

```powershell
python -m scripts.check_parity app.services.cognito_service.pricing CognitoPricing
```

Use the corresponding pricing module and class for other services. A `MATCH` result means both sources build the same service pricing index.

## AI configuration

AI features depend on the configured integration:

- Groq-backed features use `GROQ_API_KEY`, `GROQ_MODEL`, and `GROQ_TIMEOUT_SECONDS` in `backend/.env`.
- Ollama-backed features require Ollama to be running and may use `OLLAMA_BASE_URL`, `OLLAMA_MODEL`, `OLLAMA_TIMEOUT_SECONDS`, `OLLAMA_NUM_CTX`, and `OLLAMA_NUM_PREDICT`.

Set only the provider configuration needed by the AI feature you are using. Cost calculations do not require an AI provider key.

## Useful commands

From `frontend/`:

```powershell
npm run lint
npm run build
```

From `backend/`:

```powershell
python -m py_compile app\main.py
```

## Demo

[Watch the project demo on Google Drive](https://drive.google.com/file/d/135yi-1-oqn24I5IpGFindn2OjHdlB5gT/view?usp=sharing).
