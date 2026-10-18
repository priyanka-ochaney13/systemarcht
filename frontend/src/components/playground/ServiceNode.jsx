import React from 'react';
import { Handle, Position } from 'reactflow';
import { Cloud, Zap, Database, Lock, Globe, Server, Activity, Globe2, ListOrdered } from 'lucide-react';

const SERVICE_ICONS = {
  api_gateway: Cloud,
  lambda: Zap,
  s3: Database,
  cognito: Lock,
  dynamodb: Database,
  elb: Globe,
  elastic_beanstalk: Server,
  cloudwatch: Activity,
  cloudfront: Globe2,
  elasticache: Zap,
  sqs: ListOrdered,
  ec2: Server,
  rds: Database,
};

const SERVICE_COLORS = {
  api_gateway: '#FF9900',
  lambda: '#FF9900',
  s3: '#569A31',
  cognito: '#FF9900',
  dynamodb: '#FF4444',
  elb: '#FF9900',
  elastic_beanstalk: '#FF6633',
  cloudwatch: '#E7157B',
  cloudfront: '#8C4FFF',
  elasticache: '#C925D1',
  sqs: '#FF4F8B',
  ec2: '#FF9900',
  rds: '#3B48CC',
};

export const ServiceNode = ({ data, isSelected }) => {
  const Icon = SERVICE_ICONS[data.serviceType] || Cloud;
  const color = SERVICE_COLORS[data.serviceType] || '#FF9900';
  const handleClassName = 'service-node-handle !h-3 !w-3 !border-2 !border-primary !bg-background !opacity-0 group-hover:!opacity-100 group-focus-within:!opacity-100';

  return (
    <div
      className={`group relative min-w-36 rounded-lg border-2 px-4 py-3 shadow-lg transition-all ${
        isSelected
          ? 'bg-blue-100 border-blue-500'
          : 'bg-card border-input hover:border-blue-400'
      }`}
    >
      <Handle id="top" type="source" position={Position.Top} className={handleClassName} />
      <Handle id="right" type="source" position={Position.Right} className={handleClassName} />
      <Handle id="bottom" type="source" position={Position.Bottom} className={handleClassName} />
      <Handle id="left" type="source" position={Position.Left} className={handleClassName} />
      <div className="flex items-center gap-2 pr-1">
        <Icon className="w-5 h-5" style={{ color }} />
        <div className="text-sm font-semibold text-foreground">{data.label}</div>
      </div>
    </div>
  );
};