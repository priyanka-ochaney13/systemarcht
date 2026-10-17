'use client';

import Link from 'next/link';
import {
  BookOpen,
  ArrowRight,
  CheckCircle2,
} from 'lucide-react';

import { learningModules } from '@/lib/learningModules';

export default function LearningPage() {
  return (
    <main className="min-h-screen bg-white text-gray-900 px-6 py-10">
      <div className="max-w-6xl mx-auto">

        {/* Header */}
        <div className="mb-10">

          <p className="text-sm text-amber-600 font-semibold mb-2">
            SYSTEMARCHT LEARNING
          </p>

          <h1 className="text-3xl md:text-4xl font-bold text-gray-900 mb-3">
            Learn Cloud Architecture
          </h1>

          <p className="text-gray-600 max-w-2xl leading-relaxed">
            Learn a concept, explore an architecture, build it in the
            Playground, calculate its cost, and use ArchBot to reason about
            your design.
          </p>

        </div>

        {/* Learning Flow */}
        <div className="mb-10 p-5 rounded-xl border border-gray-200 bg-gray-50">

          <h2 className="text-sm font-semibold text-gray-800 mb-4">
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
                    bg-white
                    border border-gray-200
                    text-gray-700
                    font-medium
                  "
                >
                  {step}
                </span>

                {index < 6 && (
                  <ArrowRight className="w-4 h-4 text-gray-400" />
                )}

              </div>
            ))}

          </div>

        </div>

        {/* Modules */}
        <div>

          <h2 className="text-xl font-semibold text-gray-900 mb-5">
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
                    border border-gray-200
                    bg-white
                    p-6
                    shadow-sm
                    transition-all duration-200
                    hover:border-amber-400
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
                        bg-amber-50
                        border border-amber-200
                        flex items-center justify-center
                      "
                    >
                      <BookOpen className="w-5 h-5 text-amber-600" />
                    </div>

                    <span className="text-xs font-semibold text-gray-500">
                      MODULE {module.moduleNumber}
                    </span>

                  </div>

                  {/* Title */}
                  <h3
                    className="
                      text-xl
                      font-semibold
                      text-gray-900
                      mb-3
                      group-hover:text-amber-600
                      transition
                    "
                  >
                    {module.title}
                  </h3>

                  {/* Description */}
                  <p className="text-sm text-gray-600 leading-relaxed mb-6">
                    {module.description}
                  </p>

                  {/* Objective */}
                  <div className="mb-6">

                    <p
                      className="
                        text-xs
                        uppercase
                        tracking-wide
                        text-gray-500
                        font-semibold
                        mb-2
                      "
                    >
                      Objective
                    </p>

                    <p className="text-sm text-gray-700 leading-relaxed">
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
                        text-gray-500
                        font-semibold
                        mb-2
                      "
                    >
                      Services introduced
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
                            bg-gray-100
                            text-gray-700
                            border border-gray-200
                          "
                        >
                          {service.name || service.serviceType}
                        </span>

                      ))}

                    </div>

                  </div>

                  {/* Learning stages */}
                  <div className="border-t border-gray-200 pt-5">

                    <div
                      className="
                        flex
                        flex-wrap
                        gap-x-4
                        gap-y-2
                        text-xs
                        text-gray-500
                      "
                    >

                      <span className="flex items-center gap-1 text-gray-700">

                        <CheckCircle2 className="w-3.5 h-3.5 text-green-600" />

                        Learn

                      </span>

                      <span>Explore</span>

                      <span>Build</span>

                      <span>Cost Activity</span>

                      {module.aiActivity && (
                        <span className="text-amber-600 font-medium">
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
                        text-amber-600
                      "
                    >
                      Start Module
                    </span>

                    <ArrowRight
                      className="
                        w-4 h-4
                        text-amber-600
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