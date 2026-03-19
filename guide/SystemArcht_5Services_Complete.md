# SystemArcht Phase 1: Implementation Guide for 5 Core AWS Services

**Services**: EC2 • Lambda • RDS/DynamoDB • S3 • API Gateway
**Timeline**: 8 weeks
**Focus**: Serverless-first architecture with traditional compute backup

---

## Executive Summary

You've selected **5 core services** that cover both **serverless** and **traditional** cloud architectures:

| Service | Purpose | Pricing | Complexity |
|---------|---------|---------|-----------|
| **API Gateway** | Request routing & auth | $1-3.50 per 1M requests | Medium |
| **Lambda** | Serverless compute | $0.0000002/req + $0.0000166667/GB-sec | High |
| **EC2** | Traditional compute | $0.02-0.38/hour | Medium |
| **RDS/DynamoDB** | Data storage | $0.17-3.26/hour (RDS) or $1.25/million RCU (DynamoDB) | Very High |
| **S3** | Object storage | $0.023/GB-month | Low |

**Advantage of this combination**: You can teach **both serverless (API GW + Lambda + DynamoDB)** and **traditional (EC2 + RDS + S3)** patterns.

---

## Service 1: API Gateway (The Front Door)

### Overview
API Gateway acts as a "front door" to allow applications to access data and business logic and trigger functionality from backend services such as AWS Lambda, Amazon EC2, Amazon DynamoDB, and Amazon Kinesis.

### Pricing Model
HTTP APIs cost $1.00 per million requests while REST APIs cost $3.50 per million requests, making HTTP APIs 71% cheaper.

**Pricing Breakdown**:
- **HTTP APIs**: $1.00 per 1M requests (first 300M)
- **REST APIs**: $3.50 per 1M requests
- **WebSocket APIs**: $1.00 per 1M messages
- **Data Transfer Out**: $0.09/GB (to internet)
- **Caching**: $0.02/hour (0.5 GB) to $0.38/hour (237 GB)
- **Free Tier**: 1M requests/month for 12 months

**Key Behavior**: Each request that reaches API Gateway is billable, whether it succeeds or fails. Failed authentication requests still count.

### Simulation Logic

```typescript
interface APIGatewayRequest {
  id: string;
  method: "GET" | "POST" | "PUT" | "DELETE";
  path: string;
  size_bytes: number;
  timestamp: number;
}

interface APIGatewayMetrics {
  total_requests: number;
  successful_requests: number;
  failed_requests: number;
  data_transfer_out_bytes: number;
  
  // Per integration type
  lambda_invocations: number;
  dynamodb_calls: number;
  rds_calls: number;
  s3_calls: number;
  ec2_calls: number;
}

function processAPIGatewayRequest(
  request: APIGatewayRequest,
  apiType: "HTTP" | "REST" | "WebSocket"
): {
  latency_ms: number;
  success: boolean;
  reason?: string;
} {
  // API Gateway latency: 1-3ms baseline
  let latency = 2; // ms
  
  // Authentication: +5-50ms depending on method
  if (request.authRequired) {
    const authLatency = request.authMethod === "JWT" ? 5 : 20;
    latency += authLatency;
  }
  
  // Rate limiting check: <1ms
  if (isRateLimited(request)) {
    return {latency, success: false, reason: "Rate limited (429)"};
  }
  
  // Request transformation: +0-10ms
  latency += request.needsTransformation ? 5 : 0;
  
  // Forward to backend (next service handles)
  return {latency, success: true};
}

function calculateAPIGatewayCost(metrics: APIGatewayMetrics, apiType: string): number {
  let cost = 0;
  
  // Request cost
  const requestPrice = apiType === "HTTP" ? 1.00 : 3.50;  // per million
  cost += (metrics.total_requests / 1_000_000) * requestPrice;
  
  // Data transfer cost: $0.09/GB outbound
  const dataTransferGB = metrics.data_transfer_out_bytes / (1024 ** 3);
  cost += dataTransferGB * 0.09;
  
  return cost;
}
```

### Teaching Points
✓ API Gateway is often **most expensive per-request** when combined with Lambda
✓ **HTTP vs REST**: 71% cost difference; use HTTP for simple serverless apps
✓ Data transfer costs can be **10-30%** of total API Gateway costs
✓ Failed requests still count (authentication failures, rate limiting)
✓ Caching can save backend calls but costs $0.02-0.38/hour

---

## Service 2: Lambda (Serverless Compute)

### Overview
Lambda charges based on the number of requests for your functions and the duration it takes for your code to execute, with the price depending on the amount of memory you allocate to your function.

### Pricing Model
**Core Charges**:
- **Requests**: $0.20 per 1M requests
- **Duration**: $0.0000166667 per GB-second (or $0.00001667 per 128MB-second)
- **Minimum**: 100ms per invocation (billed in 1ms increments)
- **Provisioned Concurrency**: $0.015 per GB-hour

**Example Calculation**:
```
100 requests/second, 200ms execution, 128MB memory
= 100 req/sec × 86,400 sec/day
= 8.64 million requests/day
= 259.2 million requests/month

Cost = (259.2M / 1M) × $0.20 = $51.84 (requests)

GB-seconds = (259.2M × 0.2 seconds × 128MB) / (1024MB) = 12,646 GB-seconds/month
Cost = 12,646 × $0.0000166667 = $0.21 (duration)

Total: $52.05/month
```

### Simulation Logic

```typescript
interface LambdaFunctionConfig {
  memory_mb: number;
  timeout_seconds: number;
  runtime: "nodejs18.x" | "python3.11" | "java11";
  provisioned_concurrency?: number;
}

interface LambdaInvocation {
  request_id: string;
  is_cold_start: boolean;
  duration_ms: number;
  memory_used_mb: number;
  success: boolean;
}

function simulateLambdaInvocation(
  func: LambdaFunctionConfig,
  previousInvocations: number,
  timeSinceLastInvocation: number
): LambdaInvocation {
  // Determine if cold start
  // Cold starts occur if: no warm containers OR time since last invocation > 15 min
  const isColdStart = previousInvocations === 0 || timeSinceLastInvocation > 900000;
  
  // Cold start latency (runtime-dependent)
  const coldStartLatencies = {
    "nodejs18.x": 400,    // ms
    "python3.11": 300,
    "java11": 1500,
  };
  
  let duration = isColdStart ? coldStartLatencies[func.runtime] : 0;
  
  // Function execution time (assume 200ms baseline for this simulation)
  const executionTime = 200;
  
  // Memory impact: More memory = Faster CPU
  // Memory doubles, CPU roughly 2x faster
  const memoryFactor = func.memory_mb / 1024;  // 1x at 1GB
  const adjustedExecutionTime = executionTime / Math.sqrt(memoryFactor);
  
  duration += adjustedExecutionTime;
  
  // Check timeout
  const success = duration <= func.timeout_seconds * 1000;
  
  if (!success) {
    duration = func.timeout_seconds * 1000;  // Capped at timeout
  }
  
  return {
    request_id: generateId(),
    is_cold_start: isColdStart,
    duration_ms: duration,
    memory_used_mb: func.memory_mb * 0.85,  // ~85% utilization
    success,
  };
}

function calculateLambdaCost(
  metrics: {
    total_invocations: number;
    total_duration_ms: number;
    memory_mb: number;
  }
): number {
  // Invocation cost
  const invocationCost = (metrics.total_invocations / 1_000_000) * 0.20;
  
  // Duration cost (billed per 1ms)
  const gbSeconds = (metrics.total_duration_ms / 1000) * (metrics.memory_mb / 1024);
  const durationCost = gbSeconds * 0.0000166667;
  
  return invocationCost + durationCost;
}
```

### Cold Start Impact

**Real-world latencies** by runtime:
```
Python 3.11:     ~300ms  (best for web APIs)
Node.js 18:      ~400ms  (balanced)
Java 11:         ~1500ms (avoid for latency-sensitive)

For API endpoints requiring <100ms response:
Cold start makes this impossible!
```

### Teaching Points
✓ **Cold starts kill latency**: 1-3s penalty on first invocation
✓ **Memory CPU correlation**: Double memory ≈ 2x CPU speed
✓ **Provisioned Concurrency**: Pre-warm containers at $0.015/GB-hour cost
✓ **Cost calculation**: Often cheaper than EC2 for **bursty** traffic
✓ **vs EC2**: Lambda <100 req/sec cheaper; EC2 wins at >1000 req/sec constant load

---

## Service 3: RDS vs DynamoDB (Data Storage)

### RDS (Relational Database)

**Pricing** (us-east-1):
- **db.t3.small**: $0.017/hour ($122/month)
- **db.t3.medium**: $0.034/hour ($245/month)
- **db.m5.large**: $0.192/hour ($1,382/month)
- **Storage**: $0.23/GB-month (SSD gp2)
- **Backup**: $0.095/GB-month
- **Multi-AZ**: +100% on instance cost

**Key Behaviors**:
```typescript
interface RDSInstance {
  max_connections: number;        // db.t3.small: 100
  max_iops: number;               // gp2: baseline
  connection_pool_exhaustion: boolean;
  failover_time_seconds: number;  // 60-120
  multi_az: boolean;
}

// Connection pool under load
// If connections > max_connections, queries are queued or fail
// Each additional connection adds ~5ms latency

// Multi-AZ adds synchronous replication overhead
// Writes: +5-10ms latency
// Failover: 60-120 second window of unavailability
```

### DynamoDB (NoSQL Database)

**Pricing** (on-demand mode):
- **Read**: $1.25 per 1M RCU (Read Capacity Units)
  - 1 RCU = 1 strongly consistent read of 4 KB item/sec
- **Write**: $6.25 per 1M WCU (Write Capacity Units)
  - 1 WCU = 1 write of 1 KB item/sec
- **Storage**: $0.25 per GB-month
- **Free Tier**: 25 RCU, 25 WCU, 1 GB storage

**Provisioned Mode** (better for predictable workloads):
- **RCU**: $0.00013 per RCU-hour
- **WCU**: $0.00065 per WCU-hour

**Key Behaviors**:
```typescript
interface DynamoDBTable {
  partition_key: string;
  sort_key?: string;
  rcu: number;          // Read Capacity Units
  wcu: number;          // Write Capacity Units
  
  // Hot partition detection: If traffic concentrated
  // on single partition key, throughput is limited
  // by that partition (3000 RCU, 1000 WCU per partition)
}

// On-demand: Pay per request (good for bursty)
// Provisioned: Fixed capacity (good for predictable)

// Queries vs Scans
// Query: 1 RCU = 1 read per second (efficient)
// Scan: 1 RCU = 0.25 items per second (inefficient)
```

### RDS vs DynamoDB Comparison

| Aspect | RDS | DynamoDB |
|--------|-----|----------|
| **Best For** | Complex queries, ACID | Fast key-value, eventual consistency |
| **Latency** | 1-5ms (query dependent) | <1ms (single digit) |
| **Cost/GB** | $0.23 | $0.25 |
| **Scaling** | Manual (instance size) | Automatic |
| **Complexity** | Medium (SQL) | Low (key-value) |
| **Cost per 1M ops** | $50+ (compute) | $1.25 RCU/$6.25 WCU |

### Teaching Points
✓ **RDS is cheaper for static data** (storage + compute)
✓ **DynamoDB is cheaper for high-frequency operations** (millions of reads)
✓ **Multi-AZ doubles RDS cost** but prevents AZ-level outages
✓ **DynamoDB hot partition bottleneck** is real (3000 RCU per partition)
✓ **Query vs Scan**: Scan can waste 75% of RCU (teach query optimization)

---

## Service 4: S3 (Object Storage)

### Pricing Model
AWS charges for every request, message, or connection minute that reaches the gateway with no minimum fees or upfront commitments.

**S3 Pricing**:
- **Storage**: $0.023/GB-month (STANDARD)
- **Requests**: $0.0004 per 1000 GET, $0.005 per 1000 PUT
- **Data Transfer Out**: $0.02/GB (to internet), free intra-region
- **Storage Classes**: 
  - STANDARD: $0.023/GB
  - INTELLIGENT-TIERING: $0.0125/GB
  - GLACIER: $0.004/GB
  - DEEP_ARCHIVE: $0.00099/GB

### Simulation Logic

```typescript
interface S3Bucket {
  storage_class: "STANDARD" | "INTELLIGENT_TIERING" | "GLACIER";
  total_objects: number;
  total_size_gb: number;
  
  // Lifecycle rules
  transition_to_ia_days: number;        // Auto-move after N days
  transition_to_glacier_days: number;
  expiration_days: number;              // Auto-delete after N days
}

interface S3Operations {
  get_requests: number;
  put_requests: number;
  delete_requests: number;
  list_requests: number;
  data_retrieved_gb: number;
}

function calculateS3Cost(bucket: S3Bucket, operations: S3Operations): number {
  // Determine storage cost based on class
  const storageCosts = {
    "STANDARD": 0.023,
    "INTELLIGENT_TIERING": 0.0125,
    "GLACIER": 0.004,
    "DEEP_ARCHIVE": 0.00099,
  };
  
  const monthlyCost = (bucket.total_size_gb * storageCosts[bucket.storage_class]);
  const hourlyCost = monthlyCost / 730;  // hours per month
  
  // Request costs (monthly)
  let requestCost = 0;
  requestCost += (operations.get_requests / 1000) * 0.0004;
  requestCost += (operations.put_requests / 1000) * 0.005;
  requestCost += (operations.delete_requests / 1000) * 0.0004;
  requestCost += (operations.list_requests / 1000) * 0.005;
  
  // Data transfer cost
  const transferCost = operations.data_retrieved_gb * 0.02;
  
  // Retrieval cost (only for GLACIER/DEEP_ARCHIVE)
  const retrievalCost = bucket.storage_class === "GLACIER" ? 
    operations.data_retrieved_gb * 0.03 : 0;
  
  return hourlyCost + (requestCost / 730) + transferCost + (retrievalCost / 730);
}

// Lifecycle example: Photo storage app
// Day 0-30: STANDARD (hot access)
// Day 31-90: INTELLIGENT_TIERING (moderate access)
// Day 91+: GLACIER (archive)
// After 1 year: Auto-delete
```

### Teaching Points
✓ **Storage class selection dramatically impacts cost** (GLACIER 82% cheaper)
✓ **Lifecycle policies are essential** for cost optimization
✓ **Data transfer dominates cost** for high-traffic buckets
✓ **Request costs are negligible** unless millions of requests
✓ **Retrieval cost from GLACIER** can exceed storage cost if accessed frequently

---

## Service 5: EC2 (Traditional Compute)

### Pricing Model
- **On-Demand**: $0.02-0.38/hour (t3.micro → m5.2xlarge)
- **Reserved Instances**: 30-50% discount (1-3 year commitment)
- **Spot Instances**: 70-90% discount, 2-minute interruption notice
- **Data Transfer**: $0.02/GB outbound

### Key EC2 Behaviors

```typescript
interface EC2Instance {
  instance_type: string;  // t3.micro, t3.small, m5.large, etc.
  state: "running" | "stopped" | "terminated";
  
  // For burstable t3 instances
  cpu_credit_balance: number;
  baseline_cpu_percent: number;  // 5% (t3.micro), 10% (t3.small), 20% (t3.medium)
  is_throttled: boolean;
}

// t3 CPU Credit Model
// Accumulate credits at baseline CPU (5% for t3.micro)
// Every 1 vCPU-hour at 100% = 1 credit used
// 1 vCPU-hour at 5% = 0.05 credit used, 0.95 credit gained

function updateEC2CPUCredits(instance: EC2Instance, timeStepMs: number) {
  const baseline = instance.baseline_cpu_percent;
  const utilization = instance.current_cpu_utilization;
  
  // Credit accumulation
  const accumulationRate = instance.vcpu_count * (baseline / 100);  // per hour
  const creditGain = accumulationRate * (timeStepMs / 3600000);
  
  // Credit burn
  const excessCPU = Math.max(0, utilization - baseline);
  const creditBurn = instance.vcpu_count * (excessCPU / 100) * (timeStepMs / 3600000);
  
  instance.cpu_credit_balance += creditGain - creditBurn;
  
  // Throttling occurs if balance goes negative
  if (instance.cpu_credit_balance < 0) {
    instance.is_throttled = true;
    instance.current_cpu_utilization = baseline;  // Reduce to baseline
  } else {
    instance.is_throttled = false;
  }
}
```

### EC2 vs Lambda Cost Comparison

```
Scenario: 1000 requests/second, 200ms execution

EC2 Approach:
- 3× t3.medium ($0.0416/h each) = $0.1248/h
- ALB ($0.0016/h) = $0.0016/h
- Monthly: ($0.1264) × 730 = $92.27

Lambda Approach:
- API Gateway: (1000 × 86400 / 1M) × $1 = $86.4/month
- Lambda: (259M / 1M) × $0.20 = $51.84/month
- Monthly: $138.24

**Breakeven**: ~200 requests/second constant load
EC2 wins for constant, predictable traffic >200 req/sec
Lambda wins for bursty traffic
```

### Teaching Points
✓ **t3 CPU credits are deceptive**: Baseline doesn't mean "free"
✓ **EC2 + ALB cheaper than Lambda** for constant >200 req/sec
✓ **Reserved Instances save 30-50%** but lock you in
✓ **Data transfer becomes significant** at scale (10-30% of cost)
✓ **Multi-AZ doubles compute cost** but prevents AZ failures

---

## Integration Patterns

### Pattern 1: API Gateway + Lambda + DynamoDB (Serverless)

```
Client → API Gateway ($1/1M) → Lambda ($0.20/1M) → DynamoDB ($1.25/1M RCU)

Cost Breakdown (100 requests/second = 259M req/month):
- API Gateway: $259
- Lambda: $51.84
- DynamoDB (100 RCU): $32.50
Total: $343.34/month

Characteristics:
✓ Automatic scaling (no capacity planning)
✓ Pay only for usage
✓ Cold starts add 300-1500ms latency
✓ Best for bursty traffic
```

### Pattern 2: ALB + EC2 + RDS (Traditional)

```
Client → ALB ($0.0016/h) → EC2 ($0.0416/h × 3) → RDS ($0.17/h multi-AZ)

Cost Breakdown:
- ALB: $11.66/month
- EC2 (3× t3.medium): $91.10/month
- RDS (db.t3.small multi-AZ): $177.30/month
Total: $280.06/month

Characteristics:
✓ Consistent latency (<50ms)
✓ Fixed capacity planning needed
✓ No cold starts
✓ Best for predictable constant load
```

### Pattern 3: API Gateway + Lambda + S3 (File Processing)

```
Client → API Gateway → Lambda (file upload handler) → S3

Cost Breakdown (10,000 uploads/month, 100MB avg):
- API Gateway: $10
- Lambda: $0.20 (1M requests) + $0.21 (duration)
- S3 Storage: (1TB) × $0.023 = $23.30
- S3 PUT: (10K / 1000) × $0.005 = $0.05
- S3 GET: (10K / 1000) × $0.0004 = $0.004
Total: ~$33.75/month

Characteristics:
✓ Highly scalable
✓ Storage decoupled from compute
✓ Cost grows with data, not requests
```

---

## 8-Week Implementation Timeline

### Weeks 1-2: Foundation
- [ ] API Gateway request routing simulation
- [ ] API authentication (success/failure rates)
- [ ] Basic cost calculation
- **Deliverable**: API Gateway handling 1000 req/sec

### Weeks 2-3: Lambda Integration
- [ ] Cold start modeling (per runtime)
- [ ] Memory-CPU correlation
- [ ] API Gateway → Lambda invocation flow
- [ ] Cost aggregation (API GW + Lambda)
- **Deliverable**: Serverless API working with realistic latency

### Weeks 3-4: DynamoDB (Serverless) OR RDS (Traditional)
- [ ] DynamoDB: On-demand pricing, RCU/WCU, partition limits
- [ ] RDS: Connection pools, multi-AZ failover
- [ ] Database bottleneck detection
- **Deliverable**: Full serverless stack (API GW + Lambda + DynamoDB) OR traditional stack

### Weeks 4-5: Dual-Stack Comparison
- [ ] Build both traditional (EC2+RDS) and serverless (Lambda+DynamoDB)
- [ ] Cost comparison UI
- [ ] Performance metrics side-by-side
- **Deliverable**: Students can compare cost/latency trade-offs

### Weeks 5-6: S3 Integration
- [ ] S3 storage class modeling
- [ ] Lifecycle policies
- [ ] Data transfer costs
- [ ] Lambda → S3 file processing
- **Deliverable**: File upload pipeline with cost breakdown

### Weeks 6-7: Learning Framework
- [ ] 5 challenge exercises
- [ ] Pre-built scenarios (e-commerce, analytics, startup)
- [ ] Assessment rubrics
- **Deliverable**: Complete educational framework

### Weeks 7-8: Polish & Deployment
- [ ] Performance optimization (<2s response)
- [ ] Cost accuracy validation (±10% vs AWS)
- [ ] Deploy to AWS Free Tier
- **Deliverable**: Production-ready MVP

---

## Real-World Cost Examples

### Scenario 1: Startup Product API (1000 req/sec)

**Architecture**: API Gateway + Lambda + DynamoDB

```
Monthly Metrics:
- API requests: 259.2 million
- Lambda execution: 200ms average
- DynamoDB: 100 RCU, 50 WCU

Costs:
- API Gateway: $259
- Lambda requests: $51.84
- Lambda duration: $200 (5M GB-seconds @ 128MB)
- DynamoDB RCU: $32.50
- DynamoDB WCU: $11.25
- Data transfer: $50 (rough estimate)
Total: $604.59/month
Per-request: $0.0000023
```

### Scenario 2: Enterprise E-Commerce (10,000 req/sec)

**Architecture**: ALB + EC2 + RDS + S3

```
Monthly Metrics:
- Traffic: 2.592 billion requests
- Peak: 10,000 req/sec (need 5-10 EC2 instances)
- Database: 1 million connections/sec (needs db.m5.large)
- Storage: 500 GB product images

Costs:
- ALB: $11.66
- EC2 (8×m5.large auto-scaled): $700
- RDS multi-AZ (db.m5.large): $1,382
- S3 (500GB × $0.023): $11.50
- Data transfer out: $2,000 (500GB × $0.02)
- Data transfer between services: $0
Total: $4,105.16/month
Per-request: $0.00158
```

### Scenario 3: Data Analytics Pipeline

**Architecture**: Lambda (scheduled) + DynamoDB + S3

```
Daily Job: Process 1TB of logs, aggregate to summary

Costs:
- Lambda: 1 invocation/day × 3600 sec execution × 1024MB
  = (365 × 3600 × 1) / 1M × $0.20 + (365 × 3600 × 1024/1024) / 1M × $0.0000166667
  = $0.26 + $0.21 = $0.47/month
- DynamoDB writes (1M summaries): (1M / 1M) × $6.25 = $6.25/month
- S3 storage (500GB aggregated): (500 × $0.023) = $11.50/month
- S3 requests: ~$0.05/month
Total: ~$18.27/month
```

---

## Success Metrics (How to Validate)

### Technical Metrics
- [ ] API Gateway latency: <5ms in simulation
- [ ] Lambda cold start: 300-1500ms per runtime
- [ ] DynamoDB hot partition detection working
- [ ] RDS failover: 60-120 second window
- [ ] S3 lifecycle transitions accurate
- [ ] Cost calculation: ±10% vs AWS pricing

### Educational Metrics
- [ ] Students understand API Gateway cost impact
- [ ] Students can explain cold start penalties
- [ ] Students compare serverless vs EC2 trade-offs
- [ ] Students identify database bottlenecks
- [ ] Students optimize S3 storage class selection

### Business Metrics
- [ ] Runs on AWS Free Tier (<$20/month)
- [ ] Loads 1000-component architecture in <2 seconds
- [ ] Handles 50 concurrent users
- [ ] Tutorial completion: >60%
- [ ] System Usability Score: >75

---

## Cost Optimization Tips

### For Developers Using This Platform

**API Gateway**:
- Use HTTP APIs (71% cheaper than REST)
- Avoid caching unless backend processing >$146/month
- Minimize response payload size

**Lambda**:
- Use ARM-based Graviton2 (20% cheaper)
- Set minimum memory (128MB) if latency not critical
- Use Provisioned Concurrency only for unpredictable patterns

**DynamoDB**:
- Use on-demand for unpredictable workloads
- Use provisioned for constant-load applications
- Avoid scans (4x RCU cost vs queries)

**RDS**:
- Single-AZ for non-critical, use Multi-AZ for production
- Use read replicas for read-heavy workloads (not for this phase)
- Right-size instances (don't use m5.large if t3.medium sufficient)

**S3**:
- Enable Intelligent-Tiering (auto-optimizes cost)
- Use lifecycle policies (move to GLACIER after 90 days)
- Consider S3 Transfer Acceleration for large files only

---

## Sources Cited

AWS Documentation: API Gateway acts as a "front door" for applications to access data and business logic from backend services like Lambda, EC2, DynamoDB, and Kinesis.

AWS Lambda pricing is based on the number of requests and the duration of execution, with pricing dependent on memory allocation.

When combining API Gateway with Lambda, you pay for both services: API Gateway for request management and routing, and Lambda for executing backend logic.

HTTP APIs cost $1.00 per million requests while REST APIs cost $3.50 per million requests, with HTTP APIs being 71% cheaper for simple serverless applications.

AWS Service proxy integrations can reduce costs by avoiding Lambda function overhead for simple data transformations between API Gateway and backend services.

---

## Next Steps

1. **Review** this guide with your team
2. **Validate** against current AWS pricing (your index.json has pricing endpoints)
3. **Implement** in order: API GW → Lambda → DynamoDB → EC2+RDS → S3
4. **Test** each service simulator with real AWS billing data
5. **Launch** MVP after 8 weeks with 5-10 pre-built scenarios

Good luck! This is an excellent set of services for teaching **both serverless and traditional** cloud architecture patterns. 🚀

