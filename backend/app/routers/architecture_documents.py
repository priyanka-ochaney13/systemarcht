"""Owner-scoped architecture document and calculation snapshot APIs."""
import logging
from datetime import datetime, timezone
from typing import Any

from bson import ObjectId
from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel, Field
from pymongo.errors import PyMongoError

from app.core.mongo import get_architecture_documents_collection
from app.services.firebase_auth import get_current_user

logger = logging.getLogger(__name__)
router = APIRouter(prefix="/api/architecture-documents", tags=["Architecture documents"])


class ArchitectureDocumentInput(BaseModel):
    title: str = Field(min_length=1, max_length=200)
    diagram_data: dict[str, Any] = Field(default_factory=dict)
    service_configs: dict[str, Any] = Field(default_factory=dict)
    calculation_options: dict[str, Any] = Field(default_factory=dict)


class CalculationSnapshotInput(BaseModel):
    total_cost: float = Field(ge=0)
    service_costs: dict[str, Any] = Field(default_factory=dict)
    architecture_snapshot: dict[str, Any] = Field(default_factory=dict)
    calculation_options: dict[str, Any] = Field(default_factory=dict)
    pricing_basis: str = Field(min_length=1, max_length=1000)


def _collection():
    collection = get_architecture_documents_collection()
    if collection is None:
        raise HTTPException(
            status_code=503,
            detail="Architecture document storage is not configured. Set MONGODB_USER_URI and MONGODB_USER_DB.",
        )
    return collection


def _serialize(document: dict[str, Any]) -> dict[str, Any]:
    return {
        "id": str(document["_id"]),
        "owner_id": document["owner_id"],
        "title": document["title"],
        "diagram_data": document.get("diagram_data", {}),
        "service_configs": document.get("service_configs", {}),
        "calculation_options": document.get("calculation_options", {}),
        "snapshots": document.get("snapshots", []),
        "created_at": document["created_at"].isoformat(),
        "updated_at": document["updated_at"].isoformat(),
    }


def _owned_document_id(document_id: str, owner_id: str) -> dict[str, Any]:
    if not ObjectId.is_valid(document_id):
        raise HTTPException(status_code=404, detail="Architecture document not found.")
    return {"_id": ObjectId(document_id), "owner_id": owner_id}


@router.post("")
def create_document(
    document: ArchitectureDocumentInput,
    user: dict = Depends(get_current_user),
):
    now = datetime.now(timezone.utc)
    record = {
        "owner_id": user["_id"],
        "title": document.title.strip(),
        "diagram_data": document.diagram_data,
        "service_configs": document.service_configs,
        "calculation_options": document.calculation_options,
        "snapshots": [],
        "created_at": now,
        "updated_at": now,
    }
    if not record["title"]:
        raise HTTPException(status_code=422, detail="Document title cannot be blank.")
    try:
        result = _collection().insert_one(record)
        record["_id"] = result.inserted_id
        return _serialize(record)
    except PyMongoError as exc:
        logger.exception("Could not create architecture document")
        raise HTTPException(status_code=503, detail="Architecture document storage is temporarily unavailable.") from exc


@router.get("")
def list_documents(user: dict = Depends(get_current_user)):
    try:
        documents = _collection().find({"owner_id": user["_id"]}).sort("updated_at", -1)
        return [_serialize(document) for document in documents]
    except PyMongoError as exc:
        logger.exception("Could not list architecture documents")
        raise HTTPException(status_code=503, detail="Architecture document storage is temporarily unavailable.") from exc


@router.get("/{document_id}")
def read_document(document_id: str, user: dict = Depends(get_current_user)):
    try:
        document = _collection().find_one(_owned_document_id(document_id, user["_id"]))
    except PyMongoError as exc:
        logger.exception("Could not read architecture document")
        raise HTTPException(status_code=503, detail="Architecture document storage is temporarily unavailable.") from exc
    if document is None:
        raise HTTPException(status_code=404, detail="Architecture document not found.")
    return _serialize(document)


@router.put("/{document_id}")
def update_document(
    document_id: str,
    updates: ArchitectureDocumentInput,
    user: dict = Depends(get_current_user),
):
    title = updates.title.strip()
    if not title:
        raise HTTPException(status_code=422, detail="Document title cannot be blank.")
    now = datetime.now(timezone.utc)
    try:
        collection = _collection()
        result = collection.update_one(
            _owned_document_id(document_id, user["_id"]),
            {
                "$set": {
                    "title": title,
                    "diagram_data": updates.diagram_data,
                    "service_configs": updates.service_configs,
                    "calculation_options": updates.calculation_options,
                    "updated_at": now,
                }
            },
        )
        document = collection.find_one(_owned_document_id(document_id, user["_id"]))
    except PyMongoError as exc:
        logger.exception("Could not update architecture document")
        raise HTTPException(status_code=503, detail="Architecture document storage is temporarily unavailable.") from exc
    if result.matched_count == 0 or document is None:
        raise HTTPException(status_code=404, detail="Architecture document not found.")
    return _serialize(document)


@router.delete("/{document_id}")
def delete_document(document_id: str, user: dict = Depends(get_current_user)):
    try:
        result = _collection().delete_one(_owned_document_id(document_id, user["_id"]))
    except PyMongoError as exc:
        logger.exception("Could not delete architecture document")
        raise HTTPException(status_code=503, detail="Architecture document storage is temporarily unavailable.") from exc
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Architecture document not found.")
    return {"deleted": True}


@router.post("/{document_id}/snapshots")
def create_calculation_snapshot(
    document_id: str,
    snapshot: CalculationSnapshotInput,
    user: dict = Depends(get_current_user),
):
    timestamp = datetime.now(timezone.utc)
    snapshot_record = {
        "id": str(ObjectId()),
        "calculated_at": timestamp.isoformat(),
        "total_cost": snapshot.total_cost,
        "service_costs": snapshot.service_costs,
        "architecture_snapshot": snapshot.architecture_snapshot,
        "calculation_options": snapshot.calculation_options,
        "pricing_basis": snapshot.pricing_basis,
    }
    try:
        collection = _collection()
        result = collection.update_one(
            _owned_document_id(document_id, user["_id"]),
            {
                "$push": {"snapshots": snapshot_record},
                "$set": {"updated_at": timestamp},
            },
        )
    except PyMongoError as exc:
        logger.exception("Could not save architecture calculation snapshot")
        raise HTTPException(status_code=503, detail="Architecture document storage is temporarily unavailable.") from exc
    if result.matched_count == 0:
        raise HTTPException(status_code=404, detail="Architecture document not found.")
    return snapshot_record
