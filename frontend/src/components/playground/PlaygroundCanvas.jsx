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
  React.useEffect(() => {
    const rfNodesData = nodes.map(node => ({
      id: node.id,
      data: { label: node.label, serviceType: node.serviceType },
      position: node.position,
      type: 'serviceNode',
    }));
    setRfNodes(rfNodesData);
  }, [nodes, setRfNodes]);

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
    <div className="w-full h-full flex flex-col bg-white">
      {/* Toolbar */}
      <div className="bg-gray-50 border-b border-gray-200 p-4 flex items-center gap-2 flex-wrap">
        <span className="text-sm font-medium text-gray-700">Add Service:</span>
        <button
          onClick={() => handleAddNode('api_gateway')}
          className="px-3 py-2 text-sm bg-yellow-500 hover:bg-yellow-600 text-white rounded-md transition"
        >
          + API Gateway
        </button>
        <button
          onClick={() => handleAddNode('lambda')}
          className="px-3 py-2 text-sm bg-yellow-500 hover:bg-yellow-600 text-white rounded-md transition"
        >
          + Lambda
        </button>
        <button
          onClick={() => handleAddNode('s3')}
          className="px-3 py-2 text-sm bg-yellow-500 hover:bg-yellow-600 text-white rounded-md transition"
        >
          + S3
        </button>
        <button
          onClick={() => handleAddNode('dynamodb')}
          className="px-3 py-2 text-sm bg-yellow-500 hover:bg-yellow-600 text-white rounded-md transition"
        >
          + DynamoDB
        </button>
        <div className="flex-1" />
        <button
          onClick={handleDeleteSelected}
          disabled={!selectedNodeId}
          className="px-3 py-2 text-sm bg-red-500 hover:bg-red-600 text-white rounded-md transition disabled:opacity-50 flex items-center gap-1"
        >
          <Trash2 className="w-4 h-4" />
          Delete
        </button>
        <button
          onClick={handleClear}
          className="px-3 py-2 text-sm bg-gray-400 hover:bg-gray-500 text-white rounded-md transition flex items-center gap-1"
        >
          <RotateCw className="w-4 h-4" />
          Clear
        </button>
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
