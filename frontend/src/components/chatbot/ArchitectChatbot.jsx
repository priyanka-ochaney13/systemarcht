'use client';

import React, { useState, useRef, useEffect, useCallback, useMemo } from 'react';
import {
  BarChart2,
  ChevronDown,
  RefreshCw,
  Send,
  X,
} from 'lucide-react';
import { useArchitectureStore, useServiceConfigStore } from '@/store';
import {
  analyzeArchitectureCost,
  chatAboutArchitecture,
} from '@/api/chatbot';
import {
  buildArchitecturePayload,
  isArchitectureAnalyzable,
  parseAnalysisResponse,
} from '@/lib/chatbotUtils';
import { ChatMessage } from './ChatMessage';
import { TypingIndicator } from './TypingIndicator';

// ─── Static bot responses ─────────────────────────────────────────────────────

const WELCOME_MESSAGE = {
  id: 'welcome',
  role: 'bot',
  type: 'text',
  content:
    'Hi, I’m ArchBot. I can help you think through the design on your canvas, explain AWS trade-offs, or make sense of a cost estimate. What are you working on?',
  timestamp: Date.now(),
};

const EMPTY_ARCH_MESSAGE =
  'There aren’t any services on the canvas to calculate yet. Add a service in the Playground, then try calculating costs again.';

// ─── Main Component ───────────────────────────────────────────────────────────

export function ArchitectChatbot({ onClose, embedded = false }) {
  const [messages, setMessages] = useState([WELCOME_MESSAGE]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [lastCostResult, setLastCostResult] = useState(null);
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
  const ec2Config = useServiceConfigStore((s) => s.ec2Config);
  const rdsConfig = useServiceConfigStore((s) => s.rdsConfig);
  const dynamoDBConfig = useServiceConfigStore((s) => s.dynamoDBConfig);
  const elbConfig = useServiceConfigStore((s) => s.elbConfig);
  const cognitoConfig = useServiceConfigStore((s) => s.cognitoConfig);
  const elasticBeanstalkConfig = useServiceConfigStore((s) => s.elasticBeanstalkConfig);
  const cloudWatchConfig = useServiceConfigStore((s) => s.cloudWatchConfig);
  const cloudFrontConfig = useServiceConfigStore((s) => s.cloudFrontConfig);
  const elastiCacheConfig = useServiceConfigStore((s) => s.elastiCacheConfig);
  const sqsConfig = useServiceConfigStore((s) => s.sqsConfig);
  const serviceConfigs = useMemo(
    () => ({
      lambdaConfig,
      apiGatewayConfig,
      s3Config,
      ec2Config,
      rdsConfig,
      dynamoDBConfig,
      elbConfig,
      cognitoConfig,
      elasticBeanstalkConfig,
      cloudWatchConfig,
      cloudFrontConfig,
      elastiCacheConfig,
      sqsConfig,
    }),
    [
      lambdaConfig,
      apiGatewayConfig,
      s3Config,
      ec2Config,
      rdsConfig,
      dynamoDBConfig,
      elbConfig,
      cognitoConfig,
      elasticBeanstalkConfig,
      cloudWatchConfig,
      cloudFrontConfig,
      elastiCacheConfig,
      sqsConfig,
    ]
  );

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

      setLastCostResult(data);

      addMessage({ role: 'bot', type: 'analysis', payload: parsed });
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

  // ── AI Free-text Chat ────────────────────────────────────────────────────

  const handleAIChat = useCallback(async (text) => {
    setIsLoading(true);

    try {
      const architectureSnapshot = architectureNodes.length
        ? buildArchitecturePayload(
            {
              nodes: architectureNodes,
              connections: architectureConnections,
            },
            serviceConfigs
          )
        : null;

      const history = messages
        .filter((msg) => msg.role === 'user' || msg.role === 'bot')
        .filter((msg) => msg.type === 'text')
        .slice(-10)
        .map((msg) => ({
          role: msg.role === 'bot' ? 'assistant' : 'user',
          content: msg.content,
        }));

      const data = await chatAboutArchitecture({
        message: text,
        architectureSnapshot,
        costResult: lastCostResult,
        history,
      });

      addMessage({
        role: 'bot',
        type: 'text',
        content: data.reply,
      });
    } catch (err) {
      const status = err?.response?.status;
      const rawDetail = err?.response?.data?.detail;
      const errorMessage =
        typeof rawDetail === 'string' && rawDetail.trim()
          ? rawDetail
          : status === 404
            ? 'The ArchBot endpoint could not be found. Check that the backend is running the current version.'
            : status
              ? `ArchBot couldn’t complete that request (HTTP ${status}). Please try again.`
              : 'I couldn’t reach ArchBot. Check that the backend is running, then try again.';

      addMessage({
        role: 'bot',
        type: 'error',
        content: errorMessage,
      });
    } finally {
      setIsLoading(false);
    }
  }, [
    architectureNodes,
    architectureConnections,
    serviceConfigs,
    messages,
    lastCostResult,
    addMessage,
  ]);

  // ── Message Send ─────────────────────────────────────────────────────────

  const handleSend = useCallback(async () => {
    const text = input.trim();
    if (!text || isLoading) return;

    addMessage({ role: 'user', type: 'text', content: text });
    setInput('');

    await handleAIChat(text);
  }, [input, isLoading, addMessage, handleAIChat]);

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  // ── Render ───────────────────────────────────────────────────────────────

  const containerClass = embedded
    ? 'flex flex-col h-full bg-card'
    : 'flex flex-col h-full bg-card rounded-xl overflow-hidden shadow-2xl shadow-black/60 border border-border';

  return (
    <div className={containerClass}>
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 bg-card border-b border-border flex-shrink-0">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-full bg-primary flex items-center justify-center shadow-md shadow-primary/20">
            <span className="text-sm font-black text-foreground">A</span>
          </div>
          <div>
            <p className="text-sm font-semibold text-foreground leading-none">ArchBot</p>
            <p className="text-[10px] text-success-foreground mt-0.5 flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 inline-block animate-pulse" />
              Architecture assistant
            </p>
          </div>
        </div>

        <div className="flex items-center gap-1">
          <button
            onClick={() => { setMessages([WELCOME_MESSAGE]); setLastCostResult(null); }}
            title="Reset conversation"
            className="p-1.5 rounded-md text-muted-foreground hover:text-foreground/80 hover:bg-muted transition"
          >
            <RefreshCw className="w-4 h-4" />
          </button>
          {!embedded && (
            <>
              <button
                onClick={() => setIsMinimized((v) => !v)}
                className="p-1.5 rounded-md text-muted-foreground hover:text-foreground/80 hover:bg-muted transition"
              >
                <ChevronDown className={`w-4 h-4 transition-transform ${isMinimized ? 'rotate-180' : ''}`} />
              </button>
              {onClose && (
                <button
                  onClick={onClose}
                  className="p-1.5 rounded-md text-muted-foreground hover:text-foreground/80 hover:bg-muted transition"
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
        <div className="px-4 py-2 bg-muted/60 border-b border-border flex-shrink-0">
          <div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
            <span className="font-mono">Playground:</span>
            <span className={`font-semibold ${architectureNodes.length > 0 ? 'text-primary' : 'text-muted-foreground'}`}>
              {architectureNodes.length} node{architectureNodes.length !== 1 ? 's' : ''}
            </span>
            <span className="text-muted-foreground">·</span>
            <span className="font-semibold text-foreground/80">
              {architectureConnections.length} connection{architectureConnections.length !== 1 ? 's' : ''}
            </span>
            <button
              type="button"
              onClick={runAnalysis}
              disabled={isLoading || !isArchitectureAnalyzable(architectureNodes)}
              className="ml-auto inline-flex items-center gap-1.5 rounded-md border border-primary/30 px-2.5 py-1 text-xs font-medium text-primary transition hover:bg-accent disabled:cursor-not-allowed disabled:opacity-40"
            >
              <BarChart2 className="h-3.5 w-3.5" />
              Calculate costs
            </button>
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

          {/* Input */}
          <div className="px-3 pb-3 flex-shrink-0">
            <div className="flex items-end gap-2 bg-muted rounded-xl border border-border focus-within:border-amber-500/50 transition px-3 py-2">
              <textarea
                ref={inputRef}
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Ask ArchBot anything about your architecture…"
                rows={1}
                disabled={isLoading}
                className="flex-1 bg-transparent text-sm text-foreground placeholder:text-muted-foreground resize-none outline-none leading-relaxed max-h-24 disabled:opacity-50"
                style={{ scrollbarWidth: 'none' }}
              />
              <button
                onClick={handleSend}
                disabled={!input.trim() || isLoading}
                className="w-8 h-8 rounded-lg bg-primary hover:bg-primary/90 flex items-center justify-center flex-shrink-0 transition disabled:opacity-30 disabled:cursor-not-allowed shadow-md shadow-primary/20"
              >
                <Send className="w-3.5 h-3.5 text-foreground" />
              </button>
            </div>
            <p className="text-[10px] text-muted-foreground mt-1.5 text-center">
              Press Enter to send · Shift+Enter for new line
            </p>
          </div>
        </>
      )}
    </div>
  );
}
