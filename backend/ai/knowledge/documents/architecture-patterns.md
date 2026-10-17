# SystemArcht architecture patterns

The event-driven pattern uses API Gateway for HTTP ingress, Lambda for compute, DynamoDB for metadata, and S3 for object storage. It is strong for bursty traffic and asynchronous workflows.

The photo sharing pattern routes metadata requests through API Gateway, processes upload-related work with Lambda, stores photos in S3, and stores photo metadata in DynamoDB. This is appropriate for a large user base and separates durable objects from queryable metadata.

The booking pattern is transaction-heavy. Use API Gateway for the API and choose EC2 for steady application workloads. Use RDS when relational consistency is required. When inventory is held in DynamoDB, prevent overbooking with conditional writes such as updating only when available capacity is greater than zero; a failed condition means another request won the race.

The constant high-load pattern favors EC2 for sustained, predictable throughput and can combine it with RDS or DynamoDB according to consistency and access-pattern needs. Realtime analytics can ingest through API Gateway and Lambda, store event summaries in DynamoDB, and archive raw payloads in S3.
