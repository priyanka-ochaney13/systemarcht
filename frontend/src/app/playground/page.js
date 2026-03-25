'use client';

import { useState } from 'react';
import { PlaygroundCanvas } from '@/components/playground/PlaygroundCanvas';
import { APIGatewayConfigPanel } from '@/components/services/APIGatewayConfigPanel';
import { LambdaConfigPanel } from '@/components/services/LambdaConfigPanel';
import { S3ConfigPanel } from '@/components/services/S3ConfigPanel';
import { CognitoConfigPanel } from '@/components/services/CognitoConfigPanel';
import { DynamoDBConfigPanel } from '@/components/services/DynamoDBConfigPanel';
import { ELBConfigPanel } from '@/components/services/ELBConfigPanel';
import { ElasticBeanstalkConfigPanel } from '@/components/services/ElasticBeanstalkConfigPanel';
import { ArchitectChatbot } from '@/components/chatbot';
import { usePricingStore } from '@/store';
import Link from 'next/link';
import { ChevronLeft, MessageSquare, X } from 'lucide-react';

export default function PlaygroundPage() {
  const [selectedNodeId, setSelectedNodeId] = useState(null);
  const [openConfigPanel, setOpenConfigPanel] = useState(null);
  const [showChatbot, setShowChatbot] = useState(false);
  const totalCost = usePricingStore(s => s.totalCost);

  const handleNodeSelect = (node) => {
    setSelectedNodeId(node.id);
    const serviceType = node.data.serviceType;
    if (serviceType === 'api_gateway') {
      setOpenConfigPanel('api_gateway');
    } else if (serviceType === 'lambda') {
      setOpenConfigPanel('lambda');
    } else if (serviceType === 's3') {
      setOpenConfigPanel('s3');
    } else if (serviceType === 'cognito') {
      setOpenConfigPanel('cognito');
    } else if (serviceType === 'dynamodb') {
      setOpenConfigPanel('dynamodb');
    } else if (serviceType === 'elb') {
      setOpenConfigPanel('elb');
    }else if (serviceType === 'elastic_beanstalk') {
      setOpenConfigPanel('elastic_beanstalk');
    }
  };

  const handleChatbotToggle = () => {
    setShowChatbot(v => !v);
    // Close config panel when chatbot opens to give more room
    if (!showChatbot) setOpenConfigPanel(null);
  };
  
  return (
    <div className="w-full h-screen flex flex-col bg-white">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 p-4 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link href="/">
            <button className="flex items-center gap-1 text-gray-600 hover:text-gray-900">
              <ChevronLeft className="w-5 h-5" />
              <span>Back</span>
            </button>
          </Link>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Architecture Playground</h1>
            <p className="text-sm text-gray-500">Design and simulate AWS architectures</p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          {totalCost > 0 && (
            <div className="text-right">
              <p className="text-xs text-gray-500">Estimated Monthly Cost</p>
              <p className="text-2xl font-bold text-yellow-600">${totalCost.toFixed(2)}</p>
            </div>
          )}

          {/* ArchBot Toggle Button */}
          <button
            onClick={handleChatbotToggle}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium text-sm transition-all duration-200 border ${
              showChatbot
                ? 'bg-zinc-900 text-amber-400 border-zinc-700 shadow-lg shadow-black/20'
                : 'bg-gray-100 hover:bg-gray-900 text-gray-700 hover:text-amber-400 border-gray-200 hover:border-zinc-700'
            }`}
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
                <span className="inline-flex items-center justify-center w-4 h-4 rounded-full bg-amber-500 text-zinc-900 text-[9px] font-black">
                  AI
                </span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex overflow-hidden">
        {/* Canvas */}
        <div className="flex-1 flex flex-col min-w-0">
          <PlaygroundCanvas onNodeSelect={handleNodeSelect} />
        </div>

        {/* Config Panel — hidden when chatbot is open */}
        {openConfigPanel && !showChatbot && (
          <div className="w-96 border-l border-gray-200 bg-gray-50 p-4 overflow-y-auto flex-shrink-0">
            <div className="relative">
              {openConfigPanel === 'api_gateway' && (
                <APIGatewayConfigPanel onClose={() => setOpenConfigPanel(null)} />
              )}
              {openConfigPanel === 'lambda' && (
                <LambdaConfigPanel onClose={() => setOpenConfigPanel(null)} />
              )}
              {openConfigPanel === 's3' && (
                <S3ConfigPanel onClose={() => setOpenConfigPanel(null)} />
              )}
              {openConfigPanel === 'cognito' && (
                <CognitoConfigPanel onClose={() => setOpenConfigPanel(null)} />
              )}
              {openConfigPanel === 'dynamodb' && (
                <DynamoDBConfigPanel onClose={() => setOpenConfigPanel(null)} />
              )}
              {openConfigPanel === 'elb' && (
                <ELBConfigPanel onClose={() => setOpenConfigPanel(null)} />
              )}
              {openConfigPanel === 'elastic_beanstalk' && (
                <ElasticBeanstalkConfigPanel onClose={() => setOpenConfigPanel(null)} />
              )}
            </div>
          </div>
        )}

        {/* ArchBot Side Panel */}
        {showChatbot && (
          <div
            className="w-[420px] flex-shrink-0 border-l border-zinc-800 overflow-hidden"
            style={{ animation: 'slideInRight 0.22s ease-out' }}
          >
            <style>{`
              @keyframes slideInRight {
                from { opacity: 0; transform: translateX(30px); }
                to   { opacity: 1; transform: translateX(0); }
              }
            `}</style>
            <ArchitectChatbot
              embedded
              onClose={() => setShowChatbot(false)}
            />
          </div>
        )}
      </div>
    </div>
  );
}

