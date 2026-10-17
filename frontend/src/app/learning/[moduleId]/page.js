'use client';

import React, { useEffect, useMemo } from 'react';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';

import {
  ArrowLeft,
  ArrowRight,
  BookOpen,
  CheckCircle2,
  Circle,
  ExternalLink,
  Lightbulb,
  Play,
  Calculator,
  Bot,
} from 'lucide-react';

import { learningModules } from '@/lib/learningModules';
import { useLearningStore } from '@/store';
import { SiteHeader } from '@/components/common/SiteHeader';

const EMPTY_QUIZ_ANSWERS = {};
const EMPTY_MODULE_PROGRESS = {};

export default function LearningModulePage() {
  const params = useParams();
  const router = useRouter();

  const moduleId = params?.moduleId;

  const module = useMemo(
    () => learningModules.find((item) => item.id === moduleId),
    [moduleId]
  );

  const progress = useLearningStore(
    (state) => state.modules[moduleId] || EMPTY_MODULE_PROGRESS
  );
  const completeModuleSection = useLearningStore(
    (state) => state.completeModuleSection
  );
  const startModule = useLearningStore((state) => state.startModule);

  useEffect(() => {
    if (module?.id) {
      startModule(module.id);
    }
  }, [module?.id, startModule]);

  if (!module) {
    return (
      <main className="min-h-screen bg-background text-foreground px-6 py-10">
        <div className="max-w-4xl mx-auto">

          <h1 className="text-2xl font-bold mb-3">
            Module not found
          </h1>

          <p className="text-muted-foreground mb-6">
            The requested learning module does not exist.
          </p>

          <Link
            href="/learning"
            className="
              inline-flex
              items-center
              gap-2
              text-primary
              hover:text-primary
            "
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Learning
          </Link>

        </div>
      </main>
    );
  }

  const markComplete = (sectionId) => {
    completeModuleSection(module.id, sectionId);
  };

  const isComplete = (sectionId) =>
    (progress.completedSections || []).includes(sectionId);

  const services = module.services || [];
  const sectionLinks = [
    ['scenario', 'Scenario'],
    ['learn', 'Learn'],
    ['explore', 'Explore'],
    ['build', 'Build'],
    ['cost-activity', 'Cost'],
    ...(module.aiActivity ? [['ai-assist', 'AI Assist']] : []),
    ['quick-check', 'Quick Check'],
  ];
  const completedCount = (progress.completedSections || []).length;
  const totalSections = sectionLinks.length - 1;
  const moduleComplete = completedCount >= totalSections;
  const nextModule = learningModules.find(
    (item) => item.moduleNumber === module.moduleNumber + 1
  );
  const progressPercent = Math.round(
    (Math.min(completedCount, totalSections) / totalSections) * 100
  );

  return (
    <>
      <SiteHeader />
      <main className="min-h-screen bg-white text-gray-900">

      <div className="max-w-5xl mx-auto px-6 py-10">

        {/* Back */}
        <Link
          href="/learning"
          className="
            inline-flex
            items-center
            gap-2
            text-sm
            text-muted-foreground
            hover:text-foreground
            mb-8
            transition
          "
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Learning Modules
        </Link>

        {/* =========================================================
            HEADER
        ========================================================= */}

        <section className="mb-10 scroll-mt-28" id="module-overview">

          <div className="flex items-start justify-between gap-6">

            <div>

              <p className="text-sm text-primary font-medium mb-2">
                MODULE {module.moduleNumber}
              </p>

              <h1 className="text-3xl md:text-4xl font-bold mb-4 text-foreground">
                {module.title}
              </h1>

              <p className="text-muted-foreground max-w-3xl leading-relaxed">
                {module.description}
              </p>

            </div>

            <div
              className="
                hidden
                md:flex
                w-12
                h-12
                rounded-xl
                bg-accent
                border border-primary/30
                items-center
                justify-center
                flex-shrink-0
              "
            >
              <BookOpen className="w-5 h-5 text-primary" />
            </div>

          </div>

          {/* Objective */}

          <div
            className="
              mt-6
              rounded-xl
              border border-border
              bg-muted/50
              p-5
            "
          >
            <p className="text-xs uppercase tracking-wide text-muted-foreground mb-2">
              Learning Objective
            </p>

            <p className="text-sm text-foreground/80 leading-relaxed">
              {module.objective}
            </p>
          </div>

        </section>

        {/* =========================================================
            PROGRESS
        ========================================================= */}

        <nav
          aria-label="Module sections"
          className="sticky top-[57px] z-30 -mx-6 mb-8 border-y border-gray-200 bg-white/95 px-6 py-3 backdrop-blur"
        >
          <div className="mx-auto flex max-w-5xl items-center gap-2 overflow-x-auto">
            {sectionLinks.slice(1).map(([sectionId, label]) => (
              <a
                key={sectionId}
                href={`#${sectionId}`}
                className="flex-shrink-0 rounded-full border border-gray-200 px-3 py-1.5 text-xs font-medium text-gray-600 hover:border-amber-300 hover:bg-amber-50 hover:text-amber-800"
              >
                {label}
              </a>
            ))}
          </div>
        </nav>

        <section
          className="
            mb-10
            rounded-xl
            border border-border
            bg-muted/50
            p-4
          "
        >

          <div className="flex items-center justify-between mb-3">

            <span className="text-sm font-medium text-foreground/80">
              Module Progress
            </span>

            <span className="text-xs text-gray-500">
              {completedCount} of {totalSections} activities · {progressPercent}%
            </span>

          </div>

          <div className="h-2 rounded-full bg-border overflow-hidden">

            <div
              className="h-full bg-primary transition-all duration-300"
              style={{
                width: `${progressPercent}%`,
              }}
            />

          </div>

        </section>

        {/* =========================================================
            SCENARIO
        ========================================================= */}

        <section className="mb-10 scroll-mt-28" id="scenario">

          <SectionHeading
            number="01"
            label="SCENARIO"
            title={module.scenario.title}
          />

          <div
            className="
              rounded-2xl
              border border-border
              bg-card
              shadow-sm
              p-6
            "
          >

            <p className="text-foreground/80 leading-relaxed mb-6">
              {module.scenario.description}
            </p>

            <div>

              <p className="text-xs uppercase tracking-wide text-muted-foreground mb-3">
                Requirements
              </p>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">

                {module.scenario.requirements.map((requirement) => (

                  <div
                    key={requirement}
                    className="flex items-start gap-2.5 text-sm text-muted-foreground"
                  >
                    <CheckCircle2
                      className="
                        w-4 h-4
                        text-emerald-600
                        mt-0.5
                        flex-shrink-0
                      "
                    />

                    <span>{requirement}</span>
                  </div>

                ))}

              </div>

            </div>

          </div>

        </section>

        {/* =========================================================
            LEARN
        ========================================================= */}

        <section className="mb-10 scroll-mt-28" id="learn">

          <SectionHeading
            number="02"
            label="LEARN"
            title="Build your cloud architecture knowledge"
          />

          <div className="space-y-4">

            {module.lessons.map((lesson, index) => (

              <article
                key={lesson.id}
                className="
                  rounded-2xl
                  border border-border
                  bg-card
                  shadow-sm
                  p-6
                "
              >

                <div className="flex items-start gap-4">

                  <div
                    className="
                      w-8
                      h-8
                      rounded-lg
                      bg-accent
                      border border-primary/30
                      flex items-center
                      justify-center
                      text-xs
                      font-semibold
                      text-primary
                      flex-shrink-0
                    "
                  >
                    {index + 1}
                  </div>

                  <div className="flex-1">

                    <h3 className="text-lg font-semibold mb-3 text-foreground">
                      {lesson.title}
                    </h3>

                    <p className="text-sm text-muted-foreground leading-relaxed">
                      {lesson.content}
                    </p>

                    {/* Table */}

                    {lesson.table && (
                      <div className="mt-5 overflow-hidden rounded-lg border border-border">

                        <table className="w-full text-sm">

                          <thead className="bg-muted/50">

                            <tr>

                              <th className="text-left px-4 py-3 text-foreground/80">
                                Resource
                              </th>

                              <th className="text-left px-4 py-3 text-foreground/80">
                                Purpose
                              </th>

                            </tr>

                          </thead>

                          <tbody>

                            {lesson.table.map((row) => (

                              <tr
                                key={row.resource}
                                className="border-t border-border"
                              >

                                <td className="px-4 py-3 text-foreground/80">
                                  {row.resource}
                                </td>

                                <td className="px-4 py-3 text-muted-foreground">
                                  {row.purpose}
                                </td>

                              </tr>

                            ))}

                          </tbody>

                        </table>

                      </div>
                    )}

                    {/* Points */}

                    {lesson.points && (
                      <div className="mt-5 grid gap-3">

                        {lesson.points.map((point) => (

                          <div
                            key={point.term}
                            className="
                              rounded-lg
                              bg-muted/50
                              border border-border
                              p-4
                            "
                          >

                            <p className="text-sm font-semibold text-foreground mb-1">
                              {point.term}
                            </p>

                            <p className="text-sm text-muted-foreground">
                              {point.description}
                            </p>

                          </div>

                        ))}

                      </div>
                    )}

                  </div>

                </div>

              </article>

            ))}

          </div>

          <CompleteButton
            completed={isComplete('learn')}
            onClick={() => markComplete('learn')}
          >
            Mark Learn Section Complete
          </CompleteButton>

        </section>

        {/* =========================================================
            EXPLORE
        ========================================================= */}

        <section className="mb-10 scroll-mt-28" id="explore">

          <SectionHeading
            number="03"
            label="EXPLORE"
            title={module.exploreActivity.title}
          />

          <div
            className="
              rounded-2xl
              border border-border
              bg-card
              shadow-sm
              p-6
            "
          >

            {/* Single chain (Modules 1 and 2) */}

            {!module.exploreActivity.comparisons &&
              module.exploreActivity.architecture && (
                <div className="mb-8">
                  <ArchitectureFlow
                    paths={[module.exploreActivity.architecture]}
                  />
                </div>
              )}

            {/* Comparisons (Modules 3 and later) */}

            {module.exploreActivity.comparisons && (
              <div className="space-y-6 mb-8">
                {module.exploreActivity.comparisons.map((item) => (
                  <div
                    key={item.title}
                    className="rounded-xl border border-gray-200 bg-gray-50 p-5"
                  >
                    <p className="text-sm font-semibold text-gray-800 mb-4">
                      {item.title}
                    </p>

                    <ArchitectureFlow paths={item.paths} />

                    {item.note && (
                      <p className="mt-4 text-sm text-gray-600 leading-relaxed">
                        {item.note}
                      </p>
                    )}
                  </div>
                ))}
              </div>
            )}

            {/* Trade-offs */}

            {module.exploreActivity.tradeoffs && (
              <div className="grid gap-3 mb-8">
                {module.exploreActivity.tradeoffs.map((point) => (
                  <div
                    key={point.term}
                    className="rounded-lg bg-gray-50 border border-gray-200 p-4"
                  >
                    <p className="text-sm font-semibold text-gray-800 mb-1">
                      {point.term}
                    </p>
                    <p className="text-sm text-gray-600">
                      {point.description}
                    </p>
                  </div>
                ))}
              </div>
            )}

            {/* Service information */}

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">

              {services.map((service) => (

                <div
                  key={service.id}
                  className="
                    rounded-xl
                    border border-border
                    bg-muted/50
                    p-4
                  "
                >

                  <h3 className="font-semibold text-foreground mb-2">
                    {service.name}
                  </h3>

                  <p className="text-sm text-muted-foreground">
                    {service.description}
                  </p>

                </div>

              ))}

            </div>

            {/* Explanation */}

            {module.exploreActivity.explanation && (
              <div className="space-y-3">

                {module.exploreActivity.explanation.map(
                  (item, index) => (

                    <div
                      key={index}
                      className="flex items-start gap-3"
                    >

                      <div
                        className="
                          mt-1
                          w-5
                          h-5
                          rounded-full
                          bg-accent
                          border border-primary/30
                          flex items-center
                          justify-center
                          flex-shrink-0
                        "
                      >
                        <span className="text-[10px] text-primary">
                          {index + 1}
                        </span>
                      </div>

                      <p className="text-sm text-muted-foreground leading-relaxed">
                        {item}
                      </p>

                    </div>

                  )
                )}

              </div>
            )}

            {/* Module 2 flow */}

            {module.exploreActivity.flow && (
              <div className="space-y-3">

                {module.exploreActivity.flow.map(
                  (item, index) => (

                    <div
                      key={index}
                      className="flex items-start gap-3"
                    >

                      <div
                        className="
                          mt-1
                          w-5
                          h-5
                          rounded-full
                          bg-accent
                          border border-primary/30
                          flex items-center
                          justify-center
                          flex-shrink-0
                        "
                      >
                        <span className="text-[10px] text-primary">
                          {index + 1}
                        </span>
                      </div>

                      <p className="text-sm text-muted-foreground">
                        {item}
                      </p>

                    </div>

                  )
                )}

              </div>
            )}

          </div>

          <CompleteButton
            completed={isComplete('explore')}
            onClick={() => markComplete('explore')}
          >
            Mark Explore Section Complete
          </CompleteButton>

        </section>

        {/* =========================================================
            BUILD
        ========================================================= */}

        <section className="mb-10 scroll-mt-28" id="build">

          <SectionHeading
            number="04"
            label="BUILD"
            title={module.buildActivity.title}
          />

          <div
            className="
              rounded-2xl
              border border-primary/30
              bg-accent
              p-6
            "
          >

            <div className="flex items-start gap-4 mb-6">

              <div
                className="
                  w-10
                  h-10
                  rounded-xl
                  bg-card
                  border border-primary/30
                  flex items-center
                  justify-center
                  flex-shrink-0
                "
              >
                <Play className="w-5 h-5 text-primary" />
              </div>

              <div>

                <h3 className="font-semibold text-foreground mb-2">
                  Build this architecture yourself
                </h3>

                <p className="text-sm text-muted-foreground leading-relaxed">
                  Open the SystemArcht Playground and construct the
                  architecture you just explored.
                </p>

              </div>

            </div>

            {module.buildActivity.requiredServices.length > 0 && (
              <div className="mb-6">
                <p className="text-xs uppercase tracking-wide text-gray-500 mb-3">
                  Required Services
                </p>

                <div className="flex flex-wrap gap-2">
                  {module.buildActivity.requiredServices.map((service) => (
                    <span
                      key={service}
                      className="
                        px-3
                        py-1.5
                        rounded-full
                        bg-card
                        border border-border
                        text-xs
                        text-foreground/80
                      "
                    >
                      {service}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {module.buildActivity.minServiceCounts && (
              <div className="mb-6">
                <p className="text-xs uppercase tracking-wide text-gray-500 mb-3">
                  Minimum Instances
                </p>

                <div className="flex flex-wrap gap-2">
                  {Object.entries(module.buildActivity.minServiceCounts).map(
                    ([service, count]) => (
                      <span
                        key={service}
                        className="px-3 py-1.5 rounded-full bg-white border border-gray-200 text-xs text-gray-700"
                      >
                        At least {count} × {service}
                      </span>
                    )
                  )}
                </div>
              </div>
            )}

            {module.buildActivity.requiredConnections.length > 0 && (
              <div className="mb-6">
                <p className="text-xs uppercase tracking-wide text-gray-500 mb-3">
                  Required Connections
                </p>

                <div className="space-y-2">
                  {module.buildActivity.requiredConnections.map(
                    (connection, index) => (
                      <div
                        key={index}
                        className="flex items-center gap-3 text-sm"
                      >
                        <span className="px-3 py-1.5 rounded-lg bg-card border border-border text-foreground/80">
                          {connection.source}
                        </span>

                        <ArrowRight className="w-4 h-4 text-primary" />

                        <span className="px-3 py-1.5 rounded-lg bg-card border border-border text-foreground/80">
                          {connection.target}
                        </span>
                      </div>
                    )
                  )}
                </div>
              </div>
            )}

            {module.buildActivity.rules && (
              <div className="mb-6">
                <p className="text-xs uppercase tracking-wide text-gray-500 mb-3">
                  Design Requirements
                </p>

                <ul className="space-y-2 text-sm text-gray-700 list-disc pl-5">
                  {module.buildActivity.rules.map((rule) => (
                    <li key={rule.id}>{rule.label}</li>
                  ))}
                </ul>

                {module.buildActivity.monthlyBudgetUSD && (
                  <p className="mt-3 text-sm text-gray-600">
                    Monthly budget: $
                    {module.buildActivity.monthlyBudgetUSD.toLocaleString('en-US')}
                  </p>
                )}
              </div>
            )}

            {/* IMPORTANT: module context passed to Playground */}

            <button
              onClick={() =>
                router.push(
                  `/playground?module=${module.id}`
                )
              }
              className="
                inline-flex
                items-center
                gap-2
                px-5
                py-3
                rounded-xl
                bg-primary
                hover:bg-primary/90
                text-primary-foreground
                font-semibold
                text-sm
                transition
              "
            >
              {module.buildActivity.buttonText}
              <ExternalLink className="w-4 h-4" />
            </button>

            <p className="mt-3 text-xs text-muted-foreground">
              Your Playground will open with this module context.
            </p>

          </div>

          <CompleteButton
            completed={isComplete('build')}
            onClick={() => markComplete('build')}
          >
            Mark Build Section Complete
          </CompleteButton>

        </section>

        {/* =========================================================
            COST CHALLENGE
        ========================================================= */}

        <section className="mb-10 scroll-mt-28" id="cost-activity">

          <SectionHeading
            number="05"
            label="COST ACTIVITY"
            title={module.costChallenge.title}
          />

          <div
            className="
              rounded-2xl
              border border-border
              bg-card
              shadow-sm
              p-6
            "
          >

            <div className="flex items-start gap-4 mb-6">

              <div
                className="
                  w-10
                  h-10
                  rounded-xl
                  bg-muted/50
                  border border-border
                  flex items-center
                  justify-center
                "
              >
                <Calculator className="w-5 h-5 text-primary" />
              </div>

              <div>

                <h3 className="font-semibold text-foreground mb-2">
                  Explore how usage affects cost
                </h3>

                <p className="text-sm text-muted-foreground leading-relaxed">
                  {module.costChallenge.description}
                </p>

              </div>

            </div>

            {/* Module 1 usage */}

            {module.costChallenge.usage && (
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">

                <UsageCard
                  label="Storage"
                  value={`${module.costChallenge.usage.storageGB.toLocaleString('en-US')} GB`}
                />

                <UsageCard
                  label="Monthly Data Transfer"
                  value={`${module.costChallenge.usage.monthlyDataTransferGB} GB`}
                />

                <UsageCard
                  label="Monthly Requests"
                  value={module.costChallenge.usage.requestsPerMonth.toLocaleString('en-US')}
                />

              </div>
            )}

            {/* Module 2 scenarios */}

            {module.costChallenge.scenarios && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">

                {module.costChallenge.scenarios.map(
                  (scenario) => (

                    <div
                      key={scenario.name}
                      className="
                        rounded-xl
                        border border-border
                        bg-muted/50
                        p-5
                      "
                    >

                      <p className="font-semibold text-foreground mb-2">
                        {scenario.name}
                      </p>

                      <p className="text-sm text-muted-foreground">
                        {scenario.description}
                      </p>

                    </div>

                  )
                )}

              </div>
            )}

            {module.costChallenge.steps && (
              <ol className="space-y-3">
                {module.costChallenge.steps.map((step, index) => (
                  <li
                    key={index}
                    className="flex items-start gap-3 text-sm text-gray-600 leading-relaxed"
                  >
                    <span className="mt-0.5 w-5 h-5 rounded-full bg-amber-50 border border-amber-200 flex items-center justify-center text-[10px] text-amber-600 flex-shrink-0">
                      {index + 1}
                    </span>
                    <span>{step}</span>
                  </li>
                ))}
              </ol>
            )}

            {module.costChallenge.question && (
              <div className="mt-5 rounded-xl border border-gray-200 bg-gray-50 p-4">
                <p className="text-xs uppercase tracking-wide text-gray-500 mb-1">
                  Think about it
                </p>
                <p className="text-sm text-gray-800">
                  {module.costChallenge.question}
                </p>
              </div>
            )}

            <div
              className="
                mt-6
                p-4
                rounded-xl
                bg-accent
                border border-primary/30
              "
            >

              <p className="text-sm text-foreground/80">

                <span className="font-semibold text-primary">
                  Activity:
                </span>{' '}

                Change the workload in the Playground and
                recalculate the estimated cost. Compare the result
                with your original architecture.

              </p>

            </div>

          </div>

          <CompleteButton
            completed={isComplete('cost')}
            onClick={() => markComplete('cost')}
          >
            Mark Cost Activity Complete
          </CompleteButton>

        </section>

        {/* =========================================================
            AI ACTIVITY
        ========================================================= */}

        {module.aiActivity && (
          <section className="mb-10 scroll-mt-28" id="ai-assist">

            <SectionHeading
              number="06"
              label="AI ASSIST"
              title={module.aiActivity.title}
            />

            <div
              className="
                rounded-2xl
                border border-primary/30
                bg-accent
                p-6
              "
            >

              <div className="flex items-start gap-4 mb-6">

                <div
                  className="
                    w-10
                    h-10
                    rounded-xl
                    bg-card
                    border border-primary/30
                    flex items-center
                    justify-center
                  "
                >
                  <Bot className="w-5 h-5 text-primary" />
                </div>

                <div>

                  <h3 className="font-semibold text-foreground mb-2">
                    Ask ArchBot
                  </h3>

                  <p className="text-sm text-muted-foreground leading-relaxed">
                    Use ArchBot as a learning assistant. The AI can
                    explain architectural choices and suggest
                    alternatives, while SystemArcht remains responsible
                    for deterministic cost and architecture validation.
                  </p>

                </div>

              </div>

              <div
                className="
                  rounded-xl
                  border border-border
                  bg-card
                  p-5
                  mb-5
                "
              >

                <p className="text-xs uppercase tracking-wide text-muted-foreground mb-2">
                  Suggested Question
                </p>

                <p className="text-sm text-gray-800 leading-relaxed">
                  &quot;{module.aiActivity.prompt}&quot;
                </p>

              </div>

              {module.aiActivity.studentTask && (
                <p className="mb-5 text-sm text-gray-600 leading-relaxed">
                  <span className="font-semibold text-amber-700">
                    Your task:
                  </span>{' '}
                  {module.aiActivity.studentTask}
                </p>
              )}

              <Link
                href="/chatbot"
                className="
                  inline-flex
                  items-center
                  gap-2
                  px-5
                  py-3
                  rounded-xl
                  bg-primary
                  hover:bg-primary/90
                  text-primary-foreground
                  font-semibold
                  text-sm
                  transition
                "
              >
                Ask ArchBot
                <Bot className="w-4 h-4" />
              </Link>

              {module.aiActivity.compareWithStudentArchitecture && (
                <div className="mt-5 flex items-start gap-2 text-xs text-muted-foreground">

                  <Lightbulb className="w-4 h-4 text-primary flex-shrink-0" />

                  <p>
                    Compare ArchBot&apos;s recommendation with your own
                    architecture. Do not automatically accept the AI
                    recommendation.
                  </p>

                </div>
              )}

            </div>

            <CompleteButton
              completed={isComplete('ai-assist')}
              onClick={() => markComplete('ai-assist')}
            >
              Mark AI Assist Complete
            </CompleteButton>

          </section>
        )}

        {/* =========================================================
            QUICK CHECK
        ========================================================= */}

        <section className="mb-10 scroll-mt-28" id="quick-check">

          <SectionHeading
            number={module.aiActivity ? '07' : '06'}
            label="QUICK CHECK"
            title="Test what you learned"
          />

          <Quiz
            questions={module.quiz}
            moduleId={module.id}
          />

        </section>

        {/* =========================================================
            MODULE COMPLETE
        ========================================================= */}

        <section
          className="
            rounded-2xl
            border border-border
            bg-muted/50
            p-6
            text-center
          "
        >

          <CheckCircle2
            className="
              w-10
              h-10
              text-emerald-600
              mx-auto
              mb-4
            "
          />

          <h2 className="text-xl font-semibold mb-2">
            {moduleComplete
              ? 'Module complete!'
              : `Module ${module.moduleNumber}`}
          </h2>

          <p className="text-sm text-gray-600 mb-6">
            {moduleComplete
              ? 'Great work. Your progress is saved and you can continue to the next module.'
              : 'Complete the learning activities and quick check to finish this module.'}
          </p>

          <div className="flex flex-wrap items-center justify-center gap-4">
            {moduleComplete && nextModule && (
              <Link
                href={`/learning/${nextModule.id}`}
                className="inline-flex items-center gap-2 rounded-xl bg-amber-500 px-5 py-3 text-sm font-semibold text-gray-950 hover:bg-amber-400"
              >
                Continue to Module {nextModule.moduleNumber}
                <ArrowRight className="h-4 w-4" />
              </Link>
            )}
            <Link
              href="/learning"
              className="inline-flex items-center gap-2 text-sm text-amber-600 hover:text-amber-700"
            >
              Back to all modules
              <ArrowRight className="h-4 w-4" />
            </Link>
          </div>

        </section>

      </div>
      </main>
    </>
  );
}

/* ===============================================================
   Supporting Components
=============================================================== */

function SectionHeading({ number, label, title }) {
  return (
    <div className="mb-5">

      <div className="flex items-center gap-3 mb-2">

        <span className="text-xs font-mono text-primary">
          {number}
        </span>

        <span className="text-xs uppercase tracking-widest text-muted-foreground">
          {label}
        </span>

      </div>

      <h2 className="text-2xl font-semibold text-foreground">
        {title}
      </h2>

    </div>
  );
}

function CompleteButton({ completed, onClick, children }) {
  return (
    <button
      onClick={onClick}
      disabled={completed}
      className={`
        mt-4
        inline-flex
        items-center
        gap-2
        text-xs
        px-3
        py-2
        rounded-lg
        border
        transition

        ${
          completed
            ? 'border-emerald-200 bg-emerald-50 text-emerald-700'
            : 'border-border bg-card text-muted-foreground hover:text-foreground hover:border-input'
        }
      `}
    >

      {completed ? (
        <CheckCircle2 className="w-3.5 h-3.5" />
      ) : (
        <Circle className="w-3.5 h-3.5" />
      )}

      {completed ? 'Completed' : children}

    </button>
  );
}

function UsageCard({ label, value }) {
  return (
    <div
      className="
        rounded-xl
        border border-border
        bg-muted/50
        p-5
      "
    >

      <p className="text-xs uppercase tracking-wide text-muted-foreground mb-2">
        {label}
      </p>

      <p className="text-xl font-semibold text-foreground">
        {value}
      </p>

    </div>
  );
}

function Quiz({ questions, moduleId }) {
  const answers = useLearningStore(
    (state) =>
      state.modules[moduleId]?.quizAnswers || EMPTY_QUIZ_ANSWERS
  );
  const submitted = useLearningStore(
    (state) => Boolean(state.modules[moduleId]?.quizCompleted)
  );
  const updateQuizAnswer = useLearningStore(
    (state) => state.updateQuizAnswer
  );
  const updateModuleProgress = useLearningStore(
    (state) => state.updateModuleProgress
  );
  const completeModuleSection = useLearningStore(
    (state) => state.completeModuleSection
  );

  const score = questions.reduce(
    (total, question) =>
      total + (answers[question.id] === question.answer ? 1 : 0),
    0
  );

  return (
    <div className="space-y-5">

      {questions.map((question, index) => (

        <div
          key={question.id}
          className="
            rounded-2xl
            border border-border
            bg-card
            shadow-sm
            p-6
          "
        >

          <p className="text-sm font-semibold text-foreground mb-4">
            {index + 1}. {question.question}
          </p>

          <div className="space-y-2">

            {question.options.map((option) => {

              const selected =
                answers[question.id] === option;

              const correct =
                submitted && option === question.answer;

              return (
                <button
                  key={option}
                  onClick={() =>
                    !submitted &&
                    updateQuizAnswer(moduleId, question.id, option)
                  }
                  disabled={submitted}
                  className={`
                    w-full
                    text-left
                    px-4
                    py-3
                    rounded-xl
                    border
                    text-sm
                    transition

                    ${
                      correct
                        ? 'border-emerald-300 bg-emerald-50 text-emerald-700'
                        : selected
                          ? 'border-amber-300 bg-accent text-primary'
                          : 'border-border bg-muted/50 text-muted-foreground hover:border-input hover:text-foreground'
                    }
                  `}
                >
                  {option}
                </button>
              );

            })}

          </div>

          {submitted && (

            <div
              className="
                mt-4
                p-4
                rounded-xl
                bg-muted/50
                border border-border
              "
            >

              <p className="text-sm text-foreground/80 mb-1">

                <span className="font-semibold">
                  Answer:
                </span>{' '}

                {question.answer}

              </p>

              <p className="text-sm text-muted-foreground">
                {question.explanation}
              </p>

            </div>

          )}

        </div>

      ))}

      {!submitted ? (

        <button
          onClick={() => {
            updateModuleProgress(moduleId, { quizCompleted: true });
            completeModuleSection(moduleId, 'quiz');
          }}
          disabled={
            Object.keys(answers).length !== questions.length
          }
          className="
            px-5
            py-3
            rounded-xl
            bg-primary
            hover:bg-primary/90
            text-primary-foreground
            font-semibold
            text-sm
            disabled:opacity-40
            disabled:cursor-not-allowed
            transition
          "
        >
          Submit Quick Check
        </button>

      ) : (

        <div
          className="
            rounded-xl
            border border-border
            bg-muted/50
            p-5
          "
        >

          <p className="text-lg font-semibold text-foreground mb-1">
            Score: {score} / {questions.length}
          </p>

          <p className="text-sm text-muted-foreground">
            Review the explanations above and then continue
            exploring the architecture.
          </p>

        </div>

      )}

    </div>
  );
}

function ArchitectureFlow({ paths }) {
  return (
    <div className="space-y-3">
      {paths.map((path, pathIndex) => (
        <div
          key={pathIndex}
          className="flex flex-wrap items-center gap-3"
        >
          {path.map((service, index) => (
            <React.Fragment key={`${service}-${index}`}>
              <div className="px-4 py-3 rounded-xl border border-gray-200 bg-white text-sm font-medium text-gray-800">
                {service}
              </div>

              {index < path.length - 1 && (
                <ArrowRight className="w-4 h-4 text-amber-500" />
              )}
            </React.Fragment>
          ))}
        </div>
      ))}
    </div>
  );
}
