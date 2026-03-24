"""FastAPI main application"""
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.routers import api_gateway
from app.routers.lambda_function import router as lambda_router
from app.routers.architecture import router as architecture_router
from app.routers.s3 import router as s3_router
from app.routers.dynamodb import router as dynamodb_router
from app.routers.elb import router as elb_router
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
app.include_router(s3_router)
app.include_router(dynamodb_router)
app.include_router(elb_router)

@app.get("/")
def root():
    return {
        "service": "AWS Pricing Calculator",
        "version": "1.0.0",
        "services": ["api_gateway", "lambda", "architecture", "s3", "dynamodb", "elb"]
    }

@app.get("/health")
def health_check():
    return {"status": "healthy"}