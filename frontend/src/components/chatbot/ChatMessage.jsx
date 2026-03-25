'use client';

import React from 'react';
import { formatUSD } from '@/lib/chatbotUtils';
import { AlertTriangle, CheckCircle, Zap, Cloud, Database, TrendingDown } from 'lucide-react';

const SERVICE_ICON = {
  lambda: <Zap className="w-3.5 h-3.5" />,
  api_gateway: <Cloud className="w-3.5 h-3.5" />,
  s3: <Database className="w-3.5 h-3.5" />,
};

function AnalysisCard({ payload }) {
  const { totalCost, servicesCost, transferCost, services, connections, warnings, architectureName } = payload;

  return (
    <div className="space-y-3 text-sm">
      {/* Summary Banner */}
      <div className="bg-amber-500/10 border border-amber-500/30 rounded-lg p-3">
        <p className="text-xs text-amber-400 font-mono uppercase tracking-widest mb-1">
          Monthly Estimate · {architectureName}
        </p>
        <p className="text-3xl font-bold text-amber-400 font-mono">{formatUSD(totalCost)}</p>
        <div className="flex gap-4 mt-2 text-xs text-zinc-400">
          <span>Services: <span className="text-zinc-200">{formatUSD(servicesCost)}</span></span>
          <span>Data Transfer: <span className="text-zinc-200">{formatUSD(transferCost)}</span></span>
        </div>
      </div>

      {/* Service Breakdown */}
      {services.length > 0 && (
        <div>
          <p className="text-xs font-semibold text-zinc-400 uppercase tracking-wider mb-2">Service Breakdown</p>
          <div className="space-y-1.5">
            {services.map((svc) => (
              <div
                key={svc.node_id}
                className="flex items-center justify-between bg-zinc-800/60 rounded-md px-3 py-2 border border-zinc-700/40"
              >
                <div className="flex items-center gap-2 text-zinc-300">
                  <span className="text-amber-400">
                    {SERVICE_ICON[svc.service_type] ?? <Cloud className="w-3.5 h-3.5" />}
                  </span>
                  <span className="font-medium">{svc.name}</span>
                  <span className="text-xs text-zinc-500 font-mono">{svc.region}</span>
                </div>
                <span className="font-mono font-semibold text-zinc-100">{formatUSD(svc.cost)}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Data Transfer */}
      {connections.length > 0 && transferCost > 0 && (
        <div>
          <p className="text-xs font-semibold text-zinc-400 uppercase tracking-wider mb-2">Data Transfer</p>
          <div className="space-y-1.5">
            {connections.map((conn) => (
              <div
                key={conn.connection_id}
                className="flex items-center justify-between bg-zinc-800/60 rounded-md px-3 py-2 border border-zinc-700/40"
              >
                <div className="text-zinc-400 text-xs">
                  <span className="text-zinc-300">{conn.source_name}</span>
                  <span className="mx-1.5">→</span>
                  <span className="text-zinc-300">{conn.target_name}</span>
                  <span className="ml-2 text-zinc-500">({conn.transfer_type?.replace(/_/g, ' ')})</span>
                </div>
                <span className="font-mono text-xs text-zinc-300">{formatUSD(conn.cost)}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Warnings & Optimizations */}
      {warnings.length > 0 && (
        <div>
          <p className="text-xs font-semibold text-zinc-400 uppercase tracking-wider mb-2 flex items-center gap-1">
            <TrendingDown className="w-3 h-3 text-emerald-400" />
            Optimization Tips
          </p>
          <div className="space-y-1.5">
            {warnings.map((w, i) => (
              <div key={i} className="flex gap-2 bg-emerald-950/40 border border-emerald-800/30 rounded-md px-3 py-2">
                <AlertTriangle className="w-3.5 h-3.5 text-emerald-400 mt-0.5 flex-shrink-0" />
                <p className="text-xs text-emerald-300">{w}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {warnings.length === 0 && (
        <div className="flex items-center gap-2 text-xs text-emerald-400">
          <CheckCircle className="w-3.5 h-3.5" />
          <span>Architecture looks well-optimized — no major cost warnings detected.</span>
        </div>
      )}
    </div>
  );
}

export function ChatMessage({ message }) {
  const isUser = message.role === 'user';
  const isError = message.type === 'error';

  return (
    <div className={`flex ${isUser ? 'justify-end' : 'justify-start'} mb-4`}>
      {!isUser && (
        <div className="w-7 h-7 rounded-full bg-amber-500 flex items-center justify-center mr-2 flex-shrink-0 mt-0.5 shadow-md shadow-amber-500/20">
          <span className="text-xs font-black text-zinc-900">A</span>
        </div>
      )}

      <div
        className={`max-w-[85%] rounded-2xl px-4 py-3 ${
          isUser
            ? 'bg-zinc-700 text-zinc-100 rounded-tr-sm'
            : isError
            ? 'bg-red-950/60 border border-red-800/40 text-red-300 rounded-tl-sm'
            : 'bg-zinc-800/80 border border-zinc-700/40 text-zinc-200 rounded-tl-sm'
        }`}
      >
        {message.type === 'analysis' ? (
          <AnalysisCard payload={message.payload} />
        ) : (
          <p className="text-sm leading-relaxed whitespace-pre-wrap">{message.content}</p>
        )}

        {message.timestamp && (
          <p className="text-[10px] text-zinc-500 mt-1.5 text-right font-mono">
            {new Date(message.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
          </p>
        )}
      </div>

      {isUser && (
        <div className="w-7 h-7 rounded-full bg-zinc-600 flex items-center justify-center ml-2 flex-shrink-0 mt-0.5">
          <span className="text-xs font-bold text-zinc-200">U</span>
        </div>
      )}
    </div>
  );
}
