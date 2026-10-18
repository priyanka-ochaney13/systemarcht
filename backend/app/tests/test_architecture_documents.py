import unittest
from datetime import datetime, timezone
from unittest.mock import Mock, patch

from bson import ObjectId
from fastapi import HTTPException

from app.routers import architecture_documents as documents


class ArchitectureDocumentTests(unittest.TestCase):
    def setUp(self):
        self.user = {"_id": "firebase-user-1"}
        self.document_id = str(ObjectId())
        self.document_input = documents.ArchitectureDocumentInput(
            title="  Example architecture  ",
            diagram_data={
                "nodes": [{"id": "lambda-1", "position": {"x": 30, "y": 50}}],
                "connections": [],
            },
            service_configs={"lambdaConfig": {"region": "us-east-1"}},
            calculation_options={"period": "monthly"},
        )

    def test_create_document_stores_owner_and_editable_data(self):
        collection = Mock()
        collection.insert_one.return_value.inserted_id = ObjectId(self.document_id)

        with patch.object(documents, "get_architecture_documents_collection", return_value=collection):
            result = documents.create_document(self.document_input, self.user)

        stored = collection.insert_one.call_args.args[0]
        self.assertEqual(stored["owner_id"], self.user["_id"])
        self.assertEqual(stored["title"], "Example architecture")
        self.assertEqual(stored["diagram_data"], self.document_input.diagram_data)
        self.assertEqual(stored["service_configs"], self.document_input.service_configs)
        self.assertIsInstance(stored["created_at"], datetime)
        self.assertEqual(result["id"], self.document_id)

    def test_list_documents_filters_by_authenticated_owner(self):
        collection = Mock()
        collection.find.return_value.sort.return_value = []

        with patch.object(documents, "get_architecture_documents_collection", return_value=collection):
            self.assertEqual(documents.list_documents(self.user), [])

        collection.find.assert_called_once_with({"owner_id": self.user["_id"]})

    def test_read_foreign_or_missing_document_is_not_found(self):
        collection = Mock()
        collection.find_one.return_value = None

        with patch.object(documents, "get_architecture_documents_collection", return_value=collection):
            with self.assertRaises(HTTPException) as error:
                documents.read_document(self.document_id, self.user)

        self.assertEqual(error.exception.status_code, 404)
        collection.find_one.assert_called_once_with(
            {"_id": ObjectId(self.document_id), "owner_id": self.user["_id"]}
        )

    def test_update_is_owner_scoped_and_preserves_snapshots(self):
        collection = Mock()
        collection.update_one.return_value.matched_count = 1
        stored_document = {
            "_id": ObjectId(self.document_id),
            "owner_id": self.user["_id"],
            "title": "Example architecture",
            "diagram_data": self.document_input.diagram_data,
            "service_configs": self.document_input.service_configs,
            "calculation_options": self.document_input.calculation_options,
            "snapshots": [{"id": "saved-report"}],
            "created_at": datetime.now(timezone.utc),
            "updated_at": datetime.now(timezone.utc),
        }
        collection.find_one.return_value = stored_document

        with patch.object(documents, "get_architecture_documents_collection", return_value=collection):
            result = documents.update_document(self.document_id, self.document_input, self.user)

        query, update = collection.update_one.call_args.args
        self.assertEqual(query, {"_id": ObjectId(self.document_id), "owner_id": self.user["_id"]})
        self.assertEqual(update["$set"]["diagram_data"], self.document_input.diagram_data)
        self.assertNotIn("snapshots", update["$set"])
        self.assertEqual(result["snapshots"], [{"id": "saved-report"}])

    def test_snapshot_keeps_calculation_and_pricing_context_separate(self):
        collection = Mock()
        collection.update_one.return_value.matched_count = 1
        snapshot = documents.CalculationSnapshotInput(
            total_cost=12.5,
            service_costs={"lambdaCost": {"breakdown": {"total_cost": 12.5}}},
            architecture_snapshot={"title": "Saved at estimate time"},
            calculation_options={"period": "monthly"},
            pricing_basis="SystemArcht pricing data at calculation time.",
        )

        with patch.object(documents, "get_architecture_documents_collection", return_value=collection):
            result = documents.create_calculation_snapshot(self.document_id, snapshot, self.user)

        query, update = collection.update_one.call_args.args
        self.assertEqual(query, {"_id": ObjectId(self.document_id), "owner_id": self.user["_id"]})
        self.assertEqual(update["$push"]["snapshots"]["total_cost"], 12.5)
        self.assertEqual(update["$push"]["snapshots"]["architecture_snapshot"], snapshot.architecture_snapshot)
        self.assertEqual(result["pricing_basis"], snapshot.pricing_basis)

    def test_delete_is_owner_scoped(self):
        collection = Mock()
        collection.delete_one.return_value.deleted_count = 1

        with patch.object(documents, "get_architecture_documents_collection", return_value=collection):
            result = documents.delete_document(self.document_id, self.user)

        collection.delete_one.assert_called_once_with(
            {"_id": ObjectId(self.document_id), "owner_id": self.user["_id"]}
        )
        self.assertEqual(result, {"deleted": True})


if __name__ == "__main__":
    unittest.main()
