import React from 'react';
import Link from 'next/link';
import { CASE_STUDIES } from '@/lib/constants';
import { ArrowRight, Zap } from 'lucide-react';
import { SiteHeader } from '@/components/common/SiteHeader';

export const CaseStudyList = () => {
  return (
    <div className="min-h-screen bg-background text-foreground">
      <SiteHeader />
      {/* Header */}
      <div className="border-b border-border bg-muted/40 px-4 py-14">
        <div className="max-w-6xl mx-auto">
          <p className="mb-3 text-xs font-semibold uppercase tracking-[0.18em] text-primary">
            SystemArcht patterns
          </p>
          <h1 className="mb-4 text-3xl font-semibold tracking-tight md:text-4xl">System Design Case Studies</h1>
          <p className="max-w-2xl text-base text-muted-foreground md:text-lg">
            Learn real-world cloud architectures with interactive simulations
          </p>
        </div>
      </div>

      {/* Case Studies Grid */}
      <div className="mx-auto max-w-6xl px-4 py-10 md:py-12">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {CASE_STUDIES.map((caseStudy) => (
            <Link key={caseStudy.id} href={`/case-studies/${caseStudy.id}`}>
              <div className="group h-full rounded-xl border border-border bg-card p-6 shadow-sm transition-all duration-200 hover:-translate-y-0.5 hover:border-primary/50 hover:shadow-md">
                {/* Pattern Badge */}
                <div className="flex items-center gap-2 mb-3">
                  <Zap className="w-4 h-4" style={{ color: '#FF9900' }} />
                  <span className="text-xs font-semibold text-primary bg-accent px-3 py-1 rounded-full">
                    {caseStudy.pattern}
                  </span>
                </div>

                {/* Title */}
                <h2 className="text-xl font-bold text-foreground mb-2 group-hover:text-primary transition">
                  {caseStudy.title}
                </h2>

                {/* Description */}
                <p className="text-muted-foreground text-sm mb-4 line-clamp-2">
                  {caseStudy.description}
                </p>

                {/* Scale */}
                <div className="mb-4 pb-4 border-b border-border">
                  <p className="text-xs text-muted-foreground font-semibold mb-1">SCALE</p>
                  <p className="text-sm text-foreground/80">{caseStudy.scale}</p>
                </div>

                {/* Key Insight */}
                <p className="text-xs text-muted-foreground italic mb-4">
                  💡 <span className="font-semibold">{caseStudy.keyInsight}</span>
                </p>

                {/* Cost & CTA */}
                <div className="flex items-center justify-between">
                  <span className="text-sm font-bold text-foreground">
                    Estimated: <span className="text-primary">{caseStudy.cost}</span>
                  </span>
                  <ArrowRight className="w-5 h-5 text-primary group-hover:translate-x-1 transition" />
                </div>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
};
