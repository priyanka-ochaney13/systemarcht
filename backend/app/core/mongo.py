"""MongoDB connections used by the application."""
import os
from functools import lru_cache
from typing import Optional

from dotenv import load_dotenv
from pymongo import MongoClient
from pymongo.collection import Collection

load_dotenv()

PRICING_COLLECTION = "pricing"
SERVICE_CONFIG_COLLECTION = "service_config"


@lru_cache(maxsize=1)
def _get_client() -> Optional[MongoClient]:
    uri = os.getenv("MONGODB_URI")
    if not uri:
        return None
    return MongoClient(uri, serverSelectionTimeoutMS=5000)


def _get_collection(collection_name: str) -> Optional[Collection]:
    client = _get_client()
    if client is None:
        return None
    return client[os.getenv("MONGODB_DB", "capstone")][collection_name]


def get_pricing_collection() -> Optional[Collection]:
    """Return the pricing collection, or None when MONGODB_URI is not set."""
    return _get_collection(PRICING_COLLECTION)


def get_service_config_collection() -> Optional[Collection]:
    """Return the service configuration collection, or None without MongoDB URI."""
    return _get_collection(SERVICE_CONFIG_COLLECTION)