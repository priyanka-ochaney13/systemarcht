"""Learning module content routes."""
import logging
from typing import Any, Dict, List

from fastapi import APIRouter, HTTPException
from pymongo.errors import PyMongoError

from app.core.mongo import get_learning_modules_collection

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/api/learning-modules", tags=["Learning Modules"])


@router.get("")
def list_learning_modules() -> List[Dict[str, Any]]:
    """Return the published learning modules ordered by module number."""
    collection = get_learning_modules_collection()
    if collection is None:
        raise HTTPException(
            status_code=503,
            detail="Learning modules database is not configured. "
            "Set MONGODB_USER_URI in the backend environment.",
        )

    try:
        return list(
            collection.find(
                {},
                {"_id": 0, "schema_version": 0, "updated_at": 0},
            ).sort("moduleNumber", 1)
        )
    except PyMongoError as exc:
        logger.exception("Failed to fetch learning modules from MongoDB")
        raise HTTPException(
            status_code=503,
            detail="Learning modules are temporarily unavailable.",
        ) from exc
