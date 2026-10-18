import React from 'react';
import Link from 'next/link';
import { Zap, Layout, Gauge, Lightbulb, ArrowRight, MessageSquare, BookOpen, Sparkles, FilePlus2 } from 'lucide-react';
import { SiteHeader } from '@/components/layout/SiteHeader';
import { CASE_STUDIES } from '@/lib/constants';

const FEATURES = [
  {
    icon: Layout,
    title: 'Drag & Drop Design',
    description: 'Visually design cloud architectures by dragging AWS services onto a canvas.',
  },
  {
    icon: Gauge,
    title: 'Real-World Simulation',
    description: 'Simulate actual AWS service behavior including cold starts, throttling, and latency.',
  },
  {
    icon: Lightbulb,
    title: 'Learn Patterns',
    description: 'Study core system design patterns used by companies like Netflix, Uber, and Instagram.',
  },
  {
    icon: MessageSquare,
    title: 'ArchBot — Cost AI',
    description: 'Chat with your assistant for cost breakdowns and optimization tips for your architecture.',
    link: '/chatbot',
    highlight: true,
  },
];

export const LandingPage = () => {
  return (
    <div className="min-h-screen bg-background text-foreground">
      <SiteHeader showLandingAnchors />

      <section className="border-b border-border px-4 py-16 md:py-20">
        <div className="mx-auto max-w-5xl text-center">
          <p className="mb-3 text-xs font-semibold tracking-[0.18em] text-primary uppercase">
            AWS Architecture Learning
          </p>
          <h1 className="text-4xl font-semibold tracking-tight text-foreground md:text-5xl">
            Design, simulate, and learn
            <span className="block mt-1">AWS architectures</span>
          </h1>
          <p className="mx-auto mt-5 max-w-2xl text-base leading-relaxed text-muted-foreground md:text-[17px]">
            SystemArcht is an interactive platform where you can visually design cloud architectures,
            simulate their behavior with real-world constraints, and understand system design patterns.
          </p>
          <div className="mt-8 flex flex-col items-stretch justify-center gap-3 sm:flex-row sm:flex-wrap sm:items-center">
            <Link href="/learning" className="sa-btn-primary h-11 px-5 text-[15px]">
              <BookOpen className="size-4" />
              Start Learning
            </Link>
            <Link href="/playground" className="sa-btn-secondary h-11 px-5 text-[15px]">
              <Layout className="size-4" />
              Start Building
            </Link>
            <Link href="/playground?newDocument=true" className="sa-btn-secondary h-11 px-5 text-[15px]">
              <FilePlus2 className="size-4" />
              New architecture doc
            </Link>
            <Link href="/ai-architect" className="sa-btn-secondary h-11 px-5 text-[15px]">
              <Sparkles className="size-4" />
              AI Architect
            </Link>
            <Link href="/chatbot" className="sa-btn-secondary h-11 px-5 text-[15px]">
              <MessageSquare className="size-4" />
              Ask ArchBot
            </Link>
          </div>
        </div>
      </section>

      <section id="features" className="bg-muted/50 px-4 py-16">
        <div className="mx-auto max-w-6xl">
          <h2 className="mb-10 text-center text-2xl font-semibold tracking-tight">Why SystemArcht?</h2>
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-4">
            {FEATURES.map((feature) => (
              <div key={feature.title} className="relative rounded-xl border border-border bg-card p-6 shadow-xs">
                {feature.highlight ? (
                  <span className="absolute top-3 right-3 rounded-full border border-border bg-accent px-2 py-0.5 text-[10px] font-semibold tracking-wide text-accent-foreground uppercase">
                    New
                  </span>
                ) : null}
                <feature.icon className="mb-4 size-6 text-primary" />
                <h3 className="mb-2 text-base font-semibold">{feature.title}</h3>
                <p className="text-sm leading-relaxed text-muted-foreground">{feature.description}</p>
                {feature.link ? (
                  <Link href={feature.link} className="mt-4 inline-flex items-center gap-1 text-sm font-medium text-primary hover:underline">
                    Try ArchBot <ArrowRight className="size-3.5" />
                  </Link>
                ) : null}
              </div>
            ))}
          </div>
        </div>
      </section>

      <section id="patterns" className="px-4 py-16">
        <div className="mx-auto max-w-6xl">
          <h2 className="mb-3 text-center text-2xl font-semibold tracking-tight">Learn 3 core patterns</h2>
          <p className="mb-8 text-center text-sm text-muted-foreground">
            Explore real-world case studies and open each architecture in the interactive playground.
          </p>
          <div className="space-y-3">
            {CASE_STUDIES.map((caseStudy) => (
              <Link
                key={caseStudy.id}
                href={`/case-studies/${caseStudy.id}`}
                className="group flex flex-col gap-3 rounded-xl border border-border bg-card px-5 py-4 shadow-xs transition-colors hover:border-primary/50 hover:bg-muted/40 sm:flex-row sm:items-center sm:justify-between"
              >
                <div className="min-w-0">
                  <span className="mb-2 inline-flex rounded-full bg-accent px-2.5 py-1 text-xs font-semibold text-accent-foreground">
                    {caseStudy.pattern}
                  </span>
                  <h3 className="text-base font-semibold group-hover:text-primary">{caseStudy.title}</h3>
                  <p className="mt-1 text-sm text-muted-foreground">{caseStudy.description}</p>
                </div>
                <span className="inline-flex shrink-0 items-center gap-2 text-sm font-semibold text-primary">
                  Est: {caseStudy.cost}
                  <ArrowRight className="size-4 transition-transform group-hover:translate-x-1" aria-hidden="true" />
                </span>
              </Link>
            ))}
          </div>
          <div className="mt-6 text-center">
            <Link href="/case-studies" className="inline-flex items-center gap-1 text-sm font-medium text-primary hover:underline">
              Browse all case studies <ArrowRight className="size-4" aria-hidden="true" />
            </Link>
          </div>
        </div>
      </section>

      <section className="border-t border-border bg-foreground px-4 py-14 text-background">
        <div className="mx-auto max-w-3xl text-center">
          <h2 className="text-2xl font-semibold tracking-tight">Ready to learn?</h2>
          <p className="mt-3 text-sm text-background/70 md:text-base">
            Start building your first AWS architecture and understand real-world constraints.
          </p>
          <Link href="/playground" className="sa-btn-primary mx-auto mt-6 h-11 px-5">
            <Layout className="size-4" />
            Launch Playground
          </Link>
        </div>
      </section>

      <footer className="border-t border-border px-4 py-8">
        <div className="mx-auto max-w-6xl text-center text-sm text-muted-foreground">
          <p>SystemArcht © 2026 · An interactive learning platform for AWS cloud architecture</p>
        </div>
      </footer>
    </div>
  );
};
