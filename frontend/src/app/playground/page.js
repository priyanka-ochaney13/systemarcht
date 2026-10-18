'use client';
import { useState, useEffect, useMemo, useRef } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';

import {
  ChevronLeft,
  MessageSquare,
  X,
  CheckCircle,
  AlertCircle,
  Info,
  Sparkles,
  FilePlus2,
  FolderOpen,
  Save,
  FileText,
} from 'lucide-react';

import { useLearningModules } from '@/hooks/useLearningModules';

import {
  useArchitectureStore,
  usePricingStore,
  useLearningStore,
  useServiceConfigStore,
  getServiceConfigs,
} from '@/store';
import {
  createArchitectureDocument,
  createCalculationSnapshot,
  getArchitectureDocument,
  updateArchitectureDocument,
} from '@/api/client';

import { validateModuleArchitecture } from '@/lib/architectureValidation';

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
import { EC2ConfigPanel } from '@/components/services/EC2ConfigPanel';
import { RDSConfigPanel } from '@/components/services/RDSConfigPanel';

import { ArchitectChatbot } from '@/components/chatbot';
import { MermaidArchitectureDiagram } from '@/components/playground/MermaidArchitectureDiagram';

const DOCUMENT_CALCULATION_OPTIONS = {
  currency: 'USD',
  period: 'monthly',
  free_tier: 'as configured per service',
};

const currentDocumentSignature = (title) => {
  const { nodes, connections } = useArchitectureStore.getState();
  return JSON.stringify({
    title,
    diagram_data: { nodes, connections },
    service_configs: getServiceConfigs(),
    calculation_options: DOCUMENT_CALCULATION_OPTIONS,
  });
};

function ModuleInstructions({
  module,
  getServiceName,
  panelWidth,
  validationResult,
  onDismissValidation,
}) {
  return (
    <div
      className="w-full md:flex-none md:w-[var(--instruction-panel-width)] max-h-48 md:max-h-none md:h-full flex-shrink-0 overflow-y-auto border-b border-border bg-info md:border-b-0 md:border-r"
      style={{ '--instruction-panel-width': `${panelWidth}px` }}
    >
      <div className="px-5 py-4">
        <div className="max-w-5xl">
          <div className="flex items-start gap-3">
            <Info className="w-5 h-5 text-info-foreground mt-0.5 flex-shrink-0" />

            <div className="flex-1">
              <h2 className="font-semibold text-info-foreground">
                Module {module.moduleNumber} Build Activity
              </h2>

              <p className="text-sm text-info-foreground mt-1">
                {module.buildActivity?.title}
              </p>

              <p className="text-sm text-info-foreground/80 mt-2">
                Build the required architecture on the canvas, connect the
                services correctly, configure them if needed, and then click
                <strong> Validate Architecture</strong>.
              </p>

              {module.buildActivity?.requiredServices?.length > 0 && (
                <div className="mt-3">
                  <p className="text-xs font-semibold text-info-foreground mb-2">
                    Required Services
                  </p>

                  <div className="flex flex-wrap gap-2">
                    {module.buildActivity.requiredServices.map((service) => (
                      <span
                        key={service}
                        className="px-3 py-1 rounded-full bg-card border border-border text-xs text-card-foreground font-medium"
                      >
                        {getServiceName(service)}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {module.buildActivity?.requiredConnections?.length > 0 && (
                <div className="mt-3">
                  <p className="text-xs font-semibold text-info-foreground mb-2">
                    Required Connections
                  </p>

                  <div className="flex flex-wrap gap-2">
                    {module.buildActivity.requiredConnections.map(
                      (connection, index) => (
                        <span
                          key={`${connection.source}-${connection.target}-${index}`}
                          className="px-3 py-1 rounded-full bg-card border border-border text-xs text-card-foreground font-medium"
                        >
                          {getServiceName(connection.source)} →{' '}
                          {getServiceName(connection.target)}
                        </span>
                      )
                    )}
                  </div>
                </div>
              )}

              {Object.keys(module.buildActivity?.minServiceCounts || {})
                .length > 0 && (
                <div className="mt-3">
                  <p className="text-xs font-semibold text-info-foreground mb-2">
                    Minimum Instances
                  </p>

                  <div className="flex flex-wrap gap-2">
                    {Object.entries(module.buildActivity.minServiceCounts).map(
                      ([service, count]) => (
                        <span
                          key={service}
                          className="px-3 py-1 rounded-full bg-card border border-border text-xs text-card-foreground font-medium"
                        >
                          At least {count} × {getServiceName(service)}
                        </span>
                      )
                    )}
                  </div>
                </div>
              )}

              {module.buildActivity?.rules?.length > 0 && (
                <div className="mt-3">
                  <p className="text-xs font-semibold text-info-foreground mb-2">
                    Design Requirements
                  </p>

                  <ul className="space-y-1 text-xs text-info-foreground list-disc pl-4">
                    {module.buildActivity.rules.map((rule) => (
                      <li key={rule.id}>{rule.label}</li>
                    ))}
                  </ul>

                  {module.buildActivity.monthlyBudgetUSD && (
                    <p className="text-xs text-info-foreground/80 mt-2">
                      Monthly budget: $
                      {module.buildActivity.monthlyBudgetUSD.toLocaleString(
                        'en-US'
                      )}
                    </p>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>

        {validationResult && (
          <ValidationFeedback
            result={validationResult}
            module={module}
            getServiceName={getServiceName}
            onDismiss={onDismissValidation}
          />
        )}
      </div>
    </div>
  );
}

function ValidationFeedback({ result, module, getServiceName, onDismiss }) {
  const isValid = result.valid;
  const issues = [
    ...(result.missingServices || []).map((service) =>
      `Add ${getServiceName(service)}`
    ),
    ...(result.missingConnections || []).map(
      (connection) =>
        `Connect ${getServiceName(connection.source)} to ${getServiceName(connection.target)}`
    ),
    ...(result.missingCounts || []).map(
      (item) =>
        `Add ${item.required - item.found} more ${getServiceName(item.service)}`
    ),
    ...(result.ruleResults || [])
      .filter((rule) => !rule.passed)
      .map((rule) => rule.detail ? `${rule.label}: ${rule.detail}` : rule.label),
  ];

  return (
    <section
      aria-live="polite"
      className={`mt-5 rounded-lg border p-3 ${
        isValid
          ? 'border-success-foreground/30 bg-success'
          : 'border-destructive/30 bg-destructive/10'
      }`}
    >
      <div className="flex items-start gap-2">
        {isValid ? (
          <CheckCircle className="mt-0.5 h-4 w-4 flex-shrink-0 text-success-foreground" />
        ) : (
          <AlertCircle className="mt-0.5 h-4 w-4 flex-shrink-0 text-destructive" />
        )}
        <div className="min-w-0 flex-1">
          <h3
            className={`text-sm font-semibold ${
              isValid ? 'text-success-foreground' : 'text-destructive'
            }`}
          >
            {isValid ? 'Architecture validated' : 'Architecture incomplete'}
          </h3>
          <p
            className={`mt-1 text-xs ${
              isValid ? 'text-success-foreground' : 'text-destructive'
            }`}
          >
            {isValid
              ? 'All requirements for this module are satisfied.'
              : 'Fix the items below, then validate again.'}
          </p>
        </div>
        <button
          type="button"
          onClick={onDismiss}
          aria-label="Cancel validation result"
          className="inline-flex items-center gap-1 rounded px-2 py-1 text-xs font-medium text-muted-foreground hover:bg-card hover:text-foreground"
        >
          <X className="h-4 w-4" />
          <span>Cancel</span>
        </button>
      </div>

      {!isValid && issues.length > 0 && (
        <ul className="mt-3 space-y-1 border-t border-destructive/30 pt-3 text-xs text-destructive">
          {issues.map((issue, index) => (
            <li key={`${issue}-${index}`} className="flex gap-2">
              <span aria-hidden="true">•</span>
              <span>{issue}</span>
            </li>
          ))}
        </ul>
      )}

      {isValid && module?.buildActivity?.requiredServices?.length > 0 && (
        <div className="mt-3 flex flex-wrap gap-1.5">
          {module.buildActivity.requiredServices.map((service) => (
            <span
              key={service}
              className="rounded border border-success-foreground/30 bg-card px-2 py-1 text-xs text-success-foreground"
            >
              ✓ {getServiceName(service)}
            </span>
          ))}
        </div>
      )}
    </section>
  );
}
import { ThemeToggle } from '@/components/theme/ThemeToggle';

export default function PlaygroundPage() {
  const searchParams = useSearchParams();
  const router = useRouter();

  // ============================================================
  // MODULE CONTEXT
  // ============================================================

  const moduleId = searchParams.get('module');
  const requestedDocumentId = searchParams.get('document');
  const isNewDocument = searchParams.get('newDocument') === 'true';
  const isDocumentWorkflow = !moduleId && (isNewDocument || Boolean(requestedDocumentId));
  const {
    modules: learningModules,
    isLoading: areModulesLoading,
    error: modulesError,
    retry: retryModules,
  } = useLearningModules(Boolean(moduleId));
  // eslint-disable-next-line @next/next/no-assign-module-variable
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
  const serviceConfigState = useServiceConfigStore((state) => state);
  const serviceConfigs = useMemo(
    () =>
      Object.fromEntries(
        Object.entries(serviceConfigState).filter(
          ([key, value]) => key.endsWith('Config') && value && typeof value === 'object'
        )
      ),
    [serviceConfigState]
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
  const [documentTitle, setDocumentTitle] = useState('Untitled architecture');
  const [documentId, setDocumentId] = useState(null);
  const [documentReady, setDocumentReady] = useState(false);
  const [documentSaving, setDocumentSaving] = useState(false);
  const [documentDirty, setDocumentDirty] = useState(false);
  const [documentError, setDocumentError] = useState('');
  const [latestSnapshot, setLatestSnapshot] = useState(null);
  const [documentLoadAttempt, setDocumentLoadAttempt] = useState(0);
  const loadedDocumentKey = useRef(null);
  const savedDocumentSignature = useRef(null);
  const [instructionsPanelWidth, setInstructionsPanelWidth] = useState(320);
  const [isResizingInstructions, setIsResizingInstructions] = useState(false);
  const mainContentRef = useRef(null);

  useEffect(() => {
    if (!isResizingInstructions) {
      return undefined;
    }

    const handlePointerMove = (event) => {
      const container = mainContentRef.current;
      if (!container) {
        return;
      }

      const { left, width } = container.getBoundingClientRect();
      const maximumWidth = Math.min(520, width * 0.5);
      const minimumWidth = Math.min(240, maximumWidth);
      const nextWidth = Math.min(
        maximumWidth,
        Math.max(minimumWidth, event.clientX - left)
      );

      setInstructionsPanelWidth(nextWidth);
    };

    const handlePointerUp = () => setIsResizingInstructions(false);

    window.addEventListener('pointermove', handlePointerMove);
    window.addEventListener('pointerup', handlePointerUp);

    return () => {
      window.removeEventListener('pointermove', handlePointerMove);
      window.removeEventListener('pointerup', handlePointerUp);
    };
  }, [isResizingInstructions]);

  useEffect(() => {
    if (!isDocumentWorkflow) return undefined;

    const documentKey = requestedDocumentId ? `document:${requestedDocumentId}` : 'new';
    if (loadedDocumentKey.current === documentKey) return undefined;

    let active = true;
    setDocumentReady(false);
    setDocumentError('');
    setLatestSnapshot(null);

    const prepareBlankDocument = () => {
      useArchitectureStore.getState().clearArchitecture();
      useServiceConfigStore.getState().resetServiceConfigs();
      usePricingStore.getState().reset();
      setDocumentId(null);
      setDocumentTitle('Untitled architecture');
      savedDocumentSignature.current = currentDocumentSignature('Untitled architecture');
      loadedDocumentKey.current = 'new';
      setDocumentReady(true);
    };

    if (isNewDocument || !requestedDocumentId) {
      prepareBlankDocument();
    } else {
      getArchitectureDocument(requestedDocumentId)
        .then((document) => {
          if (!active) return;
          useArchitectureStore.getState().loadArchitecture(document.diagram_data || {});
          useServiceConfigStore.getState().loadServiceConfigs(document.service_configs || {});
          usePricingStore.getState().reset();
          setDocumentId(document.id);
          setDocumentTitle(document.title);
          setLatestSnapshot(document.snapshots?.[document.snapshots.length - 1] || null);
          savedDocumentSignature.current = currentDocumentSignature(document.title);
          loadedDocumentKey.current = documentKey;
          setDocumentReady(true);
        })
        .catch((error) => {
          if (!active) return;
          setDocumentError(
            error.response?.data?.detail || error.message || 'Could not load this document.'
          );
        });
    }

    return () => {
      active = false;
    };
  }, [isDocumentWorkflow, isNewDocument, requestedDocumentId, documentLoadAttempt]);

  useEffect(() => {
    if (!isDocumentWorkflow || !documentReady) return;
    setDocumentDirty(
      savedDocumentSignature.current !== currentDocumentSignature(documentTitle)
    );
  }, [
    isDocumentWorkflow,
    documentReady,
    documentTitle,
    architectureNodes,
    architectureConnections,
    serviceConfigs,
  ]);

  useEffect(() => {
    if (!isDocumentWorkflow || !documentDirty) return undefined;
    const warnBeforeLeaving = (event) => {
      event.preventDefault();
      event.returnValue = '';
    };
    window.addEventListener('beforeunload', warnBeforeLeaving);
    return () => window.removeEventListener('beforeunload', warnBeforeLeaving);
  }, [isDocumentWorkflow, documentDirty]);

  const resizeInstructionsPanel = (direction) => {
    const containerWidth = mainContentRef.current?.getBoundingClientRect().width;
    if (!containerWidth) {
      return;
    }

    const maximumWidth = Math.min(520, containerWidth * 0.5);
    const minimumWidth = Math.min(240, maximumWidth);
    setInstructionsPanelWidth((currentWidth) =>
      Math.min(
        maximumWidth,
        Math.max(minimumWidth, currentWidth + direction * 16)
      )
    );
  };

  // ============================================================
  // PRICING
  // ============================================================

  const totalCost = usePricingStore(
    (state) => state.totalCost
  );

  // ============================================================
  // LEARNING PROGRESS
  // ============================================================

  const startModule = useLearningStore((state) => state.startModule);
  const updateModuleProgress = useLearningStore(
    (state) => state.updateModuleProgress
  );

  useEffect(() => {
    if (module?.id) {
      startModule(module.id);
    }
  }, [module?.id, startModule]);

  useEffect(() => {
    if (module?.id && totalCost > 0) {
      updateModuleProgress(module.id, { costCalculated: true });
    }
  }, [module?.id, totalCost, updateModuleProgress]);

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
      ec2: 'EC2',
      rds: 'RDS',
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
  // ARCHITECTURE DIAGRAM (Mermaid)
  // ============================================================

  const architectureDiagram = useMemo(() => {
    if (!architectureNodes || architectureNodes.length === 0) {
      return null;
    }

    const safeId = (id) => `n_${String(id).replace(/[^a-zA-Z0-9_]/g, '_')}`;

    const lines = ['flowchart LR'];

    architectureNodes.forEach((node) => {
      const serviceType = node.serviceType || node.data?.serviceType;
      lines.push(`  ${safeId(node.id)}["${getServiceName(serviceType)}"]`);
    });

    (architectureConnections || []).forEach((connection) => {
      lines.push(
        `  ${safeId(connection.source)} --> ${safeId(connection.target)}`
      );
    });

    return {
      mermaid: lines.join('\n'),
      valid: validationResult?.valid === true,
    };
  }, [architectureNodes, architectureConnections, validationResult]);
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

      case 'ec2':
        setOpenConfigPanel('ec2');
        break;

      case 'rds':
        setOpenConfigPanel('rds');
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

  if (moduleId && (areModulesLoading || modulesError || !module)) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-background px-6 text-foreground">
        <section className="max-w-xl rounded-xl border border-border bg-card p-6">
          {areModulesLoading ? (
            <p role="status" className="text-sm text-muted-foreground">
              Loading learning module...
            </p>
          ) : modulesError ? (
            <>
              <h1 className="text-xl font-semibold">Learning module is unavailable</h1>
              <p role="alert" className="mt-2 text-sm text-muted-foreground">
                {modulesError}
              </p>
              <button
                type="button"
                onClick={retryModules}
                className="mt-4 rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground"
              >
                Try again
              </button>
            </>
          ) : (
            <h1 className="text-xl font-semibold">Learning module not found</h1>
          )}
          <Link href="/learning" className="mt-5 inline-flex text-sm text-primary hover:underline">
            Back to learning modules
          </Link>
        </section>
      </main>
    );
  }

  // ============================================================
  // VALIDATE ARCHITECTURE
  // ============================================================

  const validateArchitecture = () => {
    if (!module?.buildActivity) {
      return null;
    }

    const { nodes, connections } = useArchitectureStore.getState();
    const result = validateModuleArchitecture(
      module,
      nodes,
      connections,
      totalCost
    );

    console.log(
      'Architecture Validation Result:',
      result
    );

    setValidationResult(result);
    updateModuleProgress(module.id, {
      architectureValidated: result.valid,
    });
    return result;
  };

  const handleArchitectureChange = () => {
    setValidationResult(null);
    if (module?.id) {
      updateModuleProgress(module.id, { architectureValidated: false });
    }
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

  const getDocumentPayload = (title = documentTitle) => {
    const { nodes, connections } = useArchitectureStore.getState();
    return {
      title: title.trim(),
      diagram_data: { nodes, connections },
      service_configs: getServiceConfigs(),
      calculation_options: DOCUMENT_CALCULATION_OPTIONS,
    };
  };

  const handleSaveDocument = async () => {
    const payload = getDocumentPayload();
    if (!payload.title) {
      setDocumentError('Give this architecture a name before saving.');
      return null;
    }

    setDocumentSaving(true);
    setDocumentError('');
    try {
      const savedDocument = documentId
        ? await updateArchitectureDocument(documentId, payload)
        : await createArchitectureDocument(payload);
      setDocumentId(savedDocument.id);
      setDocumentTitle(savedDocument.title);
      savedDocumentSignature.current = currentDocumentSignature(savedDocument.title);
      loadedDocumentKey.current = `document:${savedDocument.id}`;
      setDocumentDirty(false);
      router.replace(`/playground?document=${encodeURIComponent(savedDocument.id)}`);
      return savedDocument;
    } catch (error) {
      setDocumentError(
        error.response?.data?.detail || error.message || 'Could not save this document.'
      );
      return null;
    } finally {
      setDocumentSaving(false);
    }
  };

  const handleSaveCalculationSnapshot = async () => {
    if (architectureNodes.length === 0) {
      setDocumentError('Add at least one service to the canvas before saving a report.');
      return;
    }
    const currentPricing = usePricingStore.getState();
    const costKeyByService = {
      api_gateway: 'apiGatewayCost',
      lambda: 'lambdaCost',
      s3: 's3Cost',
      cognito: 'cognitoCost',
      dynamodb: 'dynamoDBCost',
      elb: 'elbCost',
      elastic_beanstalk: 'elasticBeanstalkCost',
      cloudwatch: 'cloudWatchCost',
      cloudfront: 'cloudFrontCost',
      elasticache: 'elastiCacheCost',
      sqs: 'sqsCost',
      ec2: 'ec2Cost',
      rds: 'rdsCost',
    };
    const usedServices = [
      ...new Set(
        architectureNodes
          .map((node) => node.serviceType || node.service_type || node.type)
          .filter(Boolean)
      ),
    ];
    const missingCalculations = usedServices.filter(
      (service) => !currentPricing[costKeyByService[service]]?.breakdown
    );
    if (missingCalculations.length > 0) {
      setDocumentError(
        `Calculate costs for each service on the canvas before saving a report. Still needed: ${missingCalculations.join(', ')}.`
      );
      return;
    }
    const serviceCosts = Object.fromEntries(
      usedServices.map((service) => [costKeyByService[service], currentPricing[costKeyByService[service]]])
    );
    const snapshotTotal = Object.values(serviceCosts).reduce(
      (sum, result) => sum + (result?.breakdown?.total_cost || 0),
      0
    );

    setDocumentError('');
    const architectureSnapshot = getDocumentPayload();
    const savedDocument = !documentId || documentDirty
      ? await handleSaveDocument()
      : { id: documentId };
    if (!savedDocument) return;

    try {
      const snapshot = await createCalculationSnapshot(savedDocument.id, {
        total_cost: snapshotTotal,
        service_costs: serviceCosts,
        architecture_snapshot: {
          title: architectureSnapshot.title,
          diagram_data: architectureSnapshot.diagram_data,
          service_configs: architectureSnapshot.service_configs,
        },
        calculation_options: DOCUMENT_CALCULATION_OPTIONS,
        pricing_basis: 'SystemArcht pricing data and calculator results available at calculation time. Monthly USD estimate; AWS prices may have changed since this snapshot.',
      });
      setLatestSnapshot(snapshot);
    } catch (error) {
      setDocumentError(
        error.response?.data?.detail || error.message || 'Could not save this calculation snapshot.'
      );
    }
  };

  const handleNewDocument = () => {
    if (documentDirty && !window.confirm('Discard your unsaved changes and start a new document?')) {
      return;
    }
    useArchitectureStore.getState().clearArchitecture();
    useServiceConfigStore.getState().resetServiceConfigs();
    usePricingStore.getState().reset();
    setDocumentId(null);
    setDocumentTitle('Untitled architecture');
    setLatestSnapshot(null);
    savedDocumentSignature.current = currentDocumentSignature('Untitled architecture');
    loadedDocumentKey.current = 'new';
    setDocumentReady(true);
    router.push('/playground?newDocument=true');
  };

  const confirmUnsavedNavigation = (event) => {
    if (documentDirty && !window.confirm('Leave this document without saving your changes?')) {
      event.preventDefault();
    }
  };

  // ============================================================
  // UI
  // ============================================================

  return (
    <div className="w-full h-screen flex flex-col bg-background">

      {/* ======================================================
          HEADER
      ======================================================= */}

      <div className={`bg-background border-b border-border p-3 md:p-4 flex gap-3 ${
        isDocumentWorkflow
          ? 'flex-col items-stretch'
          : 'flex-wrap items-center justify-between'
      }`}>

        {/* LEFT */}

        <div className={`flex items-center gap-4 ${isDocumentWorkflow ? 'min-w-0 flex-wrap justify-between' : ''}`}>

          <Link
            href={module ? `/learning/${module.id}` : isDocumentWorkflow ? '/documents' : '/learning'}
            onClick={isDocumentWorkflow ? confirmUnsavedNavigation : undefined}
            className="flex items-center gap-1 text-muted-foreground hover:text-foreground"
          >
            <ChevronLeft className="w-5 h-5" />
            <span>{module ? 'Back to Module' : isDocumentWorkflow ? 'My Documents' : 'Back to Learning'}</span>
          </Link>

          <div>

            <h1 className="text-2xl font-bold text-foreground">
              {isDocumentWorkflow ? 'Architecture Document' : 'Architecture Playground'}
            </h1>

            <p className="text-sm text-muted-foreground">
              {isDocumentWorkflow
                ? documentDirty
                  ? 'Unsaved changes'
                  : documentId
                    ? 'All changes saved'
                    : 'New document · not saved yet'
                : 'Design and simulate AWS architectures'}
            </p>

            {module && (
              <div className="mt-1 text-xs text-info-foreground font-medium">
                Learning Module {module.moduleNumber}:{' '}
                {module.shortTitle}
              </div>
            )}

          </div>

          {isDocumentWorkflow && (
            <div className="ml-auto">
              <ThemeToggle />
            </div>
          )}

        </div>

        {/* RIGHT */}

        <div className={`flex flex-wrap gap-2 ${
          isDocumentWorkflow
            ? 'w-full flex-col items-stretch sm:flex-row sm:items-center'
            : 'items-center justify-end gap-3'
        }`}>

          {isDocumentWorkflow && (
            <>
              <div className="flex min-w-0 flex-1 gap-2">
                <input
                  aria-label="Architecture document name"
                  value={documentTitle}
                  onChange={(event) => setDocumentTitle(event.target.value)}
                  disabled={!documentReady}
                  maxLength={200}
                  className="h-10 min-w-0 flex-1 rounded-lg border border-border bg-card px-3 text-sm text-foreground disabled:opacity-50"
                  placeholder="Architecture name"
                />
                <button
                  type="button"
                  onClick={handleSaveDocument}
                  disabled={!documentReady || documentSaving || (!documentDirty && Boolean(documentId))}
                  className="inline-flex h-10 shrink-0 items-center gap-2 rounded-lg bg-primary px-3 text-sm font-medium text-primary-foreground hover:bg-primary/90 disabled:opacity-50"
                >
                  <Save className="size-4" />
                  {documentSaving ? 'Saving…' : documentId ? 'Save' : 'Save document'}
                </button>
              </div>
              <div className="flex flex-wrap gap-2">
                <button
                  type="button"
                  onClick={handleSaveCalculationSnapshot}
                  disabled={!documentReady || documentSaving}
                  className="inline-flex h-10 items-center gap-2 rounded-lg border border-border bg-card px-3 text-sm font-medium hover:bg-muted disabled:opacity-50"
                >
                  <FileText className="size-4" />
                  Save report snapshot
                </button>
                {latestSnapshot && documentId && (
                  <Link
                    href={`/documents/${encodeURIComponent(documentId)}/report?snapshot=${encodeURIComponent(latestSnapshot.id)}`}
                    onClick={confirmUnsavedNavigation}
                    className="inline-flex h-10 items-center gap-2 rounded-lg border border-border bg-card px-3 text-sm font-medium hover:bg-muted"
                  >
                    <FileText className="size-4" />
                    Print report
                  </Link>
                )}
                <button
                  type="button"
                  onClick={handleNewDocument}
                  className="inline-flex h-10 items-center gap-2 rounded-lg border border-border bg-card px-3 text-sm font-medium hover:bg-muted"
                >
                  <FilePlus2 className="size-4" />
                  New
                </button>
                <Link
                  href="/documents"
                  onClick={confirmUnsavedNavigation}
                  className="inline-flex h-10 items-center gap-2 rounded-lg border border-border bg-card px-3 text-sm font-medium hover:bg-muted"
                >
                  <FolderOpen className="size-4" />
                  My documents
                </Link>
              </div>
            </>
          )}

          {/* VALIDATE */}

          {module && (
            <button
              onClick={validateArchitecture}
              className="px-4 py-2 rounded-lg bg-primary hover:bg-primary/90 text-primary-foreground font-medium text-sm transition"
            >
              Validate Architecture
            </button>
          )}

          {/* COST */}

          {totalCost > 0 && (
            <div className="text-right">

              <p className="text-xs text-muted-foreground">
                Estimated Monthly Cost
              </p>

              <p className="text-2xl font-bold text-primary">
                ${totalCost.toFixed(2)}
              </p>

            </div>
          )}

          {/* AI ARCHITECT */}
          {!isDocumentWorkflow && <Link href="/ai-architect">
            <button
              className="flex items-center gap-1.5 px-3.5 py-2 rounded-lg font-semibold text-sm bg-primary hover:bg-primary/90 text-primary-foreground shadow-xs transition-colors"
              title="Design new architecture with AI"
            >
              <Sparkles className="w-4 h-4 fill-primary-foreground" />
              <span>AI Architect</span>
            </button>
          </Link>}

          {/* ARCHBOT */}

          {!isDocumentWorkflow && <button
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
                    bg-card
                    text-primary
                    border-border
                  `
                  : `
                    bg-muted
                    hover:bg-muted/80
                    text-foreground/80
                    hover:text-foreground
                    border-border
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

                <span className="inline-flex items-center justify-center w-4 h-4 rounded-full bg-primary text-primary-foreground text-[9px] font-black">
                  AI
                </span>
              </>
            )}

          </button>}

          {!isDocumentWorkflow && <ThemeToggle />}

        </div>

      </div>

      {/* ======================================================
          MAIN CONTENT
      ======================================================= */}

      <div
        ref={mainContentRef}
        className={`flex-1 flex overflow-hidden min-h-0 ${
          module ? 'flex-col md:flex-row' : ''
        }`}
      >

        {isDocumentWorkflow && documentReady && documentError && (
          <div role="alert" className="absolute left-1/2 top-20 z-20 max-w-xl -translate-x-1/2 rounded-lg border border-destructive/30 bg-card px-4 py-3 text-sm text-destructive shadow-lg">
            {documentError}
            <button type="button" onClick={() => setDocumentError('')} className="ml-3 font-semibold underline">
              Dismiss
            </button>
          </div>
        )}

        {module && (
          <ModuleInstructions
            module={module}
            getServiceName={getServiceName}
            panelWidth={instructionsPanelWidth}
            validationResult={validationResult}
            onDismissValidation={() => setValidationResult(null)}
          />
        )}

        {module && (
          <div
            role="separator"
            aria-label="Resize module instructions panel"
            aria-orientation="vertical"
            aria-valuemin={240}
            aria-valuemax={520}
            aria-valuenow={Math.round(instructionsPanelWidth)}
            tabIndex={0}
            onPointerDown={(event) => {
              event.preventDefault();
              setIsResizingInstructions(true);
            }}
            onKeyDown={(event) => {
              if (event.key === 'ArrowLeft') {
                event.preventDefault();
                resizeInstructionsPanel(-1);
              } else if (event.key === 'ArrowRight') {
                event.preventDefault();
                resizeInstructionsPanel(1);
              }
            }}
            className={`hidden md:block w-1 flex-shrink-0 cursor-col-resize touch-none transition-colors ${
              isResizingInstructions
                ? 'bg-primary'
                : 'bg-border hover:bg-primary/70'
            }`}
            title="Drag to resize instructions"
          />
        )}

        {/* PLAYGROUND */}

        <div className="flex-1 flex flex-col min-w-0 min-h-0">
          {isDocumentWorkflow && !documentReady ? (
            <div role={documentError ? 'alert' : 'status'} className="flex h-full items-center justify-center bg-background p-6 text-center text-sm text-muted-foreground">
              {documentError ? (
                <div>
                  <p className="text-destructive">{documentError}</p>
                  <button
                    type="button"
                    onClick={() => {
                      loadedDocumentKey.current = null;
                      setDocumentError('');
                      setDocumentReady(false);
                      setDocumentLoadAttempt((attempt) => attempt + 1);
                    }}
                    className="mt-3 rounded-md border border-border px-3 py-2 text-foreground hover:bg-muted"
                  >
                    Try loading again
                  </button>
                </div>
              ) : 'Loading architecture document…'}
            </div>
          ) : (
            <PlaygroundCanvas
              onNodeSelect={handleNodeSelect}
              onArchitectureChange={handleArchitectureChange}
            />
          )}
        </div>

        {/* CONFIG PANEL */}

        {openConfigPanel && !showChatbot && (

          <div
            className="
              w-96
              border-l
              border-border
              bg-muted/50
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

              {openConfigPanel === 'ec2' && (
                <EC2ConfigPanel
                  onClose={() => setOpenConfigPanel(null)}
                />
              )}

              {openConfigPanel === 'rds' && (
                <RDSConfigPanel
                  onClose={() => setOpenConfigPanel(null)}
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
              border-border
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