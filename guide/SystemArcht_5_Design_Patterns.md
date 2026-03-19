# 5 System Design Patterns Using EC2, Lambda, RDS/DynamoDB, S3, API Gateway

These patterns represent real-world system design problems and how to solve them using your 5 AWS services.

---

## Pattern 1: Event-Driven Microservices Architecture (Netflix-like)

### Problem
Design a video streaming platform that handles:
- 100 million users
- Peak: 10 million concurrent viewers
- Variable bitrates (480p to 4K)
- Global distribution
- Real-time notifications

### Solution Architecture

```
┌─────────────┐
│   Client    │
└──────┬──────┘
       │ (API requests)
       ▼
┌──────────────────────────────────────────────┐
│         API Gateway                          │
│  - Rate limiting                             │
│  - Request routing                           │
│  - Authentication/JWT validation             │
└──────────────┬───────────────────────────────┘
               │
        ┌──────┴──────────┬─────────────┬──────────┐
        ▼                 ▼             ▼          ▼
    ┌────────┐     ┌──────────┐  ┌──────────┐  ┌──────────┐
    │Lambda 1│     │ Lambda 2 │  │Lambda 3  │  │Lambda 4  │
    │(Auth)  │     │(Stream)  │  │(Metadata)│  │(Analytics)
    └────┬───┘     └────┬─────┘  └────┬─────┘  └────┬─────┘
         │              │             │             │
         └──────────────┼─────────────┼─────────────┘
                        │
         ┌──────────────┴──────────────┐
         ▼                             ▼
    ┌─────────────┐          ┌─────────────────┐
    │ DynamoDB    │          │      S3         │
    │ (Metadata   │          │ (Video files    │
    │  Sessions)  │          │  Bitrates)      │
    └─────────────┘          └─────────────────┘
```

### Service Usage

**API Gateway**:
- 100M requests/day = 100M / (1B/month) × $3.50 = $0.35/month (REST)
- Authentication: JWT validation <5ms
- Rate limiting: 1000 req/sec per user

**Lambda Functions** (4 independent microservices):
- Auth Lambda: 100M × 50ms = 5M GB-seconds = $83.33/month
- Stream Lambda: 100M × 200ms (process bitrate) = 20M GB-seconds = $333/month
- Metadata Lambda: 100M × 100ms = 10M GB-seconds = $167/month
- Analytics Lambda: 100M × 500ms (aggregation) = 50M GB-seconds = $833/month
- **Total Lambda**: ~$1,416/month

**DynamoDB**:
- Sessions table: 10M concurrent × 1 write = 10M WCU
- User profiles: 100M reads/day = 1.2M RCU
- **Cost**: (10M WCU × $6.25/M) + (1.2M RCU × $1.25/M) = $63 + $1.50 = $64.50/month

**S3**:
- Video files: 500TB storage (1PB in different bitrates)
- **Cost**: (500,000 GB × $0.023) + (100M GET × $0.0004/1000) = $11,500 + $40 = $11,540/month

**Total Monthly Cost**: $13,550

### Key Design Decisions

✅ **Why Lambda?**
- Microservices decouple concerns (auth, streaming, analytics)
- Auto-scales with traffic
- Pay only for execution time
- Can independently optimize each function

✅ **Why DynamoDB?**
- Session data (volatile, high throughput)
- Single-partition key (user_id) for fast lookups
- Eventual consistency OK for metadata

✅ **Why S3?**
- Durable storage for video files
- Multiple bitrates = multiple objects
- Can serve via CloudFront (not modeled in Phase 1)

### Teaching Points

1. **Microservices vs Monolith**: Lambda separates concerns, enables independent scaling
2. **Cold Starts Matter**: 4 Lambda functions = 4 cold starts if traffic bursty
3. **DynamoDB Throughput**: Each 10M concurrent sessions needs pre-provisioning
4. **S3 Cost Dominates**: Storage >> compute for media platforms
5. **Cost Attribution**: Can see cost per function (auth most expensive per transaction)

### Interview Question

"Design a video streaming platform for 100M users. Walk me through the cost and latency trade-offs at 10M concurrent viewers."

**Expected Answer**:
- API Gateway → Lambda (microservices) → DynamoDB (sessions) + S3 (video)
- Cold starts would add 300-1500ms; use provisioned concurrency ($0.015/GB/h)
- DynamoDB hot partition if user_id alone; need composite key (user_id + region)
- S3 retrieval latency 100ms; use CloudFront for <10ms (not in Phase 1)
- Cost: Mostly S3 storage; optimize bitrates and TTL

---

## Pattern 2: Real-Time Analytics & Aggregation (Uber/Airbnb)

### Problem
Design a real-time analytics system that:
- Ingests 1M events/second
- Provides dashboard refreshing every 10 seconds
- Calculates metrics (total bookings, revenue, wait times)
- Detects anomalies
- Low latency (<2s for dashboard)

### Solution Architecture

```
┌─────────────────────────┐
│  Client App (Mobile)    │
│  Request Dashboard      │
└────────────┬────────────┘
             │ (API call)
             ▼
        ┌─────────────┐
        │API Gateway  │
        │Query Handler│
        └────────┬────┘
                 │
                 ▼
        ┌──────────────────┐
        │  Lambda          │
        │  (Query Builder) │
        │  Aggregate       │
        │  Last 10 seconds │
        └────────┬─────────┘
                 │
                 ▼
        ┌──────────────────┐
        │   DynamoDB       │
        │  (Time-series    │
        │   aggregated)    │
        └────────┬─────────┘
                 │
                 ▼
        ┌──────────────────┐
        │   Response       │
        │   <50ms latency  │
        └──────────────────┘

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ (Background)

┌─────────────┐
│Event Stream │ (1M events/sec)
│(Bookings)   │
└────────┬────┘
         │
         ▼
    ┌─────────────────┐
    │Lambda (Batch)   │
    │Every 10 seconds:│
    │Aggregate metrics│
    │Detect anomalies │
    └────────┬────────┘
             │
             ▼
        ┌──────────────────┐
        │   DynamoDB       │
        │  (Store aggreg.) │
        │  Partition by    │
        │  timestamp       │
        └──────────────────┘
```

### Service Usage

**Event Ingestion** (Background Batch):
```
1M events/second
= 86.4B events/day
= 2.592T events/month

Lambda Batch Job (every 10 seconds):
- Read: 10M events from buffer
- Aggregate: Group by city, service type, etc.
- Write: 1000 aggregated records
- Execution: 2 seconds per batch
- 8,640 batches/day

Cost:
- Lambda: (8,640 × 2s × 2GB) / 1B sec × $0.0000166667 = $2.88/month
- DynamoDB Writes: (8,640 × 1000 WCU) / 1B = $54/month
```

**Dashboard Query** (Synchronous):
```
1M dashboard views/day
- Each view = 5 queries (load, revenue, bookings, anomalies, wait times)
- 5M queries/day

Lambda Query:
- Execution: 500ms (DynamoDB scan + aggregation)
- Memory: 512MB
- Cost: (5M × 0.5s × 0.5GB) / 1B × $0.0000166667 = $0.042/month

API Gateway:
- 5M requests × $3.50/1M = $17.50/month

DynamoDB Reads:
- 5M reads/day = 57.9K RCU/month
- Cost: 57.9K × $1.25/1M = $0.072/month

Total Dashboard Cost: $17.61/month
```

**Storage**:
```
DynamoDB:
- 2.592T events/month × $0.25/GB = $648K/month (PROBLEM!)
- Solution: Move to S3 after 30 days (Intelligent-Tiering)
- S3 Cost: $2,000-3,000/month (much cheaper)

S3:
- 1 month of events = 1TB (compressed)
- Cost: 1000 GB × $0.0125 (Intelligent-Tiering) = $12.50/month
```

### Key Design Decisions

✅ **Why Lambda Batch?**
- Scales to 1M events/second without provisioning
- Can retry failed aggregations
- Pay only for processing time

✅ **Why DynamoDB (not RDS)?**
- Time-series data: partition by timestamp
- Hot partitions: timestamp-based (all writes to "current hour")
- Scan queries for dashboard

⚠️ **Problem**: Hot partition bottleneck
- All writes go to current hour partition
- DynamoDB limit: 1000 WCU per partition
- Solution: Use Lambda to fan-out writes across multiple partitions

✅ **Why S3 + Intelligent-Tiering?**
- Raw events: Keep 3 days in DynamoDB (hot)
- Archive: Move to S3 after 3 days (warm/cold)
- Cost: $12/month vs $648K/month in DynamoDB!

### Teaching Points

1. **Hot Partition Problem**: Time-series data concentrates on "now"
2. **Cold Starts at Scale**: 1M events/second needs provisioned concurrency
3. **Storage Tiering**: DynamoDB hot → S3 cold saves 99%+ cost
4. **Aggregation Pattern**: Batch + sync query layer (CQRS)
5. **Latency Trade-off**: Eventual consistency (10s delay) acceptable for analytics

### Interview Question

"Design analytics for 1M events/second. How would you handle the hot partition problem in DynamoDB?"

**Expected Answer**:
- Distribute writes: Instead of one "current_timestamp" partition, use hash(user_id % 100) + timestamp
- Maintain 100 partitions, each handles 10K WCU
- At query time, scan all 100 partitions in parallel via Lambda
- Cost-benefit: More DynamoDB cost vs. lower latency & reliability

---

## Pattern 3: Photo Sharing Service (Instagram/Pinterest)

### Problem
Design a photo sharing platform:
- 500M users, 100M daily active
- 1 billion photos uploaded/day
- 50TB new data/day
- Photos served in multiple resolutions (thumbnail, web, HD, 4K)
- Instant upload + eventual processing

### Solution Architecture

```
┌──────────────────┐
│   Mobile App     │
│   Upload Photo   │
└────────┬─────────┘
         │
         ▼
    ┌──────────────────┐
    │  API Gateway     │
    │  POST /upload    │
    │  Presigned S3    │
    │  URL             │
    └────────┬─────────┘
             │
             ▼
        ┌─────────────────────┐
        │   Lambda            │
        │   Generate          │
        │   Presigned URL     │
        │   Valid 15 min      │
        └────────┬────────────┘
                 │
    ┌────────────┴────────────┐
    ▼                         ▼
┌─────────────┐      ┌──────────────┐
│Client uploads│     │DynamoDB      │
│directly to   │     │Store metadata│
│S3 via        │     │filename, user│
│presigned URL │     │timestamp, etc│
└─────────────┘     └──────────────┘
    │
    └─────────────────────────────────────────────────┐
                                                      │
                    (S3 Event Trigger)                │
                                                      ▼
                            ┌────────────────────────────────┐
                            │  Lambda (Image Processing)     │
                            │  - Generate thumbnails (200px) │
                            │  - Generate web (1000px)       │
                            │  - Generate HD (2000px)        │
                            │  - Extract metadata (EXIF)     │
                            │  - Detect inappropriate content│
                            └────────────┬───────────────────┘
                                         │
                         ┌───────────────┼───────────────┐
                         ▼               ▼               ▼
                    ┌────────┐     ┌─────────┐     ┌──────────┐
                    │S3      │     │DynamoDB │     │DynamoDB  │
                    │(Multiple   │ │(Photo   │     │(Index    │
                    │resolutions)│ │metadata)│     │for feed) │
                    └────────┘     └─────────┘     └──────────┘

┌─────────────────────────────────────────────────────────────┐
│                   CLIENT VIEWING FLOW                        │
└─────────────────────────────────────────────────────────────┘

┌──────────────────┐
│  Mobile App      │
│  Get Feed        │
└────────┬─────────┘
         │
         ▼
    ┌──────────────────┐
    │  API Gateway     │
    │  GET /feed       │
    └────────┬─────────┘
             │
             ▼
    ┌──────────────────────┐
    │  Lambda              │
    │  Query DynamoDB      │
    │  Index (User_Feed)   │
    │  Get 20 photo IDs    │
    └────────┬─────────────┘
             │
             ▼
    ┌──────────────────────┐
    │  DynamoDB            │
    │  (Feed Index)        │
    │  user_id + timestamp │
    │  <100ms response     │
    └────────┬─────────────┘
             │
             ▼
    ┌──────────────────────┐
    │  Lambda              │
    │  Fetch photo URLs    │
    │  from metadata table │
    │  Generate CloudFront │
    │  URLs for web version│
    └────────┬─────────────┘
             │
             ▼
    ┌──────────────────────┐
    │  Response to Client  │
    │  20 photo URLs       │
    │  + metadata          │
    │  <200ms total        │
    └──────────────────────┘
```

### Service Usage

**Upload Phase**:
```
1B photos/day = 50TB/day

S3 Upload (Presigned URL):
- PUTs: 1B × $0.005/1000 = $5,000/month
- Storage: 50TB/day × 30 days = 1.5PB
  - Original: 1500TB × $0.023 = $34,500/month
  - Thumbnail: 1500TB × 0.2 (90% compressed) × $0.023 = $6,900/month
  - Web: 1500TB × 0.5 × $0.023 = $17,250/month
  - HD: 1500TB × 0.8 × $0.023 = $27,600/month
  - Total S3: $86,250/month (can optimize with GLACIER)

DynamoDB Metadata:
- 1B writes/day = 11.6M WCU
- Cost: 11.6M × $6.25/1M = $72.50/month

Lambda Image Processing:
- 1B images × 10 seconds (all conversions) = 10B seconds
- At 1GB memory: 10B × 1 / 1B × $0.0000166667 = $166,667/month
- Problem: Too slow! Need parallel processing
```

**Feed Query Phase**:
```
DynamoDB Feed Index:
- 100M DAU × 5 feed views/day = 500M reads
- Partition key: user_id, Sort key: timestamp (reverse)
- Cost: 500M RCU × $1.25/1M = $0.625/month (cheap!)

Lambda Feed Generation:
- 500M requests × 100ms = 50M GB-seconds
- Cost: 50M × $0.0000166667 = $833/month
```

### Key Design Decisions

✅ **Why S3 Presigned URLs?**
- Upload directly from client → S3 (no Lambda involved)
- Reduces Lambda cold starts
- Bandwidth: Client → S3 (faster than client → API → Lambda → S3)

✅ **Why Lambda for Image Processing?**
- Triggered by S3 events (put-object)
- Process in background (user doesn't wait)
- Parallel: Generate all resolutions at once

⚠️ **Problem**: Lambda has 15-minute timeout
- 10 seconds per image × 1000 images in parallel
- Solution: Use 1000 concurrent Lambda instances (provisioned concurrency)
- Cost: 1000 instances × 1GB × $0.015/hour = $360/month
- Or: Move to EC2 for batch processing (cheaper at scale)

✅ **Why DynamoDB for Feed?**
- User_id + timestamp = efficient scan
- Fast queries (<100ms)
- Auto-scales with reads

✅ **Why S3 + Intelligent-Tiering for archival?**
- Hot (30 days): STANDARD ($0.023/GB)
- Warm (30-90 days): STANDARD-IA ($0.0125/GB) (70% cheaper)
- Cold (90+ days): GLACIER ($0.004/GB) (83% cheaper)

### Teaching Points

1. **Async Processing**: Upload immediately, process in background (Lambda)
2. **S3 Presigned URLs**: Avoid bottleneck of proxying uploads through Lambda
3. **Multiple Resolutions**: Store separately (thumbnail, web, HD, 4K)
4. **Feed Index**: DynamoDB GSI with user_id + timestamp for fast pagination
5. **Cost Optimization**: INTELLIGENT_TIERING saves 70-80% on archive

### Interview Question

"Instagram stores 1B photos/day. How would you handle resizing photos to 4 different resolutions while keeping costs low?"

**Expected Answer**:
- Use S3 event triggers → Lambda for each resolution in parallel
- Store original + 3 resolutions as separate S3 objects
- Use Intelligent-Tiering to auto-optimize cost after 30 days
- Alternative: Use ImageMagick on EC2 if single image takes >10 seconds (Lambda timeout)
- Total cost: Mostly S3 storage ($86K/month); Lambda processing ($166K) is expensive, might switch to batch EC2

---

## Pattern 4: E-Commerce Search & Inventory (Amazon/eBay)

### Problem
Design an e-commerce search system:
- 1 billion products
- 100K QPS during peak (Black Friday)
- Sub-100ms search latency
- Real-time inventory updates
- Filtering (price, category, brand, ratings)
- Sorting (relevance, price, ratings)

### Solution Architecture

```
┌─────────────────────────┐
│   Web/Mobile App        │
│   Search "laptop"       │
└────────────┬────────────┘
             │
             ▼
        ┌─────────────────────┐
        │  API Gateway        │
        │  GET /search?q=...  │
        │  Rate limit: 1000   │
        │  req/sec per user   │
        └────────────┬────────┘
                     │
                     ▼
        ┌─────────────────────────┐
        │  Lambda (Search)        │
        │  - Validate query       │
        │  - Build filter params  │
        │  - Query Elasticsearch  │
        │  (not modeled in Phase 1)
        │  - Sort results         │
        │  - Add inventory status │
        └────────────┬────────────┘
                     │
         ┌───────────┴────────────┐
         ▼                        ▼
    ┌─────────────┐      ┌──────────────────┐
    │ DynamoDB    │      │      S3          │
    │ (Inventory) │      │ (Pre-computed    │
    │ Stock levels│      │  search index)   │
    │ Product IDs │      │ (1TB, updated    │
    │ Per product │      │  daily)          │
    └─────────────┘      └──────────────────┘
         │                        │
         └───────────┬────────────┘
                     │
                     ▼
        ┌─────────────────────────┐
        │  Response               │
        │  - 20 results           │
        │  - Metadata (price,     │
        │    rating, stock)       │
        │  - <100ms latency       │
        └─────────────────────────┘

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ (Background)

┌────────────────────────────┐
│  Product Catalog Updated   │
│  (New products, pricing)   │
└────────────┬───────────────┘
             │
             ▼
    ┌──────────────────────────┐
    │  Lambda (Batch Index)    │
    │  Every 1 hour:           │
    │  - Read from product DB  │
    │  - Generate search index │
    │  - Write to S3           │
    │  - 1 hour to process     │
    └────────────┬─────────────┘
                 │
                 ▼
    ┌──────────────────────────┐
    │  S3                      │
    │  (Search index, 1TB)     │
    │  Format: Parquet/JSON    │
    │  Updated daily           │
    └──────────────────────────┘

┌────────────────────────────┐
│  Inventory Update          │
│  (Stock decreases)         │
└────────────┬───────────────┘
             │
             ▼
    ┌──────────────────────────┐
    │  Lambda (Sync Inventory) │
    │  Triggered by order      │
    │  - Decrement stock       │
    │  - Check if low          │
    │  - Trigger reorder       │
    └────────────┬─────────────┘
                 │
                 ▼
    ┌──────────────────────────┐
    │  DynamoDB                │
    │  products_inventory      │
    │  sku + warehouse_id      │
    │  stock_level (updated)   │
    └──────────────────────────┘
```

### Service Usage

**Search Query** (100K QPS):
```
100K QPS × 86,400 sec/day = 8.64B queries/day

API Gateway:
- 8.64B requests × $3.50/1M = $30,240/month (REST)
- Consider HTTP APIs: $8,640 (71% cheaper!)
- Switching to HTTP saves: $21,600/month

Lambda Search:
- 8.64B × 100ms = 864M GB-seconds
- Cost: 864M × $0.0000166667 = $14,400/month
- Problem: 100K concurrent invocations needed
- Provisioned concurrency: 100K × 0.125GB × $0.015/hour = $45,000/month

DynamoDB Inventory:
- 100K reads/second = 8.64B/day
- 1.2M RCU × $1.25/1M = $1.50/month (negligible!)
- Partition: product_sku (1B products ÷ many partitions = no hot)

S3 Search Index:
- Size: 1TB × $0.023 = $23/month
- Requests: 1M index loads/day × $0.0004/1000 = $0.0004/month
```

**Inventory Updates** (1M updates/second):
```
Lambda Sync:
- 86.4B updates/day × 50ms = 4.32B GB-seconds
- Cost: 4.32B × $0.0000166667 = $72,000/month

DynamoDB Writes:
- 1M WCU × $6.25/1M = $6.25/month (cheap!)
```

### Key Design Decisions

✅ **Why S3 Search Index (not Elasticsearch)?**
- Phase 1 doesn't include Elasticsearch modeling
- Simulate: Pre-computed index loaded into memory
- In reality: Would use Elasticsearch/Opensearch for sub-100ms queries

✅ **Why HTTP APIs instead of REST?**
- 71% cheaper ($1 vs $3.50 per 1M)
- Saves $21,600/month
- Sufficient for stateless APIs

✅ **Why Provisioned Concurrency for Lambda?**
- Cold starts at 100K QPS = disaster
- On-demand Lambda can't handle instant scaling
- Provisioned: Keep 100K warm containers always
- Cost: $45K/month (expensive but necessary at scale)

⚠️ **Alternative: Use EC2 instead of Lambda**
- API Gateway → ALB → EC2 fleet
- 100K req/sec ÷ 5000 req/sec per m5.large = 20 instances
- Cost: 20 × m5.large × $0.192/h = $91.52/h = $2,220/month
- Much cheaper than Lambda at scale! (-$42K/month)

✅ **Why DynamoDB for Inventory?**
- 1M concurrent writes
- No complex queries (just update stock)
- Eventual consistency OK (slight lag acceptable)

### Teaching Points

1. **API Gateway Cost**: HTTP vs REST (71% difference)
2. **Lambda at Scale**: Provisioned concurrency mandatory ($45K)
3. **Cold Starts Kill SLA**: At 100K QPS, even 1% cold starts = 1000 errors/sec
4. **EC2 Cheaper at Scale**: Switch from Lambda to EC2 at ~1000 req/sec constant
5. **Search Index Pattern**: Pre-compute offline, serve from memory

### Interview Question

"eBay search handles 100K QPS. Would you use Lambda or EC2? Why?"

**Expected Answer**:
```
Option 1: Lambda + Provisioned Concurrency
- Cost: $45K/month (concurrency) + $14K (duration) = $59K/month
- Latency: 100-200ms (including cold start penalty)
- Scaling: Automatic to 1M concurrency
- Complexity: API Gateway, Lambda, DynamoDB

Option 2: EC2 + ALB + RDS
- Cost: 20 × m5.large = $2.2K/month
- Latency: 50-100ms (no cold starts)
- Scaling: Manual (need ASG)
- Complexity: Load balancer, instance management

Recommendation: EC2 (27× cheaper)

Why?: At 100K QPS constant load, EC2 amortizes to $0.0002 per request
Lambda: $0.007 per request (35× more expensive)

When to use Lambda?: <100 req/sec or very bursty (1000 → 100 → 1000)
```

---

## Pattern 5: User Session & Cache Layer (Airbnb Booking)

### Problem
Design a high-traffic booking system:
- 100K concurrent users browsing/booking
- Sub-200ms response for checkout
- Real-time availability (overbooking prevention)
- Session management (user state)
- Cart management (temporary)

### Solution Architecture

```
┌────────────────────────────┐
│   Web Browser              │
│   Browse listings          │
│   Add to cart              │
│   Checkout                 │
└────────────┬───────────────┘
             │
             ▼
        ┌──────────────────────┐
        │  API Gateway         │
        │  - Route requests    │
        │  - Validate JWT      │
        │  - Rate limit        │
        └────────────┬─────────┘
                     │
        ┌────────────┴─────────┐
        ▼                      ▼
   ┌──────────────┐      ┌─────────────────┐
   │Lambda        │      │Lambda           │
   │(Browse/      │      │(Checkout)       │
   │Search)       │      │(Payment)        │
   └────┬─────────┘      └────┬────────────┘
        │                     │
    ┌───┴──────────┐          │
    ▼              ▼          │
┌────────┐   ┌──────────┐    │
│DynamoDB│   │DynamoDB  │    │
│Search  │   │User      │    │
│Index   │   │Sessions  │    │
└────────┘   └──────────┘    │
                              │
                              ▼
                         ┌──────────────────┐
                         │  DynamoDB        │
                         │  Bookings Table  │
                         │  Partition:      │
                         │  listing_id +    │
                         │  check_in_date   │
                         │                  │
                         │  ATOMIC          │
                         │  Conditional     │
                         │  Write           │
                         └──────────────────┘
```

### Service Usage & Design

**Browse Phase** (Read-Heavy):
```
100K concurrent × 10 requests/minute = 16.6K req/sec

Lambda Browse:
- 16.6K req/sec × 24h × 30 days = 43.2B requests/month
- Execution: 200ms (fetch listings + user profile)
- Cost: 43.2B × $0.20/1M + (43.2B × 0.2s × 1GB) × $0.0000166667
        = $8,640 + $144 = $8,784/month

DynamoDB Search Index:
- 16.6K reads/sec = 19.7M RCU/month
- Cost: 19.7M × $1.25/1M = $24.63/month

Sessions:
- 100K active sessions
- Each session: 1KB data
- Cost: (100K × 1KB / 1M × 1GB) × $0.25 = $0.000025/month (negligible)
```

**Checkout Phase** (Write-Heavy + Coordination):
```
100K concurrent × 2 checkouts/hour = 55 req/sec

Lambda Checkout:
- 55 req/sec × 24h × 30d = 143M requests
- Execution: 500ms (payment processing, inventory lock)
- Cost: 143M × $0.20/1M + (143M × 0.5s × 1GB) × $0.0000166667
        = $28.60 + $238 = $266.60/month

DynamoDB Bookings (Inventory):
- 55 writes/sec
- CONDITIONAL WRITE (only if available):
  - Prevents overbooking
  - Atomic operation
  - Cost: 55 × $6.25/1M = $0.000344/month
  - Problem: Hot partition!
    - listing_id = "123", check_in = "2024-03-20"
    - All bookings for same date go to same partition
    - DynamoDB limit: 1000 WCU per partition
    - At 55 writes, we're fine (no hot partition)
```

**Session Management**:
```
User Sessions (DynamoDB):
- 100K concurrent
- TTL: 1 hour
- Partition: session_id (uniform distribution, no hot partition)
- Cost: 100K × $0.25 = $25/month storage

Session Updates:
- Every 5 minutes: 20M updates/day
- Cost: 20M WCU = $0.125/month
```

### Key Design Decisions

✅ **Why Conditional Writes in DynamoDB?**
```
Instead of:
1. Read availability
2. Check if available
3. Write booking
(Race condition: two users book same room)

Use DynamoDB conditional write:
1. Write booking with condition: "available_count > 0"
   - Atomic (no race condition)
   - Fails if condition not met
   - Returns error immediately

Prevents overbooking without locks
```

✅ **Why Lambda instead of EC2?**
- 55 req/sec avg, spikes to 500 req/sec
- Lambda auto-scales, no provisioning
- EC2 would be idle 95% of time
- Cold starts OK (<1 second acceptable during checkout)

⚠️ **Problem**: Payment Processing
- Can't stay in Lambda >15 minutes
- Use Lambda to initiate, then check status
- Real architecture: Stripe webhook → Lambda (async confirmation)

✅ **Why DynamoDB (not RDS)?**
- Session data: volatile, high throughput
- Availability: no complex queries
- Partition key: session_id (uniform)
- Perfect fit for DynamoDB

✅ **Why NOT a Cache (ElastiCache)?**
- Phase 1 focuses on core 5 services
- In reality: Cache user profiles (200KB × 100K = 20GB)
- Cost: ElastiCache $0.017/hour (not modeled here)

### Teaching Points

1. **Conditional Writes**: Prevent race conditions without locking
2. **Hot Partition**: listing_id + date concentrates writes
3. **Session TTL**: Auto-delete expired sessions (DynamoDB feature)
4. **Atomic Operations**: ACID-like guarantees in DynamoDB
5. **Async Patterns**: Don't block on payment; use webhook confirmation

### Interview Question

"Airbnb handles 55 checkouts/second. How would you prevent overbooking?"

**Expected Answer**:
```
Problem: Two users try to book same listing simultaneously
- User A: Read available_count = 1
- User B: Read available_count = 1
- Both think it's available
- Both book (overbooking!)

Solution: Conditional Write in DynamoDB
- Update bookings WITH condition: "available_count > 0"
- AND decrement available_count atomically
- User A: Succeeds (available_count: 1 → 0)
- User B: Fails (available_count is now 0)
- No race condition, no locks needed

Alternative (Old approach):
- Use pessimistic locks (RDS)
- SELECT FOR UPDATE listing WHERE id = 123
- More complex, slower, doesn't scale

DynamoDB wins: Atomic, distributed, no locks
```

---

## Summary Table: When to Use Which Pattern

| Pattern | Use Case | Primary Service | Cost Model |
|---------|----------|-----------------|-----------|
| **Event-Driven Microservices** | Media streaming, complex workflows | Lambda + DynamoDB | Pay per invocation |
| **Real-Time Analytics** | Dashboards, metrics, anomalies | Lambda batch + DynamoDB | Pay per aggregation |
| **Photo Sharing** | User-generated content, resizing | S3 + Lambda + DynamoDB | Pay per storage/processing |
| **E-Commerce Search** | High-throughput search, filtering | API Gateway + Lambda/EC2 | Pay per request (switch at scale) |
| **Booking System** | Sessions, inventory, payments | DynamoDB + Lambda | Pay per write + session |

### Cost Breakdowns

| Pattern | API Gateway | Lambda | DynamoDB | S3 | EC2 | Total |
|---------|-------------|--------|----------|-----|-----|-------|
| **Event-Driven** | $0.35 | $1,416 | $64 | $11,540 | - | $13,020 |
| **Analytics** | $17.50 | $2.88 | $54 | $12 | - | $86 |
| **Photo Sharing** | $0 | $166K* | $72 | $86,250 | $360* | $253K* |
| **E-Commerce** | $30,240→$8,640** | $14,400→$2,220*** | $1.50 | $23 | - | $23,285→$11K |
| **Booking** | $0 | $9,050 | $25 | - | - | $9,075 |

*With optimization (batch processing on EC2)
**HTTP APIs save 71% vs REST
***EC2 instead of Lambda at scale

---

## Key Takeaways for Interview Preparation

1. **Always consider cost trade-offs**
   - Lambda vs EC2: Lambda cheaper <100 req/sec
   - REST vs HTTP APIs: HTTP 71% cheaper
   - RDS vs DynamoDB: DynamoDB scales writes better

2. **Understand service limitations**
   - Lambda: 15-minute timeout (batch jobs fail)
   - DynamoDB hot partition: Single partition limit is bottleneck
   - S3: Eventually consistent (writes → reads lag)
   - EC2: Requires capacity planning

3. **Recognize patterns**
   - Event-driven: Decouple with Lambda/SQS
   - Analytics: Batch aggregation + sync query layer
   - Real-time: Cache hot data, DynamoDB for consistency
   - High-throughput: Conditional writes, atomic updates

4. **Calculate costs realistically**
   - Storage dominates (S3 often >70% of bill)
   - Data transfer costs hidden (10-30% of bill)
   - Provisioned concurrency expensive ($45K/month at scale)
   - Switch to EC2 at ~1000 req/sec constant

5. **Think about scale**
   - 1M users: One EC2 instance
   - 100M users: Fleet of EC2 + caching layer
   - 1B+ operations: Distributed database + event streaming
   - Always question: "Will this work at 10× scale?"

