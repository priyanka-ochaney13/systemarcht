import React from 'react';
import { Handle, Position } from 'reactflow';
import { Cloud, Zap, Database } from 'lucide-react';

const SERVICE_ICONS = {
  api_gateway: Cloud,
  lambda: Zap,
  s3: Database,
};

export const ServiceNode = ({ data, isConnecting, isSelected }) => {
  const Icon = SERVICE_ICONS[data.serviceType] || Cloud;

  return (
    <div
      className={`px-4 py-3 shadow-lg rounded-lg border-2 transition-all ${
        isSelected
          ? 'bg-yellow-100 border-yellow-500'
          : 'bg-white border-gray-300 hover:border-yellow-400'
      }`}
    >
      <Handle type="target" position={Position.Top} />
      <div className="flex items-center gap-2">
        <Icon className="w-5 h-5" style={{ color: '#FF9900' }} />
        <div className="text-sm font-semibold text-gray-900">{data.label}</div>
      </div>
      <Handle type="source" position={Position.Bottom} />
    </div>
  );
};
