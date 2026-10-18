"""Upload one service's pricing JSON from pricing_data/ to MongoDB.

Run from the backend folder:
    python -m scripts.migrate_to_mongo cloudfront
"""
import json
import sys
from pathlib import Path

from app.core.mongo import get_pricing_collection

PRICING_DIR = Path(__file__).resolve().parent.parent / "pricing_data"
BATCH_SIZE = 1000


def to_documents(service, data):
    """One document per SKU, keeping only OnDemand terms (all the loaders read)

    Terms and price dimensions are stored as lists because their original
    keys contain dots, which MongoDB field names should avoid.
    The loader rebuilds the original structure from these documents.
    """
    on_demand = data.get("terms", {}).get("OnDemand", {})

    for order, (sku, product) in enumerate(data.get("products", {}).items()):
        sku_terms = on_demand.get(sku)
        if not sku_terms:
            continue

        terms = []
        for term in sku_terms.values():
            kept = {k: v for k, v in term.items() if k != "priceDimensions"}
            kept["priceDimensions"] = list(term.get("priceDimensions", {}).values())
            terms.append(kept)

        yield {
            "_id": f"{service}:{sku}",
            "service": service,
            "sku": sku,
            "order": order,
            "product": product,
            "terms": terms,
        }


def main():
    if len(sys.argv) != 2:
        print("Usage: python -m scripts.migrate_to_mongo <service>   (for example: cloudfront)")
        sys.exit(1)

    service = sys.argv[1]
    path = PRICING_DIR / f"{service}.json"
    if not path.exists():
        print(f"File not found: {path}")
        sys.exit(1)

    collection = get_pricing_collection()
    if collection is None:
        print("MONGODB_URI is not set. Add it to backend/.env first.")
        sys.exit(1)

    print(f"Reading {path.name} ({path.stat().st_size / 1024 / 1024:.2f} MB)...")
    with open(path, "r", encoding="utf-8") as f:
        data = json.load(f)
    total_products = len(data.get("products", {}))

    collection.create_index([("service", 1), ("order", 1)])
    removed = collection.delete_many({"service": service}).deleted_count
    if removed:
        print(f"Removed {removed} existing {service} documents")

    batch, inserted = [], 0
    for doc in to_documents(service, data):
        batch.append(doc)
        if len(batch) >= BATCH_SIZE:
            collection.insert_many(batch, ordered=False)
            inserted += len(batch)
            batch = []
            print(f"  inserted {inserted}...")
    if batch:
        collection.insert_many(batch, ordered=False)
        inserted += len(batch)

    stored = collection.count_documents({"service": service})
    print(f"Done: {inserted} of {total_products} products had OnDemand prices and were inserted.")
    print(f"MongoDB now holds {stored} {service} documents.")


if __name__ == "__main__":
    main()