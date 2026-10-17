'use client';

import { ArchitectChatbot } from '@/components/chatbot';
import Link from 'next/link';
import { ChevronLeft, ExternalLink, Sparkles } from 'lucide-react';
import { ThemeToggle } from '@/components/theme/ThemeToggle';

export default function ChatbotPage() {
  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Nav */}
      <header className="flex items-center justify-between px-6 py-4 border-b border-border bg-card/80 backdrop-blur-sm">
        <div className="flex items-center gap-4">
          <Link href="/">
            <button className="flex items-center gap-1.5 text-muted-foreground hover:text-foreground transition text-sm">
              <ChevronLeft className="w-4 h-4" />
              Back
            </button>
          </Link>
          <div className="w-px h-5 bg-muted" />
          <div>
            <h1 className="text-base font-bold text-foreground leading-none">ArchBot</h1>
            <p className="text-xs text-muted-foreground mt-0.5">AWS Architecture Cost Assistant</p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <Link href="/ai-architect">
            <button className="flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-full bg-primary hover:bg-primary/90 text-primary-foreground font-bold transition">
              <Sparkles className="w-3 h-3 fill-primary-foreground" />
              AI Architect
            </button>
          </Link>

          <Link href="/playground">
            <button className="flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-full bg-primary/10 hover:bg-primary/20 text-primary border border-primary/20 hover:border-primary/40 transition">
              <ExternalLink className="w-3 h-3" />
              Open Playground
            </button>
          </Link>
          <ThemeToggle />
        </div>
      </header>

      {/* Chatbot fills the remaining space */}
      <div className="flex-1 flex overflow-hidden">
        {/* Left column: chatbot */}
        <div className="flex-1 flex flex-col max-w-2xl mx-auto w-full p-4">
          <ArchitectChatbot embedded />
        </div>

        {/* Right column: context panel */}
        <aside className="hidden lg:flex w-72 flex-col border-l border-border bg-card/70 p-5 gap-5">
          <div>
            <h2 className="text-xs font-semibold uppercase tracking-widest text-muted-foreground mb-3">Quick Guide</h2>
            <ul className="space-y-2.5 text-sm text-muted-foreground">
              {[
                { cmd: 'Analyze Architecture', desc: 'Full monthly cost breakdown' },
                { cmd: 'Optimize Costs', desc: 'Tailored saving suggestions' },
                { cmd: 'Explain Design', desc: 'Summary of current setup' },
                { cmd: 'Rank by cost', desc: 'Most expensive services first' },
                { cmd: 'Help', desc: 'See all available commands' },
              ].map((item) => (
                <li key={item.cmd} className="flex gap-2">
                  <span className="text-primary font-mono text-xs pt-0.5 shrink-0">›</span>
                  <div>
                    <p className="text-foreground font-medium leading-none">{item.cmd}</p>
                    <p className="text-muted-foreground text-xs mt-0.5">{item.desc}</p>
                  </div>
                </li>
              ))}
            </ul>
          </div>

          <div className="border-t border-border pt-4">
            <h2 className="text-xs font-semibold uppercase tracking-widest text-muted-foreground mb-3">Supported Services</h2>
            <div className="space-y-1.5">
              {[
                { name: 'AWS Lambda', status: '✓ Analyzed' },
                { name: 'API Gateway', status: '✓ Analyzed' },
                { name: 'Amazon S3', status: 'Coming soon' },
                { name: 'DynamoDB', status: 'Coming soon' },
              ].map((s) => (
                <div key={s.name} className="flex items-center justify-between text-xs">
                  <span className="text-foreground/80">{s.name}</span>
                  <span className={s.status.startsWith('✓') ? 'text-success-foreground' : 'text-muted-foreground'}>
                    {s.status}
                  </span>
                </div>
              ))}
            </div>
          </div>

          <div className="border-t border-border pt-4">
            <p className="text-xs text-muted-foreground leading-relaxed">
              ArchBot reads your Playground design in real-time. Build or modify your architecture there, then ask for analysis here.
            </p>
          </div>
        </aside>
      </div>
    </div>
  );
}
