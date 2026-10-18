import argparse
import getpass
import json
import os
import subprocess
import sys
from datetime import datetime, timezone
from pathlib import Path

from dotenv import load_dotenv
from pymongo import MongoClient, ReplaceOne


ROOT_DIR = Path(__file__).resolve().parents[2]
load_dotenv(ROOT_DIR / "backend" / ".env")

NODE_EXPORTER = r"""
const fs = require("node:fs");
const vm = require("node:vm");

const filePath = process.argv[1];
const text = fs.readFileSync(filePath, "utf8");
const marker = "export const learningModules =";
const markerIndex = text.indexOf(marker);

if (markerIndex < 0) {
  throw new Error("Could not find the learningModules export.");
}

let expression = text.slice(markerIndex + marker.length).trim();

if (expression.endsWith(";")) {
  expression = expression.slice(0, -1);
}

const modules = vm.runInNewContext(
  `(${expression})`,
  Object.create(null),
  { timeout: 5000 }
);

if (!Array.isArray(modules)) {
  throw new Error("The learningModules export is not an array.");
}

process.stdout.write(JSON.stringify(modules));
"""


def read_modules(source_path: Path) -> list[dict]:
    if not source_path.is_file():
        raise FileNotFoundError(f"Module source file not found: {source_path}")

    result = subprocess.run(
        ["node", "-e", NODE_EXPORTER, str(source_path.resolve())],
        check=True,
        capture_output=True,
        text=True,
        timeout=15,
    )

    modules = json.loads(result.stdout)

    if not isinstance(modules, list) or not modules:
        raise ValueError("No learning modules were found in the source file.")

    ids = [module.get("id") for module in modules]
    if any(not isinstance(module_id, str) or not module_id for module_id in ids):
        raise ValueError("Every module must have a non-empty string 'id'.")

    if len(ids) != len(set(ids)):
        raise ValueError("Duplicate learning module IDs found.")

    return modules


def main() -> int:
    parser = argparse.ArgumentParser(
        description="Seed frontend learning modules into MongoDB Atlas."
    )
    parser.add_argument(
        "--source",
        default=str(ROOT_DIR / "frontend" / "src" / "lib" / "learningModules.js"),
        help="Path to the existing learningModules.js file.",
    )
    parser.add_argument(
        "--database",
        default=os.environ.get("MONGODB_USER_DB", "capstoneuser"),
        help="Target MongoDB database name.",
    )
    parser.add_argument(
        "--collection",
        default="learning_modules",
        help="Target MongoDB collection name.",
    )
    parser.add_argument(
        "--apply",
        action="store_true",
        help="Write/upsert the modules. Without this flag, only report the count.",
    )
    args = parser.parse_args()

    try:
        modules = read_modules(Path(args.source))
    except (
        OSError,
        ValueError,
        json.JSONDecodeError,
        subprocess.SubprocessError,
    ) as exc:
        print(f"Could not read learning modules: {exc}", file=sys.stderr)
        return 1

    print(f"Found {len(modules)} learning modules.")

    if not args.apply:
        print("Dry run only; MongoDB was not changed. Re-run with --apply to write.")
        return 0

    uri = os.environ.get("MONGODB_USER_URI")
    if not uri:
        uri = getpass.getpass("New user-cluster URI (input hidden): ")

    if not uri.strip():
        print("No MongoDB URI provided; nothing was written.", file=sys.stderr)
        return 1

    client = MongoClient(uri, serverSelectionTimeoutMS=10000)

    try:
        client.admin.command("ping")
        collection = client[args.database][args.collection]
        now = datetime.now(timezone.utc)

        operations = []
        for module in modules:
            document = dict(module)
            document["_id"] = module["id"]
            document["schema_version"] = 1
            document["updated_at"] = now

            operations.append(
                ReplaceOne(
                    {"_id": module["id"]},
                    document,
                    upsert=True,
                )
            )

        result = collection.bulk_write(operations, ordered=True)

        print(
            f"Successfully synced {len(modules)} modules to "
            f"{args.database}.{args.collection} "
            f"(inserted: {len(result.upserted_ids)}, "
            f"updated: {result.modified_count}, "
            f"matched: {result.matched_count})."
        )
        print("Other documents in the collection were left untouched.")
    except Exception as exc:
        print(f"MongoDB migration failed: {exc}", file=sys.stderr)
        return 1
    finally:
        client.close()

    return 0


if __name__ == "__main__":
    raise SystemExit(main())