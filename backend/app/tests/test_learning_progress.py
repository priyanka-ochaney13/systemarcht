import unittest
from unittest.mock import Mock, patch

from fastapi import FastAPI, HTTPException
from fastapi.testclient import TestClient
from pydantic import ValidationError

from app.routers import learning_progress


class LearningProgressTests(unittest.TestCase):
    def setUp(self):
        self.user = {"_id": "firebase-user-1"}

    def test_get_returns_empty_progress_when_user_has_no_saved_record(self):
        collection = Mock()
        collection.find_one.return_value = None

        with patch.object(
            learning_progress, "get_learning_progress_collection", return_value=collection
        ):
            result = learning_progress.get_learning_progress(self.user)

        collection.find_one.assert_called_once_with({"_id": self.user["_id"]})
        self.assertEqual(result, {"active_module_id": None, "modules": {}})

    def test_get_returns_only_progress_for_authenticated_user(self):
        collection = Mock()
        collection.find_one.return_value = {
            "_id": self.user["_id"],
            "active_module_id": "module-2",
            "modules": {"module-2": {"buildStarted": True}},
            "updated_at": "ignored",
        }

        with patch.object(
            learning_progress, "get_learning_progress_collection", return_value=collection
        ):
            result = learning_progress.get_learning_progress(self.user)

        collection.find_one.assert_called_once_with({"_id": self.user["_id"]})
        self.assertEqual(result["active_module_id"], "module-2")
        self.assertEqual(result["modules"], {"module-2": {"buildStarted": True}})

    def test_save_upserts_progress_under_authenticated_user_id(self):
        collection = Mock()
        progress = learning_progress.LearningProgressInput.model_validate(
            {
                "active_module_id": "module-2",
                "modules": {
                    "module-2": {
                        "buildStarted": True,
                        "completedSections": ["learn"],
                        "quizAnswers": {"q1": "option-a"},
                    }
                },
            }
        )

        with patch.object(
            learning_progress, "get_learning_progress_collection", return_value=collection
        ):
            result = learning_progress.save_learning_progress(progress, self.user)

        query, update = collection.update_one.call_args.args
        self.assertEqual(query, {"_id": self.user["_id"]})
        self.assertTrue(collection.update_one.call_args.kwargs["upsert"])
        self.assertEqual(update["$set"]["modules"]["module-2"]["completedSections"], ["learn"])
        self.assertEqual(result["active_module_id"], "module-2")

    def test_save_rejects_unrecognized_progress_fields(self):
        with self.assertRaises(ValidationError):
            learning_progress.LearningProgressInput.model_validate(
                {"modules": {"module-1": {"email": "attacker@example.com"}}}
            )

    def test_save_rejects_module_ids_that_could_be_mongo_paths(self):
        progress = learning_progress.LearningProgressInput(modules={"$set.email": {}})

        with self.assertRaises(HTTPException) as error:
            learning_progress._validate_module_ids(progress)

        self.assertEqual(error.exception.status_code, 422)

    def test_route_requires_authentication(self):
        test_app = FastAPI()
        test_app.include_router(learning_progress.router)

        response = TestClient(test_app).get("/api/learning-progress")

        self.assertEqual(response.status_code, 401)


if __name__ == "__main__":
    unittest.main()
