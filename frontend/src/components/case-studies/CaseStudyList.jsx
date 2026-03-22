import React from 'react';
import Link from 'next/link';
import { CASE_STUDIES } from '@/lib/constants';
import { ArrowRight, Zap } from 'lucide-react';

export const CaseStudyList = () => {
  return (
    <div className="min-h-screen bg-white">
      {/* Header */}
      <div className="bg-gradient-to-r from-gray-900 to-gray-800 text-white py-16 px-4">
        <div className="max-w-6xl mx-auto">
          <h1 className="text-4xl font-bold mb-4">System Design Case Studies</h1>
          <p className="text-xl text-gray-300">
            Learn real-world cloud architectures with interactive simulations
          </p>
        </div>
      </div>

      {/* Case Studies Grid */}
      <div className="max-w-6xl mx-auto py-12 px-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {CASE_STUDIES.map((caseStudy) => (
            <Link key={caseStudy.id} href={`/case-studies/${caseStudy.id}`}>
              <div className="h-full bg-white border border-gray-200 rounded-lg shadow-md hover:shadow-xl transition-all duration-300 cursor-pointer p-6 group">
                {/* Pattern Badge */}
                <div className="flex items-center gap-2 mb-3">
                  <Zap className="w-4 h-4" style={{ color: '#FF9900' }} />
                  <span className="text-xs font-semibold text-yellow-600 bg-yellow-50 px-3 py-1 rounded-full">
                    {caseStudy.pattern}
                  </span>
                </div>

                {/* Title */}
                <h2 className="text-xl font-bold text-gray-900 mb-2 group-hover:text-yellow-600 transition">
                  {caseStudy.title}
                </h2>

                {/* Description */}
                <p className="text-gray-600 text-sm mb-4 line-clamp-2">
                  {caseStudy.description}
                </p>

                {/* Scale */}
                <div className="mb-4 pb-4 border-b border-gray-200">
                  <p className="text-xs text-gray-500 font-semibold mb-1">SCALE</p>
                  <p className="text-sm text-gray-700">{caseStudy.scale}</p>
                </div>

                {/* Key Insight */}
                <p className="text-xs text-gray-600 italic mb-4">
                  💡 <span className="font-semibold">{caseStudy.keyInsight}</span>
                </p>

                {/* Cost & CTA */}
                <div className="flex items-center justify-between">
                  <span className="text-sm font-bold text-gray-900">
                    Estimated: <span className="text-yellow-600">{caseStudy.cost}</span>
                  </span>
                  <ArrowRight className="w-5 h-5 text-yellow-600 group-hover:translate-x-1 transition" />
                </div>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
};
