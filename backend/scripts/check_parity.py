"""Check that MongoDB-loaded pricing builds exactly the same index as the JSON file.

Run from the backend folder, giving the pricing class module and name:
    python -m scripts.check_parity app.services.cloudfront.pricing CloudFrontPricing
"""
import importlib
import os
import sys

from app.core.base_calculator import PricingTier
from app.services.pricing_loader import PricingLoader


def normalize(value):
    """Turn an index into plain comparable data"""
    if isinstance(value, PricingTier):
        return (value.begin_range, value.end_range, value.price_per_unit, value.unit)
    if isinstance(value, dict):
        return {k: normalize(v) for k, v in sorted(value.items(), key=lambda kv: str(kv[0]))}
    if isinstance(value, (list, tuple)):
        return [normalize(v) for v in value]
    return value


def build_index(module_name, class_name, source):
    os.environ["PRICING_SOURCE"] = source
    PricingLoader._instances.clear()
    loader_class = getattr(importlib.import_module(module_name), class_name)
    return normalize(loader_class().index)


def main():
    if len(sys.argv) != 3:
        print("Usage: python -m scripts.check_parity <module> <class>")
        sys.exit(1)

    module_name, class_name = sys.argv[1], sys.argv[2]

    print("Building index from the JSON file...")
    from_file = build_index(module_name, class_name, "file")
    print("Building index from MongoDB...")
    from_mongo = build_index(module_name, class_name, "mongo")

    if from_file == from_mongo:
        print(f"MATCH: both sources produce an identical index ({len(from_file)} top-level keys)")
        return

    print("MISMATCH between the JSON file and MongoDB")
    if isinstance(from_file, dict) and isinstance(from_mongo, dict):
        print("  keys only in file :", sorted(set(from_file) - set(from_mongo), key=str)[:10])
        print("  keys only in mongo:", sorted(set(from_mongo) - set(from_file), key=str)[:10])
        different = [k for k in from_file if k in from_mongo and from_file[k] != from_mongo[k]]
        print("  keys with different values:", different[:10])
    sys.exit(1)


if __name__ == "__main__":
    main()