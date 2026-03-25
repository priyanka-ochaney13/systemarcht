'use client';

import React, { useState, useRef, useEffect, useCallback } from 'react';
import { Send, Zap, BarChart2, HelpCircle, RefreshCw, X, ChevronDown } from 'lucide-react';
import { useArchitectureStore, useServiceConfigStore } from '@/store';
import { analyzeArchitectureCost } from '@/api/chatbot';
import {
  buildArchitecturePayload,
  isArchitectureAnalyzable,
  parseAnalysisResponse,
  formatUSD,
} from '@/lib/chatbotUtils';
import { ChatMessage } from './ChatMessage';
import { TypingIndicator } from './TypingIndicator';

// ─── Static bot responses ─────────────────────────────────────────────────────

const WELCOME_MESSAGE = {
  id: 'welcome',
  role: 'bot',
  type: 'text',
  content:
    'Hey! I\'m your AWS Architecture Assistant 👋\n\nI can analyze the architecture you\'ve built on the Playground and break down:\n• Monthly cost estimates per service\n• Data transfer costs between services\n• Cost optimization tips\n\nHit "Analyze Architecture" to get started, or ask me anything.',
  timestamp: Date.now(),
};

const HELP_CONTENT = `Here's what you can ask me:

📊 "Analyze my architecture" — Full cost breakdown
💡 "How can I reduce costs?" — Optimization tips
🔢 "What's the most expensive service?" — Cost ranking
📐 "Explain my architecture" — Summary of current design
🔄 "Reset" — Start a fresh conversation

To get a cost analysis, first build your architecture in the Playground, then come back here!`;

const EMPTY_ARCH_MESSAGE = `Your Playground is empty! 🏗️

Head over to the Architecture Playground, add some services (Lambda, API Gateway, etc.), connect them, and then come back here for a cost analysis.

I can only analyze services currently supported: Lambda and API Gateway.`;

// ─── Intent matching ──────────────────────────────────────────────────────────

const matchIntent = (text) => {
  const lower = text.toLowerCase().trim();

  if (/analyz|calculat|cost|estimat|how much|price|break.?down/.test(lower)) return 'analyze';
  if (/optim|cheap|reduc|sav|improv|tip/.test(lower)) return 'optimize';
  if (/explain|describe|summar|what.*(arch|design|build)|tell me about/.test(lower)) return 'explain';
  if (/expensive|highest|most cost|biggest/.test(lower)) return 'rank';
  if (/help|what can|commands?|options?/.test(lower)) return 'help';
  if (/reset|clear|start over|new conv/.test(lower)) return 'reset';
  if (/hello|hi|hey|sup|greet/.test(lower)) return 'greet';

  return 'unknown';
};

// ─── Main Component ───────────────────────────────────────────────────────────

export function ArchitectChatbot({ onClose, embedded = false }) {
  const [messages, setMessages] = useState([WELCOME_MESSAGE]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [lastAnalysis, setLastAnalysis] = useState(null);
  const [isMinimized, setIsMinimized] = useState(false);

  const messagesEndRef = useRef(null);
  const inputRef = useRef(null);

  // Zustand stores — each selected individually to avoid new object
  // references on every render, which causes an infinite re-render loop
  const architectureNodes = useArchitectureStore((s) => s.nodes);
  const architectureConnections = useArchitectureStore((s) => s.connections);
  const lambdaConfig = useServiceConfigStore((s) => s.lambdaConfig);
  const apiGatewayConfig = useServiceConfigStore((s) => s.apiGatewayConfig);
  const s3Config = useServiceConfigStore((s) => s.s3Config);
  const serviceConfigs = { lambdaConfig, apiGatewayConfig, s3Config };

  // Auto-scroll on new messages
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isLoading]);

  const addMessage = useCallback((msg) => {
    setMessages((prev) => [...prev, { id: Date.now() + Math.random(), timestamp: Date.now(), ...msg }]);
  }, []);

  // ── Core: Architecture Analysis ──────────────────────────────────────────

  const runAnalysis = useCallback(async () => {
    if (!isArchitectureAnalyzable(architectureNodes)) {
      addMessage({ role: 'bot', type: 'text', content: EMPTY_ARCH_MESSAGE });
      return;
    }

    setIsLoading(true);

    try {
      const payload = buildArchitecturePayload(
        { nodes: architectureNodes, connections: architectureConnections },
        serviceConfigs
      );

      const data = await analyzeArchitectureCost(payload);
      const parsed = parseAnalysisResponse(data);
      setLastAnalysis(parsed);

      addMessage({ role: 'bot', type: 'analysis', payload: parsed });

      // Follow-up suggestion
      setTimeout(() => {
        addMessage({
          role: 'bot',
          type: 'text',
          content: `Analysis complete! Total monthly estimate: ${formatUSD(parsed.totalCost)}\n\nWant optimization tips? Try asking "How can I reduce costs?" or "What's the most expensive service?"`,
        });
      }, 400);
    } catch (err) {
      const status = err?.response?.status;
      const rawDetail = err?.response?.data?.detail;
      const detail = Array.isArray(rawDetail)
        ? rawDetail.map(e => `${e.loc?.join('.')} — ${e.msg}`).join(', ')
        : rawDetail;
      const calledUrl = `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api'}/architecture/calculate`;
      const errorMsg = detail || err.message || 'Unknown error';

      let hint;
      if (status === 404) {
        hint = `Route not found (404)\nURL tried: ${calledUrl}\n\nThis usually means your backend is not running or the URL is wrong.`;
      } else if (status === 422) {
        hint = `Payload validation failed (422):\n${errorMsg}`;
      } else if (status) {
        hint = `HTTP ${status}: ${errorMsg}\nURL: ${calledUrl}`;
      } else {
        hint = `Cannot reach backend.\nURL tried: ${calledUrl}\nError: ${errorMsg}`;
      }

      addMessage({
        role: 'bot',
        type: 'error',
        content: `❌ Analysis failed\n\n${hint}`,
      });
    } finally {
      setIsLoading(false);
    }
  }, [architectureNodes, architectureConnections, serviceConfigs, addMessage]);

  // ── Intent Handlers ──────────────────────────────────────────────────────

  const handleOptimize = useCallback(() => {
    if (!lastAnalysis) {
      addMessage({
        role: 'bot',
        type: 'text',
        content: "I haven't analyzed your architecture yet. Run an analysis first and then I'll give you tailored optimization tips!",
      });
      return;
    }

    const { services, warnings, totalCost } = lastAnalysis;
    const tips = [...warnings];

    // Auto-generate tips from service data
    const lambdaServices = services.filter((s) => s.service_type === 'lambda');
    if (lambdaServices.length > 1) {
      tips.push('You have multiple Lambda functions. Consider using ARM64 (Graviton2) architecture — it\'s ~20% cheaper with comparable performance.');
    }

    const expensive = services.sort((a, b) => b.cost - a.cost)[0];
    if (expensive) {
      tips.push(`Your most expensive component is "${expensive.name}" at ${formatUSD(expensive.cost)}/mo. Focus optimization efforts here first.`);
    }

    if (totalCost > 500) {
      tips.push('Consider using AWS Cost Explorer and Budgets to set alerts when costs exceed thresholds.');
    }

    if (tips.length === 0) {
      tips.push('Your architecture appears well-optimized for its current configuration.');
      tips.push('Consider using Reserved Concurrency on Lambda to cap costs during traffic spikes.');
    }

    addMessage({
      role: 'bot',
      type: 'text',
      content: `💡 Cost Optimization Tips:\n\n${tips.map((t, i) => `${i + 1}. ${t}`).join('\n\n')}`,
    });
  }, [lastAnalysis, addMessage]);

  const handleExplain = useCallback(() => {
    if (architectureNodes.length === 0) {
      addMessage({ role: 'bot', type: 'text', content: EMPTY_ARCH_MESSAGE });
      return;
    }

    const typeCounts = architectureNodes.reduce((acc, n) => {
      acc[n.serviceType] = (acc[n.serviceType] || 0) + 1;
      return acc;
    }, {});

    const typeList = Object.entries(typeCounts)
      .map(([type, count]) => `• ${count}x ${type.replace(/_/g, ' ').toUpperCase()}`)
      .join('\n');

    const connCount = architectureConnections.length;

    addMessage({
      role: 'bot',
      type: 'text',
      content: `📐 Your current architecture has:\n\n${typeList}\n• ${connCount} connection${connCount !== 1 ? 's' : ''} between services\n\nThis looks like a${
        typeCounts['api_gateway'] ? ' serverless API pattern.' : ' function-based pipeline.'
      } Run an analysis to see the full cost breakdown!`,
    });
  }, [architectureNodes, architectureConnections, addMessage]);

  const handleRank = useCallback(() => {
    if (!lastAnalysis) {
      addMessage({
        role: 'bot',
        type: 'text',
        content: "Run an analysis first, then I can rank your services by cost!",
      });
      return;
    }

    const ranked = [...lastAnalysis.services].sort((a, b) => b.cost - a.cost);
    const list = ranked
      .map((s, i) => `${i + 1}. ${s.name} — ${formatUSD(s.cost)}/mo`)
      .join('\n');

    addMessage({
      role: 'bot',
      type: 'text',
      content: `📊 Services ranked by monthly cost:\n\n${list}\n\nTotal: ${formatUSD(lastAnalysis.totalCost)}/mo`,
    });
  }, [lastAnalysis, addMessage]);

  // ── Message Send ─────────────────────────────────────────────────────────

  const handleSend = useCallback(async () => {
    const text = input.trim();
    if (!text || isLoading) return;

    addMessage({ role: 'user', type: 'text', content: text });
    setInput('');

    const intent = matchIntent(text);

    // Small delay to feel natural
    await new Promise((r) => setTimeout(r, 300));

    switch (intent) {
      case 'analyze':
        await runAnalysis();
        break;
      case 'optimize':
        handleOptimize();
        break;
      case 'explain':
        handleExplain();
        break;
      case 'rank':
        handleRank();
        break;
      case 'help':
        addMessage({ role: 'bot', type: 'text', content: HELP_CONTENT });
        break;
      case 'reset':
        setMessages([WELCOME_MESSAGE]);
        setLastAnalysis(null);
        break;
      case 'greet':
        addMessage({
          role: 'bot',
          type: 'text',
          content: "Hey there! Ready to analyze your AWS architecture? Hit 'Analyze Architecture' or ask me about costs, optimizations, or your current design.",
        });
        break;
      default:
        addMessage({
          role: 'bot',
          type: 'text',
          content: `I'm focused on AWS architecture cost analysis. Try:\n• "Analyze my architecture"\n• "How can I reduce costs?"\n• "Explain my architecture"\n\nOr type "help" to see all options.`,
        });
    }
  }, [input, isLoading, addMessage, runAnalysis, handleOptimize, handleExplain, handleRank]);

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  // ── Quick Actions ────────────────────────────────────────────────────────

  const QUICK_ACTIONS = [
    { label: 'Analyze Architecture', icon: <BarChart2 className="w-3.5 h-3.5" />, action: runAnalysis },
    { label: 'Optimize Costs', icon: <Zap className="w-3.5 h-3.5" />, action: handleOptimize },
    { label: 'Explain Design', icon: <HelpCircle className="w-3.5 h-3.5" />, action: handleExplain },
  ];

  // ── Render ───────────────────────────────────────────────────────────────

  const containerClass = embedded
    ? 'flex flex-col h-full bg-zinc-900'
    : 'flex flex-col h-full bg-zinc-900 rounded-xl overflow-hidden shadow-2xl shadow-black/60 border border-zinc-700/50';

  return (
    <div className={containerClass}>
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 bg-zinc-900 border-b border-zinc-700/60 flex-shrink-0">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-full bg-amber-500 flex items-center justify-center shadow-md shadow-amber-500/30">
            <span className="text-sm font-black text-zinc-900">A</span>
          </div>
          <div>
            <p className="text-sm font-semibold text-zinc-100 leading-none">ArchBot</p>
            <p className="text-[10px] text-emerald-400 mt-0.5 flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 inline-block animate-pulse" />
              AWS Cost Assistant
            </p>
          </div>
        </div>

        <div className="flex items-center gap-1">
          <button
            onClick={() => { setMessages([WELCOME_MESSAGE]); setLastAnalysis(null); }}
            title="Reset conversation"
            className="p-1.5 rounded-md text-zinc-500 hover:text-zinc-300 hover:bg-zinc-800 transition"
          >
            <RefreshCw className="w-4 h-4" />
          </button>
          {!embedded && (
            <>
              <button
                onClick={() => setIsMinimized((v) => !v)}
                className="p-1.5 rounded-md text-zinc-500 hover:text-zinc-300 hover:bg-zinc-800 transition"
              >
                <ChevronDown className={`w-4 h-4 transition-transform ${isMinimized ? 'rotate-180' : ''}`} />
              </button>
              {onClose && (
                <button
                  onClick={onClose}
                  className="p-1.5 rounded-md text-zinc-500 hover:text-zinc-300 hover:bg-zinc-800 transition"
                >
                  <X className="w-4 h-4" />
                </button>
              )}
            </>
          )}
        </div>
      </div>

      {/* Arch node count badge */}
      {!isMinimized && (
        <div className="px-4 py-2 bg-zinc-800/50 border-b border-zinc-700/40 flex-shrink-0">
          <div className="flex items-center gap-2 text-xs text-zinc-400">
            <span className="font-mono">Playground:</span>
            <span className={`font-semibold ${architectureNodes.length > 0 ? 'text-amber-400' : 'text-zinc-500'}`}>
              {architectureNodes.length} node{architectureNodes.length !== 1 ? 's' : ''}
            </span>
            <span className="text-zinc-600">·</span>
            <span className="font-semibold text-zinc-300">
              {architectureConnections.length} connection{architectureConnections.length !== 1 ? 's' : ''}
            </span>
          </div>
        </div>
      )}

      {/* Messages */}
      {!isMinimized && (
        <>
          <div className="flex-1 overflow-y-auto px-4 pt-4 pb-2 space-y-0 scrollbar-thin scrollbar-thumb-zinc-700 scrollbar-track-transparent">
            {messages.map((msg) => (
              <ChatMessage key={msg.id} message={msg} />
            ))}
            {isLoading && <TypingIndicator />}
            <div ref={messagesEndRef} />
          </div>

          {/* Quick Actions */}
          <div className="px-3 py-2 flex gap-1.5 flex-wrap border-t border-zinc-800 flex-shrink-0">
            {QUICK_ACTIONS.map((qa) => (
              <button
                key={qa.label}
                onClick={qa.action}
                disabled={isLoading}
                className="flex items-center gap-1.5 text-xs px-2.5 py-1.5 rounded-full bg-zinc-800 hover:bg-zinc-700 text-zinc-300 hover:text-zinc-100 border border-zinc-700/50 hover:border-amber-500/40 transition disabled:opacity-40"
              >
                <span className="text-amber-400">{qa.icon}</span>
                {qa.label}
              </button>
            ))}
          </div>

          {/* Input */}
          <div className="px-3 pb-3 flex-shrink-0">
            <div className="flex items-end gap-2 bg-zinc-800 rounded-xl border border-zinc-700/50 focus-within:border-amber-500/50 transition px-3 py-2">
              <textarea
                ref={inputRef}
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Ask about costs, optimizations, or your design…"
                rows={1}
                disabled={isLoading}
                className="flex-1 bg-transparent text-sm text-zinc-100 placeholder-zinc-500 resize-none outline-none leading-relaxed max-h-24 disabled:opacity-50"
                style={{ scrollbarWidth: 'none' }}
              />
              <button
                onClick={handleSend}
                disabled={!input.trim() || isLoading}
                className="w-8 h-8 rounded-lg bg-amber-500 hover:bg-amber-400 flex items-center justify-center flex-shrink-0 transition disabled:opacity-30 disabled:cursor-not-allowed shadow-md shadow-amber-500/20"
              >
                <Send className="w-3.5 h-3.5 text-zinc-900" />
              </button>
            </div>
            <p className="text-[10px] text-zinc-600 mt-1.5 text-center">
              Press Enter to send · Shift+Enter for new line
            </p>
          </div>
        </>
      )}
    </div>
  );
}
