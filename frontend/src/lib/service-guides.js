// Comprehensive service guides with specifications, connection patterns, and data flows

export const SERVICE_GUIDES = {
  api_gateway: {
    name: 'API Gateway',
    icon: 'Cloud',
    description: 'Fully managed service to create, publish, maintain, monitor, and secure APIs',
    keyFeatures: [
      'RESTful APIs and WebSocket APIs',
      'Request/response transformation',
      'Throttling and rate limiting',
      'CORS and authorization',
      'Caching strategies',
      'Monitoring with CloudWatch',
    ],
    specifications: {
      'API Types': {
        HTTP: { desc: 'Simple HTTP APIs', pricing: '$1.00 per 1M requests', useCase: 'Microservices' },
        REST: { desc: 'Full-featured REST APIs', pricing: '$3.50 per 1M requests', useCase: 'Complex APIs' },
        WebSocket: { desc: 'Real-time bidirectional', pricing: '$1.00 per 1M messages', useCase: 'Streaming' },
      },
      'Caching': {
        'Cache Hit': { timeToLive: '300s - 3600s', savings: 'Reduces backend calls' },
        'Compression': { minSize: '1024 bytes', savings: 'Reduces data transfer' },
      },
      'Data Transfer': {
        'First 1GB/month': 'Free',
        'Beyond 1GB': '$0.085 per GB (US)',
      },
    },
    connectionPatterns: [
      {
        name: 'Frontend Gateway',
        description: 'API Gateway receives all client requests and routes them',
        targetServices: ['Lambda', 'EC2', 'DynamoDB'],
        dataFormat: 'JSON REST/WebSocket messages',
      },
      {
        name: 'Request Distribution',
        description: 'Routes different endpoints to different backend services',
        targetServices: ['Lambda', 'DynamoDB'],
        pattern: '/auth/* → Auth Lambda, /data/* → DynamoDB',
      },
    ],
    dataFlow: {
      'Incoming': 'HTTP/WebSocket requests from client applications',
      'Processing': 'Validates, transforms, throttles, and authenticates requests',
      'Outgoing': 'Routes to backend services or returns cached responses',
      'Latency': 'Typical: 50-100ms (cached: 5-10ms)',
    },
  },

  lambda: {
    name: 'AWS Lambda',
    icon: 'Zap',
    description: 'Serverless compute service that runs code in response to events',
    keyFeatures: [
      'Pay-per-use pricing (1M free requests/month)',
      'Auto-scaling and elasticity',
      'Support for Node.js, Python, Java, Go, .NET',
      'Event-driven architecture',
      'Maximum 900 seconds (15 minutes) execution',
      'Memory: 128 MB - 10,240 MB (CPU scales with memory)',
    ],
    specifications: {
      'Memory Configuration': {
        '128 - 512 MB': { cpu: '0.5 vCPU equivalent', costPer1M: '$0.0000083' },
        '512 MB - 1.7 GB': { cpu: '1 vCPU equivalent', costPer1M: '$0.000017' },
        '1.7 GB - 10.2 GB': { cpu: '6 vCPU equivalent', costPer1M: '$0.00006' },
      },
      'Execution Duration': {
        'Billed Granularity': '1 millisecond',
        'Price': '$0.0000166667 per vCPU-second',
        'Free Tier': '400,000 GB-seconds/month',
      },
      'Concurrency': {
        'Reserved': 'Pre-allocated concurrent executions',
        'Unreserved': 'On-demand up to 1000s',
        'Provisioned': 'Warm instances for lower latency',
      },
    },
    connectionPatterns: [
      {
        name: 'API Gateway Trigger',
        description: 'Lambda invoked synchronously by API Gateway requests',
        targetServices: ['API Gateway', 'DynamoDB', 'S3'],
        latency: 'Warm: 50-100ms, Cold: 500-1000ms',
      },
      {
        name: 'Event-Driven Processing',
        description: 'Lambda triggered by S3 events, DynamoDB streams, SQS messages',
        targetServices: ['S3', 'DynamoDB', 'SQS'],
        pattern: 'Asynchronous, batch processing',
      },
      {
        name: 'Database Access',
        description: 'Lambda connects to DynamoDB for CRUD operations',
        targetServices: ['DynamoDB', 'RDS'],
        consistency: 'Eventually consistent (DynamoDB) or strong (RDS)',
      },
    ],
    dataFlow: {
      'Incoming': 'API requests, events (S3, DynamoDB), scheduled (CloudWatch)',
      'Processing': 'User code executes (cold/warm start varies)',
      'Outgoing': 'Responses to caller or writes to databases/storage',
      'Execution Time': '100ms average (for simple operations)',
      'TotalCost': 'Requests fee + duration fee + provisioned concurrency',
    },
  },

  s3: {
    name: 'Amazon S3',
    icon: 'Database',
    description: 'Object storage service for storing and retrieving any amount of data',
    keyFeatures: [
      '8 storage classes for cost optimization',
      'Lifecycle policies for automatic transitions',
      'Cross-region replication for durability',
      'Server-side encryption by default',
      'Presigned URLs for secure direct uploads',
      'Intelligent-Tiering for automatic cost savings',
    ],
    specifications: {
      'Storage Classes': {
        'Standard': { price: '$0.023/GB', latency: 'Immediate', useCase: 'Frequent access' },
        'Standard-IA': { price: '$0.0125/GB', latency: 'Minutes', useCase: 'Infrequent access' },
        'Glacier Instant': { price: '$0.004/GB', latency: '1ms(instant)', useCase: 'Archive' },
        'Glacier Flexible': { price: '$0.0036/GB', latency: '1-5 min retrieve', useCase: 'Backups' },
        'Deep Archive': { price: '$0.00099/GB', latency: '12h retrieve', useCase: 'Compliance' },
        'Intelligent-Tiering': { price: 'Auto-optimizes', latency: 'Varies', useCase: 'Unknown pattern' },
      },
      'Requests Pricing': {
        'PUT/COPY/POST': '$0.005 per 1,000 requests',
        'GET': '$0.0004 per 1,000 requests',
        'DELETE': 'Free',
      },
      'Data Transfer': {
        'First 1 GB/month': 'Free',
        'Out to Internet': '$0.085-0.09/GB',
        'Out to CloudFront': '$0.0085/GB (90% savings)',
      },
    },
    connectionPatterns: [
      {
        name: 'Presigned URLs',
        description: 'Lambda generates one-time URLs allowing direct client→S3 uploads',
        targetServices: ['Lambda', 'API Gateway'],
        benefit: 'Bypass Lambda for expensive upload handling',
        costSavings: '~50% reduction on Lambda invocations',
      },
      {
        name: 'Event Notifications',
        description: 'S3 triggers Lambda on file upload (e.g., image processing)',
        targetServices: ['Lambda'],
        pattern: 'Image upload → S3 → Lambda (resize) → S3 (thumbnails)',
      },
      {
        name: 'Static Distributions',
        description: 'CloudFront distributes S3 content globally with caching',
        targetServices: ['CloudFront'],
        benefit: 'Faster downloads, reduced S3 data transfer costs',
      },
    ],
    dataFlow: {
      'Incoming': 'PUT requests (uploads) via API Gateway or presigned URLs',
      'Storage': 'Objects stored in buckets by storage class',
      'Processing': 'Lifecycle rules transition to cheaper tiers',
      'Outgoing': 'GET requests (downloads) via CloudFront or direct S3',
      'Throughput': '3,500 requests/sec (partitioned key performance)',
    },
  },

  dynamodb: {
    name: 'Amazon DynamoDB',
    icon: 'Database',
    description: 'Fully managed NoSQL database with single-digit millisecond latency',
    keyFeatures: [
      'On-demand and provisioned billing modes',
      'Global secondary indexes for flexible querying',
      'DynamoDB Streams for real-time changes',
      'TTL for automatic item expiration',
      'Point-in-time recovery',
      'Encryption at rest and in transit',
    ],
    specifications: {
      'Billing Modes': {
        'On-Demand': { pricing: 'Pay per request', bestFor: 'Unpredictable workloads' },
        'Provisioned': { pricing: 'Fixed capacity', bestFor: 'Predictable workloads' },
      },
      'On-Demand Pricing': {
        'Write': '$1.00 per 1M write units',
        'Read': '$0.25 per 1M read units',
        'Flexibility': 'Scales automatically',
      },
      'Provisioned Pricing': {
        'Write': '$0.00013 per write unit',
        'Read': '$0.000026 per read unit',
        'Auto-scaling': 'Available for cost optimization',
      },
    },
    connectionPatterns: [
      {
        name: 'Lambda CRUD',
        description: 'Lambda performs Create, Read, Update, Delete operations',
        targetServices: ['Lambda', 'API Gateway'],
        latency: 'Single-digit ms for simple operations',
      },
      {
        name: 'Streams Processing',
        description: 'DynamoDB Streams capture changes for real-time processing',
        targetServices: ['Lambda'],
        useCase: 'Real-time analytics, cache invalidation',
      },
    ],
    dataFlow: {
      'Incoming': 'PUT, UPDATE, DELETE from Lambda or API',
      'Processing': 'Atomic transactions, consistent reads/writes',
      'Outgoing': 'Query/Scan results returned to Lambda',
      'Latency': '<10ms for single item operations',
      'Consistency': 'Eventually consistent (default) or strongly consistent',
    },
  },
};

// Connection patterns between services
export const CONNECTION_PATTERNS = {
  'Request-Response': {
    description: 'Synchronous communication where caller waits for response',
    flow: 'Client → API Gateway → Lambda → DynamoDB → Lambda → API Gateway → Client',
    latency: '100-500ms typical',
    useCase: 'Web requests, real-time queries',
    costImpact: 'Higher due to synchronous Lambda invocations',
  },

  'Event-Driven': {
    description: 'Asynchronous communication via events and messages',
    flow: 'Event source → Lambda → Action (write to DB, trigger another Lambda)',
    latency: '100ms - minutes',
    useCase: 'Image processing, batch analytics, notifications',
    costImpact: 'Lower cost than request-response',
  },

  'Direct Client Upload': {
    description: 'Client uploads directly to S3 via presigned URLs',
    flow: 'Client → Lambda (get URL) → S3 (upload) → Lambda (process)',
    latency: '50-100ms (URL generation) + upload time',
    useCase: 'Large file uploads (photos, videos)',
    costImpact: 'Saves Lambda compute time for data transfer',
  },

  'Caching Layer': {
    description: 'Cache responses at API Gateway or CloudFront',
    flow: 'Client → CloudFront (check cache) → API Gateway → Backend',
    latency: '5-10ms (cache hit) vs 100-500ms (cache miss)',
    useCase: 'Static content, frequently accessed data',
    costImpact: 'Reduces backend Lambda/database invocations',
  },
};

// Data flow diagrams for each case study
export const CASE_STUDY_DATA_FLOWS = {
  'netflix-like': {
    name: 'Event-Driven Microservices (Netflix)',
    overview: 'Multiple independent Lambda functions process different aspects of requests',
    steps: [
      {
        number: 1,
        description: 'User requests stream URL via API Gateway',
        services: ['Client', 'API Gateway'],
        data: 'User ID, video ID',
      },
      {
        number: 2,
        description: 'Auth Lambda validates user credentials',
        services: ['Auth Lambda', 'DynamoDB'],
        data: 'User session, permissions',
        cost: '~$0.0024 per 1M requests',
      },
      {
        number: 3,
        description: 'Streaming Lambda generates presigned S3 URL',
        services: ['Streaming Lambda', 'S3'],
        data: 'Presigned URL (valid 1 hour)',
        cost: '~$0.0024 per 1M requests',
      },
      {
        number: 4,
        description: 'Analytics Lambda logs view event asynchronously',
        services: ['Analytics Lambda', 'DynamoDB'],
        data: 'User ID, video ID, timestamp, duration',
        cost: '~$0.0024 per 1M requests',
      },
      {
        number: 5,
        description: 'Client downloads video from S3 (5-50 MB)',
        services: ['S3', 'CloudFront'],
        data: 'Video stream (H.264, 1-4K resolution)',
        cost: '~$0.085-0.25 per GB (via CloudFront cheaper)',
      },
    ],
    bottlenecks: [
      { service: 'API Gateway', issue: 'Rate limiting at 10k requests/sec', solution: 'Increase throttle settings' },
      { service: 'DynamoDB', issue: 'Hot partition if user ID as sort key', solution: 'Add uuid to sort key' },
      { service: 'S3', issue: 'Eventual consistency on new uploads', solution: 'Use strong consistency' },
    ],
    costBreakdown: {
      'API Gateway': '$2,000',
      'Lambda (Auth)': '$1,500',
      'Lambda (Streaming)': '$1,500',
      'Lambda (Analytics)': '$1,200',
      'DynamoDB': '$2,000',
      'S3 Data Transfer': '$4,000',
      'CloudFront': '$820',
      'Total': '$13,020',
    },
  },

  'real-time-analytics': {
    name: 'Real-Time Analytics (Uber)',
    overview: 'Separate write path (aggregation) from read path (queries) to optimize costs',
    steps: [
      {
        number: 1,
        description: 'Stream Lambda receives 1M events/sec from clients',
        services: ['Stream Ingestion Lambda'],
        data: 'Location, timestamp, status (pickup/dropoff)',
        cost: '~$0.0024 per 1M requests',
      },
      {
        number: 2,
        description: 'Aggregate Lambda batches data every 60 seconds',
        services: ['Batch Aggregation Lambda'],
        data: 'Bucketed events (1 min aggregates)',
        cost: 'Runs 1440x per day only',
      },
      {
        number: 3,
        description: 'Write aggregates to Write DB',
        services: ['Write DB (DynamoDB)', 'Write Lambda'],
        data: 'Aggregated metrics (count, avg, p95)',
        cost: '~$0.00013 per write unit (provisioned)',
      },
      {
        number: 4,
        description: 'Replicate to Read DB (secondary index)',
        services: ['Read DB (DynamoDB)'],
        data: 'Same aggregated data',
        cost: 'Included in write cost',
      },
      {
        number: 5,
        description: 'Dashboard queries Read DB directly',
        services: ['API Gateway', 'Read DB'],
        data: 'Time-series metrics for charting',
        cost: '~$0.000026 per read unit (provisioned)',
      },
    ],
    optimizations: [
      'Batch aggregation reduces Lambda from 86,400x/day to 1,440x/day (60x reduction)',
      'Write-once, read-many pattern minimizes database writes',
      'Provisioned capacity (not on-demand) saves 95% on DynamoDB',
      'Compressed data storage for archival (move to S3 after 30 days)',
    ],
    costBreakdown: {
      'Stream Ingestion Lambda': '$40',
      'Batch Aggregation Lambda': '$0',
      'DynamoDB (Write)': '$20',
      'DynamoDB (Read)': '$25',
      'API Gateway': '$1',
      'Total': '$86',
    },
  },

  'photo-sharing': {
    name: 'Photo Sharing (Instagram)',
    overview: 'Presigned URLs bypass Lambda for expensive upload handling',
    steps: [
      {
        number: 1,
        description: 'User requests presigned URL from API Gateway',
        services: ['API Gateway', 'Presign Lambda'],
        data: 'User ID, file type, file size',
        cost: '~$0.0024 per 1M requests',
      },
      {
        number: 2,
        description: 'Lambda generates 1-hour valid presigned URL',
        services: ['Presign Lambda'],
        data: 'URL with embedded credentials',
        cost: 'Minimal - lightweight function',
      },
      {
        number: 3,
        description: 'Client uploads directly to S3 (bypass Lambda)',
        services: ['S3'],
        data: '1-50 MB JPEG/PNG image',
        cost: '$0.005 per 1,000 PUTs (~$5 per 1B uploads)',
      },
      {
        number: 4,
        description: 'S3 triggers Lambda on object creation',
        services: ['S3', 'Image Processing Lambda'],
        data: 'Bucket event notification',
        cost: 'Only triggered on upload (not for downloads)',
      },
      {
        number: 5,
        description: 'Lambda processes image (resize, optimize)',
        services: ['Image Processing Lambda', 'S3 Thumbnails'],
        data: 'Thumbnails (64x64, 256x256, full)',
        cost: '~$0.00167 per 1B invocations',
      },
      {
        number: 6,
        description: 'Metadata stored for querying',
        services: ['DynamoDB', 'Metadata Lambda'],
        data: 'Image URL, owner, timestamp, tags',
        cost: '~$0.00013 per write unit',
      },
    ],
    optimizations: [
      'Presigned URLs save ~50% on Lambda costs (users upload directly)',
      'Intelligent-Tiering in S3 auto-moves old images to cheaper storage',
      'CloudFront caches thumbnails, reducing S3 data transfer by 90%',
      'DynamoDB on-demand (unpredictable upload patterns)',
    ],
    costBreakdown: {
      'API Gateway': '$1,000',
      'Presign Lambda': '$500',
      'Image Processing Lambda': '$5,000',
      'S3 Uploads (Standard)': '$50,000',
      'S3 Metadata': '$2,000',
      'S3 Thumbnails': '$40,000',
      'DynamoDB': '$50,000',
      'CloudFront': '$100,000',
      'Total Un-optimized': '$253,000',
      'After Optimization': '$100,000',
    },
  },
};
