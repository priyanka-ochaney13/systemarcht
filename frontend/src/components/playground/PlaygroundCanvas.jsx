'use client';

import React, { useState, useCallback, useId, useRef } from 'react';
import ReactFlow, {
  addEdge,
  useNodesState,
  useEdgesState,
  Controls,
  Background,
  MiniMap,
  ConnectionMode,
} from 'reactflow';
import 'reactflow/dist/style.css';
import { useArchitectureStore } from '@/store';
import { ServiceNode } from './ServiceNode';
import {
  ChevronDown,
  ChevronUp,
  RotateCw,
  Search,
  Trash2,
} from 'lucide-react';

const SERVICES = [
  { type: 'api_gateway', label: 'API Gateway', category: 'Compute' },
  { type: 'lambda', label: 'Lambda', category: 'Compute' },
  { type: 'ec2', label: 'EC2', category: 'Compute' },
  { type: 'elastic_beanstalk', label: 'Elastic Beanstalk', category: 'Compute' },
  { type: 's3', label: 'S3', category: 'Storage' },
  { type: 'dynamodb', label: 'DynamoDB', category: 'Data' },
  { type: 'rds', label: 'RDS', category: 'Data' },
  { type: 'elasticache', label: 'ElastiCache', category: 'Data' },
  { type: 'cognito', label: 'Cognito', category: 'Identity' },
  { type: 'elb', label: 'ELB', category: 'Networking' },
  { type: 'cloudfront', label: 'CloudFront', category: 'Networking' },
  { type: 'sqs', label: 'SQS', category: 'Messaging' },
  { type: 'cloudwatch', label: 'CloudWatch', category: 'Monitoring' },
];

// Define nodeTypes outside component to avoid React Flow warning
const nodeTypesConfig = {
  serviceNode: ServiceNode,
};

export const PlaygroundCanvas = ({ onNodeSelect, onArchitectureChange }) => {
  const nodes = useArchitectureStore(s => s.nodes);
  const addNode = useArchitectureStore(s => s.addNode);
  const addConnection = useArchitectureStore(s => s.addConnection);
  const updateNode = useArchitectureStore(s => s.updateNode);
  const removeNode = useArchitectureStore(s => s.removeNode);
  const clearArchitecture = useArchitectureStore(s => s.clearArchitecture);

  const [rfNodes, setRfNodes, onNodesChange] = useNodesState([]);
  const [rfEdges, setRfEdges, onEdgesChange] = useEdgesState([]);
  const [selectedNodeId, setSelectedNodeId] = useState(null);
  const [serviceMenuOpen, setServiceMenuOpen] = useState(false);
  const [serviceSearch, setServiceSearch] = useState('');
  const [serviceCategory, setServiceCategory] = useState('All');
  const [confirmClear, setConfirmClear] = useState(false);
  const nodeIdPrefix = useId().replace(/:/g, '');
  const nodeIdCounter = useRef(0);

  // Sync architecture store to ReactFlow
  const connections = useArchitectureStore(s => s.connections);
  React.useEffect(() => {
    const rfNodesData = nodes.map(node => ({
      id: node.id,
      data: {
        label: node.label || node.name || node.serviceType?.toUpperCase(),
        serviceType: node.serviceType,
      },
      position: node.position || { x: 100, y: 100 },
      type: 'serviceNode',
    }));
    setRfNodes(rfNodesData);
  }, [nodes, setRfNodes]);

  React.useEffect(() => {
    const rfEdgesData = (connections || []).map(conn => ({
      id: conn.id || `${conn.source}-${conn.target}`,
      source: conn.source,
      target: conn.target,
      sourceHandle: conn.sourceHandle,
      targetHandle: conn.targetHandle,
      animated: true,
      style: { stroke: '#FF9900', strokeWidth: 2 },
    }));
    setRfEdges(rfEdgesData);
  }, [connections, setRfEdges]);

  const onConnect = useCallback(
    (connection) => {
      if (!connection.source || !connection.target || connection.source === connection.target) {
        return;
      }
      const exists = useArchitectureStore
        .getState()
        .connections.some(
          (edge) =>
            edge.source === connection.source &&
            edge.target === connection.target &&
            edge.sourceHandle === connection.sourceHandle &&
            edge.targetHandle === connection.targetHandle
        );
      if (exists) {
        return;
      }
      const newEdge = {
        id: `${connection.source}-${connection.sourceHandle || 'default'}-${connection.target}-${connection.targetHandle || 'default'}`,
        source: connection.source,
        target: connection.target,
        sourceHandle: connection.sourceHandle,
        targetHandle: connection.targetHandle,
      };
      setRfEdges((eds) => addEdge(connection, eds));
      addConnection(newEdge);
      onArchitectureChange?.();
    },
    [addConnection, onArchitectureChange, setRfEdges]
  );

  const handleNodesChange = useCallback((changes) => {
    onNodesChange(changes);
    changes.forEach((change) => {
      if (change.type === 'position' && change.position && change.dragging === false) {
        updateNode(change.id, { position: change.position });
      }
    });
  }, [onNodesChange, updateNode]);

  const onNodeClick = (event, node) => {
    setSelectedNodeId(node.id);
    onNodeSelect?.(node);
  };

  const handleAddNode = (serviceType) => {
    const occupiedPositions = new Set(
      nodes.map((node) => {
        const position = node.position || { x: 100, y: 100 };
        return `${position.x},${position.y}`;
      })
    );
    let positionIndex = nodes.length;
    let position = {
      x: 100 + (positionIndex % 3) * 240,
      y: 100 + Math.floor(positionIndex / 3) * 170,
    };

    while (occupiedPositions.has(`${position.x},${position.y}`)) {
      positionIndex += 1;
      position = {
        x: 100 + (positionIndex % 3) * 240,
        y: 100 + Math.floor(positionIndex / 3) * 170,
      };
    }

    const newNode = {
      id: `${serviceType}-${nodeIdPrefix}-${nodeIdCounter.current++}`,
      label: serviceType.replace(/_/g, ' ').toUpperCase(),
      serviceType,
      position,
    };
    addNode(newNode);
    onArchitectureChange?.();
  };

  const handleDeleteSelected = () => {
    if (selectedNodeId) {
      removeNode(selectedNodeId);
      setSelectedNodeId(null);
      onArchitectureChange?.();
    }
  };

  const handleClear = () => {
    clearArchitecture();
    setRfNodes([]);
    setRfEdges([]);
    setSelectedNodeId(null);
    setConfirmClear(false);
    onArchitectureChange?.();
  };

  const visibleServices = SERVICES.filter((service) => {
    const matchesSearch = service.label
      .toLowerCase()
      .includes(serviceSearch.trim().toLowerCase());
    const matchesCategory =
      serviceCategory === 'All' || service.category === serviceCategory;
    return matchesSearch && matchesCategory;
  });

  return (
    <div className="w-full h-full flex flex-col bg-background">
      {/* Toolbar */}
      <div className="bg-muted/50 border-b border-border p-4">
        <div className="flex items-center gap-2 flex-wrap">
          <div className="relative">
            <button
              type="button"
              onClick={() => setServiceMenuOpen((open) => !open)}
              aria-expanded={serviceMenuOpen}
              aria-controls="service-picker"
              className="inline-flex items-center gap-2 rounded-md bg-primary px-3 py-2 text-sm text-primary-foreground transition hover:bg-primary/90"
            >
              Add Service
              {serviceMenuOpen ? (
                <ChevronUp className="h-4 w-4" />
              ) : (
                <ChevronDown className="h-4 w-4" />
              )}
            </button>

            {serviceMenuOpen && (
              <div
                id="service-picker"
                className="absolute left-0 top-full z-30 mt-2 space-y-3 rounded-lg border border-border bg-card p-3 shadow-xl"
                style={{ width: 'min(28rem, calc(100vw - 2rem))' }}
              >
                <div className="flex min-w-0 gap-2">
                  <label className="relative block min-w-0 flex-1">
                    <Search aria-hidden="true" className="pointer-events-none absolute left-3 top-1/2 z-10 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                    <input
                      type="search"
                      value={serviceSearch}
                      onChange={(event) => setServiceSearch(event.target.value)}
                      placeholder="Search services"
                      aria-label="Search AWS services"
                      className="sa-input"
                      style={{ paddingLeft: '2.5rem' }}
                    />
                  </label>
                  <label className="sr-only" htmlFor="service-category">
                    Filter services by category
                  </label>
                  <select
                    id="service-category"
                    value={serviceCategory}
                    onChange={(event) => setServiceCategory(event.target.value)}
                    className="w-32 shrink-0 rounded-md border border-input bg-background px-2 text-xs text-foreground outline-none focus-visible:border-ring focus-visible:ring-2 focus-visible:ring-ring/40"
                  >
                    {['All', ...new Set(SERVICES.map((service) => service.category))].map(
                      (category) => (
                        <option key={category} value={category}>
                          {category === 'All' ? 'All categories' : category}
                        </option>
                      )
                    )}
                  </select>
                </div>
                <div className="grid max-h-64 grid-cols-2 gap-2 overflow-y-auto">
                  {visibleServices.map((service) => (
                    <button
                      key={service.type}
                      type="button"
                      onClick={() => handleAddNode(service.type)}
                      className="flex h-9 min-w-0 items-center justify-between gap-2 rounded-md border border-primary/70 bg-primary px-2.5 text-left text-xs font-medium text-primary-foreground transition hover:bg-primary/90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                      title={`Add ${service.label}`}
                    >
                      <span className="truncate">+ {service.label}</span>
                      <span className="shrink-0 text-[10px] text-primary-foreground/75">
                        {service.category}
                      </span>
                    </button>
                  ))}
                  {visibleServices.length === 0 && (
                    <p className="col-span-2 py-3 text-center text-sm text-muted-foreground">
                      No services match that search.
                    </p>
                  )}
                </div>
              </div>
            )}
          </div>

          {/* Action buttons on the right */}
          <div className="flex-1" />
          <div className="flex items-center gap-2">
            <button
              onClick={handleDeleteSelected}
              disabled={!selectedNodeId}
              className="px-3 py-2 text-sm bg-destructive text-destructive-foreground hover:bg-destructive/90 rounded-md transition disabled:opacity-50 flex items-center gap-1 whitespace-nowrap"
              title="Delete selected service"
            >
              <Trash2 className="h-4 w-4" />
              Delete
            </button>
            <button
              onClick={handleClear}
              className="px-3 py-2 text-sm bg-secondary hover:bg-muted text-secondary-foreground border border-border rounded-md transition flex items-center gap-1 whitespace-nowrap"
              title="Clear entire architecture"
            >
              <RotateCw className="w-4 h-4" />
              Clear
            </button>
          </div>
        </div>
      </div>

      {/* Canvas */}
      <div className="relative min-h-0 flex-1">
        <ReactFlow
          nodes={rfNodes}
          edges={rfEdges}
          onNodesChange={handleNodesChange}
          onEdgesChange={onEdgesChange}
          onConnect={onConnect}
          onNodeClick={onNodeClick}
          nodeTypes={nodeTypesConfig}
          connectionMode={ConnectionMode.Loose}
          fitView
        >
          <Background />
          <Controls />
          <MiniMap />
          {nodes.length === 0 && (
            <div className="pointer-events-none absolute inset-0 z-10 flex items-center justify-center">
              <div className="pointer-events-auto mx-4 max-w-sm rounded-xl border border-border bg-card/95 p-5 text-center shadow-lg">
                <h2 className="font-semibold text-foreground">
                  Start building your architecture
                </h2>
                <p className="mt-2 text-sm text-muted-foreground">
                  Add services, drag them into place, then connect the handles
                  to show how requests flow.
                </p>
                <button
                  type="button"
                  onClick={() => setServiceMenuOpen(true)}
                  className="sa-btn-primary mt-4"
                >
                  Browse services
                </button>
              </div>
            </div>
          )}
        </ReactFlow>
      </div>
    </div>
  );
};
