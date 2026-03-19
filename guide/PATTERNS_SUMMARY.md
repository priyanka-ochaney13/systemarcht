# 5 System Design Patterns: Quick Reference

**Document**: SystemArcht_5_Design_Patterns.md (35 KB)

## The 5 Patterns

### 1️⃣ Event-Driven Microservices (Netflix-like)
**Scale**: 10M concurrent viewers, 100M users
**Architecture**: API Gateway → Lambda microservices → DynamoDB + S3
**Cost**: $13,020/month
**Key Insight**: Decouple auth, streaming, and analytics into independent Lambda functions

| Service | Purpose | Cost |
|---------|---------|------|
| API Gateway | Request routing | $0.35/mo |
| Lambda (4 functions) | Microservices | $1,416/mo |
| DynamoDB | Sessions & metadata | $65/mo |
| S3 | Video files (500TB) | $11,540/mo |

**Interview Question**: "Design video streaming for 10M concurrent. How do you prevent cold starts from killing latency?"
**Answer**: Provisioned concurrency, keep warm pools for each function, or use EC2 for compute-heavy encoding

---

### 2️⃣ Real-Time Analytics (Uber/Airbnb)
**Scale**: 1M events/second, 100M dashboard queries/day
**Architecture**: Event stream → Lambda batch → DynamoDB → Query layer
**Cost**: $86/month
**Key Insight**: Separate write path (batch aggregation) from read path (sync query)

| Service | Purpose | Cost |
|---------|---------|------|
| Lambda batch | Aggregate every 10 sec | $2.88/mo |
| DynamoDB writes | Store aggregations | $54/mo |
| DynamoDB reads | Serve dashboard | $0.07/mo |
| S3 archive | Long-term data | $12.50/mo |

**Problem Solved**: Hot partition bottleneck
- All writes to "current_timestamp" partition
- Solution: Use multiple partitions, scan all at query time

**Interview Question**: "Analytics for 1M events/sec. What's the bottleneck?"
**Answer**: DynamoDB partition limit (1000 WCU). Use distributed writes with hash(user_id) % 100

---

### 3️⃣ Photo Sharing (Instagram/Pinterest)
**Scale**: 1B uploads/day, 500M users
**Architecture**: Presigned S3 URLs → Lambda image processing → Multiple resolutions
**Cost**: $253,000/month (with optimization: $100K)
**Key Insight**: Use presigned URLs to upload directly from client (bypass Lambda)

| Service | Purpose | Cost |
|---------|---------|------|
| S3 Upload | Original + 3 resolutions | $86,250/mo |
| Lambda processing | Generate thumbnails, web, HD | $166,667/mo (expensive!) |
| DynamoDB metadata | Photo info, owner, tags | $72/mo |
| DynamoDB feed index | User's photo feed | negligible |

**Cost Optimization**:
- Switch from Lambda to EC2 batch processing: Save $140K/month
- Use Intelligent-Tiering: Save 70-80% after 30 days

**Interview Question**: "Instagram resizes photos to 4 resolutions. How do you handle 1B uploads/day?"
**Answer**: 
- S3 event trigger → Lambda for parallel processing
- Alternative: Use EC2 batch if single image >10 seconds
- Use Intelligent-Tiering for archive (older photos cheaper)

---

### 4️⃣ E-Commerce Search (Amazon/eBay)
**Scale**: 100K QPS peak, 1B products
**Architecture**: API Gateway → Lambda/EC2 → DynamoDB (inventory) + S3 (index)
**Cost**: $11,285/month (EC2) vs $30K (Lambda)
**Key Insight**: Switch from Lambda to EC2 at >1000 req/sec constant load

| Service | Option A (Lambda) | Option B (EC2) |
|---------|------------------|----------------|
| API Gateway | $30,240 | $30,240 |
| Compute | $14,400 + $45K concurrency | $2,220 |
| DynamoDB | $1.50 | $1.50 |
| S3 Index | $23 | $23 |
| **Total** | **$90K** | **$33K** |

**Cost Trade-off**: EC2 saves $57K/month!

**Interview Question**: "eBay search at 100K QPS. Lambda or EC2?"
**Answer**: EC2
- Lambda with provisioned concurrency: $45K/month (expensive)
- EC2 20 instances: $2.2K/month
- At 100K QPS constant: EC2 is 20× cheaper
- Lambda better for <100 QPS or bursty patterns

---

### 5️⃣ Booking System (Airbnb)
**Scale**: 100K concurrent users, 55 checkouts/second
**Architecture**: API Gateway → Lambda → DynamoDB (conditional writes)
**Cost**: $9,075/month
**Key Insight**: Use atomic conditional writes to prevent overbooking

| Service | Purpose | Cost |
|---------|---------|------|
| API Gateway | Auth & routing | $0 (included) |
| Lambda browse | 16.6K req/sec | $8,784/mo |
| Lambda checkout | 55 req/sec | $267/mo |
| DynamoDB sessions | 100K concurrent | $25/mo |
| DynamoDB bookings | Availability tracking | negligible |

**Prevents Overbooking With**:
```
UPDATE bookings
SET available_count = available_count - 1
WHERE listing_id = ? AND check_in_date = ?
IF available_count > 0  // Atomic condition
```
- User A: Succeeds (available goes 1 → 0)
- User B: Fails (available already 0)
- No race condition, no locks, distributed

**Interview Question**: "Prevent overbooking in booking system without locks"
**Answer**: DynamoDB conditional writes
- Atomic update with condition
- Cheaper than pessimistic locking
- Scales globally

---

## Pattern Comparison

| Pattern | Use Case | Primary Service | Cost | Scaling |
|---------|----------|-----------------|------|---------|
| **1. Event-Driven** | Media, workflows | Lambda | $13K | Auto |
| **2. Analytics** | Dashboards, metrics | Lambda batch | $86 | Auto |
| **3. Photo Sharing** | UGC, resizing | S3 + Lambda | $253K | Auto (but optimize) |
| **4. E-Commerce** | High-throughput search | EC2 at scale | $11K | Manual ASG |
| **5. Booking** | Inventory, sessions | DynamoDB | $9K | Auto |

---

## Teaching Checklist

After teaching these 5 patterns, students should understand:

✅ **When to use each service**:
- Lambda: <1000 req/sec, bursty, microservices
- EC2: >1000 req/sec constant, complex processing
- DynamoDB: High throughput, no complex queries
- S3: Storage-dominant workloads
- API Gateway: Request routing, auth

✅ **Cost optimization**:
- HTTP APIs vs REST (71% savings)
- Provisioned concurrency (expensive at scale)
- Intelligent-Tiering for storage
- Switch Lambda → EC2 at 1000 req/sec
- S3 cost dominates media platforms

✅ **Design patterns**:
- Microservices with Lambda
- Async processing (upload + background process)
- Atomic operations (prevent race conditions)
- Batch aggregation + sync query layer
- Pre-computed indexes for search

✅ **Real-world trade-offs**:
- Latency vs cost (cold starts, provisioned concurrency)
- Consistency vs scalability (conditional writes)
- Real-time vs eventual consistency
- Vertical vs horizontal scaling
- Managed services vs self-managed

---

## Interview Preparation

### Common Questions

1. "Design Netflix/video streaming" → Pattern 1 (microservices)
2. "Design Uber/analytics dashboard" → Pattern 2 (batch aggregation)
3. "Design Instagram/photo sharing" → Pattern 3 (async processing)
4. "Design Amazon/product search" → Pattern 4 (switch at scale)
5. "Design Airbnb/booking system" → Pattern 5 (atomic operations)

### Expected Answers

✅ Include cost analysis (not just architecture)
✅ Discuss bottlenecks (hot partitions, cold starts, timeouts)
✅ Consider scaling (1M → 100M → 1B users)
✅ Know when to switch services (Lambda → EC2, DynamoDB → RDS)
✅ Mention tradeoffs (latency, cost, consistency)

---

## Key Insights

1. **Lambda is expensive at scale** (100K concurrent = $45K/month)
2. **S3 cost dominates media platforms** (86% of cost)
3. **DynamoDB conditional writes are powerful** (prevent race conditions atomically)
4. **Batch aggregation + sync query** is the pattern for analytics
5. **EC2 beats Lambda at 1000+ req/sec constant load**

---

**All patterns are in**: SystemArcht_5_Design_Patterns.md (full details, code, questions)

