export const AWS_YELLOW = '#FF9900';
export const AWS_DARK_GRAY = '#232F3E';
export const AWS_LIGHT_GRAY = '#F5F5F5';

export const SERVICE_TYPES = {
  API_GATEWAY: 'api_gateway',
  LAMBDA: 'lambda',
  S3: 's3',
  EC2: 'ec2',
  RDS: 'rds',
  DYNAMODB: 'dynamodb',
};

export const SERVICE_COLORS = {
  api_gateway: '#FF9900',
  lambda: '#FF9900',
  s3: '#FF9900',
  ec2: '#FF9900',
  rds: '#FF9900',
  dynamodb: '#FF9900',
};

export const SERVICE_ICONS = {
  api_gateway: 'Cloud',
  lambda: 'Zap',
  s3: 'Database',
  ec2: 'Server',
  rds: 'Database',
  dynamodb: 'Database',
};

export const REGIONS = {
  'US East (N. Virginia)': 'us-east-1',
  'US East (Ohio)': 'us-east-2',
  'US West (N. California)': 'us-west-1',
  'US West (Oregon)': 'us-west-2',
  'Asia Pacific (Mumbai)': 'ap-south-1',
  'Asia Pacific (Singapore)': 'ap-southeast-1',
  'Asia Pacific (Sydney)': 'ap-southeast-2',
  'Asia Pacific (Tokyo)': 'ap-northeast-1',
  'EU (Ireland)': 'eu-west-1',
  'EU (London)': 'eu-west-2',
  'EU (Frankfurt)': 'eu-central-1',
};

export const CASE_STUDIES = [
  {
    id: 'netflix-like',
    title: 'Event-Driven Microservices (Netflix-like)',
    description: 'Design a scalable video streaming platform for 10M concurrent viewers',
    scale: '10M concurrent viewers, 100M users',
    cost: '$13,020/month',
    pattern: 'Event-Driven',
    keyInsight: 'Decouple auth, streaming, and analytics into independent Lambda functions',
    services: ['api_gateway', 'lambda', 'dynamodb', 's3'],
    architecture: {
      nodes: [
        { id: 'api', type: 'api_gateway', label: 'API Gateway', position: { x: 100, y: 100 } },
        { id: 'auth-lambda', type: 'lambda', label: 'Auth Lambda', position: { x: 300, y: 50 } },
        { id: 'stream-lambda', type: 'lambda', label: 'Streaming Lambda', position: { x: 300, y: 150 } },
        { id: 'analytics-lambda', type: 'lambda', label: 'Analytics Lambda', position: { x: 300, y: 250 } },
        { id: 'dynamodb', type: 'dynamodb', label: 'DynamoDB', position: { x: 500, y: 100 } },
        { id: 's3', type: 's3', label: 'S3 Video', position: { x: 500, y: 250 } },
      ],
      connections: [
        { source: 'api', target: 'auth-lambda' },
        { source: 'api', target: 'stream-lambda' },
        { source: 'api', target: 'analytics-lambda' },
        { source: 'auth-lambda', target: 'dynamodb' },
        { source: 'stream-lambda', target: 's3' },
        { source: 'analytics-lambda', target: 'dynamodb' },
      ],
    },
  },
  {
    id: 'real-time-analytics',
    title: 'Real-Time Analytics (Uber/Airbnb)',
    description: 'Build a real-time analytics dashboard for 1M events/second',
    scale: '1M events/second, 100M dashboard queries/day',
    cost: '$86/month',
    pattern: 'Real-Time Analytics',
    keyInsight: 'Separate write path (batch aggregation) from read path (sync query)',
    services: ['lambda', 'dynamodb'],
    architecture: {
      nodes: [
        { id: 'stream', type: 'lambda', label: 'Stream Ingestion', position: { x: 100, y: 100 } },
        { id: 'batch', type: 'lambda', label: 'Batch Aggregation', position: { x: 300, y: 100 } },
        { id: 'write-db', type: 'dynamodb', label: 'Write DB', position: { x: 500, y: 50 } },
        { id: 'read-db', type: 'dynamodb', label: 'Read DB', position: { x: 500, y: 150 } },
      ],
      connections: [
        { source: 'stream', target: 'batch' },
        { source: 'batch', target: 'write-db' },
        { source: 'write-db', target: 'read-db' },
      ],
    },
  },
  {
    id: 'photo-sharing',
    title: 'Photo Sharing (Instagram/Pinterest)',
    description: 'Create a scalable photo sharing platform handling 1B uploads/day',
    scale: '1B uploads/day, 500M users',
    cost: '$253,000/month (optimized: $100K)',
    pattern: 'Photo Sharing',
    keyInsight: 'Use presigned S3 URLs to upload directly from client (bypass Lambda)',
    services: ['s3', 'lambda', 'dynamodb'],
    architecture: {
      nodes: [
        { id: 'api', type: 'api_gateway', label: 'API Gateway', position: { x: 100, y: 100 } },
        { id: 'presign', type: 'lambda', label: 'Presigned URLs', position: { x: 300, y: 50 } },
        { id: 'process', type: 'lambda', label: 'Image Processing', position: { x: 300, y: 150 } },
        { id: 's3-original', type: 's3', label: 'Original', position: { x: 500, y: 50 } },
        { id: 's3-thumbs', type: 's3', label: 'Thumbnails', position: { x: 500, y: 150 } },
        { id: 'metadata', type: 'dynamodb', label: 'Metadata', position: { x: 500, y: 250 } },
      ],
      connections: [
        { source: 'api', target: 'presign' },
        { source: 'presign', target: 's3-original' },
        { source: 's3-original', target: 'process' },
        { source: 'process', target: 's3-thumbs' },
        { source: 'api', target: 'metadata' },
      ],
    },
  },
];
