"""Authenticated learning progress storage routes."""
import logging
import re
from datetime import datetime, timezone
from typing import Dict, List, Optional

from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel, ConfigDict, Field
from pymongo.errors import PyMongoError

from app.core.mongo import get_learning_progress_collection
from app.services.firebase_auth import get_current_user

logger = logging.getLogger(__name__)
router = APIRouter(
    prefix="/api/learning-progress",
    tags=["Learning Progress"],
    dependencies=[Depends(get_current_user)],
)


class ModuleProgress(BaseModel):
    model_config = ConfigDict(extra="forbid")

    buildStarted: bool = False
    architectureValidated: bool = False
    costCalculated: bool = False
    aiActivityCompleted: bool = False
    quizCompleted: bool = False
    completed: bool = False
    completedSections: List[str] = Field(default_factory=list)
    quizAnswers: Dict[str, str] = Field(default_factory=dict)


class LearningProgressInput(BaseModel):
    model_config = ConfigDict(extra="forbid")

    active_module_id: Optional[str] = Field(default=None, max_length=100)
    modules: Dict[str, ModuleProgress] = Field(default_factory=dict)


def _collection():
    collection = get_learning_progress_collection()
    if collection is None:
        raise HTTPException(
            status_code=503,
            detail="Learning progress storage is not configured. "
            "Set MONGODB_USER_URI and MONGODB_USER_DB.",
        )
    return collection


def _serialize(document: dict) -> dict:
    return {
        "active_module_id": document.get("active_module_id"),
        "modules": document.get("modules", {}),
    }


def _validate_module_ids(progress: LearningProgressInput) -> None:
    if progress.active_module_id is not None and not re.fullmatch(
        r"[A-Za-z0-9_-]+", progress.active_module_id
    ):
        raise HTTPException(status_code=422, detail="Invalid active module ID.")
    if any(not re.fullmatch(r"[A-Za-z0-9_-]+", module_id) for module_id in progress.modules):
        raise HTTPException(status_code=422, detail="Invalid module ID.")


@router.get("")
def get_learning_progress(user: dict = Depends(get_current_user)):
    try:
        document = _collection().find_one({"_id": user["_id"]})
    except PyMongoError as exc:
        logger.exception("Could not load the authenticated user's learning progress")
        raise HTTPException(
            status_code=503,
            detail="Learning progress is temporarily unavailable.",
        ) from exc
    return _serialize(document) if document else {
        "active_module_id": None,
        "modules": {},
    }


@router.put("")
def save_learning_progress(
    progress: LearningProgressInput,
    user: dict = Depends(get_current_user),
):
    _validate_module_ids(progress)
    document = {
        "active_module_id": progress.active_module_id,
        "modules": {
            module_id: module.model_dump()
            for module_id, module in progress.modules.items()
        },
        "updated_at": datetime.now(timezone.utc),
    }
    try:
        collection = _collection()
        collection.update_one(
            {"_id": user["_id"]},
            {"$set": document},
            upsert=True,
        )
    except PyMongoError as exc:
        logger.exception("Could not save the authenticated user's learning progress")
        raise HTTPException(
            status_code=503,
            detail="Learning progress is temporarily unavailable.",
        ) from exc
    return _serialize(document)
