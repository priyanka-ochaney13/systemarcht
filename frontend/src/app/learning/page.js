'use client';

import Link from 'next/link';
import {
  BookOpen,
  ArrowRight,
  CheckCircle2,
} from 'lucide-react';

import { learningModules } from '@/lib/learningModules';
import { SiteHeader } from '@/components/layout/SiteHeader';

export default function LearningPage() {
  return (
    <main className="min-h-screen bg-background text-foreground">
      <SiteHeader />
      <div className="max-w-6xl mx-auto px-6 py-10">

        {/* Header */}
        <div className="mb-10">

          <p className="text-sm text-primary font-semibold mb-2">
            SYSTEMARCHT LEARNING
          </p>

          <h1 className="text-3xl md:text-4xl font-bold text-foreground mb-3">
            Learn Cloud Architecture
          </h1>

          <p className="text-muted-foreground max-w-2xl leading-relaxed">
            Learn a concept, explore an architecture, build it in the
            Playground, calculate its cost, and use ArchBot to reason about
            your design.
          </p>

        </div>

        {/* Learning Flow */}
        <div className="mb-10 p-5 rounded-xl border border-border bg-muted/50">

          <h2 className="text-sm font-semibold text-foreground mb-4">
            Your Learning Journey
          </h2>

          <div className="flex flex-wrap items-center gap-2 text-sm">

            {[
              'Learn',
              'Explore',
              'Build',
              'Calculate',
              'Ask ArchBot',
              'Optimize',
              'Validate',
            ].map((step, index) => (
              <div
                key={step}
                className="flex items-center gap-2"
              >

                <span
                  className="
                    px-3 py-1.5
                    rounded-full
                    bg-card
                    border border-border
                    text-foreground/80
                    font-medium
                  "
                >
                  {step}
                </span>

                {index < 6 && (
                  <ArrowRight className="w-4 h-4 text-muted-foreground" />
                )}

              </div>
            ))}

          </div>

        </div>

        {/* Modules */}
        <div>

          <h2 className="text-xl font-semibold text-foreground mb-5">
            Learning Modules
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">

            {learningModules.map((module) => (

              <Link
                key={module.id}
                href={`/learning/${module.id}`}
                className="group"
              >

                <div
                  className="
                    h-full
                    rounded-2xl
                    border border-border
                    bg-card
                    p-6
                    shadow-sm
                    transition-all duration-200
                    hover:border-primary
                    hover:shadow-md
                    hover:-translate-y-1
                  "
                >

                  {/* Module number */}
                  <div className="flex items-center justify-between mb-6">

                    <div
                      className="
                        w-11 h-11
                        rounded-xl
                        bg-accent
                        border border-primary/30
                        flex items-center justify-center
                      "
                    >
                      <BookOpen className="w-5 h-5 text-primary" />
                    </div>

                    <span className="text-xs font-semibold text-muted-foreground">
                      MODULE {module.moduleNumber}
                    </span>

                  </div>

                  {/* Title */}
                  <h3
                    className="
                      text-xl
                      font-semibold
                      text-foreground
                      mb-3
                      group-hover:text-primary
                      transition
                    "
                  >
                    {module.title}
                  </h3>

                  {/* Description */}
                  <p className="text-sm text-muted-foreground leading-relaxed mb-6">
                    {module.description}
                  </p>

                  {/* Objective */}
                  <div className="mb-6">

                    <p
                      className="
                        text-xs
                        uppercase
                        tracking-wide
                        text-muted-foreground
                        font-semibold
                        mb-2
                      "
                    >
                      Objective
                    </p>

                    <p className="text-sm text-foreground/80 leading-relaxed">
                      {module.objective}
                    </p>

                  </div>

                  {/* Services */}
                  <div className="mb-6">

                    <p
                      className="
                        text-xs
                        uppercase
                        tracking-wide
                        text-muted-foreground
                        font-semibold
                        mb-2
                      "
                    >
                      Services
                    </p>

                    <div className="flex flex-wrap gap-2">

                      {(
                        module.services ||
                        module.sections?.services ||
                        module.sections?.explore?.services ||
                        []
                      ).map((service) => (

                        <span
                          key={
                            service.serviceType ||
                            service.name
                          }
                          className="
                            text-xs
                            px-2.5 py-1
                            rounded-full
                            bg-muted
                            text-foreground/80
                            border border-border
                          "
                        >
                          {service.name || service.serviceType}
                        </span>

                      ))}

                    </div>

                  </div>

                  {/* Learning stages */}
                  <div className="border-t border-border pt-5">

                    <div
                      className="
                        flex
                        flex-wrap
                        gap-x-4
                        gap-y-2
                        text-xs
                        text-muted-foreground
                      "
                    >

                      <span className="flex items-center gap-1 text-foreground/80">

                        <CheckCircle2 className="w-3.5 h-3.5 text-success-foreground" />

                        Learn

                      </span>

                      <span>Explore</span>

                      <span>Build</span>

                      <span>Cost Activity</span>

                      {module.aiActivity && (
                        <span className="text-primary font-medium">
                          Ask ArchBot
                        </span>
                      )}

                      <span>Quick Check</span>

                    </div>

                  </div>

                  {/* CTA */}
                  <div className="mt-6 flex items-center justify-between">

                    <span
                      className="
                        text-sm
                        font-semibold
                        text-primary
                      "
                    >
                      Start Module
                    </span>

                    <ArrowRight
                      className="
                        w-4 h-4
                        text-primary
                        transition-transform
                        group-hover:translate-x-1
                      "
                    />

                  </div>

                </div>

              </Link>

            ))}

          </div>

        </div>

      </div>
    </main>
  );
}