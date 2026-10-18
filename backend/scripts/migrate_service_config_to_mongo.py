"""Upload pricing_data/service_config.json to the service_config collection.

Run from the backend folder:
    python -m scripts.migrate_service_config_to_mongo
"""
import json
from pathlib import Path

from app.core.mongo import get_service_config_collection

CONFIG_FILE = Path(__file__).resolve().parent.parent / "pricing_data" / "service_config.json"
DOCUMENT_ID = "default"


def main():
    if not CONFIG_FILE.exists():
        raise FileNotFoundError(f"Service config file not found: {CONFIG_FILE}")

    with CONFIG_FILE.open("r", encoding="utf-8") as file:
        config = json.load(file)
    if not isinstance(config, dict):
        raise ValueError("Service config JSON must contain a top-level object")

    collection = get_service_config_collection()
    if collection is None:
        raise RuntimeError("MONGODB_URI is not set. Add it to backend/.env first.")

    result = collection.replace_one(
        {"_id": DOCUMENT_ID},
        {"_id": DOCUMENT_ID, "config": config},
        upsert=True,
    )
    print(
        f"Stored service_config/default in MongoDB "
        f"(matched={result.matched_count}, modified={result.modified_count}, "
        f"upserted={result.upserted_id is not None})."
    )


if __name__ == "__main__":
    main()
