"""FastAPI main application"""
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.routers import api_gateway
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

@app.get("/")
def root():
    return {
        "service": "AWS Pricing Calculator",
        "version": "1.0.0",
        "services": ["api_gateway"]
    }

@app.get("/health")
def health_check():
    return {"status": "healthy"}