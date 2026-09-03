'use client';

import { useState, useEffect } from 'react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';

import {
  ChevronLeft,
  MessageSquare,
  X,
  CheckCircle,
  AlertCircle,
  Info,
} from 'lucide-react';

import { learningModules } from '@/lib/learningModules';

import {
  useArchitectureStore,
  usePricingStore,
} from '@/store';

import { PlaygroundCanvas } from '@/components/playground/PlaygroundCanvas';

import { APIGatewayConfigPanel } from '@/components/services/APIGatewayConfigPanel';
import { LambdaConfigPanel } from '@/components/services/LambdaConfigPanel';
import { S3ConfigPanel } from '@/components/services/S3ConfigPanel';
import { CognitoConfigPanel } from '@/components/services/CognitoConfigPanel';
import { DynamoDBConfigPanel } from '@/components/services/DynamoDBConfigPanel';
import { ELBConfigPanel } from '@/components/services/ELBConfigPanel';
import { ElasticBeanstalkConfigPanel } from '@/components/services/ElasticBeanstalkConfigPanel';
import { CloudWatchConfigPanel } from '@/components/services/CloudWatchConfigPanel';
import { CloudFrontConfigPanel } from '@/components/services/CloudFrontConfigPanel';
import { ElastiCacheConfigPanel } from '@/components/services/ElastiCacheConfigPanel';
import { SQSConfigPanel } from '@/components/services/SQSConfigPanel';

import { ArchitectChatbot } from '@/components/chatbot';

export default function PlaygroundPage() {
  const searchParams = useSearchParams();

  // ============================================================
  // MODULE CONTEXT
  // ============================================================

  const moduleId = searchParams.get('module');

  const module = learningModules.find(
    (item) => item.id === moduleId
  );

  // ============================================================
  // ARCHITECTURE STORE
  // ============================================================

  const architectureNodes = useArchitectureStore(
    (state) => state.nodes
  );

  const architectureConnections = useArchitectureStore(
    (state) => state.connections
  );

  // ============================================================
  // LOCAL STATE
  // ============================================================

  const [selectedNodeId, setSelectedNodeId] = useState(null);

  const [openConfigPanel, setOpenConfigPanel] =
    useState(null);

  const [showChatbot, setShowChatbot] =
    useState(false);

  const [validationResult, setValidationResult] =
    useState(null);

  // ============================================================
  // PRICING
  // ============================================================

  const totalCost = usePricingStore(
    (state) => state.totalCost
  );

  // ============================================================
  // MODULE CONTEXT DEBUG
  // ============================================================

  useEffect(() => {
    if (!module) {
      console.log(
        'Playground opened without a learning module.'
      );

      return;
    }

    console.log('================================');
    console.log('Learning Module:', module.title);
    console.log('Module ID:', module.id);

    console.log(
      'Required Services:',
      module.buildActivity?.requiredServices || []
    );

    console.log(
      'Required Connections:',
      module.buildActivity?.requiredConnections || []
    );

    console.log('================================');
  }, [module]);

  // ============================================================
  // SERVICE DISPLAY NAME
  // ============================================================

  const getServiceName = (serviceType) => {
    const names = {
      api_gateway: 'API Gateway',
      lambda: 'Lambda',
      s3: 'S3',
      cognito: 'Cognito',
      dynamodb: 'DynamoDB',
      elb: 'ELB',
      elastic_beanstalk: 'Elastic Beanstalk',
      cloudwatch: 'CloudWatch',
      cloudfront: 'CloudFront',
      elasticache: 'ElastiCache',
      sqs: 'SQS',
    };

    return names[serviceType] || serviceType;
  };

  // ============================================================
  // NODE SELECTION
  // ============================================================

  const handleNodeSelect = (node) => {
    console.log('Node selected:', node);

    setSelectedNodeId(node.id);

    const serviceType =
      node?.data?.serviceType || node?.serviceType;

    console.log(
      'Selected service type:',
      serviceType
    );

    switch (serviceType) {
      case 'api_gateway':
        setOpenConfigPanel('api_gateway');
        break;

      case 'lambda':
        setOpenConfigPanel('lambda');
        break;

      case 's3':
        setOpenConfigPanel('s3');
        break;

      case 'cognito':
        setOpenConfigPanel('cognito');
        break;

      case 'dynamodb':
        setOpenConfigPanel('dynamodb');
        break;

      case 'elb':
        setOpenConfigPanel('elb');
        break;

      case 'elastic_beanstalk':
        setOpenConfigPanel('elastic_beanstalk');
        break;

      case 'cloudwatch':
        setOpenConfigPanel('cloudwatch');
        break;

      case 'cloudfront':
        setOpenConfigPanel('cloudfront');
        break;

      case 'elasticache':
        setOpenConfigPanel('elasticache');
        break;

      case 'sqs':
        setOpenConfigPanel('sqs');
        break;

      default:
        console.warn(
          'Unknown service type:',
          serviceType
        );

        setOpenConfigPanel(null);
    }
  };

  // ============================================================
  // CONNECTION DISPLAY NAME
  // ============================================================

  const getConnectionName = (connection) => {
    const sourceNode = architectureNodes.find(
      (node) => node.id === connection.source
    );

    const targetNode = architectureNodes.find(
      (node) => node.id === connection.target
    );

    const sourceService =
      sourceNode?.serviceType ||
      sourceNode?.data?.serviceType ||
      connection.source;

    const targetService =
      targetNode?.serviceType ||
      targetNode?.data?.serviceType ||
      connection.target;

    return `${getServiceName(
      sourceService
    )} → ${getServiceName(targetService)}`;
  };

  // ============================================================
  // VALIDATE ARCHITECTURE
  // ============================================================

  const validateArchitecture = () => {
    // ----------------------------------------------------------
    // No module = normal free-play playground
    // ----------------------------------------------------------

    if (!module?.buildActivity) {
      const result = {
        valid: true,
        missingServices: [],
        missingConnections: [],
        extraServices: [],
      };

      setValidationResult(result);

      return result;
    }

    // ----------------------------------------------------------
    // Required architecture from module
    // ----------------------------------------------------------

    const requiredServices =
      module.buildActivity.requiredServices || [];

    const requiredConnections =
      module.buildActivity.requiredConnections || [];

    // ----------------------------------------------------------
    // Student services
    // ----------------------------------------------------------

    const studentServices =
      architectureNodes
        .map(
          (node) =>
            node.serviceType ||
            node.data?.serviceType
        )
        .filter(Boolean);

    // ----------------------------------------------------------
    // Missing services
    // ----------------------------------------------------------

    const missingServices =
      requiredServices.filter(
        (requiredService) =>
          !studentServices.includes(requiredService)
      );

    // ----------------------------------------------------------
    // Extra services
    // ----------------------------------------------------------

    const extraServices =
      studentServices.filter(
        (service) =>
          !requiredServices.includes(service)
      );

    // ----------------------------------------------------------
    // Missing connections
    // ----------------------------------------------------------

    const missingConnections =
      requiredConnections.filter(
        (requiredConnection) => {
          const connectionExists =
            architectureConnections.some(
              (connection) => {
                const sourceNode =
                  architectureNodes.find(
                    (node) =>
                      node.id === connection.source
                  );

                const targetNode =
                  architectureNodes.find(
                    (node) =>
                      node.id === connection.target
                  );

                if (
                  !sourceNode ||
                  !targetNode
                ) {
                  return false;
                }

                const sourceService =
                  sourceNode.serviceType ||
                  sourceNode.data?.serviceType;

                const targetService =
                  targetNode.serviceType ||
                  targetNode.data?.serviceType;

                return (
                  sourceService ===
                    requiredConnection.source &&
                  targetService ===
                    requiredConnection.target
                );
              }
            );

          return !connectionExists;
        }
      );

    // ----------------------------------------------------------
    // Final validation
    // ----------------------------------------------------------

    const valid =
      missingServices.length === 0 &&
      missingConnections.length === 0;

    const result = {
      valid,
      missingServices,
      missingConnections,
      extraServices,
    };

    console.log(
      'Architecture Validation Result:',
      result
    );

    setValidationResult(result);

    return result;
  };

  // ============================================================
  // CHATBOT
  // ============================================================

  const handleChatbotToggle = () => {
    setShowChatbot((current) => {
      const next = !current;

      if (next) {
        setOpenConfigPanel(null);
      }

      return next;
    });
  };

  // ============================================================
  // UI
  // ============================================================

  return (
    <div className="w-full h-screen flex flex-col bg-white">

      {/* ======================================================
          HEADER
      ======================================================= */}

      <div className="bg-white border-b border-gray-200 p-4 flex items-center justify-between">

        {/* LEFT */}

        <div className="flex items-center gap-4">

          <Link href="/">
            <button
              className="
                flex items-center gap-1
                text-gray-600
                hover:text-gray-900
              "
            >
              <ChevronLeft className="w-5 h-5" />
              <span>Back</span>
            </button>
          </Link>

          <div>

            <h1 className="text-2xl font-bold text-gray-900">
              Architecture Playground
            </h1>

            <p className="text-sm text-gray-500">
              Design and simulate AWS architectures
            </p>

            {module && (
              <div className="mt-1 text-xs text-blue-600 font-medium">
                Learning Module {module.moduleNumber}:{' '}
                {module.shortTitle}
              </div>
            )}

          </div>

        </div>

        {/* RIGHT */}

        <div className="flex items-center gap-3">

          {/* VALIDATE */}

          {module && (
            <button
              onClick={validateArchitecture}
              className="
                px-4 py-2
                rounded-lg
                bg-blue-600
                hover:bg-blue-700
                text-white
                font-medium
                text-sm
                transition
              "
            >
              Validate Architecture
            </button>
          )}

          {/* COST */}

          {totalCost > 0 && (
            <div className="text-right">

              <p className="text-xs text-gray-500">
                Estimated Monthly Cost
              </p>

              <p className="text-2xl font-bold text-yellow-600">
                ${totalCost.toFixed(2)}
              </p>

            </div>
          )}

          {/* ARCHBOT */}

          <button
            onClick={handleChatbotToggle}
            className={`
              flex items-center gap-2
              px-4 py-2
              rounded-lg
              font-medium
              text-sm
              transition-all
              duration-200
              border

              ${
                showChatbot
                  ? `
                    bg-zinc-900
                    text-amber-400
                    border-zinc-700
                  `
                  : `
                    bg-gray-100
                    hover:bg-gray-900
                    text-gray-700
                    hover:text-amber-400
                    border-gray-200
                  `
              }
            `}
          >

            {showChatbot ? (
              <>
                <X className="w-4 h-4" />
                Close ArchBot
              </>
            ) : (
              <>
                <MessageSquare className="w-4 h-4" />
                ArchBot

                <span
                  className="
                    inline-flex
                    items-center
                    justify-center
                    w-4 h-4
                    rounded-full
                    bg-amber-500
                    text-zinc-900
                    text-[9px]
                    font-black
                  "
                >
                  AI
                </span>
              </>
            )}

          </button>

        </div>

      </div>

      {/* ======================================================
          MODULE INSTRUCTIONS
      ======================================================= */}

      {module && (
        <div
          className="
            border-b
            border-blue-200
            bg-blue-50
            px-6
            py-4
          "
        >

          <div className="max-w-5xl">

            <div className="flex items-start gap-3">

              <Info
                className="
                  w-5 h-5
                  text-blue-600
                  mt-0.5
                  flex-shrink-0
                "
              />

              <div className="flex-1">

                <h2 className="font-semibold text-blue-900">
                  Module {module.moduleNumber} Build Activity
                </h2>

                <p className="text-sm text-blue-800 mt-1">
                  {module.buildActivity?.title}
                </p>

                <p className="text-sm text-blue-700 mt-2">
                  Build the required architecture on the
                  canvas, connect the services correctly,
                  configure them if needed, and then click
                  <strong> Validate Architecture</strong>.
                </p>

                {/* REQUIRED SERVICES */}

                {module.buildActivity
                  ?.requiredServices?.length > 0 && (

                  <div className="mt-3">

                    <p className="text-xs font-semibold text-blue-900 mb-2">
                      Required Services
                    </p>

                    <div className="flex flex-wrap gap-2">

                      {module.buildActivity.requiredServices.map(
                        (service) => (
                          <span
                            key={service}
                            className="
                              px-3 py-1
                              rounded-full
                              bg-white
                              border
                              border-blue-200
                              text-xs
                              text-blue-800
                              font-medium
                            "
                          >
                            {getServiceName(service)}
                          </span>
                        )
                      )}

                    </div>

                  </div>
                )}

                {/* REQUIRED CONNECTIONS */}

                {module.buildActivity
                  ?.requiredConnections?.length > 0 && (

                  <div className="mt-3">

                    <p className="text-xs font-semibold text-blue-900 mb-2">
                      Required Connections
                    </p>

                    <div className="flex flex-wrap gap-2">

                      {module.buildActivity.requiredConnections.map(
                        (connection, index) => (
                          <span
                            key={`${connection.source}-${connection.target}-${index}`}
                            className="
                              px-3 py-1
                              rounded-full
                              bg-white
                              border
                              border-blue-200
                              text-xs
                              text-blue-800
                              font-medium
                            "
                          >
                            {getServiceName(
                              connection.source
                            )}{' '}
                            →
                            {' '}
                            {getServiceName(
                              connection.target
                            )}
                          </span>
                        )
                      )}

                    </div>

                  </div>
                )}

              </div>

            </div>

          </div>

        </div>
      )}

      {/* ======================================================
          VALIDATION RESULT
      ======================================================= */}

      {validationResult && (
        <div className="border-b border-gray-200 bg-gray-50 px-6 py-4">

          {validationResult.valid ? (

            <div
              className="
                rounded-lg
                border
                border-green-200
                bg-green-50
                p-4
              "
            >

              <div className="flex items-start gap-3">

                <CheckCircle
                  className="
                    w-6 h-6
                    text-green-600
                    flex-shrink-0
                  "
                />

                <div>

                  <h2 className="font-semibold text-green-800">
                    Architecture Valid
                  </h2>

                  <p className="text-sm text-green-700 mt-1">
                    Your architecture satisfies all required
                    services and connections for this learning
                    module.
                  </p>

                  <div className="mt-3 flex flex-wrap gap-2">

                    {module?.buildActivity?.requiredServices?.map(
                      (service) => (
                        <span
                          key={service}
                          className="
                            px-2 py-1
                            rounded
                            bg-green-100
                            border
                            border-green-200
                            text-xs
                            text-green-800
                          "
                        >
                          ✓ {getServiceName(service)}
                        </span>
                      )
                    )}

                  </div>

                </div>

              </div>

            </div>

          ) : (

            <div
              className="
                rounded-lg
                border
                border-red-200
                bg-red-50
                p-4
              "
            >

              <div className="flex items-start gap-3">

                <AlertCircle
                  className="
                    w-6 h-6
                    text-red-600
                    flex-shrink-0
                  "
                />

                <div className="flex-1">

                  <h2 className="font-semibold text-red-800">
                    Architecture Incomplete
                  </h2>

                  <p className="text-sm text-red-700 mt-1">
                    Your architecture is missing required
                    components or connections.
                  </p>

                  {/* MISSING SERVICES */}

                  {validationResult.missingServices.length > 0 && (
                    <div className="mt-3">

                      <p className="text-sm font-semibold text-red-800">
                        Missing Services
                      </p>

                      <div className="flex flex-wrap gap-2 mt-2">

                        {validationResult.missingServices.map(
                          (service) => (
                            <span
                              key={service}
                              className="
                                px-2 py-1
                                rounded
                                bg-red-100
                                text-red-800
                                border
                                border-red-200
                                text-xs
                              "
                            >
                              ✕ {getServiceName(service)}
                            </span>
                          )
                        )}

                      </div>

                    </div>
                  )}

                  {/* MISSING CONNECTIONS */}

                  {validationResult.missingConnections.length > 0 && (
                    <div className="mt-3">

                      <p className="text-sm font-semibold text-red-800">
                        Missing Connections
                      </p>

                      <div className="flex flex-wrap gap-2 mt-2">

                        {validationResult.missingConnections.map(
                          (connection, index) => (
                            <span
                              key={`${connection.source}-${connection.target}-${index}`}
                              className="
                                px-2 py-1
                                rounded
                                bg-red-100
                                text-red-800
                                border
                                border-red-200
                                text-xs
                              "
                            >
                              ✕ {getServiceName(
                                connection.source
                              )}{' '}
                              →
                              {' '}
                              {getServiceName(
                                connection.target
                              )}
                            </span>
                          )
                        )}

                      </div>

                    </div>
                  )}

                  {/* EXTRA SERVICES */}

                  {validationResult.extraServices.length > 0 && (
                    <div className="mt-3">

                      <div className="flex items-start gap-2">

                        <Info
                          className="
                            w-4 h-4
                            text-blue-500
                            mt-0.5
                          "
                        />

                        <div>

                          <p className="text-sm font-semibold text-blue-800">
                            Additional Services
                          </p>

                          <p className="text-xs text-blue-700 mt-1">
                            These services are not required
                            for this module but are allowed
                            for experimentation.
                          </p>

                          <div className="flex flex-wrap gap-2 mt-2">

                            {validationResult.extraServices.map(
                              (service, index) => (
                                <span
                                  key={`${service}-${index}`}
                                  className="
                                    px-2 py-1
                                    rounded
                                    bg-blue-100
                                    text-blue-800
                                    border
                                    border-blue-200
                                    text-xs
                                  "
                                >
                                  + {getServiceName(service)}
                                </span>
                              )
                            )}

                          </div>

                        </div>

                      </div>

                    </div>
                  )}

                </div>

              </div>

            </div>

          )}

        </div>
      )}

      {/* ======================================================
          MAIN CONTENT
      ======================================================= */}

      <div className="flex-1 flex overflow-hidden">

        {/* PLAYGROUND */}

        <div className="flex-1 flex flex-col min-w-0">

          <PlaygroundCanvas
            onNodeSelect={handleNodeSelect}
          />

        </div>

        {/* CONFIG PANEL */}

        {openConfigPanel && !showChatbot && (

          <div
            className="
              w-96
              border-l
              border-gray-200
              bg-gray-50
              p-4
              overflow-y-auto
              flex-shrink-0
            "
          >

            <div className="relative">

              {openConfigPanel === 'api_gateway' && (
                <APIGatewayConfigPanel
                  onClose={() =>
                    setOpenConfigPanel(null)
                  }
                />
              )}

              {openConfigPanel === 'lambda' && (
                <LambdaConfigPanel
                  onClose={() =>
                    setOpenConfigPanel(null)
                  }
                />
              )}

              {openConfigPanel === 's3' && (
                <S3ConfigPanel
                  onClose={() =>
                    setOpenConfigPanel(null)
                  }
                />
              )}

              {openConfigPanel === 'cognito' && (
                <CognitoConfigPanel
                  onClose={() =>
                    setOpenConfigPanel(null)
                  }
                />
              )}

              {openConfigPanel === 'dynamodb' && (
                <DynamoDBConfigPanel
                  onClose={() =>
                    setOpenConfigPanel(null)
                  }
                />
              )}

              {openConfigPanel === 'elb' && (
                <ELBConfigPanel
                  onClose={() =>
                    setOpenConfigPanel(null)
                  }
                />
              )}

              {openConfigPanel === 'elastic_beanstalk' && (
                <ElasticBeanstalkConfigPanel
                  onClose={() =>
                    setOpenConfigPanel(null)
                  }
                />
              )}

              {openConfigPanel === 'cloudwatch' && (
                <CloudWatchConfigPanel
                  onClose={() =>
                    setOpenConfigPanel(null)
                  }
                />
              )}

              {openConfigPanel === 'cloudfront' && (
                <CloudFrontConfigPanel
                  onClose={() =>
                    setOpenConfigPanel(null)
                  }
                />
              )}

              {openConfigPanel === 'elasticache' && (
                <ElastiCacheConfigPanel
                  onClose={() =>
                    setOpenConfigPanel(null)
                  }
                />
              )}

              {openConfigPanel === 'sqs' && (
                <SQSConfigPanel
                  onClose={() =>
                    setOpenConfigPanel(null)
                  }
                />
              )}

            </div>

          </div>

        )}

        {/* ARCHBOT */}

        {showChatbot && (

          <div
            className="
              w-[420px]
              flex-shrink-0
              border-l
              border-zinc-800
              overflow-hidden
            "
            style={{
              animation:
                'slideInRight 0.22s ease-out',
            }}
          >

            <style>{`
              @keyframes slideInRight {
                from {
                  opacity: 0;
                  transform: translateX(30px);
                }

                to {
                  opacity: 1;
                  transform: translateX(0);
                }
              }
            `}</style>

            <ArchitectChatbot
              embedded
              onClose={() =>
                setShowChatbot(false)
              }
            />

          </div>

        )}

      </div>

    </div>
  );
}