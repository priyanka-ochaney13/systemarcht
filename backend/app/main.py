"""FastAPI main application"""
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.routers import api_gateway
from app.routers.lambda_function import router as lambda_router
from app.routers.architecture import router as architecture_router
from app.routers.ai_architecture import router as ai_architecture_router
from app.routers.archbot_chat import router as archbot_chat_router
from app.routers.s3 import router as s3_router
from app.routers.cognito import router as cognito_router
from app.routers.dynamodb import router as dynamodb_router
from app.routers.elastic_beanstalk import router as elastic_beanstalk_router
from app.routers.elb import router as elb_router
from app.routers.cloudwatch import router as cloudwatch_router
from app.routers.cloudfront import router as cloudfront_router
from app.routers.elasticache import router as elasticache_router
from app.routers.sqs import router as sqs_router
import logging

logging.basicConfig(level=logging.INFO)

app = FastAPI(
    title="AWS Pricing Calculator",
    description="Multi-service AWS pricing calculator",
    version="1.0.0"
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(api_gateway.router)
app.include_router(lambda_router)
app.include_router(architecture_router)
app.include_router(ai_architecture_router)
app.include_router(archbot_chat_router)
app.include_router(s3_router)
app.include_router(cognito_router)
app.include_router(dynamodb_router)
app.include_router(elastic_beanstalk_router)
app.include_router(elb_router)
app.include_router(cloudwatch_router)
app.include_router(cloudfront_router)
app.include_router(elasticache_router)
app.include_router(sqs_router)

@app.get("/")
def root():
    return {
        "service": "AWS Pricing Calculator",
        "version": "1.0.0",
        "services": [
            "api_gateway",
            "lambda",
            "architecture",
            "ai_architecture",
            "ai_chat_architecture",
            "s3",
            "cognito",
            "dynamodb",
            "elb",
            "elastic_beanstalk",
            "cloudwatch",
            "cloudfront",
            "elasticache",
            "sqs",
        ],
    }

@app.get("/health")
def health_check():
    return {"status": "healthy"}