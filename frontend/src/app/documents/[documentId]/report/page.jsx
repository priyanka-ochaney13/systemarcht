'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useParams, useSearchParams } from 'next/navigation';
import { ArrowLeft, Printer } from 'lucide-react';
import { getArchitectureDocument } from '@/api/client';

const CONFIG_KEYS_BY_SERVICE = {
  api_gateway: 'apiGatewayConfig',
  lambda: 'lambdaConfig',
  s3: 's3Config',
  cognito: 'cognitoConfig',
  dynamodb: 'dynamoDBConfig',
  elb: 'elbConfig',
  elastic_beanstalk: 'elasticBeanstalkConfig',
  cloudwatch: 'cloudWatchConfig',
  cloudfront: 'cloudFrontConfig',
  elasticache: 'elastiCacheConfig',
  sqs: 'sqsConfig',
  ec2: 'ec2Config',
  rds: 'rdsConfig',
};

const SERVICE_COST_KEYS = {
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

const formatMoney = (amount) => `$${Number(amount || 0).toFixed(2)}`;
const getCostAmount = (result) =>
  typeof result === 'number'
    ? result
    : result?.breakdown?.total_cost ?? result?.total_cost ?? result?.cost ?? null;

const formatLabel = (key) =>
  key
    .replace(/([a-z0-9])([A-Z])/g, '$1 $2')
    .replace(/[_-]+/g, ' ')
    .replace(/\b\w/g, (letter) => letter.toUpperCase());

const formatValue = (value) => {
  if (value === null || value === undefined || value === '') return 'Not specified';
  if (typeof value === 'boolean') return value ? 'Enabled' : 'Disabled';
  if (Array.isArray(value)) {
    return value.length
      ? value.map((item) => (
        item && typeof item === 'object'
          ? Object.entries(item).map(([key, entry]) => `${formatLabel(key)}: ${formatValue(entry)}`).join(', ')
          : formatValue(item)
      )).join('; ')
      : 'None';
  }
  if (typeof value === 'object') return '';
  return String(value);
};

const flattenDetails = (value, prefix = '') => {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return [];
  return Object.entries(value).flatMap(([key, item]) => {
    const label = prefix ? `${prefix} · ${formatLabel(key)}` : formatLabel(key);
    if (item && typeof item === 'object' && !Array.isArray(item)) {
      return flattenDetails(item, label);
    }
    return [{ label, value: formatValue(item) }];
  });
};

function DetailList({ details }) {
  if (!details.length) {
    return <p className="report-muted text-sm text-muted-foreground">No options were recorded.</p>;
  }
  return (
    <dl className="mt-3 divide-y divide-border">
      {details.map(({ label, value }) => (
        <div key={label} className="grid grid-cols-1 gap-1 py-2.5 text-sm sm:grid-cols-[minmax(0,1fr)_minmax(0,1.5fr)] sm:gap-4">
          <dt className="text-muted-foreground">{label}</dt>
          <dd className="break-words font-medium">{value}</dd>
        </div>
      ))}
    </dl>
  );
}

function ArchitectureDiagram({ nodes, connections }) {
  const nodeWidth = 184;
  const nodeHeight = 68;
  const padding = 48;
  const positionedNodes = nodes.map((node, index) => ({
    ...node,
    x: Number.isFinite(node.position?.x) ? node.position.x : 80 + (index % 3) * 240,
    y: Number.isFinite(node.position?.y) ? node.position.y : 80 + Math.floor(index / 3) * 150,
  }));
  const minX = Math.min(0, ...positionedNodes.map((node) => node.x));
  const minY = Math.min(0, ...positionedNodes.map((node) => node.y));
  const maxX = Math.max(nodeWidth, ...positionedNodes.map((node) => node.x + nodeWidth));
  const maxY = Math.max(nodeHeight, ...positionedNodes.map((node) => node.y + nodeHeight));
  const viewBox = `${minX - padding} ${minY - padding} ${maxX - minX + padding * 2} ${maxY - minY + padding * 2}`;
  const nodeLookup = new Map(positionedNodes.map((node) => [node.id, node]));

  return (
    <svg
      role="img"
      aria-label="Architecture diagram showing services and connections"
      viewBox={viewBox}
      className="mt-4 h-auto max-h-[520px] min-h-64 w-full rounded-lg border border-border bg-white"
      preserveAspectRatio="xMidYMid meet"
    >
      <defs>
        <marker id="architecture-arrow" markerWidth="10" markerHeight="8" refX="9" refY="4" orient="auto">
          <path d="M0,0 L10,4 L0,8 Z" fill="#64748b" />
        </marker>
      </defs>
      {connections.map((connection, index) => {
        const source = nodeLookup.get(connection.source || connection.source_id);
        const target = nodeLookup.get(connection.target || connection.target_id);
        if (!source || !target) return null;
        const sourceHandle = connection.sourceHandle;
        const targetHandle = connection.targetHandle;
        const anchor = (node, handle) => {
          switch (handle) {
            case 'top':
              return { x: node.x + nodeWidth / 2, y: node.y };
            case 'right':
              return { x: node.x + nodeWidth, y: node.y + nodeHeight / 2 };
            case 'bottom':
              return { x: node.x + nodeWidth / 2, y: node.y + nodeHeight };
            case 'left':
              return { x: node.x, y: node.y + nodeHeight / 2 };
            default:
              return { x: node.x + nodeWidth / 2, y: node.y + nodeHeight / 2 };
          }
        };
        const sourcePoint = anchor(source, sourceHandle);
        const targetPoint = anchor(target, targetHandle);
        const sourceX = sourcePoint.x;
        const sourceY = sourcePoint.y;
        const targetX = targetPoint.x;
        const targetY = targetPoint.y;
        const middleX = (sourceX + targetX) / 2;
        const middleY = (sourceY + targetY) / 2;
        return (
          <g key={connection.id || `${source.id}-${target.id}-${index}`}>
            <path
              d={`M ${sourceX} ${sourceY} L ${targetX} ${targetY}`}
              fill="none"
              stroke="#64748b"
              strokeWidth="2"
              markerEnd="url(#architecture-arrow)"
            />
            <circle cx={middleX} cy={middleY} r="3" fill="#64748b" />
          </g>
        );
      })}
      {positionedNodes.map((node, index) => {
        const serviceType = node.serviceType || node.service_type || node.type || 'Service';
        return (
          <g key={node.id || `${serviceType}-${index}`}>
            <rect
              x={node.x}
              y={node.y}
              width={nodeWidth}
              height={nodeHeight}
              rx="12"
              fill="#fff"
              stroke="#f59e0b"
              strokeWidth="2"
            />
            <text
              x={node.x + nodeWidth / 2}
              y={node.y + 29}
              textAnchor="middle"
              fill="#111827"
              fontSize="13"
              fontWeight="600"
            >
              {(node.label || node.name || serviceType).slice(0, 24)}
            </text>
            <text
              x={node.x + nodeWidth / 2}
              y={node.y + 49}
              textAnchor="middle"
              fill="#64748b"
              fontSize="11"
            >
              {serviceType}
            </text>
          </g>
        );
      })}
    </svg>
  );
}

export default function ArchitectureReportPage() {
  const params = useParams();
  const searchParams = useSearchParams();
  const [document, setDocument] = useState(null);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;
    getArchitectureDocument(params.documentId)
      .then((result) => {
        if (active) setDocument(result);
      })
      .catch((loadError) => {
        if (active) setError(loadError.response?.data?.detail || loadError.message || 'Could not load this report.');
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
    };
  }, [params.documentId]);

  const requestedSnapshot = searchParams.get('snapshot');
  const snapshot = document?.snapshots?.find((item) => item.id === requestedSnapshot)
    || document?.snapshots?.[document.snapshots.length - 1];
  const architectureSnapshot = snapshot?.architecture_snapshot || {};
  const reportTitle = architectureSnapshot.title || document?.title;
  const nodes = architectureSnapshot.diagram_data?.nodes || document?.diagram_data?.nodes || [];
  const connections = architectureSnapshot.diagram_data?.connections || document?.diagram_data?.connections || [];
  const serviceConfigs = architectureSnapshot.service_configs || document?.service_configs || {};
  const serviceTypes = [...new Set(nodes.map(
    (node) => node.serviceType || node.service_type || node.type
  ).filter(Boolean))];
  const usedServiceConfigs = serviceTypes
    .map((serviceType) => ({
      serviceType,
      configKey: CONFIG_KEYS_BY_SERVICE[serviceType],
      serviceNodes: nodes.filter(
        (node) => (node.serviceType || node.service_type || node.type) === serviceType
      ),
    }))
    .map((item) => ({
      ...item,
      config: item.serviceNodes.find((node) => node.config)?.config || serviceConfigs[item.configKey],
    }))
    .filter((item) => item.configKey && item.config);
  const getNodeName = (nodeId) =>
    nodes.find((node) => node.id === nodeId)?.label
    || nodes.find((node) => node.id === nodeId)?.name
    || nodeId
    || 'Unknown';

  if (loading) {
    return <main className="p-10 text-center text-muted-foreground">Loading report…</main>;
  }
  if (error || !document || !snapshot) {
    return (
      <main className="mx-auto max-w-2xl p-8">
        <p role="alert" className="text-destructive">{error || 'No calculation snapshot is available for this document.'}</p>
        <Link href="/documents" className="mt-4 inline-flex text-sm text-primary hover:underline">Back to documents</Link>
      </main>
    );
  }

  return (
    <main className="report-page mx-auto max-w-4xl px-6 py-8 text-foreground">
      <style>{`
        @page { size: auto; margin: 18mm; }
        @media print {
          body { background: #fff !important; color: #111 !important; }
          .report-page { max-width: none !important; padding: 0 !important; color: #111 !important; }
          .report-page .text-primary { color: #111 !important; }
          .report-card { break-inside: avoid; border-color: #bbb !important; background: #fff !important; color: #111 !important; }
          .report-muted { color: #555 !important; }
        }
      `}</style>
      <div className="mb-8 flex items-center justify-between print:hidden">
        <Link href={`/playground?document=${encodeURIComponent(document.id)}`} className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground">
          <ArrowLeft className="size-4" /> Back to editor
        </Link>
        <button type="button" onClick={() => window.print()} className="sa-btn-primary h-10 px-4">
          <Printer className="size-4" /> Print / Save as PDF
        </button>
      </div>

      <header className="border-b border-border pb-6">
        <p className="text-xs font-semibold uppercase tracking-[0.15em] text-primary">SystemArcht · Architecture estimate</p>
        <h1 className="mt-3 text-3xl font-semibold">{reportTitle}</h1>
        <p className="report-muted mt-2 text-sm text-muted-foreground">
          Calculated {new Date(snapshot.calculated_at).toLocaleString()}
        </p>
      </header>

      <section className="report-card mt-7 rounded-xl border border-border bg-card p-5">
        <p className="text-sm text-muted-foreground">Estimated monthly cost · USD</p>
        <p className="mt-1 text-4xl font-semibold text-primary">{formatMoney(snapshot.total_cost)}</p>
        <p className="report-muted mt-3 text-sm text-muted-foreground">
          Pricing basis: {snapshot.pricing_basis}
        </p>
      </section>

      <section className="report-card mt-6 rounded-xl border border-border bg-card p-5">
        <h2 className="text-lg font-semibold">Architecture diagram</h2>
        {nodes.length ? (
          <ArchitectureDiagram nodes={nodes} connections={connections} />
        ) : <p className="report-muted mt-3 text-sm text-muted-foreground">No services in this design.</p>}
      </section>

      <section className="report-card mt-6 rounded-xl border border-border bg-card p-5">
        <h2 className="text-lg font-semibold">Services used ({nodes.length} nodes)</h2>
        {nodes.length ? (
          <ul className="mt-3 divide-y divide-border">
            {serviceTypes.map((serviceType) => {
              const serviceNodes = nodes.filter(
                (node) => (node.serviceType || node.service_type || node.type) === serviceType
              );
              const serviceCost = snapshot.service_costs?.[SERVICE_COST_KEYS[serviceType]];
              const cost = getCostAmount(serviceCost);
              return (
                <li key={serviceType} className="flex items-center justify-between gap-3 py-3 text-sm">
                  <span>
                    <span className="font-medium capitalize">{serviceType.replace(/_/g, ' ')}</span>
                    <span className="report-muted block text-xs text-muted-foreground">
                      {serviceNodes.map((node) => node.label || node.name || serviceType).join(', ')}
                    </span>
                  </span>
                  <span className="font-medium">{cost == null ? '—' : formatMoney(cost)}</span>
                </li>
              );
            })}
            {serviceTypes.every((serviceType) => getCostAmount(
              snapshot.service_costs?.[SERVICE_COST_KEYS[serviceType]]
            ) == null) && (
              <li className="report-muted py-3 text-sm text-muted-foreground">No service-level costs were captured.</li>
            )}
          </ul>
        ) : (
          <p className="report-muted mt-3 text-sm text-muted-foreground">No services in this design.</p>
        )}
      </section>

      <section className="report-card mt-6 rounded-xl border border-border bg-card p-5">
        <h2 className="text-lg font-semibold">Service configurations</h2>
        {usedServiceConfigs.length ? (
          <div className="mt-3 space-y-4">
            {usedServiceConfigs.map(({ serviceType, config, serviceNodes }) => (
              <div key={serviceType} className="rounded-lg border border-border p-4">
                <h3 className="font-medium capitalize">{serviceType.replace(/_/g, ' ')}</h3>
                <p className="report-muted mt-1 text-xs text-muted-foreground">
                  {serviceNodes.map((node) => node.label || node.name || serviceType).join(', ')}
                </p>
                <DetailList details={flattenDetails(config)} />
              </div>
            ))}
          </div>
        ) : (
          <p className="report-muted mt-3 text-sm text-muted-foreground">
            No service configuration was saved for the services in this design.
          </p>
        )}
      </section>

      <section className="report-card mt-6 rounded-xl border border-border bg-card p-5">
        <h2 className="text-lg font-semibold">Connections ({connections.length})</h2>
        {connections.length ? (
          <ul className="mt-3 list-inside list-disc space-y-2 text-sm">
            {connections.map((connection, index) => (
              <li key={connection.id || `${connection.source}-${connection.target}-${index}`}>
                {getNodeName(connection.source || connection.source_id)} → {getNodeName(connection.target || connection.target_id)}
              </li>
            ))}
          </ul>
        ) : <p className="report-muted mt-3 text-sm text-muted-foreground">No connections in this design.</p>}
      </section>

      <section className="report-card mt-6 rounded-xl border border-border bg-card p-5">
        <h2 className="text-lg font-semibold">Calculation options</h2>
        <DetailList details={flattenDetails(snapshot.calculation_options || {})} />
      </section>
      <footer className="report-muted mt-8 border-t border-border pt-4 text-xs text-muted-foreground">
        This report is a saved estimate for its calculation time and pricing basis. It is not a live quote.
      </footer>
    </main>
  );
}
