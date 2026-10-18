import json
import logging
import os
import threading
from datetime import datetime, timezone
from pathlib import Path

import firebase_admin
from fastapi import Header, HTTPException
from firebase_admin import auth as fb_auth
from firebase_admin import credentials
from firebase_admin import exceptions as fb_exceptions
from pymongo.errors import PyMongoError

from app.core.mongo import get_user_profiles_collection

logger = logging.getLogger(__name__)
_firebase_lock = threading.Lock()
_firebase_app = None


def _get_users_collection():
    collection = get_user_profiles_collection()
    if collection is None:
        raise HTTPException(
            status_code=503,
            detail="User database is not configured. Set MONGODB_USER_URI and MONGODB_USER_DB.",
        )
    return collection


def _get_firebase_app():
    global _firebase_app
    if _firebase_app is not None:
        return _firebase_app

    with _firebase_lock:
        if _firebase_app is not None:
            return _firebase_app
        try:
            _firebase_app = firebase_admin.get_app()
            return _firebase_app
        except ValueError:
            pass

        raw = os.getenv("FIREBASE_SERVICE_ACCOUNT_JSON")
        if raw:
            try:
                credential = credentials.Certificate(json.loads(raw))
            except (ValueError, TypeError, OSError) as exc:
                logger.error("FIREBASE_SERVICE_ACCOUNT_JSON is invalid")
                raise HTTPException(
                    status_code=503,
                    detail="Firebase authentication is not configured correctly.",
                ) from exc
        else:
            configured_path = os.getenv("FIREBASE_CREDENTIALS_PATH")
            path = (
                Path(configured_path)
                if configured_path
                else Path(__file__).resolve().parents[2] / "firebase-service-account.json"
            )
            if not path.is_absolute():
                path = Path(__file__).resolve().parents[2] / path
            if not path.is_file():
                raise HTTPException(
                    status_code=503,
                    detail="Firebase authentication credentials are not configured.",
                )
            try:
                credential = credentials.Certificate(str(path))
            except (ValueError, TypeError, OSError) as exc:
                logger.error("Firebase service-account file is invalid")
                raise HTTPException(
                    status_code=503,
                    detail="Firebase authentication is not configured correctly.",
                ) from exc
        try:
            _firebase_app = firebase_admin.initialize_app(credential)
            return _firebase_app
        except (ValueError, fb_exceptions.FirebaseError) as exc:
            logger.exception("Could not initialize Firebase Admin")
            raise HTTPException(
                status_code=503,
                detail="Firebase authentication is temporarily unavailable.",
            ) from exc


def _create_or_get_profile(decoded: dict) -> dict:
    uid = decoded.get("uid")
    email = decoded.get("email")
    if not uid or not email:
        raise HTTPException(status_code=401, detail="Authenticated account has no email.")

    users = _get_users_collection()
    normalized_email = email.strip().lower()
    users.update_one(
        {"_id": uid},
        {
            "$set": {
                "email": normalized_email,
                "avatar_url": decoded.get("picture"),
            },
            "$setOnInsert": {
                "display_name": decoded.get("name") or normalized_email.split("@")[0],
                "preferences": {},
                "created_at": datetime.now(timezone.utc),
            },
        },
        upsert=True,
    )
    profile = users.find_one({"_id": uid})
    if profile is None:
        raise HTTPException(status_code=503, detail="User profile could not be loaded.")
    return profile


def get_current_user(authorization: str | None = Header(default=None)) -> dict:
    if not authorization:
        raise HTTPException(401, "Not authenticated.")
    scheme, _, token = authorization.partition(" ")
    if scheme.lower() != "bearer" or not token.strip():
        raise HTTPException(401, "Not authenticated.")

    try:
        app = _get_firebase_app()
        decoded = fb_auth.verify_id_token(token.strip(), app=app, check_revoked=True)
    except HTTPException:
        raise
    except (
        fb_auth.InvalidIdTokenError,
        fb_auth.ExpiredIdTokenError,
        fb_auth.RevokedIdTokenError,
        fb_auth.UserDisabledError,
        ValueError,
    ) as exc:
        raise HTTPException(401, "Invalid or expired token.") from exc
    except fb_exceptions.FirebaseError as exc:
        logger.exception("Firebase token verification failed")
        raise HTTPException(
            status_code=503,
            detail="Firebase authentication is temporarily unavailable.",
        ) from exc

    try:
        return _create_or_get_profile(decoded)
    except PyMongoError as exc:
        logger.exception("Could not load the authenticated user's profile")
        raise HTTPException(
            status_code=503,
            detail="User profile service is temporarily unavailable.",
        ) from exc