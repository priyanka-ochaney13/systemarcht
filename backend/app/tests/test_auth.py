import unittest
from unittest.mock import patch

from fastapi import FastAPI, HTTPException
from fastapi.testclient import TestClient
from fastapi.routing import APIRoute
from pydantic import ValidationError

from app.models.auth import UserProfileUpdate
from app.routers import auth as auth_router
from app.services.firebase_auth import get_current_user
from app.main import app


class AuthTests(unittest.TestCase):
    def test_application_endpoints_require_authentication(self):
        client = TestClient(app)

        for path in ("/", "/health", "/api/learning-modules", "/api/learning-progress"):
            with self.subTest(path=path):
                response = client.get(path)
                self.assertEqual(response.status_code, 401)

        self.assertEqual(client.get("/docs").status_code, 404)
        self.assertEqual(client.get("/openapi.json").status_code, 404)

    def test_every_registered_http_route_has_auth_dependency(self):
        routes = [route for route in app.routes if isinstance(route, APIRoute)]

        self.assertTrue(routes)
        for route in routes:
            with self.subTest(path=route.path):
                self.assertIn(
                    get_current_user,
                    {dependency.call for dependency in route.dependant.dependencies},
                )

    def test_profile_api_rejects_anonymous_requests(self):
        test_app = FastAPI()
        test_app.include_router(auth_router.router, prefix="/api")
        client = TestClient(test_app)

        response = client.get("/api/auth/me")
        update_response = client.patch(
            "/api/auth/me",
            json={"display_name": "Unauthorized"},
        )

        self.assertEqual(response.status_code, 401)
        self.assertEqual(update_response.status_code, 401)

    def test_profile_requires_bearer_token(self):
        with self.assertRaises(HTTPException) as exc_info:
            get_current_user(authorization=None)

        self.assertEqual(exc_info.exception.status_code, 401)

    def test_profile_rejects_non_bearer_authorization(self):
        with self.assertRaises(HTTPException) as exc_info:
            get_current_user(authorization="Basic credentials")

        self.assertEqual(exc_info.exception.status_code, 401)

    def test_profile_update_only_changes_authenticated_user(self):
        class FakeCollection:
            def __init__(self):
                self.filter = None
                self.update = None

            def update_one(self, filter_query, update):
                self.filter = filter_query
                self.update = update

            def find_one(self, filter_query):
                return {
                    "_id": filter_query["_id"],
                    "email": "user@example.com",
                    "display_name": "Updated Name",
                }

        collection = FakeCollection()
        with patch.object(auth_router, "get_user_profiles_collection", return_value=collection):
            result = auth_router.update_me(
                UserProfileUpdate(display_name=" Updated Name "),
                {"_id": "verified-firebase-uid"},
            )

        self.assertEqual(result.id, "verified-firebase-uid")
        self.assertEqual(collection.filter, {"_id": "verified-firebase-uid"})
        self.assertEqual(collection.update, {"$set": {"display_name": "Updated Name"}})

    def test_profile_update_rejects_invalid_or_privileged_fields(self):
        invalid_payloads = (
            {"display_name": "   "},
            {"display_name": "Name", "email": "attacker@example.com"},
            {"display_name": "Name", "id": "another-user"},
        )
        for payload in invalid_payloads:
            with self.subTest(payload=payload):
                with self.assertRaises(ValidationError):
                    UserProfileUpdate.model_validate(payload)


if __name__ == "__main__":
    unittest.main()
