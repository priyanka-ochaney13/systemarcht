'use client';

import React, { useState, useCallback, useMemo } from 'react';
import ReactFlow, {
  addEdge,
  useNodesState,
  useEdgesState,
  Controls,
  Background,
  MiniMap,
  Connection,
} from 'reactflow';
import 'reactflow/dist/style.css';
import { useArchitectureStore } from '@/store';
import { ServiceNode } from './ServiceNode';
import { Trash2, RotateCw } from 'lucide-react';

// Define nodeTypes outside component to avoid React Flow warning
const nodeTypesConfig = {
  serviceNode: ServiceNode,
};

export const PlaygroundCanvas = ({ onNodeSelect }) => {
  const nodes = useArchitectureStore(s => s.nodes);
  const addNode = useArchitectureStore(s => s.addNode);
  const addConnection = useArchitectureStore(s => s.addConnection);
  const removeNode = useArchitectureStore(s => s.removeNode);
  const removeConnection = useArchitectureStore(s => s.removeConnection);
  const clearArchitecture = useArchitectureStore(s => s.clearArchitecture);

  const [rfNodes, setRfNodes, onNodesChange] = useNodesState([]);
  const [rfEdges, setRfEdges, onEdgesChange] = useEdgesState([]);
  const [selectedNodeId, setSelectedNodeId] = useState(null);

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
    },
    [addConnection, setRfEdges]
  );

  const onNodeClick = (event, node) => {
    console.log('onNodeClick triggered:', { nodeId: node.id, node });
    setSelectedNodeId(node.id);
    onNodeSelect?.(node);
  };

  const handleAddNode = (serviceType) => {
    const newNode = {
      id: `${serviceType}-${Date.now()}`,
      label: serviceType.replace(/_/g, ' ').toUpperCase(),
      serviceType,
      position: {
        x: Math.random() * 500,
        y: Math.random() * 500,
      },
    };
    addNode(newNode);
  };

  const handleDeleteSelected = () => {
    if (selectedNodeId) {
      removeNode(selectedNodeId);
      setSelectedNodeId(null);
    }
  };

  const handleClear = () => {
    if (window.confirm('Are you sure you want to clear the architecture?')) {
      clearArchitecture();
      setRfNodes([]);
      setRfEdges([]);
      setSelectedNodeId(null);
    }
  };

  return (
    <div className="w-full h-full flex flex-col bg-background">
      {/* Toolbar */}
      <div className="bg-muted/50 border-b border-border p-4">
        <div className="flex items-center gap-2 flex-wrap">
          <span className="text-sm font-medium text-foreground/80 mr-2">Add Service:</span>
          
          {/* Service buttons grouped */}
          <div className="flex flex-wrap gap-2">
            <button
              onClick={() => handleAddNode('api_gateway')}
              className="px-3 py-2 text-sm bg-primary hover:bg-primary/90 text-primary-foreground rounded-md transition whitespace-nowrap"
            >
              + API Gateway
            </button>
            <button
              onClick={() => handleAddNode('lambda')}
              className="px-3 py-2 text-sm bg-primary hover:bg-primary/90 text-primary-foreground rounded-md transition whitespace-nowrap"
            >
              + Lambda
            </button>
            <button
              onClick={() => handleAddNode('s3')}
              className="px-3 py-2 text-sm bg-primary hover:bg-primary/90 text-primary-foreground rounded-md transition whitespace-nowrap"
            >
              + S3
            </button>
            <button
              onClick={() => handleAddNode('cognito')}
              className="px-3 py-2 text-sm bg-primary hover:bg-primary/90 text-primary-foreground rounded-md transition whitespace-nowrap"
            >
              + Cognito
            </button>
            <button
              onClick={() => handleAddNode('dynamodb')}
              className="px-3 py-2 text-sm bg-primary hover:bg-primary/90 text-primary-foreground rounded-md transition whitespace-nowrap"
            >
              + DynamoDB
            </button>
            <button
              onClick={() => handleAddNode('elb')}
              className="px-3 py-2 text-sm bg-primary hover:bg-primary/90 text-primary-foreground rounded-md transition whitespace-nowrap"
            >
              + ELB
            </button>
            <button
              onClick={() => handleAddNode('elastic_beanstalk')}
              className="px-3 py-2 text-sm bg-secondary hover:bg-muted text-secondary-foreground border border-border rounded-md transition whitespace-nowrap font-semibold"
              title="Click to add Elastic Beanstalk to your architecture"
            >
              + Elastic Beanstalk
            </button>
                        <button
              onClick={() => handleAddNode('cloudwatch')}
              className="px-3 py-2 text-sm bg-secondary hover:bg-muted text-secondary-foreground border border-border rounded-md transition whitespace-nowrap"
            >
              + CloudWatch
            </button>
            <button
              onClick={() => handleAddNode('cloudfront')}
              className="px-3 py-2 text-sm bg-secondary hover:bg-muted text-secondary-foreground border border-border rounded-md transition whitespace-nowrap"
            >
              + CloudFront
            </button>
            <button
              onClick={() => handleAddNode('elasticache')}
              className="px-3 py-2 text-sm bg-secondary hover:bg-muted text-secondary-foreground border border-border rounded-md transition whitespace-nowrap"
            >
              + ElastiCache
            </button>
            <button
              onClick={() => handleAddNode('sqs')}
              className="px-3 py-2 text-sm bg-secondary hover:bg-muted text-secondary-foreground border border-border rounded-md transition whitespace-nowrap"
            >
              + SQS
            </button>
            <button
              onClick={() => handleAddNode('ec2')}
              className="px-3 py-2 text-sm bg-primary hover:bg-primary/90 text-primary-foreground rounded-md transition whitespace-nowrap"
            >
              + EC2
            </button>
            <button
              onClick={() => handleAddNode('rds')}
              className="px-3 py-2 text-sm bg-secondary hover:bg-muted text-secondary-foreground border border-border rounded-md transition whitespace-nowrap"
            >
              + RDS
            </button>
          </div>
          
          {/* Action buttons on the right */}
          <div className="flex-1" />
          <div className="flex gap-2">
            <button
              onClick={handleDeleteSelected}
              disabled={!selectedNodeId}
              className="px-3 py-2 text-sm bg-destructive text-destructive-foreground hover:bg-destructive/90 rounded-md transition disabled:opacity-50 flex items-center gap-1 whitespace-nowrap"
              title="Delete selected service"
            >
              <Trash2 className="w-4 h-4" />
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
      <div className="flex-1">
        <ReactFlow
          nodes={rfNodes}
          edges={rfEdges}
          onNodesChange={onNodesChange}
          onEdgesChange={onEdgesChange}
          onConnect={onConnect}
          onNodeClick={onNodeClick}
          nodeTypes={nodeTypesConfig}
          fitView
        >
          <Background />
          <Controls />
          <MiniMap />
        </ReactFlow>
      </div>
    </div>
  );
};
