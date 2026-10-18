import logging

from fastapi import APIRouter, Depends, HTTPException
from pymongo.errors import PyMongoError

from app.core.mongo import get_user_profiles_collection
from app.models.auth import UserOut, UserProfileUpdate
from app.services.firebase_auth import get_current_user

logger = logging.getLogger(__name__)
router = APIRouter(prefix="/auth", tags=["auth"])


@router.get("/me", response_model=UserOut)
def me(user: dict = Depends(get_current_user)):
    return UserOut(
        id=user["_id"],
        email=user["email"],
        display_name=user["display_name"],
        avatar_url=user.get("avatar_url"),
        preferences=user.get("preferences", {}),
    )


@router.patch("/me", response_model=UserOut)
def update_me(
    updates: UserProfileUpdate,
    user: dict = Depends(get_current_user),
):
    collection = get_user_profiles_collection()
    if collection is None:
        raise HTTPException(
            status_code=503,
            detail="User database is not configured. Set MONGODB_USER_URI and MONGODB_USER_DB.",
        )
    try:
        collection.update_one(
            {"_id": user["_id"]},
            {"$set": {"display_name": updates.display_name.strip()}},
        )
        updated_user = collection.find_one({"_id": user["_id"]})
    except PyMongoError as exc:
        logger.exception("Could not update the authenticated user's profile")
        raise HTTPException(
            status_code=503,
            detail="User profile service is temporarily unavailable.",
        ) from exc
    if updated_user is None:
        raise HTTPException(status_code=404, detail="User profile not found.")
    return UserOut(
        id=updated_user["_id"],
        email=updated_user["email"],
        display_name=updated_user["display_name"],
        avatar_url=updated_user.get("avatar_url"),
        preferences=updated_user.get("preferences", {}),
    )