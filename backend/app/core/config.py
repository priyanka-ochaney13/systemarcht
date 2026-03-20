"""Application configuration"""
from pydantic_settings import BaseSettings
from typing import Optional

class Settings(BaseSettings):
    app_name: str = "AWS Pricing Calculator"
    app_version: str = "1.0.0"
    debug: bool = True
    
    class Config:
        env_file = ".env"

settings = Settings()