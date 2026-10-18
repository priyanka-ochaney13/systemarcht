'use client';

import Link from 'next/link';
import {
  BookOpen,
  ArrowRight,
  CheckCircle2,
  Circle,
} from 'lucide-react';

import { useLearningStore } from '@/store';
import { SiteHeader } from '@/components/common/SiteHeader';
import { useLearningModules } from '@/hooks/useLearningModules';

export default function LearningPage() {
  const { modules: learningModules, isLoading, error, retry } = useLearningModules();
  const modulesProgress = useLearningStore((state) => state.modules);
  const activeModuleId = useLearningStore((state) => state.activeModuleId);

  const getProgress = (module) => {
    const progress = modulesProgress[module.id] || {};
    const totalActivities = module.aiActivity ? 6 : 5;
    const completedActivities =
      (progress.completedSections || []).length;

    return {
      totalActivities,
      completedActivities: Math.min(completedActivities, totalActivities),
      percent: Math.round(
        (Math.min(completedActivities, totalActivities) / totalActivities) * 100
      ),
      started: Boolean(
        progress.buildStarted ||
          progress.completedSections?.length ||
          progress.quizCompleted
      ),
    };
  };

  const storedActiveModule = learningModules.find(
    (module) => module.id === activeModuleId
  );
  const activeModule =
    (storedActiveModule && getProgress(storedActiveModule).percent < 100
      ? storedActiveModule
      : null) ||
    learningModules.find((module) => getProgress(module).percent < 100) ||
    storedActiveModule ||
    learningModules[0];

  if (isLoading || error || learningModules.length === 0) {
    return (
      <>
        <SiteHeader />
        <main className="min-h-screen bg-white px-6 py-10 text-gray-900">
          <div className="mx-auto max-w-6xl">
            {isLoading ? (
              <p role="status" className="text-sm text-gray-600">
                Loading learning modules...
              </p>
            ) : error ? (
              <section role="alert" className="max-w-xl rounded-xl border border-red-200 bg-red-50 p-5">
                <h1 className="text-lg font-semibold text-red-900">
                  Learning modules are unavailable
                </h1>
                <p className="mt-2 text-sm text-red-800">{error}</p>
                <button
                  type="button"
                  onClick={retry}
                  className="mt-4 rounded-lg bg-gray-900 px-4 py-2 text-sm font-medium text-white hover:bg-gray-700"
                >
                  Try again
                </button>
              </section>
            ) : (
              <section role="status" className="max-w-xl rounded-xl border border-gray-200 p-5">
                <h1 className="text-lg font-semibold">No learning modules found</h1>
                <p className="mt-2 text-sm text-gray-600">
                  Seed the learning modules into the configured MongoDB database, then try again.
                </p>
                <button
                  type="button"
                  onClick={retry}
                  className="mt-4 rounded-lg bg-gray-900 px-4 py-2 text-sm font-medium text-white hover:bg-gray-700"
                >
                  Try again
                </button>
              </section>
            )}
          </div>
        </main>
      </>
    );
  }

  const activeModuleProgress = getProgress(activeModule);

  return (
    <>
      <SiteHeader />
      <main className="min-h-screen bg-white text-gray-900 px-6 py-10">
        <div className="max-w-6xl mx-auto">

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

          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h2 className="text-sm font-semibold text-gray-800">
                {activeModuleProgress.started
                  ? 'Continue your learning journey'
                  : 'Start your learning journey'}
              </h2>
              <p className="mt-1 text-sm text-gray-600">
                {activeModule.title}
              </p>
            </div>
            <Link
              href={`/learning/${activeModule.id}`}
              className="inline-flex items-center justify-center gap-2 rounded-lg bg-amber-500 px-4 py-2.5 text-sm font-semibold text-gray-950 hover:bg-amber-400"
            >
              {activeModuleProgress.started
                ? 'Continue Module'
                : `Start Module ${activeModule.moduleNumber}`}
              <ArrowRight className="h-4 w-4" />
            </Link>
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

                    {(() => {
                      const progress = getProgress(module);
                      return (
                        <div className="mb-4">
                          <div className="mb-2 flex items-center justify-between text-xs">
                            <span className="font-medium text-gray-700">
                              {progress.started ? 'Your progress' : 'Not started'}
                            </span>
                            <span className="text-gray-500">
                              {progress.completedActivities}/{progress.totalActivities} activities · {progress.percent}%
                            </span>
                          </div>
                          <div
                            className="h-1.5 overflow-hidden rounded-full bg-gray-100"
                            role="progressbar"
                            aria-label={`${module.title} progress`}
                            aria-valuenow={progress.percent}
                            aria-valuemin={0}
                            aria-valuemax={100}
                          >
                            <div
                              className="h-full rounded-full bg-amber-500 transition-all"
                              style={{ width: `${progress.percent}%` }}
                            />
                          </div>
                        </div>
                      );
                    })()}

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

                      {[
                        ['learn', 'Learn'],
                        ['explore', 'Explore'],
                        ['build', 'Build'],
                        ['cost', 'Cost Activity'],
                        ...(module.aiActivity ? [['ai-assist', 'Ask ArchBot']] : []),
                        ['quiz', 'Quick Check'],
                      ].map(([stepId, step]) => (
                        <span key={step} className="flex items-center gap-1 text-gray-600">
                          {(modulesProgress[module.id]?.completedSections || []).includes(stepId) ? (
                            <CheckCircle2 className="h-3.5 w-3.5 text-green-600" />
                          ) : (
                            <Circle className="h-3.5 w-3.5 text-gray-300" />
                          )}
                          {step}
                        </span>
                      ))}

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
                      {getProgress(module).started ? 'Continue Module' : 'Start Module'}
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
    </>
  );
}