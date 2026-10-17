'use client';

import { useState } from 'react';
import { ArrowUp, BookOpen, LoaderCircle } from 'lucide-react';
import { chatWithArchitectureAssistant } from '@/api/client';

export default function AITestPage() {
  const [message, setMessage] = useState('');
  const [answer, setAnswer] = useState('');
  const [sources, setSources] = useState([]);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const submit = async (event) => {
    event.preventDefault();
    const value = message.trim();
    if (!value || loading) return;
    setLoading(true);
    setError('');
    try {
      const data = await chatWithArchitectureAssistant(value);
      setAnswer(data.response);
      setSources(data.sources || []);
    } catch (requestError) {
      setError(requestError.response?.data?.detail || requestError.message || 'Request failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="min-h-screen bg-background px-5 py-12 text-foreground">
      <section className="mx-auto max-w-3xl">
        <p className="mb-3 text-xs font-semibold uppercase tracking-[0.24em] text-primary">Module 1 / AI test</p>
        <h1 className="text-4xl font-semibold tracking-tight">SystemArcht assistant</h1>
        <p className="mt-3 max-w-xl text-muted-foreground">A temporary test surface for the local retrieval and EC2 Ollama pipeline.</p>

        <form onSubmit={submit} className="mt-10 flex gap-3 rounded-2xl border border-border bg-card p-3 shadow-2xl">
          <textarea
            value={message}
            onChange={(event) => setMessage(event.target.value)}
            placeholder="Ask about an AWS architecture..."
            rows={3}
            className="min-w-0 flex-1 resize-none bg-transparent px-3 py-2 text-sm outline-none placeholder:text-muted-foreground"
          />
          <button type="submit" disabled={loading || !message.trim()} aria-label="Send message" className="self-end rounded-xl bg-primary p-3 text-primary-foreground transition hover:bg-primary/90 disabled:cursor-not-allowed disabled:opacity-40">
            {loading ? <LoaderCircle className="h-5 w-5 animate-spin" /> : <ArrowUp className="h-5 w-5" />}
          </button>
        </form>

        {error && <p className="mt-5 rounded-xl border border-destructive/40 bg-destructive/10 p-4 text-sm text-destructive">{error}</p>}
        {answer && (
          <article className="mt-8 rounded-2xl border border-border bg-card/80 p-6">
            <h2 className="text-xs font-semibold uppercase tracking-[0.2em] text-muted-foreground">Response</h2>
            <p className="mt-4 whitespace-pre-wrap text-[15px] leading-7 text-foreground">{answer}</p>
            <div className="mt-8 border-t border-border pt-5">
              <h3 className="flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.2em] text-muted-foreground"><BookOpen className="h-4 w-4" /> Retrieved sources</h3>
              <div className="mt-3 space-y-2 text-xs text-muted-foreground">
                {sources.map((source) => <p key={source.document}>{source.document}</p>)}
              </div>
            </div>
          </article>
        )}
      </section>
    </main>
  );
}
