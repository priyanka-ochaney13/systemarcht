'use client';

import React, { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  Sparkles,
  Plus,
  Trash2,
  Edit2,
  Check,
  X,
  Send,
  Loader2,
  Layout,
  Code2,
  FileCode,
  Info,
  ExternalLink,
  ChevronLeft,
  ChevronRight,
  Copy,
  CheckCheck,
  Server,
  Zap,
  Layers,
  ArrowRight,
  Menu,
} from 'lucide-react';

import {
  getAIConversations,
  createAIConversation,
  getAIConversation,
  updateAIConversationTitle,
  deleteAIConversation,
  sendAIMessage,
  editAIMessage,
} from '@/api/client';
import { useArchitectureStore } from '@/store';
import { MermaidArchitectureDiagram } from '@/components/playground/MermaidArchitectureDiagram';
import { ThemeToggle } from '@/components/theme/ThemeToggle';

const SUGGESTED_PROMPTS = [
  {
    title: 'High-Volume Image Ingestion',
    prompt: 'Infra to deploy a static img upload site with million request per hour',
    tag: 'S3 • CloudFront • Lambda',
  },
  {
    title: 'Serverless E-Commerce API',
    prompt: 'Design a serverless e-commerce checkout system handling flash sales with order queuing and inventory lock',
    tag: 'API GW • SQS • DynamoDB',
  },
  {
    title: 'Real-Time Telemetry Pipeline',
    prompt: 'IoT device streaming architecture for 50,000 events/sec with caching and analytical storage',
    tag: 'ElastiCache • Lambda • S3',
  },
  {
    title: 'High-Availability Web App',
    prompt: 'Scalable multi-AZ web application backend with load balancer, containerized compute, and relational DB',
    tag: 'ALB • Beanstalk • RDS',
  },
];

export default function AIArchitectPage() {
  const router = useRouter();
  const loadArchitecture = useArchitectureStore((s) => s.loadArchitecture);

  // Conversations & active state
  const [conversations, setConversations] = useState([]);
  const [activeConvId, setActiveConvId] = useState(null);
  const [activeConversation, setActiveConversation] = useState(null);
  const [loadingConv, setLoadingConv] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(true);

  // Message input & submission
  const [inputMessage, setInputMessage] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  // Editing state for conversation title
  const [editingTitleId, setEditingTitleId] = useState(null);
  const [editedTitle, setEditedTitle] = useState('');

  // Editing state for a user prompt
  const [editingMessageId, setEditingMessageId] = useState(null);
  const [editedPromptText, setEditedPromptText] = useState('');

  // Active tabs per assistant message: { [messageId]: 'explanation' | 'diagram' | 'sdk' | 'terraform' }
  const [activeTabs, setActiveTabs] = useState({});
  const [copiedState, setCopiedState] = useState({});

  const messagesEndRef = useRef(null);
  const inputRef = useRef(null);

  // 1. Fetch conversations on mount
  useEffect(() => {
    fetchConversations();
  }, []);

  const fetchConversations = async (selectLatest = false) => {
    try {
      const list = await getAIConversations();
      setConversations(list);
      if (list.length > 0) {
        if (selectLatest || !activeConvId) {
          selectConversation(list[0].id);
        }
      } else {
        // If empty, auto-create a starting chat
        handleNewChat();
      }
    } catch (err) {
      console.error('Failed to load conversations:', err);
    }
  };

  const selectConversation = async (convId) => {
    if (activeConvId === convId && activeConversation) return;
    setActiveConvId(convId);
    setLoadingConv(true);
    setErrorMessage('');
    try {
      const data = await getAIConversation(convId);
      setActiveConversation(data);
    } catch (err) {
      setErrorMessage('Failed to load conversation details.');
      console.error(err);
    } finally {
      setLoadingConv(false);
    }
  };

  const handleNewChat = async () => {
    try {
      const newConv = await createAIConversation('New Architecture Chat');
      setConversations((prev) => [newConv, ...prev]);
      setActiveConvId(newConv.id);
      setActiveConversation({ ...newConv, messages: [] });
      setInputMessage('');
      setErrorMessage('');
      setTimeout(() => inputRef.current?.focus(), 100);
    } catch (err) {
      setErrorMessage('Failed to create new conversation.');
      console.error(err);
    }
  };

  const handleDeleteConversation = async (e, convId) => {
    e.stopPropagation();
    if (!window.confirm('Delete this architecture chat session?')) return;
    try {
      await deleteAIConversation(convId);
      const remaining = conversations.filter((c) => c.id !== convId);
      setConversations(remaining);
      if (activeConvId === convId) {
        if (remaining.length > 0) {
          selectConversation(remaining[0].id);
        } else {
          handleNewChat();
        }
      }
    } catch (err) {
      console.error('Failed to delete conversation:', err);
    }
  };

  const handleSaveTitle = async (convId) => {
    if (!editedTitle.trim()) {
      setEditingTitleId(null);
      return;
    }
    try {
      await updateAIConversationTitle(convId, editedTitle.trim());
      setConversations((prev) =>
        prev.map((c) => (c.id === convId ? { ...c, title: editedTitle.trim() } : c))
      );
      if (activeConversation?.id === convId) {
        setActiveConversation((prev) => ({ ...prev, title: editedTitle.trim() }));
      }
    } catch (err) {
      console.error('Failed to update title:', err);
    } finally {
      setEditingTitleId(null);
    }
  };

  // Scroll to bottom on new messages
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [activeConversation?.messages, isGenerating]);

  // 2. Submit user message
  const handleSendMessage = async (customPrompt) => {
    const textToSend = (customPrompt || inputMessage).trim();
    if (!textToSend || isGenerating) return;

    let targetConvId = activeConvId;
    if (!targetConvId) {
      const created = await createAIConversation(textToSend.slice(0, 35));
      targetConvId = created.id;
      setActiveConvId(targetConvId);
    }

    // Optimistically show user message
    const tempUserMsg = {
      id: `temp-${Date.now()}`,
      role: 'user',
      content: textToSend,
      created_at: new Date().toISOString(),
    };

    setActiveConversation((prev) => ({
      ...prev,
      messages: [...(prev?.messages || []), tempUserMsg],
    }));
    setInputMessage('');
    setIsGenerating(true);
    setErrorMessage('');

    try {
      const result = await sendAIMessage(targetConvId, textToSend);
      // Replace with real saved messages
      setActiveConversation((prev) => {
        const withoutTemp = (prev?.messages || []).filter((m) => m.id !== tempUserMsg.id);
        return {
          ...prev,
          messages: [...withoutTemp, result.user_message, result.assistant_message],
        };
      });

      // Update sidebar title if needed
      fetchConversations();
    } catch (err) {
      const msg = err.response?.data?.detail || err.message || 'Architecture generation failed.';
      setErrorMessage(msg);
      // Remove temp message on failure
      setActiveConversation((prev) => ({
        ...prev,
        messages: (prev?.messages || []).filter((m) => m.id !== tempUserMsg.id),
      }));
    } finally {
      setIsGenerating(false);
    }
  };

  // 3. Edit user prompt and regenerate
  const handleEditSubmit = async (msgId) => {
    if (!editedPromptText.trim() || isGenerating) return;
    setIsGenerating(true);
    setErrorMessage('');

    try {
      const result = await editAIMessage(activeConvId, msgId, editedPromptText.trim());
      // Re-fetch conversation to sync the truncated and regenerated state
      const refreshed = await getAIConversation(activeConvId);
      setActiveConversation(refreshed);
      setEditingMessageId(null);
      fetchConversations();
    } catch (err) {
      setErrorMessage(err.response?.data?.detail || 'Failed to regenerate architecture.');
      console.error(err);
    } finally {
      setIsGenerating(false);
    }
  };

  // 4. "Tune in Playground" integration
  const handleOpenInPlayground = (architectureData) => {
    if (!architectureData || !architectureData.nodes) {
      alert('No architecture nodes found to load into Playground.');
      return;
    }

    // Format nodes for PlaygroundCanvas
    const playgroundNodes = (architectureData.nodes || []).map((node, idx) => ({
      id: node.id || `node-${idx}`,
      name: node.name || node.serviceType?.toUpperCase(),
      label: node.name || node.serviceType?.toUpperCase(),
      serviceType: node.serviceType,
      type: 'serviceNode',
      config: node.config || {},
      position: node.position || {
        x: 100 + (idx % 3) * 260,
        y: 100 + Math.floor(idx / 3) * 160,
      },
    }));

    const playgroundConnections = (architectureData.connections || []).map((conn, idx) => ({
      id: conn.id || `conn-${idx}`,
      source: conn.source,
      target: conn.target,
      avg_request_size_kb: conn.avg_request_size_kb || 5,
      avg_response_size_kb: conn.avg_response_size_kb || 25,
    }));

    loadArchitecture({
      nodes: playgroundNodes,
      connections: playgroundConnections,
    });

    router.push('/playground');
  };

  // Clipboard copy helper
  const handleCopy = (key, text) => {
    navigator.clipboard.writeText(text);
    setCopiedState((prev) => ({ ...prev, [key]: true }));
    setTimeout(() => {
      setCopiedState((prev) => ({ ...prev, [key]: false }));
    }, 2000);
  };

  return (
    <div className="flex h-screen w-screen overflow-hidden bg-background text-foreground font-sans">
      {/* ============================================================ */}
      {/* SIDEBAR: CHAT HISTORY & CONVERSATION MANAGEMENT */}
      {/* ============================================================ */}
      <aside
        className={`${
          sidebarOpen ? 'w-80' : 'w-0'
        } transition-all duration-300 ease-in-out shrink-0 bg-sidebar border-r border-border flex flex-col overflow-hidden relative z-20`}
      >
        {/* Brand / Logo */}
        <div className="p-4 border-b border-border flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2.5 group">
            <div className="w-8 h-8 rounded-lg bg-primary/20 border border-primary/40 flex items-center justify-center text-primary group-hover:scale-105 transition">
              <Zap className="w-4 h-4 fill-primary" />
            </div>
            <div>
              <span className="font-bold text-sm tracking-tight text-foreground group-hover:text-primary transition">
                SystemArcht
              </span>
              <span className="block text-[10px] text-primary font-medium">AI Architect</span>
            </div>
          </Link>
          <button
            onClick={() => setSidebarOpen(false)}
            className="text-muted-foreground hover:text-foreground p-1.5 rounded-lg hover:bg-muted lg:hidden"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* New Chat Button */}
        <div className="p-3">
          <button
            onClick={handleNewChat}
            className="w-full flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl bg-primary hover:bg-primary/90 text-primary-foreground font-semibold text-sm shadow-lg shadow-primary/20 transition hover:shadow-primary/20"
          >
            <Plus className="w-4 h-4" />
            New Architecture
          </button>
        </div>

        {/* Conversation List */}
        <div className="flex-1 overflow-y-auto px-3 py-2 space-y-1">
          <p className="px-2 pb-1.5 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
            Recent Architectures
          </p>
          {conversations.map((c) => {
            const isActive = c.id === activeConvId;
            const isEditing = editingTitleId === c.id;

            return (
              <div
                key={c.id}
                onClick={() => selectConversation(c.id)}
                className={`group flex items-center justify-between px-3 py-2.5 rounded-xl text-xs cursor-pointer transition ${
                  isActive
                    ? 'bg-muted text-primary font-medium border border-primary/30 shadow-sm'
                    : 'text-muted-foreground hover:bg-muted/60 hover:text-foreground'
                }`}
              >
                {isEditing ? (
                  <div className="flex items-center gap-1.5 flex-1" onClick={(e) => e.stopPropagation()}>
                    <input
                      type="text"
                      value={editedTitle}
                      onChange={(e) => setEditedTitle(e.target.value)}
                      onKeyDown={(e) => e.key === 'Enter' && handleSaveTitle(c.id)}
                      autoFocus
                      className="bg-background border border-primary/60 rounded px-2 py-0.5 text-xs text-foreground outline-none w-full"
                    />
                    <button
                      onClick={() => handleSaveTitle(c.id)}
                      className="text-success-foreground hover:text-success-foreground p-0.5"
                    >
                      <Check className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() => setEditingTitleId(null)}
                      className="text-muted-foreground hover:text-muted-foreground p-0.5"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ) : (
                  <>
                    <span className="truncate flex-1 pr-2">{c.title || 'Untitled Architecture'}</span>
                    <div className="opacity-0 group-hover:opacity-100 flex items-center gap-1 shrink-0 transition">
                      <button
                        title="Rename Chat"
                        onClick={(e) => {
                          e.stopPropagation();
                          setEditingTitleId(c.id);
                          setEditedTitle(c.title || '');
                        }}
                        className="text-muted-foreground hover:text-primary p-1 rounded"
                      >
                        <Edit2 className="w-3 h-3" />
                      </button>
                      <button
                        title="Delete Chat"
                        onClick={(e) => handleDeleteConversation(e, c.id)}
                        className="text-muted-foreground hover:text-rose-400 p-1 rounded"
                      >
                        <Trash2 className="w-3 h-3" />
                      </button>
                    </div>
                  </>
                )}
              </div>
            );
          })}
        </div>

        {/* Footer info & Links */}
        <div className="p-3 border-t border-border bg-background/40 space-y-2">
          <div className="flex items-center justify-between text-[11px] text-muted-foreground px-1">
            <span className="flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              Engine: <strong className="text-foreground">Groq / Grok API</strong>
            </span>
            <span className="text-muted-foreground text-[10px]">Fast</span>
          </div>

          <div className="grid grid-cols-2 gap-1.5 pt-1">
            <Link
              href="/playground"
              className="flex items-center justify-center gap-1.5 py-1.5 px-2 rounded-lg bg-muted hover:bg-muted text-foreground/80 text-[11px] font-medium transition"
            >
              <Layout className="w-3 h-3 text-primary" />
              Playground
            </Link>
            <Link
              href="/learning"
              className="flex items-center justify-center gap-1.5 py-1.5 px-2 rounded-lg bg-muted hover:bg-muted text-foreground/80 text-[11px] font-medium transition"
            >
              <Layers className="w-3 h-3 text-primary" />
              Modules
            </Link>
          </div>
        </div>
      </aside>

      {/* ============================================================ */}
      {/* MAIN VIEWPORT */}
      {/* ============================================================ */}
      <main className="flex-1 flex flex-col min-w-0 bg-background relative">
        {/* Top Header */}
        <header className="h-14 border-b border-border bg-card/70 backdrop-blur-md px-4 flex items-center justify-between shrink-0 z-10">
          <div className="flex items-center gap-3 min-w-0">
            {!sidebarOpen && (
              <button
                onClick={() => setSidebarOpen(true)}
                className="p-1.5 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted transition"
                title="Open Sidebar"
              >
                <Menu className="w-5 h-5" />
              </button>
            )}
            <div className="min-w-0">
              <h1 className="text-sm font-semibold text-foreground truncate flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-primary shrink-0" />
                <span className="truncate">{activeConversation?.title || 'AI Architecture Assistant'}</span>
              </h1>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <Link
              href="/playground"
              className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-muted/80 hover:bg-muted border border-border text-xs text-primary font-medium transition"
            >
              <Layout className="w-3.5 h-3.5" />
              Open Playground
            </Link>
            <Link
              href="/"
              className="p-1.5 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted text-xs flex items-center gap-1 transition"
            >
              <ChevronLeft className="w-4 h-4" />
              Exit
            </Link>
            <ThemeToggle />
          </div>
        </header>

        {/* Message Thread Area */}
        <div className="flex-1 overflow-y-auto px-4 md:px-8 py-6 space-y-6">
          {/* Empty Conversation State */}
          {(!activeConversation?.messages || activeConversation.messages.length === 0) && (
            <div className="max-w-3xl mx-auto py-8">
              <div className="text-center space-y-3 mb-10">
                <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-primary/10 border border-primary/20 text-primary shadow-xl shadow-primary/10">
                  <Sparkles className="w-7 h-7" />
                </div>
                <h2 className="text-2xl md:text-3xl font-bold tracking-tight text-foreground">
                  AWS Architecture Assistant
                </h2>
                <p className="text-sm text-muted-foreground max-w-lg mx-auto">
                  Describe any workload or problem statement. I will generate a complete AWS architecture,
                  interactive Mermaid diagram, Python SDK code, and Terraform templates ready to tune.
                </p>
              </div>

              {/* Suggestions Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {SUGGESTED_PROMPTS.map((item, idx) => (
                  <button
                    key={idx}
                    onClick={() => handleSendMessage(item.prompt)}
                    className="text-left p-4 rounded-2xl bg-card/80 hover:bg-card border border-border hover:border-primary/40 transition group relative overflow-hidden"
                  >
                    <div className="flex items-center justify-between mb-1.5">
                      <span className="text-xs font-semibold text-primary group-hover:text-primary transition">
                        {item.title}
                      </span>
                      <ArrowRight className="w-3.5 h-3.5 text-muted-foreground group-hover:text-primary group-hover:translate-x-0.5 transition" />
                    </div>
                    <p className="text-xs text-foreground/80 leading-relaxed mb-2">{item.prompt}</p>
                    <span className="text-[10px] text-muted-foreground font-mono">{item.tag}</span>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Render Messages */}
          {activeConversation?.messages?.map((msg) => {
            const isUser = msg.role === 'user';
            const isEditing = editingMessageId === msg.id;
            const currentTab = activeTabs[msg.id] || 'explanation';
            const arch = msg.architecture_data;

            return (
              <div key={msg.id} className={`max-w-4xl mx-auto flex flex-col ${isUser ? 'items-end' : 'items-start'}`}>
                {/* USER MESSAGE */}
                {isUser ? (
                  <div className="max-w-2xl group relative">
                    {isEditing ? (
                      <div className="bg-card border border-primary/60 rounded-2xl p-3 shadow-xl w-full min-w-[320px]">
                        <textarea
                          value={editedPromptText}
                          onChange={(e) => setEditedPromptText(e.target.value)}
                          rows={3}
                          className="w-full bg-transparent text-sm text-foreground outline-none resize-none"
                        />
                        <div className="flex justify-end gap-2 mt-2 pt-2 border-t border-border">
                          <button
                            onClick={() => setEditingMessageId(null)}
                            className="px-2.5 py-1 rounded-lg text-xs text-muted-foreground hover:text-foreground"
                          >
                            Cancel
                          </button>
                          <button
                            onClick={() => handleEditSubmit(msg.id)}
                            className="px-3 py-1 rounded-lg text-xs font-semibold bg-primary text-primary-foreground hover:bg-primary/90 transition"
                          >
                            Save & Regenerate
                          </button>
                        </div>
                      </div>
                    ) : (
                      <div className="flex items-start gap-2">
                        <button
                          onClick={() => {
                            setEditingMessageId(msg.id);
                            setEditedPromptText(msg.content);
                          }}
                          className="opacity-0 group-hover:opacity-100 p-1.5 rounded-lg text-muted-foreground hover:text-primary hover:bg-card transition self-center"
                          title="Edit Prompt"
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                        </button>
                        <div className="rounded-2xl rounded-tr-sm bg-primary px-4 py-2.5 text-primary-foreground text-sm font-medium shadow-xs">
                          {msg.content}
                        </div>
                      </div>
                    )}
                  </div>
                ) : (
                  /* ASSISTANT MESSAGE CARD */
                  <div className="w-full rounded-2xl border border-border bg-card/80 overflow-hidden shadow-2xl">
                    {/* Architecture Card Header */}
                    <div className="p-5 border-b border-border bg-sidebar flex flex-col md:flex-row md:items-center justify-between gap-4">
                      <div>
                        <div className="flex items-center gap-2 mb-1">
                          <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold tracking-wide uppercase bg-primary/10 text-primary border border-primary/30">
                            AWS Architecture
                          </span>
                          <span className="text-xs text-muted-foreground font-mono">
                            {arch?.services?.length || 0} Services Involved
                          </span>
                        </div>
                        <h3 className="text-lg font-bold text-foreground">{arch?.title || msg.content}</h3>
                        {arch?.summary && <p className="text-xs text-muted-foreground mt-1">{arch.summary}</p>}
                      </div>

                      {/* "TUNE IN PLAYGROUND" ACTION BUTTON */}
                      {arch && (
                        <button
                          onClick={() => handleOpenInPlayground(arch)}
                          className="flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-primary hover:bg-primary/90 text-primary-foreground font-semibold text-xs tracking-wide shadow-lg shadow-primary/20 hover:shadow-primary/20 transition shrink-0 transform hover:-translate-y-0.5"
                        >
                          <Layout className="w-4 h-4" />
                          Tune in Playground
                          <ExternalLink className="w-3.5 h-3.5 ml-0.5" />
                        </button>
                      )}
                    </div>

                    {/* Services Chips */}
                    {arch?.services && (
                      <div className="px-5 py-2.5 bg-background/40 border-b border-border/60 flex items-center gap-2 overflow-x-auto text-[11px]">
                        <span className="text-muted-foreground font-medium shrink-0">Services:</span>
                        {arch.services.map((svc) => (
                          <span
                            key={svc}
                            className="px-2.5 py-0.5 rounded-md bg-muted text-foreground/80 font-mono border border-border uppercase text-[10px]"
                          >
                            {svc.replace('_', ' ')}
                          </span>
                        ))}
                      </div>
                    )}

                    {/* Visual Diagram Section */}
                    {msg.diagram_mermaid && (
                      <div className="p-4 bg-background/60 border-b border-border">
                        <div className="flex items-center justify-between mb-2 px-1">
                          <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider flex items-center gap-1.5">
                            <Layers className="w-3.5 h-3.5 text-primary" />
                            Visual Architecture Flow
                          </span>
                          <span className="text-[10px] text-muted-foreground font-mono">Mermaid.js</span>
                        </div>
                        <div className="rounded-xl border border-border bg-card/80 p-2 overflow-x-auto min-h-[140px] flex items-center justify-center">
                          <MermaidArchitectureDiagram mermaidSource={msg.diagram_mermaid} valid={true} />
                        </div>
                      </div>
                    )}

                    {/* Resource Tabs (Explanation / SDK Code / Terraform) */}
                    <div className="border-b border-border bg-card/80 px-4 flex items-center justify-between text-xs">
                      <div className="flex items-center gap-1">
                        <button
                          onClick={() =>
                            setActiveTabs((prev) => ({ ...prev, [msg.id]: 'explanation' }))
                          }
                          className={`flex items-center gap-1.5 py-3 px-3 font-medium border-b-2 transition ${
                            currentTab === 'explanation'
                              ? 'border-amber-400 text-primary'
                              : 'border-transparent text-muted-foreground hover:text-foreground'
                          }`}
                        >
                          <Info className="w-3.5 h-3.5" />
                          Explanation
                        </button>

                        {msg.sdk_code && (
                          <button
                            onClick={() =>
                              setActiveTabs((prev) => ({ ...prev, [msg.id]: 'sdk' }))
                            }
                            className={`flex items-center gap-1.5 py-3 px-3 font-medium border-b-2 transition ${
                              currentTab === 'sdk'
                                ? 'border-amber-400 text-primary'
                                : 'border-transparent text-muted-foreground hover:text-foreground'
                            }`}
                          >
                            <Code2 className="w-3.5 h-3.5" />
                            AWS SDK Code
                          </button>
                        )}

                        {msg.terraform_code && (
                          <button
                            onClick={() =>
                              setActiveTabs((prev) => ({ ...prev, [msg.id]: 'terraform' }))
                            }
                            className={`flex items-center gap-1.5 py-3 px-3 font-medium border-b-2 transition ${
                              currentTab === 'terraform'
                                ? 'border-amber-400 text-primary'
                                : 'border-transparent text-muted-foreground hover:text-foreground'
                            }`}
                          >
                            <FileCode className="w-3.5 h-3.5" />
                            Terraform (IaC)
                          </button>
                        )}
                      </div>

                      {/* Copy Button for current tab */}
                      {(currentTab === 'sdk' || currentTab === 'terraform') && (
                        <button
                          onClick={() => {
                            const code = currentTab === 'sdk' ? msg.sdk_code : msg.terraform_code;
                            handleCopy(`${msg.id}-${currentTab}`, code);
                          }}
                          className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-primary py-1 px-2 rounded-md hover:bg-muted transition"
                        >
                          {copiedState[`${msg.id}-${currentTab}`] ? (
                            <>
                              <CheckCheck className="w-3.5 h-3.5 text-success-foreground" />
                              <span className="text-success-foreground">Copied</span>
                            </>
                          ) : (
                            <>
                              <Copy className="w-3.5 h-3.5" />
                              <span>Copy</span>
                            </>
                          )}
                        </button>
                      )}
                    </div>

                    {/* Tab Body */}
                    <div className="p-5">
                      {currentTab === 'explanation' && (
                        <div className="prose prose-invert prose-sm max-w-none text-foreground/80 text-xs md:text-sm leading-relaxed space-y-3 whitespace-pre-line">
                          {msg.explanation || msg.content}
                        </div>
                      )}

                      {currentTab === 'sdk' && (
                        <div className="relative">
                          <pre className="p-4 rounded-xl bg-background font-mono text-xs text-foreground overflow-x-auto leading-relaxed border border-border">
                            <code>{msg.sdk_code}</code>
                          </pre>
                        </div>
                      )}

                      {currentTab === 'terraform' && (
                        <div className="relative">
                          <div className="mb-2 p-2.5 rounded-lg bg-primary/10 border border-primary/20 text-[11px] text-primary flex items-center justify-between">
                            <span>Ready for Terraform engineering & deployment.</span>
                            <span className="font-mono text-[10px] text-muted-foreground">main.tf</span>
                          </div>
                          <pre className="p-4 rounded-xl bg-background font-mono text-xs text-foreground overflow-x-auto leading-relaxed border border-border">
                            <code>{msg.terraform_code}</code>
                          </pre>
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>
            );
          })}

          {/* Loading Indicator */}
          {isGenerating && (
            <div className="max-w-4xl mx-auto flex items-center gap-3 p-4 rounded-2xl bg-card/80 border border-border">
              <Loader2 className="w-5 h-5 text-primary animate-spin" />
              <div className="text-xs text-foreground/80">
                <span className="font-semibold text-primary">Engineering AWS Architecture...</span>
                <p className="text-[11px] text-muted-foreground mt-0.5">
                  Analyzing scale, selecting services, calculating connections, and generating SDK & Terraform code.
                </p>
              </div>
            </div>
          )}

          {errorMessage && (
            <div className="max-w-4xl mx-auto p-3 rounded-xl bg-destructive/10 border border-destructive/40/80 text-xs text-destructive">
              {errorMessage}
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>

        {/* Input Bar */}
        <div className="p-4 border-t border-border bg-card/80 backdrop-blur-md">
          <form
            onSubmit={(e) => {
              e.preventDefault();
              handleSendMessage();
            }}
            className="max-w-4xl mx-auto flex gap-2 items-end"
          >
            <div className="flex-1 bg-card rounded-2xl border border-border/80 focus-within:border-amber-500/80 transition shadow-xl p-2.5 flex items-center gap-2">
              <textarea
                ref={inputRef}
                value={inputMessage}
                onChange={(e) => setInputMessage(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault();
                    handleSendMessage();
                  }
                }}
                rows={1}
                placeholder="Ask for an architecture (e.g., 'infra to deploy a static img upload site with 1M request/hr')..."
                className="w-full bg-transparent text-sm text-foreground placeholder:text-muted-foreground outline-none resize-none max-h-32 min-h-[28px] py-1 px-1.5"
              />
            </div>

            <button
              type="submit"
              disabled={isGenerating || !inputMessage.trim()}
              className="p-3.5 rounded-2xl bg-primary hover:bg-primary/90 text-primary-foreground font-bold shadow-lg shadow-primary/20 disabled:opacity-40 disabled:cursor-not-allowed transition shrink-0"
              title="Send Message"
            >
              {isGenerating ? <Loader2 className="w-5 h-5 animate-spin" /> : <Send className="w-5 h-5" />}
            </button>
          </form>

          <p className="text-center text-[11px] text-muted-foreground mt-2">
            Engineered with fast Groq / Grok API • Click <span className="text-primary">Tune in Playground</span> to simulate live costs
          </p>
        </div>
      </main>
    </div>
  );
}

