export const learningModules = [
  {
    id: 'module-1',
    moduleNumber: 1,
    title: 'Cloud Foundations & Static Architecture',
    shortTitle: 'Cloud Foundations',
    description:
      'Learn the fundamentals of cloud computing and build a simple static website architecture.',
    objective:
      'Understand fundamental cloud concepts and how basic cloud services work together to support a simple application.',

    scenario: {
      title: 'ByteBites',
      description:
        'ByteBites is a new food-delivery startup that needs a simple website where customers can view restaurant information, food images, menus and offers.',
      requirements: [
        'Restaurant information',
        'Food images',
        'Menus',
        'Offers',
        'Basic static content',
        'Reliable access for users from different locations',
      ],
    },

    lessons: [
      {
        id: 'cloud-computing',
        title: 'What is Cloud Computing?',
        content:
          'Cloud computing allows organizations to use computing resources such as servers, storage, databases and networking through cloud providers instead of maintaining all infrastructure themselves.',
      },

      {
        id: 'basic-cloud-resources',
        title: 'Basic Cloud Resources',
        content:
          'Cloud architectures are commonly built using resources such as compute, storage, databases and networking.',
        table: [
          {
            resource: 'Compute',
            purpose: 'Runs applications and processes',
          },
          {
            resource: 'Storage',
            purpose: 'Stores files and objects',
          },
          {
            resource: 'Database',
            purpose: 'Stores structured application data',
          },
          {
            resource: 'Networking',
            purpose: 'Connects users and services',
          },
        ],
      },

      {
        id: 'static-vs-dynamic',
        title: 'Static vs Dynamic Applications',
        content:
          'A static application mainly serves pre-built content without requiring server-side processing for every request. A dynamic application generates content or responses based on user requests or application logic.',
      },

      {
        id: 'architecture-concepts',
        title: 'Availability, Scalability and Cost',
        content:
          'Architecture decisions should consider availability, scalability and cost.',
        points: [
          {
            term: 'Availability',
            description: 'Can users access the application when needed?',
          },
          {
            term: 'Scalability',
            description: 'Can the architecture handle increasing demand?',
          },
          {
            term: 'Cost',
            description: 'How much does the architecture cost to operate?',
          },
        ],
      },
    ],

    services: [
      {
        id: 's3',
        name: 'Amazon S3',
        description: 'Stores website files and images.',
      },
      {
        id: 'cloudfront',
        name: 'Amazon CloudFront',
        description:
          'Delivers content through a content delivery network.',
      },
    ],

    exploreActivity: {
      title: 'Explore a Static Website Architecture',
      architecture: ['User', 'CloudFront', 'S3'],
      explanation: [
        'S3 stores website files and images.',
        'CloudFront delivers content through a content delivery network.',
        'Users can access content without connecting directly to the storage location.',
      ],
    },

    buildActivity: {
      title: 'Build the ByteBites Static Website',
      requiredServices: ['cloudfront', 's3'],
      requiredConnections: [
        {
          source: 'cloudfront',
          target: 's3',
        },
      ],
      buttonText: 'Build in Playground',
    },

    costChallenge: {
      title: 'Static Website Cost Activity',
      usage: {
        storageGB: 10,
        monthlyDataTransferGB: 50,
        requestsPerMonth: 100000,
      },
      description:
        'Observe how changing usage affects the estimated cloud cost.',
    },

    quiz: [
      {
        id: 'm1-q1',
        question:
          'Which service is primarily used to store static website files?',
        options: ['Lambda', 'S3', 'API Gateway', 'CloudWatch'],
        answer: 'S3',
        explanation:
          'Amazon S3 is used to store objects such as website files and images.',
      },
      {
        id: 'm1-q2',
        question: 'Why is CloudFront useful?',
        options: [
          'It runs application code',
          'It stores relational data',
          'It distributes content closer to users',
          'It replaces databases',
        ],
        answer: 'It distributes content closer to users',
        explanation:
          'CloudFront is a content delivery network that distributes content through edge locations.',
      },
    ],
  },

  {
    id: 'module-2',
    moduleNumber: 2,
    title: 'Serverless Application Architecture',
    shortTitle: 'Serverless Architecture',
    description:
      'Learn APIs, serverless computing and NoSQL databases by building a serverless ordering backend.',
    objective:
      'Understand how an application can process requests without requiring students to manage traditional servers.',

    scenario: {
      title: 'ByteBites Ordering Backend',
      description:
        'ByteBites now wants customers to place orders, view order information and submit requests through an application interface.',
      requirements: [
        'Place orders',
        'View order information',
        'Submit application requests',
        'Handle unpredictable traffic',
        'Avoid continuously running large servers',
      ],
    },

    lessons: [
      {
        id: 'apis',
        title: 'APIs',
        content:
          'An API allows applications or clients to communicate with backend functionality.',
      },

      {
        id: 'serverless',
        title: 'Serverless Computing',
        content:
          'Serverless architectures allow developers to run application logic without directly managing traditional servers.',
      },

      {
        id: 'request-execution',
        title: 'Event and Request-Based Execution',
        content:
          'Instead of maintaining an application server continuously, functions can execute when requests occur.',
      },

      {
        id: 'nosql',
        title: 'NoSQL Databases',
        content:
          'NoSQL databases are designed to support flexible and scalable data access patterns.',
      },
    ],

    services: [
      {
        id: 'api-gateway',
        name: 'API Gateway',
        description:
          'Provides an API entry point for application requests.',
      },
      {
        id: 'lambda',
        name: 'Lambda',
        description:
          'Executes backend application logic in response to requests.',
      },
      {
        id: 'dynamodb',
        name: 'DynamoDB',
        description:
          'Stores application data using a scalable NoSQL database.',
      },
    ],

    exploreActivity: {
      title: 'Explore a Serverless Ordering Architecture',
      architecture: [
        'User',
        'API Gateway',
        'Lambda',
        'DynamoDB',
      ],
      flow: [
        'Customer places an order',
        'API request is sent',
        'API Gateway receives the request',
        'Lambda processes the order',
        'DynamoDB stores the order data',
      ],
    },

    buildActivity: {
      title: 'Build the ByteBites Ordering Backend',
      requiredServices: [
        'api_gateway',
        'lambda',
        'dynamodb',
      ],
      requiredConnections: [
        {
          source: 'api_gateway',
          target: 'lambda',
        },
        {
          source: 'lambda',
          target: 'dynamodb',
        },
      ],
      buttonText: 'Build in Playground',
    },

    costChallenge: {
      title: 'Compare Workloads',
      scenarios: [
        {
          name: 'Scenario A',
          description: 'Low and unpredictable traffic.',
        },
        {
          name: 'Scenario B',
          description: 'High and continuous traffic.',
        },
      ],
      description:
        'Compare how usage-based architectures behave under different workloads.',
    },

    aiActivity: {
      title: 'Ask the AI Architecture Assistant',
      prompt:
        'ByteBites has unpredictable traffic and wants a low-maintenance backend. Which architecture would you recommend and why?',
      compareWithStudentArchitecture: true,
    },

    quiz: [
      {
        id: 'm2-q1',
        question:
          'Which component executes the backend application logic?',
        options: ['S3', 'Lambda', 'CloudFront', 'DynamoDB'],
        answer: 'Lambda',
        explanation:
          'Lambda executes backend application logic in response to requests or events.',
      },
      {
        id: 'm2-q2',
        question:
          'Which service stores application data in this architecture?',
        options: ['Lambda', 'CloudFront', 'DynamoDB', 'API Gateway'],
        answer: 'DynamoDB',
        explanation:
          'DynamoDB is the NoSQL database used to store the application data.',
      },
    ],
  },

  {
    id: 'module-3',
    moduleNumber: 3,
    title: 'Scalable & Cost-Aware Architecture',
    shortTitle: 'Scalable & Cost-Aware',
    description:
      'Compare serverless and traditional architectures and learn how cost, performance and scalability trade off against each other.',
    objective:
      'Understand that architecture decisions involve trade-offs between cost, performance, scalability and application requirements.',

    scenario: {
      title: 'ByteBites Grows Up',
      description:
        'ByteBites has grown significantly. The application now has more users, more orders, larger datasets and more consistent traffic. The company needs better control over performance and infrastructure resources, and the architecture team is considering a more traditional application architecture.',
      requirements: [
        'Handle more users and more orders',
        'Work with larger, structured datasets',
        'Better control over performance and infrastructure resources',
        'Keep the estimated monthly cost under control',
      ],
    },

    lessons: [
      {
        id: 'compute-choices',
        title: 'Compute Choices',
        content:
          'Managed and serverless approaches such as Lambda run your code on demand and charge for usage. Traditional compute such as EC2 gives you virtual servers that you size and run yourself, and you pay for them while they run. Each suits different workloads.',
      },
      {
        id: 'relational-databases',
        title: 'Relational Databases',
        content:
          'When data is structured and related, such as orders linked to customers and menu items, a relational database lets you query across tables and keep data consistent. RDS provides managed relational databases.',
      },
      {
        id: 'caching',
        title: 'Caching',
        content:
          'Caching can reduce repeated database requests and improve application response times. A cache such as ElastiCache keeps frequently read data in memory so the database is queried less often.',
      },
      {
        id: 'scalability',
        title: 'Scalability',
        content:
          'There are two ways to handle increased demand.',
        points: [
          {
            term: 'Vertical scaling',
            description:
              'Increasing the resources of an existing instance.',
          },
          {
            term: 'Horizontal scaling',
            description:
              'Adding additional instances or resources to handle increased demand.',
          },
        ],
      },
    ],

    services: [
      {
        id: 'ec2',
        name: 'Amazon EC2',
        description:
          'New in this module: virtual servers that run your application.',
      },
      {
        id: 'rds',
        name: 'Amazon RDS',
        description:
          'New in this module: a managed relational database.',
      },
      {
        id: 'elasticache',
        name: 'Amazon ElastiCache',
        description:
          'New in this module: an in-memory cache that speeds up repeated reads.',
      },
    ],

    exploreActivity: {
      title: 'Compare Two Architectures',
      comparisons: [
        {
          title: 'Architecture A: Serverless',
          paths: [['API Gateway', 'Lambda', 'DynamoDB']],
        },
        {
          title: 'Architecture B: Traditional',
          paths: [
            ['Application', 'EC2', 'RDS'],
            ['EC2', 'ElastiCache'],
          ],
        },
      ],
      explanation: [
        'The purpose is not to teach that one architecture is always better.',
        'The appropriate architecture depends on workload, requirements, performance needs and cost constraints.',
      ],
    },

    buildActivity: {
      title: 'Build the Traditional ByteBites Architecture',
      requiredServices: ['ec2', 'rds', 'elasticache'],
      requiredConnections: [
        { source: 'ec2', target: 'rds' },
        { source: 'ec2', target: 'elasticache' },
      ],
      buttonText: 'Build in Playground',
    },

    costChallenge: {
      title: 'Optimization Challenge: Reduce the Monthly Cost',
      description:
        'Reduce the estimated monthly cost while maintaining the required application performance.',
      steps: [
        'Configure EC2, RDS and ElastiCache in the Playground and calculate the estimated monthly cost.',
        'Identify the most expensive components.',
        'Change one configuration at a time, for example the instance type or the number of cache nodes.',
        'Recalculate and compare the savings against your starting estimate.',
      ],
      question:
        'Which change saved the most, and what performance risk did it introduce?',
    },

    aiActivity: {
      title: 'Review Your Architecture with ArchBot',
      prompt:
        'Review this architecture and identify components that may be unnecessarily expensive. Suggest cost optimization opportunities without significantly affecting performance.',
      studentTask:
        'For each recommendation, decide whether to accept or reject it and write one line explaining why. Do not treat the AI output as automatically correct.',
      compareWithStudentArchitecture: true,
    },

    quiz: [
      {
        id: 'm3-q1',
        question: 'What is the purpose of caching?',
        options: [
          'To permanently back up the database',
          'To store frequently accessed data temporarily so repeated requests can be served faster',
          'To replace the application server',
          'To encrypt data in transit',
        ],
        answer:
          'To store frequently accessed data temporarily so repeated requests can be served faster',
        explanation:
          'A cache keeps frequently accessed data close at hand, which can reduce load on the underlying database and speed up responses.',
      },
      {
        id: 'm3-q2',
        question:
          'Which approach adds more instances to handle increased demand?',
        options: [
          'Vertical scaling',
          'Data replication',
          'Horizontal scaling',
          'Cache warming',
        ],
        answer: 'Horizontal scaling',
        explanation:
          'Horizontal scaling adds instances, while vertical scaling makes an existing instance bigger.',
      },
      {
        id: 'm3-q3',
        question: 'Which service provides a managed relational database?',
        options: ['DynamoDB', 'S3', 'SQS', 'RDS'],
        answer: 'RDS',
        explanation:
          'Amazon RDS runs managed relational databases such as MySQL and PostgreSQL.',
      },
    ],
  },

  {
    id: 'module-4',
    moduleNumber: 4,
    title: 'Production Architecture & Intelligent Optimization',
    shortTitle: 'Production Architecture',
    description:
      'Handle traffic spikes with queues, monitor your system and think about fault tolerance.',
    objective:
      'Understand production-level concerns such as reliability, asynchronous processing, monitoring and cost-aware optimization.',

    scenario: {
      title: 'ByteBites Promotion Campaigns',
      description:
        'ByteBites is now a large platform. During promotional campaigns, thousands of customers may place orders within a short period.',
      requirements: [
        'Handle traffic spikes',
        'Avoid losing requests',
        'Monitor system behaviour',
        'Identify failures',
        'Maintain acceptable availability',
        'Control infrastructure cost',
      ],
    },

    lessons: [
      {
        id: 'decoupling',
        title: 'Decoupling',
        content:
          'Instead of forcing one service to wait directly for another, components can communicate asynchronously.',
      },
      {
        id: 'queues',
        title: 'Queues',
        content:
          'A queue can temporarily hold messages when processing capacity and incoming demand do not match.',
      },
      {
        id: 'monitoring',
        title: 'Monitoring',
        content:
          'Monitoring helps architects understand resource utilization, application behaviour, errors and performance.',
      },
      {
        id: 'fault-tolerance',
        title: 'Fault Tolerance',
        content:
          'A production architecture should be designed to continue operating when individual components experience problems.',
      },
    ],

    services: [
      {
        id: 'sqs',
        name: 'Amazon SQS',
        description:
          'New in this module: a message queue that lets producers and consumers work independently.',
      },
      {
        id: 'cloudwatch',
        name: 'Amazon CloudWatch',
        description:
          'New in this module: metrics, logs and alarms for monitoring your architecture.',
      },
      {
        id: 'api-gateway',
        name: 'API Gateway',
        description: 'Reused: the entry point for order requests.',
      },
      {
        id: 'lambda',
        name: 'Lambda',
        description: 'Reused: runs the order logic and the queue worker.',
      },
      {
        id: 'dynamodb',
        name: 'DynamoDB',
        description: 'Reused: stores the processed orders.',
      },
    ],

    exploreActivity: {
      title: 'Compare Architectures With and Without a Queue',
      comparisons: [
        {
          title: 'Without a queue',
          paths: [['User', 'Application', 'Processing']],
          note: 'The application depends directly on processing, so a spike can overwhelm it and requests can be lost.',
        },
        {
          title: 'With a queue',
          paths: [['User', 'Application', 'SQS', 'Processing']],
          note: 'The queue holds messages until processing catches up, which absorbs temporary spikes and decouples the two sides.',
        },
      ],
    },

    buildActivity: {
      title: 'Extend the ByteBites Backend for Promotions',
      requiredServices: [
        'api_gateway',
        'lambda',
        'sqs',
        'dynamodb',
        'cloudwatch',
      ],
      minServiceCounts: { lambda: 2 },
      requiredConnections: [
        { source: 'api_gateway', target: 'lambda' },
        { source: 'lambda', target: 'sqs' },
        { source: 'sqs', target: 'lambda' },
        { source: 'lambda', target: 'dynamodb' },
        { source: 'lambda', target: 'cloudwatch' },
      ],
      buttonText: 'Build in Playground',
    },

    costChallenge: {
      title: 'Cost of Resilience',
      description:
        'Observe what a queue and monitoring add to the bill, and whether the protection is worth it.',
      steps: [
        'Calculate the cost of the full architecture with SQS and CloudWatch included.',
        'Raise requests per month in the SQS panel to a promotional spike level and recalculate.',
        'Increase custom metrics, alarms and log ingestion in the CloudWatch panel and watch how monitoring cost grows.',
      ],
      question:
        'Is the extra cost of the queue and monitoring worth the protection they provide during a spike?',
    },

    aiActivity: {
      title: 'Find the Weak Points with ArchBot',
      prompt:
        'Which parts of my architecture could fail during a promotional traffic spike, and how should I protect them?',
      studentTask:
        'Accept or reject each recommendation and write one line explaining your decision.',
      compareWithStudentArchitecture: true,
    },

    quiz: [
      {
        id: 'm4-q1',
        question:
          'What does a queue do when requests arrive faster than they can be processed?',
        options: [
          'It deletes the extra requests',
          'It sends the requests back to the user',
          'It holds the messages until the processing side can handle them',
          'It automatically doubles the database size',
        ],
        answer:
          'It holds the messages until the processing side can handle them',
        explanation:
          'A queue temporarily stores messages so a spike does not overwhelm the consumer.',
      },
      {
        id: 'm4-q2',
        question:
          'Which service is used to monitor metrics, logs and alarms?',
        options: ['CloudFront', 'Cognito', 'S3', 'CloudWatch'],
        answer: 'CloudWatch',
        explanation:
          'CloudWatch collects metrics and logs and can raise alarms when something goes wrong.',
      },
      {
        id: 'm4-q3',
        question: 'What is the main benefit of decoupling components?',
        options: [
          'Every component must use the same database',
          'Components can work without waiting directly on each other',
          'It removes the need for monitoring',
          'It guarantees the lowest possible cost',
        ],
        answer: 'Components can work without waiting directly on each other',
        explanation:
          'Decoupling lets one part slow down or fail without immediately taking the rest of the system with it.',
      },
    ],
  },

  {
    id: 'module-5',
    moduleNumber: 5,
    title: 'Securing Users & Access',
    shortTitle: 'Securing Users',
    description:
      'Add sign-up, sign-in and token-based access to the serverless ordering backend.',
    objective:
      'Understand how an application knows who a user is and what they are allowed to do, and why security belongs at the entry point.',

    scenario: {
      title: 'ByteBites Accounts and Orders',
      description:
        'ByteBites orders now include saved addresses and payment history. Anyone who guesses the API URL can currently read or place orders for anyone else. Customers need to sign up and sign in, and each person must only see their own data.',
      requirements: [
        'Customers can sign up and sign in',
        'Each customer sees only their own data',
        'Unauthenticated requests are rejected at the front door',
      ],
    },

    lessons: [
      {
        id: 'authn-authz',
        title: 'Authentication vs Authorization',
        content: 'These two ideas are related but different.',
        points: [
          {
            term: 'Authentication',
            description: 'Proving who you are.',
          },
          {
            term: 'Authorization',
            description: 'Deciding what you may do.',
          },
        ],
      },
      {
        id: 'token-access',
        title: 'Token-Based Access',
        content:
          'After sign-in, the user receives a token and sends it with every request. The backend never sees the password again.',
      },
      {
        id: 'front-door',
        title: 'Protect the Front Door',
        content:
          'API Gateway can reject requests with a missing or invalid token before Lambda runs, which blocks bad traffic and avoids paying for it.',
      },
      {
        id: 'least-privilege',
        title: 'Least Privilege and Per-User Data',
        content:
          'Each user reads only their own records, for example orders keyed by user ID in DynamoDB.',
      },
    ],

    services: [
      {
        id: 'cognito',
        name: 'Amazon Cognito',
        description:
          'New in this module: handles user sign-up, sign-in and tokens.',
      },
      {
        id: 'api-gateway',
        name: 'API Gateway',
        description: 'Reused: checks the token before passing requests on.',
      },
      {
        id: 'lambda',
        name: 'Lambda',
        description: 'Reused: runs the order logic.',
      },
      {
        id: 'dynamodb',
        name: 'DynamoDB',
        description: 'Reused: stores each user\'s orders.',
      },
    ],

    exploreActivity: {
      title: 'Compare Open and Protected Backends',
      comparisons: [
        {
          title: 'Module 2 backend (no authentication)',
          paths: [['User', 'API Gateway', 'Lambda', 'DynamoDB']],
          note: 'Anyone who knows the URL can call the API.',
        },
        {
          title: 'With Cognito',
          paths: [
            [
              'User',
              'Cognito (sign in, receive token)',
              'API Gateway (checks token)',
              'Lambda',
              'DynamoDB',
            ],
          ],
        },
      ],
      explanation: [
        'Compare the two architectures and ask: what can an attacker do in each one?',
      ],
    },

    buildActivity: {
      title: 'Build the Secured Ordering Backend',
      requiredServices: ['cognito', 'api_gateway', 'lambda', 'dynamodb'],
      requiredConnections: [
        { source: 'cognito', target: 'api_gateway' },
        { source: 'api_gateway', target: 'lambda' },
        { source: 'lambda', target: 'dynamodb' },
      ],
      buttonText: 'Build in Playground',
    },

    costChallenge: {
      title: 'The Price of Security',
      description:
        'Security features have a price, so choose them based on risk.',
      steps: [
        'Change monthly active users from 1,000 to 100,000 in the Cognito panel and watch the Cognito cost.',
        'Turn on MFA (SMS) and advanced security and see what each one adds.',
      ],
      question:
        'Which security features are worth their price for ByteBites, and how would you decide?',
    },

    aiActivity: {
      title: 'Security Review with ArchBot',
      prompt:
        'Review my architecture. Which parts of my API are still exposed, and what would you protect first?',
      studentTask:
        'Accept or reject each point and say why.',
      compareWithStudentArchitecture: true,
    },

    quiz: [
      {
        id: 'm5-q1',
        question: 'Which service handles user sign-up and sign-in?',
        options: ['DynamoDB', 'Cognito', 'CloudFront', 'SQS'],
        answer: 'Cognito',
        explanation:
          'Amazon Cognito manages user pools, sign-up, sign-in and tokens.',
      },
      {
        id: 'm5-q2',
        question:
          'Why reject an unauthenticated request at API Gateway rather than in Lambda?',
        options: [
          'Lambda cannot read tokens',
          'API Gateway stores the passwords',
          'It makes DynamoDB faster',
          'It blocks the request before any compute runs, which is safer and cheaper',
        ],
        answer:
          'It blocks the request before any compute runs, which is safer and cheaper',
        explanation:
          'Rejecting early means bad requests never reach, or get billed for, your backend code.',
      },
      {
        id: 'm5-q3',
        question:
          'What is the difference between authentication and authorization?',
        options: [
          'They are two names for the same thing',
          'Authentication proves who you are, authorization decides what you can access',
          'Authentication decides what you can access, authorization proves who you are',
          'Authentication only applies to databases',
        ],
        answer:
          'Authentication proves who you are, authorization decides what you can access',
        explanation:
          'First the system establishes identity, then it checks what that identity is allowed to do.',
      },
    ],
  },

  {
    id: 'module-6',
    moduleNumber: 6,
    title: 'High Availability & Load Balancing',
    shortTitle: 'High Availability',
    description:
      'Find and remove single points of failure with a load balancer, redundant servers and a Multi-AZ database.',
    objective:
      'Learn to find and remove single points of failure, and understand that availability has a cost.',

    scenario: {
      title: 'The Friday Night Outage',
      description:
        'On a Friday-night rush, ByteBites\' single EC2 server crashed and the whole site went down for 40 minutes. Even planned maintenance means downtime. The company wants the site up even when one server fails.',
      requirements: [
        'Stay available when one server fails',
        'Avoid downtime for planned maintenance',
        'Protect the database as well as the application tier',
      ],
    },

    lessons: [
      {
        id: 'spof',
        title: 'Single Point of Failure',
        content:
          'Any component whose failure takes the whole application down is a single point of failure.',
      },
      {
        id: 'load-balancing',
        title: 'Load Balancing and Health Checks',
        content:
          'A load balancer spreads traffic across servers and stops sending requests to unhealthy ones.',
      },
      {
        id: 'stateless',
        title: 'Horizontal Scaling Needs Stateless Servers',
        content:
          'If any server can handle any request, shared state such as sessions must live outside the servers. This is one reason to use ElastiCache.',
      },
      {
        id: 'multi-az',
        title: 'Multi-AZ',
        content:
          'Running a standby copy in a separate data center protects the database. RDS offers a Single-AZ or Multi-AZ choice.',
      },
    ],

    services: [
      {
        id: 'elb',
        name: 'Elastic Load Balancing',
        description:
          'New in this module: distributes traffic and skips unhealthy servers.',
      },
      {
        id: 'ec2',
        name: 'Amazon EC2',
        description: 'Reused: run at least two servers behind the load balancer.',
      },
      {
        id: 'rds',
        name: 'Amazon RDS',
        description: 'Reused: compare Single-AZ and Multi-AZ.',
      },
      {
        id: 'elasticache',
        name: 'Amazon ElastiCache',
        description: 'Reused: holds session data outside the servers.',
      },
    ],

    exploreActivity: {
      title: 'Fail a Server and Trace What Happens',
      comparisons: [
        {
          title: 'Before',
          paths: [['User', 'EC2', 'RDS']],
          note: 'Every box is a single point of failure.',
        },
        {
          title: 'After',
          paths: [
            ['User', 'ELB', 'EC2 (A)', 'RDS (Multi-AZ)'],
            ['ELB', 'EC2 (B)', 'RDS (Multi-AZ)'],
            ['EC2 (A) and EC2 (B)', 'ElastiCache'],
          ],
          note: 'Imagine one server failing in each version and trace what the user sees.',
        },
      ],
    },

    buildActivity: {
      title: 'Build the Highly Available Architecture',
      requiredServices: ['elb', 'ec2', 'rds', 'elasticache'],
      minServiceCounts: { ec2: 2 },
      requiredConnections: [
        { source: 'elb', target: 'ec2' },
        { source: 'ec2', target: 'rds' },
        { source: 'ec2', target: 'elasticache' },
      ],
      buttonText: 'Build in Playground',
    },

    costChallenge: {
      title: 'The Cost of Availability',
      description:
        'Find what the extra availability costs per month.',
      steps: [
        'The EC2 panel applies to all EC2 nodes, so use its instance count to compare 1, 2 and 3 instances and recalculate each time.',
        'Switch RDS between Single-AZ and Multi-AZ and recalculate.',
        'Work out the monthly cost of the extra availability.',
      ],
      question:
        'Does a student-run study-notes site need the same availability as ByteBites ordering?',
    },

    aiActivity: {
      title: 'Hunt Single Points of Failure with ArchBot',
      prompt:
        'List every remaining single point of failure in my architecture.',
      studentTask:
        'Check the AI list against what you built and decide which items you agree with.',
      compareWithStudentArchitecture: true,
    },

    quiz: [
      {
        id: 'm6-q1',
        question:
          'What does a load balancer do when a server fails its health check?',
        options: [
          'It restarts the whole application',
          'It copies the server to another region',
          'It stops sending traffic to that server',
          'It keeps sending traffic to that server anyway',
        ],
        answer: 'It stops sending traffic to that server',
        explanation:
          'Health checks let the load balancer route around failed servers automatically.',
      },
      {
        id: 'm6-q2',
        question:
          'Why keep session data in ElastiCache rather than on each EC2 server?',
        options: [
          'It makes the servers cheaper per hour',
          'Any server can then handle any request, and sessions survive a server failure',
          'EC2 cannot store any data',
          'It removes the need for a load balancer',
        ],
        answer:
          'Any server can then handle any request, and sessions survive a server failure',
        explanation:
          'Keeping state outside the servers makes them interchangeable.',
      },
      {
        id: 'm6-q3',
        question:
          'Does RDS Multi-AZ replace the need for the load balancer?',
        options: [
          'Yes, it balances web traffic',
          'Yes, but only for read traffic',
          'No, because Multi-AZ only works with DynamoDB',
          'No, it protects the database while the load balancer protects the application tier',
        ],
        answer:
          'No, it protects the database while the load balancer protects the application tier',
        explanation:
          'They protect different layers of the architecture, so you usually want both.',
      },
    ],
  },

  {
    id: 'module-7',
    moduleNumber: 7,
    title: 'Managed Platforms & Global Delivery',
    shortTitle: 'Managed Platforms',
    description:
      'Compare a managed platform with hand-built servers and serve a distant audience quickly.',
    objective:
      'Understand the trade-off between control and operational effort, and how to serve a distant audience quickly.',

    scenario: {
      title: 'ByteBites Goes to New Cities',
      description:
        'ByteBites is launching in several new cities. The engineering team is small and spends too much time patching servers and tuning scaling. Customers far from the servers also see slow image loads.',
      requirements: [
        'Spend less time patching servers and tuning scaling',
        'Load images quickly for distant customers',
        'Handle changing demand automatically',
      ],
    },

    lessons: [
      {
        id: 'paas',
        title: 'Managed Platforms (PaaS)',
        content:
          'You upload application code, and the platform sets up the servers, load balancing and scaling.',
      },
      {
        id: 'auto-scaling',
        title: 'Auto Scaling',
        content:
          'Instance counts follow demand, within a minimum and maximum you set. A target CPU utilization drives the scaling.',
      },
      {
        id: 'split-static-dynamic',
        title: 'Split Static and Dynamic',
        content:
          'Serve images and static files from S3 through CloudFront, and send only dynamic requests to the application.',
      },
      {
        id: 'operational-effort',
        title: 'Operational Effort Is a Real Cost',
        content:
          'Hours spent managing servers do not appear on the AWS bill, but they cost the company.',
      },
    ],

    services: [
      {
        id: 'elastic-beanstalk',
        name: 'AWS Elastic Beanstalk',
        description:
          'New in this module: a managed platform that runs your application.',
      },
      {
        id: 'cloudfront',
        name: 'Amazon CloudFront',
        description: 'Reused: delivers content close to users.',
      },
      {
        id: 's3',
        name: 'Amazon S3',
        description: 'Reused: stores images and static files.',
      },
      {
        id: 'rds',
        name: 'Amazon RDS',
        description: 'Reused: the application database.',
      },
    ],

    exploreActivity: {
      title: 'Compare Hand-Built and Managed',
      comparisons: [
        {
          title: 'Module 6 (hand-built)',
          paths: [['User', 'ELB', 'EC2', 'RDS']],
          note: 'You wire the load balancer, servers and scaling yourself. Full control, higher ongoing effort.',
        },
        {
          title: 'Module 7 (managed)',
          paths: [
            ['User', 'CloudFront', 'S3'],
            ['CloudFront', 'Elastic Beanstalk', 'RDS'],
          ],
          note: 'The platform provisions the servers, load balancing and scaling. Less control, lower ongoing effort.',
        },
      ],
      explanation: [
        'Both architectures use the same building blocks underneath.',
      ],
    },

    buildActivity: {
      title: 'Build the Managed Global Architecture',
      requiredServices: ['cloudfront', 's3', 'elastic_beanstalk', 'rds'],
      requiredConnections: [
        { source: 'cloudfront', target: 's3' },
        { source: 'cloudfront', target: 'elastic_beanstalk' },
        { source: 'elastic_beanstalk', target: 'rds' },
      ],
      buttonText: 'Build in Playground',
    },

    costChallenge: {
      title: 'Managed vs Hand-Built Cost',
      description:
        'Estimate the managed architecture and compare it with Module 6, remembering what the numbers do not show.',
      steps: [
        'Configure Elastic Beanstalk with auto scaling, then change the minimum and maximum instances and the load balancer setting.',
        'Raise the share of traffic served through CloudFront and watch the effect on the total.',
        'Compare the total with your Module 6 estimate.',
      ],
      question:
        'What does the AWS bill not show about hand-built EC2 versus a managed platform?',
    },

    aiActivity: {
      title: 'Argue Both Sides with ArchBot',
      prompt:
        'Would a managed platform or a hand-built EC2 setup suit a 3-person team? Argue both sides.',
      studentTask:
        'Pick one option and write a one-line reason.',
      compareWithStudentArchitecture: true,
    },

    quiz: [
      {
        id: 'm7-q1',
        question: 'What does Elastic Beanstalk do for you?',
        options: [
          'It stores objects for your website',
          'It authenticates your users',
          'It queues messages between services',
          'It provisions and manages the servers, load balancing and scaling for your application',
        ],
        answer:
          'It provisions and manages the servers, load balancing and scaling for your application',
        explanation:
          'Elastic Beanstalk is a managed platform, so you focus on the code.',
      },
      {
        id: 'm7-q2',
        question:
          'Why serve images through CloudFront and S3 instead of the application servers?',
        options: [
          'S3 is required for all dynamic content',
          'It is faster for distant users and takes load off the application',
          'CloudFront runs your database queries',
          'It removes the need for any servers',
        ],
        answer:
          'It is faster for distant users and takes load off the application',
        explanation:
          'CloudFront caches content near users, and the application only handles dynamic requests.',
      },
      {
        id: 'm7-q3',
        question: 'When might you still prefer hand-built EC2?',
        options: [
          'When you want the least possible control',
          'When you need fine-grained control the platform does not offer',
          'When you never want to manage anything',
          'When you only serve static files',
        ],
        answer:
          'When you need fine-grained control the platform does not offer',
        explanation:
          'Managed platforms trade some control for lower operational effort.',
      },
    ],
  },

  {
    id: 'module-8',
    moduleNumber: 8,
    title: 'Data Strategy & Storage Lifecycle',
    shortTitle: 'Data Strategy',
    description:
      'Match each kind of data to the right store and cut cost by using the right storage tier over time.',
    objective:
      'Learn to match each kind of data to the right store, and to cut cost by using the right storage tier over time.',

    scenario: {
      title: 'ByteBites Data Overload',
      description:
        'ByteBites now holds live orders, order history for reports, receipt PDFs and years of old data. Storage costs keep climbing, and finance wants monthly sales reports.',
      requirements: [
        'Fast lookups for live orders',
        'Monthly sales reports for finance',
        'Receipt PDFs stored cheaply',
        'Control the growing storage cost',
      ],
    },

    lessons: [
      {
        id: 'access-pattern',
        title: 'Match Data to Access Pattern',
        content:
          'Fast key lookups suit DynamoDB, relational queries and reports suit RDS, files suit S3, and hot repeated reads suit a cache.',
      },
      {
        id: 'storage-lifecycle',
        title: 'Storage Classes and Lifecycle',
        content:
          'Data that is accessed rarely can move to cheaper S3 storage classes over time.',
      },
      {
        id: 'backups',
        title: 'Backups and Durability',
        content:
          'High availability is not a backup. DynamoDB backup and point-in-time recovery protect against mistakes and deletions.',
      },
      {
        id: 'data-growth',
        title: 'Data Grows, So Cost Grows',
        content:
          'Storage, requests and transfer each add up as the application grows.',
      },
    ],

    services: [
      {
        id: 'api-gateway',
        name: 'API Gateway',
        description: 'Reused: the entry point.',
      },
      {
        id: 'lambda',
        name: 'Lambda',
        description: 'Reused: writes data to each store.',
      },
      {
        id: 'dynamodb',
        name: 'DynamoDB',
        description: 'Reused: fast live order lookups.',
      },
      {
        id: 'rds',
        name: 'Amazon RDS',
        description: 'Reused: reporting queries.',
      },
      {
        id: 's3',
        name: 'Amazon S3',
        description: 'Reused: receipt PDFs and old data.',
      },
      {
        id: 'elasticache',
        name: 'Amazon ElastiCache',
        description: 'Reused (optional): hot repeated reads such as the popular menu.',
      },
    ],

    exploreActivity: {
      title: 'Put Each Kind of Data in the Right Place',
      comparisons: [
        {
          title: 'ByteBites data layout',
          paths: [
            ['Order placed', 'Lambda', 'DynamoDB (fast live lookup)'],
            ['Lambda', 'RDS (reporting)'],
            ['Receipt PDF', 'Lambda', 'S3'],
            ['Popular menu', 'ElastiCache (hot reads)'],
          ],
        },
      ],
      explanation: [
        'Before reading on, sort these six data types into the right store: live orders, receipts, the menu, monthly reports, 3-year-old orders and app images.',
        'Then compare your choices with the layout above.',
      ],
    },

    buildActivity: {
      title: 'Build the ByteBites Data Architecture',
      requiredServices: ['api_gateway', 'lambda', 'dynamodb', 'rds', 's3'],
      optionalServices: ['elasticache'],
      requiredConnections: [
        { source: 'api_gateway', target: 'lambda' },
        { source: 'lambda', target: 'dynamodb' },
        { source: 'lambda', target: 'rds' },
        { source: 'lambda', target: 's3' },
      ],
      buttonText: 'Build in Playground',
    },

    costChallenge: {
      title: 'Choose the Cheapest Correct Storage',
      description:
        'Access frequency decides the cheapest correct storage.',
      steps: [
        'Model 500 GB of old receipts in the S3 panel using S3 Standard, then a cheaper infrequent-access class, then an archive class, and compare the totals.',
        'In the DynamoDB panel, turn on backup and point-in-time recovery and see the added cost.',
      ],
      question:
        'How does access frequency decide which storage class is cheapest for a given dataset?',
    },

    aiActivity: {
      title: 'Audit Your Data Placement with ArchBot',
      prompt:
        'Which of my data is in the wrong place or the wrong tier, and what would moving it save?',
      studentTask:
        'Accept or reject each suggestion with a reason.',
      compareWithStudentArchitecture: true,
    },

    quiz: [
      {
        id: 'm8-q1',
        question:
          'Which store suits monthly sales reports that need joins and aggregation?',
        options: ['DynamoDB', 'S3', 'RDS', 'SQS'],
        answer: 'RDS',
        explanation:
          'Relational databases are designed for joins and aggregation across tables.',
      },
      {
        id: 'm8-q2',
        question: 'Why move old receipts to a colder S3 class?',
        options: [
          'Cold storage makes them load faster',
          'They are rarely accessed, so a cheaper storage class cuts cost',
          'S3 Standard cannot store PDFs',
          'It protects them from accidental deletion',
        ],
        answer:
          'They are rarely accessed, so a cheaper storage class cuts cost',
        explanation:
          'Colder classes charge less for storage in exchange for slower or costlier access.',
      },
      {
        id: 'm8-q3',
        question: 'Is RDS Multi-AZ a backup?',
        options: [
          'Yes, it keeps every old version of your data',
          'Yes, it replaces point-in-time recovery',
          'No, it protects against failure but not against accidental deletion or bad data',
          'No, because RDS cannot be backed up',
        ],
        answer:
          'No, it protects against failure but not against accidental deletion or bad data',
        explanation:
          'A Multi-AZ standby copies bad writes too, so you still need backups.',
      },
    ],
  },

  {
    id: 'module-9',
    moduleNumber: 9,
    title: 'Capstone: Design, Optimize & Justify',
    shortTitle: 'Capstone',
    description:
      'Design an architecture against requirements, hit a budget and defend your trade-offs.',
    objective:
      'Combine everything you have learned: design against requirements, meet a budget and justify the trade-offs. There is no single correct answer.',

    scenario: {
      title: 'ByteBites Everywhere',
      description:
        'The board approves "ByteBites Everywhere". You are the lead architect for a platform with a very large customer base, secure accounts, huge promotional spikes, a small engineering team and a fixed monthly budget.',
      requirements: [
        '1 million customers across several cities',
        'Secure customer accounts',
        'Survive huge promotional spikes',
        'Run by a 4-person engineering team',
        'Stay within a fixed monthly budget',
      ],
    },

    lessons: [
      {
        id: 'five-lenses',
        title: 'Five Lenses for Judging an Architecture',
        content:
          'A simplified Well-Architected view. Ask these questions of any design.',
        points: [
          { term: 'Reliability', description: 'What happens when something fails?' },
          { term: 'Security', description: 'Who can access what?' },
          { term: 'Performance', description: 'Is it fast enough at peak?' },
          { term: 'Cost', description: 'Does it fit the budget?' },
          { term: 'Operational effort', description: 'Can a small team run it?' },
        ],
      },
      {
        id: 'justification',
        title: 'Writing a Design Justification',
        content:
          'Good architects explain their choices. Write short statements in the form: "I chose X over Y because...".',
      },
    ],

    services: [
      {
        id: 'all-services',
        name: 'All 13 services',
        description:
          'No new services. Choose any combination of the services you have learned.',
      },
    ],

    exploreActivity: {
      title: 'Two Reference Designs, Neither Marked Correct',
      comparisons: [
        {
          title: 'Serverless-first',
          paths: [
            ['User', 'CloudFront', 'S3'],
            ['User', 'Cognito', 'API Gateway', 'Lambda', 'SQS'],
            ['Lambda', 'DynamoDB'],
            ['CloudWatch'],
          ],
        },
        {
          title: 'Managed-platform-first',
          paths: [
            ['User', 'CloudFront', 'S3'],
            ['CloudFront', 'Elastic Beanstalk', 'RDS'],
            ['User', 'Cognito'],
            ['Elastic Beanstalk', 'SQS'],
            ['CloudWatch'],
          ],
        },
      ],
      tradeoffs: [
        {
          term: 'Reliability',
          description:
            'Serverless leaves server redundancy to the platform. A managed platform depends on how you configure scaling and load balancing.',
        },
        {
          term: 'Security',
          description:
            'Both can put Cognito in front of the application. Serverless leaves less server configuration for you to secure.',
        },
        {
          term: 'Performance',
          description:
            'Serverless functions can see cold starts when idle. Running servers give steadier latency but must be sized for peak demand.',
        },
        {
          term: 'Cost',
          description:
            'Serverless cost follows usage and is low when idle. Running instances carry a baseline cost that can pay off at steady high traffic.',
        },
        {
          term: 'Operational effort',
          description:
            'Serverless needs the least day-to-day server work. A managed platform needs some tuning of instances and scaling.',
        },
      ],
    },

    buildActivity: {
      title: 'Design the ByteBites Everywhere Architecture',
      requiredServices: [],
      requiredConnections: [],
      monthlyBudgetUSD: 3000,
      rules: [
        {
          id: 'authentication',
          label:
            'Users can sign in securely (an authentication component is present)',
          check: { type: 'hasService', services: ['cognito'] },
        },
        {
          id: 'global-static',
          label:
            'Static content is delivered globally (CloudFront in front of S3)',
          check: { type: 'hasConnection', source: 'cloudfront', target: 's3' },
        },
        {
          id: 'no-single-point-of-failure',
          label:
            'No single point of failure in the request path (serverless, a load-balanced pair of EC2 servers, or Elastic Beanstalk)',
          check: {
            type: 'anyOf',
            checks: [
              { type: 'hasService', services: ['api_gateway', 'lambda'] },
              {
                type: 'allOf',
                checks: [
                  { type: 'hasService', services: ['elb'] },
                  { type: 'minCount', service: 'ec2', count: 2 },
                ],
              },
              { type: 'hasService', services: ['elastic_beanstalk'] },
            ],
          },
        },
        {
          id: 'async-buffer',
          label:
            'Order spikes cannot lose requests (an asynchronous buffer is present)',
          check: { type: 'hasService', services: ['sqs'] },
        },
        {
          id: 'monitoring',
          label: 'The system is monitored',
          check: { type: 'hasService', services: ['cloudwatch'] },
        },
        {
          id: 'budget',
          label: 'Estimated monthly cost is within the budget',
          check: { type: 'maxCost' },
        },
      ],
      buttonText: 'Build in Playground',
    },

    costChallenge: {
      title: 'Meet the Budget',
      description:
        'Find the biggest cost items, change them, recalculate and record the saving.',
      steps: [
        'Calculate the cost of every service in your design.',
        'Find the three biggest cost items.',
        'Change configurations or services to reduce them, then recalculate.',
        'Record the saving you achieved and what you gave up.',
      ],
      question:
        'Which saving came with no trade-off, and which one cost you reliability, performance or control?',
    },

    aiActivity: {
      title: 'Design Review with ArchBot',
      prompt:
        'Critique my architecture against reliability, security, performance, cost and operational effort. List the three biggest risks.',
      studentTask:
        'Accept or reject each recommendation with a one-line justification. When your design validates, the diagram shown in the Playground is your final deliverable.',
      compareWithStudentArchitecture: true,
    },

    quiz: [
      {
        id: 'm9-q1',
        question:
          'A promotion is about to cause a 20x order spike. Which change helps most without raising idle cost?',
        options: [
          'Double every EC2 instance permanently',
          'Remove monitoring to save cost',
          'Add a queue to absorb the spike and let processing scale',
          'Move all data to a colder storage class',
        ],
        answer: 'Add a queue to absorb the spike and let processing scale',
        explanation:
          'A queue absorbs the burst, and you only pay for extra processing while it is needed.',
      },
      {
        id: 'm9-q2',
        question:
          'You must cut cost by 30% without hurting availability. What do you try first?',
        options: [
          'Right-size over-provisioned instances and move cold data to cheaper tiers',
          'Remove the load balancer and run one server',
          'Disable Multi-AZ on every database',
          'Delete all monitoring',
        ],
        answer:
          'Right-size over-provisioned instances and move cold data to cheaper tiers',
        explanation:
          'These savings remove waste, whereas removing redundancy trades away availability.',
      },
      {
        id: 'm9-q3',
        question: 'Why might two correct architectures differ?',
        options: [
          'Only one design is technically valid',
          'AWS prices change daily',
          'Different weighting of cost, effort, control and performance',
          'The canvas allows only one layout',
        ],
        answer: 'Different weighting of cost, effort, control and performance',
        explanation:
          'Good designs depend on which requirements matter most to the team and the business.',
      },
    ],
  },
];