# SystemArcht: Backend Implementation Plan

## Overview
**Technology Stack**: Node.js, TypeScript, Express.js, PostgreSQL, Redis, Socket.IO, AWS SDK
**Timeline**: 8 weeks
**Team**: 1-2 Backend Developers

---

## Architecture Overview

```
┌─────────────┐
│   Client    │
│  (Next.js)  │
└──────┬──────┘
       │ HTTP/WebSocket
       ▼
┌──────────────────────────────────────┐
│      API Gateway (Express.js)        │
│  - REST API endpoints                │
│  - WebSocket (Socket.IO)             │
│  - Authentication & rate limiting    │
└──────┬───────────────────────────────┘
       │
   ┌───┴───────────────┬─────────────┐
   ▼                   ▼             ▼
┌──────────┐    ┌─────────────┐  ┌──────────┐
│Simulation│    │   Pricing   │  │  User    │
│  Engine  │    │   Service   │  │  Service │
└─────┬────┘    └──────┬──────┘  └─────┬────┘
      │                │               │
      ▼                ▼               ▼
┌──────────────────────────────────────┐
│        PostgreSQL Database           │
│  - Users & auth                      │
│  - Saved architectures               │
│  - Simulation results                │
│  - Pricing cache                     │
└──────────────────────────────────────┘
      │
      ▼
┌──────────────────────────────────────┐
│      Redis Cache & Queue             │
│  - Active simulations                │
│  - Real-time metrics                 │
│  - Job queue (Bull)                  │
└──────────────────────────────────────┘
```

---

## Phase 1: Foundation (Weeks 1-2)

### Week 1: Project Setup & Database Schema

#### Tasks
- [ ] Initialize Node.js project with TypeScript
  ```bash
  npm init -y
  npm install express typescript ts-node @types/node @types/express
  npm install dotenv cors helmet compression
  npm install pg redis socket.io bull
  npm install -D nodemon @types/pg @types/redis
  ```
- [ ] Setup TypeScript configuration
- [ ] Create folder structure:
  ```
  src/
  ├── config/           # Configuration files
  ├── controllers/      # Request handlers
  ├── services/         # Business logic
  │   ├── simulation/   # Simulation engine
  │   ├── pricing/      # AWS pricing integration
  │   └── user/         # User management
  ├── models/           # Database models
  ├── routes/           # API routes
  ├── middleware/       # Express middleware
  ├── utils/            # Helper functions
  ├── types/            # TypeScript types
  └── index.ts          # Entry point
  ```

#### Database Schema Design

**PostgreSQL Tables**:

```sql
-- Users table
CREATE TABLE users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email VARCHAR(255) UNIQUE NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  name VARCHAR(255),
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Architectures table
CREATE TABLE architectures (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  name VARCHAR(255) NOT NULL,
  description TEXT,
  nodes JSONB NOT NULL,
  connections JSONB NOT NULL,
  is_template BOOLEAN DEFAULT false,
  template_category VARCHAR(50), -- 'netflix', 'uber', 'instagram', etc.
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Simulations table
CREATE TABLE simulations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  architecture_id UUID REFERENCES architectures(id) ON DELETE CASCADE,
  user_id UUID REFERENCES users(id) ON DELETE SET NULL,
  workload INTEGER NOT NULL,
  duration_seconds INTEGER,
  status VARCHAR(20) NOT NULL, -- 'queued', 'running', 'completed', 'failed'
  started_at TIMESTAMP,
  completed_at TIMESTAMP,
  error_message TEXT,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Simulation results table
CREATE TABLE simulation_results (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  simulation_id UUID REFERENCES simulations(id) ON DELETE CASCADE,
  timestamp_ms INTEGER NOT NULL, -- milliseconds since simulation start
  metrics JSONB NOT NULL,
  -- Example metrics structure:
  -- {
  --   "latency": {"p50": 50, "p95": 120, "p99": 250},
  --   "throughput": 980,
  --   "costs": {"ec2": 0.0416, "lambda": 0.002, ...},
  --   "resources": {"ec2": [{"cpu": 45, "memory": 60}], ...},
  --   "bottlenecks": [{"serviceId": "...", "issue": "...", ...}]
  -- }
  created_at TIMESTAMP DEFAULT NOW()
);

-- Service pricing cache
CREATE TABLE service_pricing (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  service_type VARCHAR(50) NOT NULL,
  region VARCHAR(50) NOT NULL,
  pricing_data JSONB NOT NULL,
  -- Example: {"t3.micro": 0.0104, "t3.small": 0.0208, ...}
  fetched_at TIMESTAMP NOT NULL,
  expires_at TIMESTAMP NOT NULL,
  UNIQUE(service_type, region)
);

-- Create indexes
CREATE INDEX idx_architectures_user_id ON architectures(user_id);
CREATE INDEX idx_simulations_architecture_id ON simulations(architecture_id);
CREATE INDEX idx_simulations_user_id ON simulations(user_id);
CREATE INDEX idx_simulation_results_simulation_id ON simulation_results(simulation_id);
CREATE INDEX idx_service_pricing_lookup ON service_pricing(service_type, region);
```

#### Deliverables
- ✅ Express.js server running on port 3001
- ✅ PostgreSQL database created with schema
- ✅ Redis connection established
- ✅ Basic health check endpoint: `GET /health`

---

### Week 2: Core API Endpoints

#### Tasks
- [ ] Implement user authentication:
  - `POST /api/auth/register` - User registration
  - `POST /api/auth/login` - User login (JWT)
  - `GET /api/auth/me` - Get current user
- [ ] Implement architecture CRUD:
  - `GET /api/architectures` - List user architectures
  - `POST /api/architectures` - Create new architecture
  - `GET /api/architectures/:id` - Get architecture by ID
  - `PUT /api/architectures/:id` - Update architecture
  - `DELETE /api/architectures/:id` - Delete architecture
- [ ] Implement template endpoints:
  - `GET /api/templates` - List all templates
  - `GET /api/templates/:category` - Get specific template
- [ ] Add request validation middleware (Joi or Zod)
- [ ] Add error handling middleware
- [ ] Add rate limiting (express-rate-limit)

#### Authentication Middleware
```typescript
// src/middleware/auth.ts
import jwt from 'jsonwebtoken';

export async function authenticate(req, res, next) {
  const token = req.headers.authorization?.split(' ')[1];
  
  if (!token) {
    return res.status(401).json({ error: 'No token provided' });
  }
  
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = decoded;
    next();
  } catch (error) {
    return res.status(401).json({ error: 'Invalid token' });
  }
}
```

#### Deliverables
- ✅ User registration and login working
- ✅ Architecture CRUD endpoints functional
- ✅ Template endpoints returning data
- ✅ JWT authentication in place

---

## Phase 2: Pricing Service (Week 3)

### Week 3: AWS Pricing Integration

#### Tasks
- [ ] Create pricing service to fetch AWS pricing:
  ```typescript
  // src/services/pricing/pricingService.ts
  interface PricingService {
    getEC2Pricing(region: string): Promise<EC2Pricing>;
    getLambdaPricing(region: string): Promise<LambdaPricing>;
    getRDSPricing(region: string): Promise<RDSPricing>;
    getDynamoDBPricing(region: string): Promise<DynamoDBPricing>;
    getS3Pricing(region: string): Promise<S3Pricing>;
    getAPIGatewayPricing(region: string): Promise<APIGatewayPricing>;
  }
  ```
- [ ] Implement AWS Pricing API integration:
  - Use AWS SDK to fetch pricing from `index.json`
  - Parse pricing data for each service
  - Cache in PostgreSQL with expiration (24 hours)
- [ ] Create pricing endpoints:
  - `GET /api/pricing/:service/:region` - Get pricing for specific service and region
  - `GET /api/pricing/all/:region` - Get all service pricing for region
- [ ] Implement pricing calculation utilities:
  ```typescript
  function calculateEC2Cost(config: EC2Config, hours: number): number;
  function calculateLambdaCost(config: LambdaConfig, invocations: number, durationMs: number): number;
  function calculateRDSCost(config: RDSConfig, hours: number): number;
  function calculateDynamoDBCost(config: DynamoDBConfig, rcu: number, wcu: number, storage: number): number;
  function calculateS3Cost(config: S3Config, storage: number, requests: S3Requests): number;
  function calculateAPIGatewayCost(config: APIGatewayConfig, requests: number): number;
  ```
- [ ] Add background job to refresh pricing daily (using Bull queue)

#### Pricing Data Structure
```typescript
interface EC2Pricing {
  region: string;
  instances: {
    't3.micro': { hourly: number; vcpu: number; memory: number };
    't3.small': { hourly: number; vcpu: number; memory: number };
    't3.medium': { hourly: number; vcpu: number; memory: number };
    'm5.large': { hourly: number; vcpu: number; memory: number };
    // ... more instance types
  };
  dataTransfer: {
    outbound: number; // per GB
    inbound: number;  // usually 0
  };
}

interface LambdaPricing {
  region: string;
  requestCost: number; // per million requests
  durationCost: number; // per GB-second
  provisionedConcurrency: number; // per hour per unit
}
```

#### Deliverables
- ✅ AWS Pricing API integration working
- ✅ Pricing cache in PostgreSQL
- ✅ Pricing endpoints functional
- ✅ Daily pricing refresh job
- ✅ Cost calculation utilities tested

---

## Phase 3: Simulation Engine (Weeks 4-6)

### Week 4: Core Simulation Engine

#### Tasks
- [ ] Design simulation engine architecture:
  ```typescript
  interface SimulationEngine {
    initialize(architecture: Architecture, workload: number): void;
    step(deltaTimeMs: number): SimulationMetrics;
    run(durationMs: number): Promise<SimulationMetrics[]>;
    stop(): void;
  }
  ```
- [ ] Implement service simulators:
  - **EC2Simulator**: CPU credit model, request processing, throttling
  - **LambdaSimulator**: Cold starts, warm containers, concurrency limits
  - **RDSSimulator**: Connection pool, query latency, Multi-AZ failover
  - **DynamoDBSimulator**: RCU/WCU consumption, hot partitions
  - **S3Simulator**: Storage and request tracking
  - **APIGatewaySimulator**: Request routing, rate limiting
- [ ] Create main simulation loop:
  ```typescript
  async function runSimulation(
    architecture: Architecture,
    workload: number,
    durationMs: number
  ): Promise<SimulationMetrics[]> {
    const engine = new SimulationEngine(architecture);
    const results: SimulationMetrics[] = [];
    const timeStep = 1000; // 1 second
    
    for (let time = 0; time < durationMs; time += timeStep) {
      const metrics = engine.step(timeStep);
      results.push({ timestamp: time, ...metrics });
      
      // Store in database every 10 steps
      if (time % 10000 === 0) {
        await storeMetrics(results);
      }
    }
    
    return results;
  }
  ```
- [ ] Implement bottleneck detection:
  ```typescript
  function detectBottlenecks(metrics: SimulationMetrics): Bottleneck[] {
    const bottlenecks: Bottleneck[] = [];
    
    // Check EC2 CPU throttling
    if (metrics.ec2.cpu > 90) {
      bottlenecks.push({
        serviceId: 'ec2-1',
        issue: 'CPU throttling due to credit exhaustion',
        severity: 'critical',
        suggestion: 'Switch to m5 instance or increase instance count',
      });
    }
    
    // Check RDS connection pool
    if (metrics.rds.connections > metrics.rds.maxConnections * 0.8) {
      bottlenecks.push({
        serviceId: 'rds-1',
        issue: 'Connection pool near capacity',
        severity: 'warning',
        suggestion: 'Add RDS Proxy or increase max_connections',
      });
    }
    
    // ... more checks
    
    return bottlenecks;
  }
  ```

#### Deliverables
- ✅ All 6 service simulators implemented
- ✅ Main simulation loop functional
- ✅ Bottleneck detection working
- ✅ Unit tests for each simulator

---

### Week 5: Simulation API & Queue System

#### Tasks
- [ ] Implement simulation endpoints:
  - `POST /api/simulations` - Start new simulation
  - `GET /api/simulations/:id` - Get simulation status
  - `GET /api/simulations/:id/metrics` - Get simulation metrics
  - `DELETE /api/simulations/:id` - Stop running simulation
- [ ] Setup Bull queue for background simulation jobs:
  ```typescript
  // src/services/simulation/simulationQueue.ts
  import Queue from 'bull';
  
  const simulationQueue = new Queue('simulations', {
    redis: { host: 'localhost', port: 6379 }
  });
  
  simulationQueue.process(async (job) => {
    const { architectureId, workload, durationMs } = job.data;
    
    // Update status to 'running'
    await updateSimulationStatus(job.id, 'running');
    
    try {
      const architecture = await getArchitecture(architectureId);
      const metrics = await runSimulation(architecture, workload, durationMs);
      
      // Store results
      await storeSimulationResults(job.id, metrics);
      
      // Update status to 'completed'
      await updateSimulationStatus(job.id, 'completed');
      
      return { success: true };
    } catch (error) {
      await updateSimulationStatus(job.id, 'failed', error.message);
      throw error;
    }
  });
  ```
- [ ] Add progress tracking for simulations
- [ ] Implement simulation result pagination
- [ ] Add simulation cleanup (delete old results after 30 days)

#### Deliverables
- ✅ Simulation endpoints working
- ✅ Background job queue processing simulations
- ✅ Progress tracking functional
- ✅ Result pagination implemented

---

### Week 6: Real-Time Metrics with WebSocket

#### Tasks
- [ ] Setup Socket.IO server:
  ```typescript
  // src/index.ts
  import { Server } from 'socket.io';
  
  const io = new Server(httpServer, {
    cors: { origin: process.env.FRONTEND_URL }
  });
  
  io.on('connection', (socket) => {
    console.log('Client connected:', socket.id);
    
    socket.on('subscribe', ({ simulationId }) => {
      socket.join(`simulation:${simulationId}`);
    });
    
    socket.on('unsubscribe', ({ simulationId }) => {
      socket.leave(`simulation:${simulationId}`);
    });
    
    socket.on('disconnect', () => {
      console.log('Client disconnected:', socket.id);
    });
  });
  ```
- [ ] Emit real-time metrics during simulation:
  ```typescript
  async function runSimulation(architecture, workload, durationMs, simulationId) {
    const timeStep = 1000;
    
    for (let time = 0; time < durationMs; time += timeStep) {
      const metrics = engine.step(timeStep);
      
      // Emit to subscribed clients
      io.to(`simulation:${simulationId}`).emit('metrics', {
        timestamp: time,
        metrics,
      });
      
      await new Promise(resolve => setTimeout(resolve, 100)); // Throttle
    }
  }
  ```
- [ ] Add authentication to WebSocket connections
- [ ] Implement connection health monitoring
- [ ] Add error handling for WebSocket failures

#### Deliverables
- ✅ WebSocket server functional
- ✅ Real-time metrics streaming to clients
- ✅ Authentication on WebSocket connections
- ✅ Error handling and reconnection logic

---

## Phase 4: Service-Specific Implementations (Week 7)

### Week 7: Advanced Service Features

#### EC2 Simulator (Advanced)
```typescript
// src/services/simulation/ec2Simulator.ts
export class EC2Simulator {
  private instances: EC2Instance[] = [];
  private cpuCreditBalance: Map<string, number> = new Map();
  
  constructor(config: EC2Config) {
    for (let i = 0; i < config.count; i++) {
      this.instances.push({
        id: `ec2-${i}`,
        instanceType: config.instanceType,
        state: 'running',
        cpuUtilization: 0,
        requestQueue: [],
      });
      
      // Initialize CPU credits for t3 instances
      if (config.instanceType.startsWith('t3')) {
        this.cpuCreditBalance.set(`ec2-${i}`, 144); // Initial credit balance
      }
    }
  }
  
  step(deltaTimeMs: number, incomingRequests: Request[]): EC2Metrics {
    // Distribute requests across instances (round-robin)
    const requestsPerInstance = Math.ceil(incomingRequests.length / this.instances.length);
    
    for (let i = 0; i < this.instances.length; i++) {
      const instance = this.instances[i];
      const requests = incomingRequests.slice(i * requestsPerInstance, (i + 1) * requestsPerInstance);
      
      // Add to queue
      instance.requestQueue.push(...requests);
      
      // Process requests based on CPU availability
      const processingCapacity = this.getProcessingCapacity(instance, deltaTimeMs);
      const processed = instance.requestQueue.splice(0, processingCapacity);
      
      // Calculate CPU utilization
      const cpuUsage = (processed.length / processingCapacity) * 100;
      instance.cpuUtilization = cpuUsage;
      
      // Update CPU credits for t3 instances
      if (instance.instanceType.startsWith('t3')) {
        this.updateCPUCredits(instance.id, cpuUsage, deltaTimeMs);
      }
    }
    
    return this.getMetrics();
  }
  
  private updateCPUCredits(instanceId: string, cpuUsage: number, deltaTimeMs: number) {
    const baseline = this.getBaselineCPU(this.instances.find(i => i.id === instanceId).instanceType);
    const currentCredits = this.cpuCreditBalance.get(instanceId);
    
    const creditsEarned = (baseline / 100) * (deltaTimeMs / 60000); // per minute
    const creditsSpent = Math.max(0, (cpuUsage - baseline) / 100) * (deltaTimeMs / 60000);
    
    const newBalance = Math.min(144, Math.max(0, currentCredits + creditsEarned - creditsSpent));
    this.cpuCreditBalance.set(instanceId, newBalance);
  }
  
  private getBaselineCPU(instanceType: string): number {
    const baselines = { 't3.micro': 10, 't3.small': 20, 't3.medium': 20 };
    return baselines[instanceType] || 100;
  }
  
  private getProcessingCapacity(instance: EC2Instance, deltaTimeMs: number): number {
    const specs = { 't3.micro': 1, 't3.small': 2, 't3.medium': 2, 'm5.large': 2 };
    const vCPUs = specs[instance.instanceType] || 2;
    
    // Base capacity: requests per second = vCPUs * 100
    let capacity = vCPUs * 100 * (deltaTimeMs / 1000);
    
    // Throttle if CPU credits depleted (t3 instances)
    if (instance.instanceType.startsWith('t3')) {
      const credits = this.cpuCreditBalance.get(instance.id);
      if (credits === 0) {
        const baseline = this.getBaselineCPU(instance.instanceType);
        capacity = capacity * (baseline / 100); // Throttle to baseline
      }
    }
    
    return Math.floor(capacity);
  }
  
  private getMetrics(): EC2Metrics {
    return {
      instances: this.instances.map(i => ({
        id: i.id,
        cpuUtilization: i.cpuUtilization,
        queueDepth: i.requestQueue.length,
        cpuCredits: this.cpuCreditBalance.get(i.id),
      })),
      totalProcessed: this.instances.reduce((sum, i) => sum + i.requestsProcessed, 0),
    };
  }
}
```

#### Lambda Simulator (Advanced)
```typescript
// src/services/simulation/lambdaSimulator.ts
export class LambdaSimulator {
  private warmContainers: Map<string, number> = new Map(); // containerId -> lastUsedTime
  private coldStartLatency: number;
  
  constructor(config: LambdaConfig) {
    this.coldStartLatency = this.getColdStartLatency(config.runtime);
  }
  
  step(deltaTimeMs: number, incomingRequests: Request[]): LambdaMetrics {
    let coldStarts = 0;
    let totalDuration = 0;
    
    for (const request of incomingRequests) {
      const hasWarmContainer = this.getWarmContainer();
      
      if (!hasWarmContainer) {
        coldStarts++;
        request.latency += this.coldStartLatency;
      }
      
      // Execute function
      const executionTime = this.calculateExecutionTime(request);
      totalDuration += executionTime;
      request.latency += executionTime;
      
      // Mark container as warm
      this.warmContainers.set(request.id, Date.now());
    }
    
    // Expire warm containers after 15 minutes
    this.expireWarmContainers();
    
    return {
      invocations: incomingRequests.length,
      coldStarts,
      averageDuration: totalDuration / incomingRequests.length,
      warmContainers: this.warmContainers.size,
    };
  }
  
  private getColdStartLatency(runtime: string): number {
    const latencies = {
      'nodejs18.x': 400,
      'python3.11': 600,
      'java11': 1500,
    };
    return latencies[runtime] || 500;
  }
  
  private getWarmContainer(): boolean {
    return this.warmContainers.size > 0 && Math.random() > 0.3; // 70% chance of warm
  }
  
  private expireWarmContainers() {
    const now = Date.now();
    for (const [id, lastUsed] of this.warmContainers.entries()) {
      if (now - lastUsed > 15 * 60 * 1000) { // 15 minutes
        this.warmContainers.delete(id);
      }
    }
  }
}
```

#### RDS Simulator (Advanced)
```typescript
// src/services/simulation/rdsSimulator.ts
export class RDSSimulator {
  private connectionPool: Connection[] = [];
  private maxConnections: number;
  private multiAZ: boolean;
  private failoverInProgress: boolean = false;
  
  constructor(config: RDSConfig) {
    this.maxConnections = this.getMaxConnections(config.instanceClass);
    this.multiAZ = config.multiAZ;
  }
  
  step(deltaTimeMs: number, incomingRequests: Request[]): RDSMetrics {
    const metrics: RDSMetrics = {
      activeConnections: 0,
      queuedQueries: 0,
      averageLatency: 0,
      failoverEvents: 0,
    };
    
    for (const request of incomingRequests) {
      if (this.failoverInProgress) {
        request.latency += 60000; // 60 second failover
        request.success = false;
        metrics.failoverEvents++;
        continue;
      }
      
      // Check connection pool
      if (this.connectionPool.length >= this.maxConnections) {
        metrics.queuedQueries++;
        request.latency += 500; // Queue wait time
      }
      
      // Acquire connection
      const connection = this.acquireConnection();
      metrics.activeConnections++;
      
      // Execute query
      const queryLatency = this.calculateQueryLatency(request);
      request.latency += queryLatency;
      metrics.averageLatency += queryLatency;
      
      // Release connection
      this.releaseConnection(connection);
    }
    
    metrics.averageLatency /= incomingRequests.length;
    
    // Simulate random AZ failure (1% chance per minute)
    if (this.multiAZ && Math.random() < 0.01 * (deltaTimeMs / 60000)) {
      this.triggerFailover();
    }
    
    return metrics;
  }
  
  private getMaxConnections(instanceClass: string): number {
    const connections = {
      'db.t3.micro': 85,
      'db.t3.small': 150,
      'db.t3.medium': 200,
      'db.m5.large': 1000,
    };
    return connections[instanceClass] || 100;
  }
  
  private triggerFailover() {
    this.failoverInProgress = true;
    setTimeout(() => {
      this.failoverInProgress = false;
    }, 60000); // 60 seconds
  }
}
```

#### Deliverables
- ✅ Advanced EC2 simulator with CPU credits
- ✅ Lambda simulator with cold start modeling
- ✅ RDS simulator with connection pool and failover
- ✅ DynamoDB simulator with hot partition detection
- ✅ S3 and API Gateway simulators
- ✅ Integration tests for all simulators

---

## Phase 5: Templates & Polish (Week 8)

### Week 8: Pre-built Templates & Optimization

#### Tasks
- [ ] Create 5 pre-built architecture templates:
  ```typescript
  // src/data/templates.ts
  export const templates: Template[] = [
    {
      id: 'netflix',
      name: 'Netflix Video Streaming',
      category: 'media',
      description: 'Event-driven microservices with Lambda and DynamoDB',
      nodes: [
        { id: 'apigw-1', type: 'APIGateway', config: {...} },
        { id: 'lambda-1', type: 'Lambda', config: { memory: 256, runtime: 'nodejs18.x' } },
        { id: 'lambda-2', type: 'Lambda', config: { memory: 512, runtime: 'nodejs18.x' } },
        { id: 'dynamodb-1', type: 'DynamoDB', config: {...} },
        { id: 's3-1', type: 'S3', config: {...} },
      ],
      connections: [
        { source: 'apigw-1', target: 'lambda-1' },
        { source: 'lambda-1', target: 'dynamodb-1' },
        { source: 'lambda-2', target: 's3-1' },
      ],
      expectedCost: 13020,
      workload: 100000,
    },
    // ... more templates
  ];
  ```
- [ ] Seed templates into database
- [ ] Add template validation
- [ ] Implement caching strategy:
  - Cache frequently accessed architectures in Redis
  - Cache pricing data for 24 hours
  - Cache simulation results for 1 hour
- [ ] Add monitoring and logging:
  - Winston for logging
  - Morgan for HTTP request logging
  - Sentry for error tracking
- [ ] Performance optimization:
  - Database query optimization
  - Connection pooling for PostgreSQL
  - Redis caching for hot data
- [ ] Add API documentation (Swagger/OpenAPI)
- [ ] Write integration tests

#### Deliverables
- ✅ 5 templates seeded in database
- ✅ Caching layer implemented
- ✅ Monitoring and logging setup
- ✅ API documentation generated
- ✅ Performance optimized

---

## API Endpoints Reference

### Authentication
```
POST   /api/auth/register          - Register new user
POST   /api/auth/login             - Login user
GET    /api/auth/me                - Get current user
POST   /api/auth/logout            - Logout user
```

### Architectures
```
GET    /api/architectures          - List user architectures
POST   /api/architectures          - Create architecture
GET    /api/architectures/:id      - Get architecture
PUT    /api/architectures/:id      - Update architecture
DELETE /api/architectures/:id      - Delete architecture
POST   /api/architectures/:id/fork - Fork architecture
```

### Templates
```
GET    /api/templates              - List all templates
GET    /api/templates/:category    - Get template by category
```

### Simulations
```
POST   /api/simulations            - Start new simulation
GET    /api/simulations/:id        - Get simulation status
GET    /api/simulations/:id/metrics - Get simulation metrics
DELETE /api/simulations/:id        - Stop simulation
```

### Pricing
```
GET    /api/pricing/:service/:region - Get service pricing
GET    /api/pricing/all/:region     - Get all pricing
POST   /api/pricing/refresh         - Refresh pricing cache (admin)
```

---

## Database Indexes & Optimization

```sql
-- Optimize frequent queries
CREATE INDEX idx_simulations_status ON simulations(status) WHERE status IN ('queued', 'running');
CREATE INDEX idx_simulation_results_timestamp ON simulation_results(simulation_id, timestamp_ms);
CREATE INDEX idx_architectures_template ON architectures(is_template, template_category) WHERE is_template = true;

-- Add materialized view for popular templates
CREATE MATERIALIZED VIEW popular_templates AS
SELECT 
  a.id,
  a.name,
  a.template_category,
  COUNT(s.id) as simulation_count
FROM architectures a
LEFT JOIN simulations s ON s.architecture_id = a.id
WHERE a.is_template = true
GROUP BY a.id
ORDER BY simulation_count DESC;

-- Refresh hourly
CREATE OR REPLACE FUNCTION refresh_popular_templates()
RETURNS void AS $$
BEGIN
  REFRESH MATERIALIZED VIEW popular_templates;
END;
$$ LANGUAGE plpgsql;
```

---

## Redis Cache Strategy

```typescript
// src/services/cache/cacheService.ts
import Redis from 'redis';

const redis = Redis.createClient();

export async function getCachedPricing(service: string, region: string) {
  const key = `pricing:${service}:${region}`;
  const cached = await redis.get(key);
  
  if (cached) {
    return JSON.parse(cached);
  }
  
  // Fetch from database
  const pricing = await fetchPricingFromDB(service, region);
  
  // Cache for 24 hours
  await redis.setex(key, 86400, JSON.stringify(pricing));
  
  return pricing;
}

export async function cacheSimulationMetrics(simulationId: string, metrics: SimulationMetrics) {
  const key = `simulation:${simulationId}:metrics`;
  await redis.setex(key, 3600, JSON.stringify(metrics)); // 1 hour
}
```

---

## Testing Strategy

### Unit Tests (Jest)
```typescript
// src/services/simulation/__tests__/ec2Simulator.test.ts
import { EC2Simulator } from '../ec2Simulator';

describe('EC2Simulator', () => {
  it('should throttle when CPU credits depleted', () => {
    const simulator = new EC2Simulator({
      instanceType: 't3.micro',
      count: 1,
      multiAZ: false,
      region: 'us-east-1',
    });
    
    // Simulate high CPU usage to deplete credits
    for (let i = 0; i < 100; i++) {
      const requests = Array(1000).fill({ id: `req-${i}` });
      const metrics = simulator.step(1000, requests);
    }
    
    const finalMetrics = simulator.getMetrics();
    expect(finalMetrics.instances[0].cpuCredits).toBeLessThan(10);
    expect(finalMetrics.instances[0].throttled).toBe(true);
  });
});
```

### Integration Tests (Supertest)
```typescript
// src/__tests__/simulation.test.ts
import request from 'supertest';
import app from '../index';

describe('POST /api/simulations', () => {
  it('should start a new simulation', async () => {
    const response = await request(app)
      .post('/api/simulations')
      .set('Authorization', `Bearer ${testToken}`)
      .send({
        architectureId: 'test-arch-id',
        workload: 100,
        durationMs: 60000,
      })
      .expect(201);
    
    expect(response.body).toHaveProperty('id');
    expect(response.body.status).toBe('queued');
  });
});
```

---

## Deployment

### Environment Variables
```env
# Server
PORT=3001
NODE_ENV=production

# Database
DATABASE_URL=postgresql://user:password@localhost:5432/systemarcht
DATABASE_POOL_SIZE=20

# Redis
REDIS_URL=redis://localhost:6379

# JWT
JWT_SECRET=your-secret-key
JWT_EXPIRES_IN=7d

# AWS
AWS_REGION=us-east-1
AWS_ACCESS_KEY_ID=your-key
AWS_SECRET_ACCESS_KEY=your-secret

# Frontend
FRONTEND_URL=https://systemarcht.com

# Monitoring
SENTRY_DSN=https://...
```

### Docker Setup
```dockerfile
# Dockerfile
FROM node:18-alpine

WORKDIR /app

COPY package*.json ./
RUN npm ci --only=production

COPY . .
RUN npm run build

EXPOSE 3001

CMD ["npm", "start"]
```

### Docker Compose
```yaml
# docker-compose.yml
version: '3.8'

services:
  api:
    build: .
    ports:
      - "3001:3001"
    environment:
      DATABASE_URL: postgresql://postgres:password@db:5432/systemarcht
      REDIS_URL: redis://redis:6379
    depends_on:
      - db
      - redis

  db:
    image: postgres:15-alpine
    environment:
      POSTGRES_DB: systemarcht
      POSTGRES_USER: postgres
      POSTGRES_PASSWORD: password
    volumes:
      - postgres_data:/var/lib/postgresql/data

  redis:
    image: redis:7-alpine
    volumes:
      - redis_data:/data

volumes:
  postgres_data:
  redis_data:
```

---

## Performance Requirements

- [ ] API response time < 200ms (P95)
- [ ] Simulation processing: 1000 req/sec workload in real-time
- [ ] Database queries < 50ms (P95)
- [ ] WebSocket latency < 100ms
- [ ] Memory usage < 512MB per simulation
- [ ] Support 100 concurrent simulations

---

## Security Checklist

- [ ] Rate limiting on all endpoints (100 req/min per user)
- [ ] Input validation on all requests
- [ ] SQL injection prevention (parameterized queries)
- [ ] XSS prevention (sanitize inputs)
- [ ] CORS configured correctly
- [ ] Helmet.js for security headers
- [ ] JWT with short expiration (7 days)
- [ ] Passwords hashed with bcrypt (10 rounds)
- [ ] Environment variables for secrets
- [ ] HTTPS only in production

---

## Monitoring & Logging

```typescript
// src/utils/logger.ts
import winston from 'winston';

export const logger = winston.createLogger({
  level: 'info',
  format: winston.format.json(),
  transports: [
    new winston.transports.File({ filename: 'error.log', level: 'error' }),
    new winston.transports.File({ filename: 'combined.log' }),
  ],
});

if (process.env.NODE_ENV !== 'production') {
  logger.add(new winston.transports.Console({
    format: winston.format.simple(),
  }));
}
```

---

## Success Metrics

### Technical
- [ ] Pricing accuracy within ±10% of AWS
- [ ] 99.9% uptime
- [ ] All simulations complete within 2x real-time
- [ ] Zero data loss

### Business
- [ ] API request latency P95 < 200ms
- [ ] 1000+ simulations per day
- [ ] Database size < 10GB in first month
- [ ] Operating cost < $200/month (AWS Free Tier)

---

**Total Estimated Development Time**: 8 weeks (1 backend developer)
**Lines of Code**: ~10,000-15,000 LOC
**Database Tables**: 5 core tables
**API Endpoints**: ~20 endpoints
**External APIs**: AWS Pricing API
