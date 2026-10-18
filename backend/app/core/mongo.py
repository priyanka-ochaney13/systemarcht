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
LEARNING_MODULES_COLLECTION = "learning_modules"
USER_PROFILES_COLLECTION = "users"


@lru_cache(maxsize=1)
def _get_client() -> Optional[MongoClient]:
    uri = os.getenv("MONGODB_URI")
    if not uri:
        return None
    return MongoClient(uri, serverSelectionTimeoutMS=5000)


@lru_cache(maxsize=1)
def _get_user_client() -> Optional[MongoClient]:
    uri = os.getenv("MONGODB_USER_URI")
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


def get_learning_modules_collection() -> Optional[Collection]:
    """Return the learning modules collection from the user-data MongoDB cluster."""
    client = _get_user_client()
    if client is None:
        return None
    database_name = os.getenv("MONGODB_USER_DB", "capstoneuser")
    return client[database_name][LEARNING_MODULES_COLLECTION]


def get_user_profiles_collection() -> Optional[Collection]:
    """Return the user profiles collection, or None when its database is unconfigured."""
    client = _get_user_client()
    database_name = os.getenv("MONGODB_USER_DB")
    if client is None or not database_name:
        return None
    return client[database_name][USER_PROFILES_COLLECTION]