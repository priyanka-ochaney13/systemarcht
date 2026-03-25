import React from 'react';
import { Handle, Position } from 'reactflow';
import { Cloud, Zap, Database, Lock, Globe, Server } from 'lucide-react';

const SERVICE_ICONS = {
  api_gateway: Cloud,
  lambda: Zap,
  s3: Database,
  cognito: Lock,
  dynamodb: Database,
  elb: Globe,
  elastic_beanstalk: Server,
};

const SERVICE_COLORS = {
  api_gateway: '#FF9900',
  lambda: '#FF9900',
  s3: '#569A31',
  cognito: '#FF9900',
  dynamodb: '#FF4444',
  elb: '#FF9900',
  elastic_beanstalk: '#FF6633',
};

export const ServiceNode = ({ data, isConnecting, isSelected }) => {
  const Icon = SERVICE_ICONS[data.serviceType] || Cloud;
  const color = SERVICE_COLORS[data.serviceType] || '#FF9900';

  return (
    <div
      className={`px-4 py-3 shadow-lg rounded-lg border-2 transition-all ${
        isSelected
          ? 'bg-blue-100 border-blue-500'
          : 'bg-white border-gray-300 hover:border-blue-400'
      }`}
    >
      <Handle type="target" position={Position.Top} />
      <div className="flex items-center gap-2">
        <Icon className="w-5 h-5" style={{ color }} />
        <div className="text-sm font-semibold text-gray-900">{data.label}</div>
      </div>
      <Handle type="source" position={Position.Bottom} />
    </div>
  );
};
