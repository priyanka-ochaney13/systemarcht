'use client';

import React, { useState, useCallback, useId, useRef } from 'react';
import ReactFlow, {
  addEdge,
  useNodesState,
  useEdgesState,
  Controls,
  Background,
  MiniMap,
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
  { type: 'api_gateway', label: 'API Gateway', category: 'Compute', color: 'bg-yellow-500 hover:bg-yellow-600' },
  { type: 'lambda', label: 'Lambda', category: 'Compute', color: 'bg-yellow-500 hover:bg-yellow-600' },
  { type: 'ec2', label: 'EC2', category: 'Compute', color: 'bg-amber-500 hover:bg-amber-600' },
  { type: 'elastic_beanstalk', label: 'Elastic Beanstalk', category: 'Compute', color: 'bg-orange-500 hover:bg-orange-600' },
  { type: 's3', label: 'S3', category: 'Storage', color: 'bg-yellow-500 hover:bg-yellow-600' },
  { type: 'dynamodb', label: 'DynamoDB', category: 'Data', color: 'bg-yellow-500 hover:bg-yellow-600' },
  { type: 'rds', label: 'RDS', category: 'Data', color: 'bg-blue-600 hover:bg-blue-700' },
  { type: 'elasticache', label: 'ElastiCache', category: 'Data', color: 'bg-fuchsia-500 hover:bg-fuchsia-600' },
  { type: 'cognito', label: 'Cognito', category: 'Identity', color: 'bg-yellow-500 hover:bg-yellow-600' },
  { type: 'elb', label: 'ELB', category: 'Networking', color: 'bg-yellow-500 hover:bg-yellow-600' },
  { type: 'cloudfront', label: 'CloudFront', category: 'Networking', color: 'bg-purple-500 hover:bg-purple-600' },
  { type: 'sqs', label: 'SQS', category: 'Messaging', color: 'bg-rose-500 hover:bg-rose-600' },
  { type: 'cloudwatch', label: 'CloudWatch', category: 'Monitoring', color: 'bg-pink-500 hover:bg-pink-600' },
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
      data: { label: node.label || node.name || node.serviceType?.toUpperCase(), serviceType: node.serviceType },
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
      animated: true,
      style: { stroke: '#FF9900', strokeWidth: 2 },
    }));
    setRfEdges(rfEdgesData);
  }, [connections, setRfEdges]);

  const onConnect = useCallback(
    (connection) => {
      const newEdge = {
        id: `${connection.source}-${connection.target}`,
        source: connection.source,
        target: connection.target,
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
    console.log('onNodeClick triggered:', { nodeId: node.id, node });
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

        {serviceMenuOpen && (
          <div id="service-picker" className="mt-3 space-y-3">
            <div className="flex flex-col gap-2 sm:flex-row">
              <label className="relative min-w-0 flex-1">
                <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
                <input
                  type="search"
                  value={serviceSearch}
                  onChange={(event) => setServiceSearch(event.target.value)}
                  placeholder="Search AWS services"
                  aria-label="Search AWS services"
                  className="w-full rounded-md border border-gray-300 bg-white py-2 pl-9 pr-3 text-sm outline-none focus:border-amber-500 focus:ring-2 focus:ring-amber-100"
                />
              </label>
              <label className="sr-only" htmlFor="service-category">
                Filter services by category
              </label>
              <select
                id="service-category"
                value={serviceCategory}
                onChange={(event) => setServiceCategory(event.target.value)}
                className="rounded-md border border-gray-300 bg-white px-3 py-2 text-sm text-gray-700"
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
            <div className="grid max-h-36 grid-cols-2 gap-2 overflow-y-auto sm:grid-cols-3 lg:grid-cols-4">
              {visibleServices.map((service) => (
                <button
                  key={service.type}
                  type="button"
                  onClick={() => {
                    handleAddNode(service.type);
                    setServiceMenuOpen(false);
                    setServiceSearch('');
                    setServiceCategory('All');
                  }}
                  className={`rounded-md px-3 py-2 text-left text-sm text-white transition ${service.color}`}
                >
                  + {service.label}
                  <span className="ml-2 text-xs text-white/75">
                    {service.category}
                  </span>
                </button>
              ))}
              {visibleServices.length === 0 && (
                <p className="col-span-full py-3 text-center text-sm text-gray-500">
                  No services match that search.
                </p>
              )}
            </div>
          </div>
        )}
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
          fitView
        >
          <Background />
          <Controls />
          <MiniMap />
          {nodes.length === 0 && (
            <div className="pointer-events-none absolute inset-0 z-10 flex items-center justify-center">
              <div className="pointer-events-auto mx-4 max-w-sm rounded-xl border border-gray-200 bg-white/95 p-5 text-center shadow-lg">
                <h2 className="font-semibold text-gray-900">
                  Start building your architecture
                </h2>
                <p className="mt-2 text-sm text-gray-600">
                  Add services, drag them into place, then connect the handles
                  to show how requests flow.
                </p>
                <button
                  type="button"
                  onClick={() => setServiceMenuOpen(true)}
                  className="mt-4 rounded-lg bg-amber-500 px-4 py-2 text-sm font-semibold text-gray-950 hover:bg-amber-400"
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
