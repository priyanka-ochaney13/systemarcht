# SystemArcht

SystemArcht is an AWS architecture planning and cost-estimation platform that combines service-by-service pricing analysis with AI-assisted architecture generation.

It helps teams model cloud infrastructure, estimate monthly operating cost, and generate architecture recommendations from natural-language prompts.

## Why this project exists

Managing AWS costs and designing resilient architectures can be time-consuming and error-prone. This project makes that process easier by combining:

- transparent AWS pricing calculations
- service-based architecture modeling
- AI-powered design suggestions
- a frontend for interactive exploration

## Features

- Multi-service AWS cost estimation
- Region-aware pricing assumptions and service configuration data
- AI architecture generation using a Qwen-compatible backend
- RAG-supported knowledge retrieval for architecture guidance
- Mermaid-based architecture visualization support
- FastAPI backend and Next.js frontend

## Supported services

The platform currently covers and integrates pricing/design logic for major AWS service families, including:

- S3
- Lambda
- DynamoDB
- API Gateway
- Elastic Load Balancing (ALB, NLB, GWLB, CLB)
- Elastic Beanstalk
- Cognito
- CloudFront
- CloudWatch
- ElastiCache
- EC2
- RDS
- SQS

## Product flow

The system works in two connected layers:

1. Cost estimation layer
   - Reads service pricing data from `backend/pricing_data/`
   - Applies service-specific formulas to usage inputs
   - Returns monthly cost summaries through API endpoints and the frontend UI

2. AI architecture layer
   - Retrieves architecture knowledge from the local knowledge base
   - Uses a Qwen/OpenAI-compatible model to generate architecture recommendations
   - Structures the output into architecture-ready data that can be visualized

## Demo Video

Check out the demo for a walkthrough of the platform and its features:

- [View Demo on Google Drive](https://drive.google.com/file/d/135yi-1-oqn24I5IpGFindn2OjHdlB5gT/view?usp=sharing)

## Repository structure

```text
backend/
  app/                 FastAPI application and routers
  ai/                  AI workflows, prompts, retrieval, and model integrations
  pricing_data/        AWS pricing datasets and JSON service configs
frontend/
  src/                 Next.js frontend application and UI logic
guide/
  Additional architecture, design, and UI documentation
README.md
FORMULAE.md
formula.md
```

## Getting started

### Backend

```bash
cd backend
python -m venv .venv
source .venv/bin/activate      # Windows: .venv\Scripts\activate
pip install -r requirements.txt
uvicorn app.main:app --reload
```

The API will be available at:

- http://localhost:8000
- http://localhost:8000/docs

### Frontend

```bash
cd frontend
npm install
npm run dev
```

Then open:

- http://localhost:3000

## AI configuration

The architecture-generation pipeline accepts Qwen-compatible settings through environment variables such as:

- `QWEN_BASE_URL` (default: `http://localhost:11434/v1`)
- `QWEN_MODEL` (default: `qwen3:8b`)
- `QWEN_API_KEY` (optional)
- `QWEN_TIMEOUT_SECONDS` (default: `60`)

## Example API call

```bash
curl -X POST http://localhost:8000/api/ai/architecture/generate \
  -H "Content-Type: application/json" \
  -d '{
    "task": "generate_architecture",
    "prompt": "Design a photo sharing application for 100,000 users"
  }'
```

## Documentation

- [FORMULAE.md](./FORMULAE.md) — pricing formula reference
- [formula.md](./formula.md) — lightweight alias/reference for the formula guide
- [guide/](./guide/) — architecture and UI design documentation

## Notes

This project is actively evolving. Service coverage, pricing logic, and AI workflows may continue to expand as the platform matures.

---

Last updated: October 2026
