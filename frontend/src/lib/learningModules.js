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
];