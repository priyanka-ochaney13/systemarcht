'use client';

import React, { useState } from 'react';
import { ChevronDown, ChevronRight } from 'lucide-react';
import { SERVICE_GUIDES, CONNECTION_PATTERNS, CASE_STUDY_DATA_FLOWS } from '@/lib/service-guides';

export const ServiceGuidePanel = ({ caseStudyId, selectedServices }) => {
  const [expandedSections, setExpandedSections] = useState({
    services: true,
    dataFlow: true,
    connections: false,
  });

  const [expandedService, setExpandedService] = useState(null);

  const caseStudyFlow = CASE_STUDY_DATA_FLOWS[caseStudyId];

  const toggleSection = (section) => {
    setExpandedSections((prev) => ({
      ...prev,
      [section]: !prev[section],
    }));
  };

  const toggleService = (serviceId) => {
    setExpandedService(expandedService === serviceId ? null : serviceId);
  };

  return (
    <div className="w-full h-full bg-white border-l border-gray-200 overflow-y-auto">
      {/* Header */}
      <div className="sticky top-0 bg-gradient-to-r from-yellow-50 to-white border-b border-gray-200 p-4">
        <h2 className="text-lg font-bold text-gray-900">Service Guide</h2>
        <p className="text-xs text-gray-500 mt-1">Specifications & Data Flow</p>
      </div>

      <div className="p-4 space-y-4">
        {/* Case Study Overview */}
        {caseStudyFlow && (
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
            <p className="text-sm font-semibold text-blue-900">{caseStudyFlow.name}</p>
            <p className="text-xs text-blue-700 mt-1">{caseStudyFlow.overview}</p>
          </div>
        )}

        {/* Services Section */}
        <div className="border border-gray-200 rounded-lg overflow-hidden">
          <button
            onClick={() => toggleSection('services')}
            className="w-full bg-gray-100 hover:bg-gray-200 px-4 py-3 flex items-center justify-between transition"
          >
            <span className="font-semibold text-gray-900 text-sm">Services & Specifications</span>
            {expandedSections.services ? (
              <ChevronDown className="w-4 h-4" />
            ) : (
              <ChevronRight className="w-4 h-4" />
            )}
          </button>

          {expandedSections.services && (
            <div className="divide-y divide-gray-200">
              {selectedServices && selectedServices.length > 0 ? (
                selectedServices.map((serviceId) => {
                  const guide = SERVICE_GUIDES[serviceId];
                  if (!guide) return null;

                  const isExpanded = expandedService === serviceId;

                  return (
                    <div key={serviceId}>
                      <button
                        onClick={() => toggleService(serviceId)}
                        className="w-full p-3 hover:bg-yellow-50 transition text-left flex items-center justify-between"
                      >
                        <div className="flex-1">
                          <p className="font-semibold text-gray-900 text-sm">{guide.name}</p>
                          <p className="text-xs text-gray-600 line-clamp-1">{guide.description}</p>
                        </div>
                        {isExpanded ? (
                          <ChevronDown className="w-4 h-4 ml-2 flex-shrink-0" />
                        ) : (
                          <ChevronRight className="w-4 h-4 ml-2 flex-shrink-0" />
                        )}
                      </button>

                      {isExpanded && (
                        <div className="bg-gray-50 p-3 border-t border-gray-200 space-y-3 text-xs">
                          {/* Key Features */}
                          <div>
                            <p className="font-semibold text-gray-900 mb-1">Key Features:</p>
                            <ul className="space-y-1">
                              {guide.keyFeatures.slice(0, 4).map((feature, idx) => (
                                <li key={idx} className="text-gray-700 flex gap-2">
                                  <span className="text-yellow-600 font-bold">•</span>
                                  <span>{feature}</span>
                                </li>
                              ))}
                            </ul>
                          </div>

                          {/* Specifications */}
                          {guide.specifications && (
                            <div>
                              <p className="font-semibold text-gray-900 mb-1">Specifications:</p>
                              {Object.entries(guide.specifications).map(([specName, specItems]) => (
                                <div key={specName} className="mb-2 bg-white p-2 rounded border border-gray-200">
                                  <p className="font-medium text-gray-800 text-xs">{specName}:</p>
                                  <div className="grid grid-cols-1 gap-1 mt-1">
                                    {typeof specItems === 'object' &&
                                      Object.entries(specItems).map(([key, value]) => (
                                        <div key={key} className="flex items-start justify-between py-1 px-2 bg-gray-50 rounded">
                                          <span className="font-medium text-gray-700">{key}</span>
                                          <span className="text-gray-600 text-right">
                                            {typeof value === 'object' ? JSON.stringify(value) : value}
                                          </span>
                                        </div>
                                      ))}
                                  </div>
                                </div>
                              ))}
                            </div>
                          )}

                          {/* Connection Patterns */}
                          {guide.connectionPatterns && (
                            <div>
                              <p className="font-semibold text-gray-900 mb-1">Connection Patterns:</p>
                              {guide.connectionPatterns.map((pattern, idx) => (
                                <div key={idx} className="bg-white p-2 rounded border border-gray-200 mb-1">
                                  <p className="font-medium text-gray-800">{pattern.name}</p>
                                  <p className="text-gray-600 text-xs mt-1">{pattern.description}</p>
                                  <p className="text-gray-500 text-xs mt-1">
                                    <span className="font-medium">Connects to:</span> {pattern.targetServices.join(', ')}
                                  </p>
                                </div>
                              ))}
                            </div>
                          )}

                          {/* Data Flow */}
                          {guide.dataFlow && (
                            <div>
                              <p className="font-semibold text-gray-900 mb-1">Data Flow:</p>
                              <div className="bg-white p-2 rounded border border-gray-200 space-y-1">
                                {Object.entries(guide.dataFlow).map(([phase, description]) => (
                                  <div key={phase} className="py-1">
                                    <span className="font-medium text-gray-800">{phase}:</span>{' '}
                                    <span className="text-gray-600">{description}</span>
                                  </div>
                                ))}
                              </div>
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  );
                })
              ) : (
                <div className="p-3 text-xs text-gray-600">
                  Add services to the canvas to see specifications
                </div>
              )}
            </div>
          )}
        </div>

        {/* Data Flow Section */}
        {caseStudyFlow && expandedSections.dataFlow && (
          <div className="border border-gray-200 rounded-lg overflow-hidden">
            <button
              onClick={() => toggleSection('dataFlow')}
              className="w-full bg-gray-100 hover:bg-gray-200 px-4 py-3 flex items-center justify-between transition"
            >
              <span className="font-semibold text-gray-900 text-sm">Data Flow Analysis</span>
              {expandedSections.dataFlow ? (
                <ChevronDown className="w-4 h-4" />
              ) : (
                <ChevronRight className="w-4 h-4" />
              )}
            </button>

            <div className="p-3 space-y-3 bg-gray-50 border-t border-gray-200 text-xs">
              {/* Steps */}
              <div>
                <p className="font-semibold text-gray-900 mb-2">Request Flow Steps:</p>
                <div className="space-y-2">
                  {caseStudyFlow.steps.map((step) => (
                    <div key={step.number} className="bg-white p-2 rounded border border-gray-200">
                      <div className="flex items-start gap-2">
                        <div className="w-6 h-6 rounded-full bg-yellow-100 text-yellow-700 flex items-center justify-center font-bold text-xs flex-shrink-0">
                          {step.number}
                        </div>
                        <div className="flex-1">
                          <p className="font-medium text-gray-800">{step.description}</p>
                          <p className="text-gray-600 text-xs mt-1">
                            <span className="font-medium">Services:</span> {step.services.join(' → ')}
                          </p>
                          <p className="text-gray-600 text-xs">
                            <span className="font-medium">Data:</span> {step.data}
                          </p>
                          {step.cost && (
                            <p className="text-yellow-700 text-xs font-medium mt-1">Cost: {step.cost}</p>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Bottlenecks */}
              {caseStudyFlow.bottlenecks && (
                <div>
                  <p className="font-semibold text-gray-900 mb-2">Potential Bottlenecks:</p>
                  {caseStudyFlow.bottlenecks.map((bottleneck, idx) => (
                    <div key={idx} className="bg-red-50 border border-red-200 p-2 rounded mb-1">
                      <p className="font-medium text-red-900 text-xs">{bottleneck.service}</p>
                      <p className="text-red-800 text-xs">{bottleneck.issue}</p>
                      <p className="text-red-700 text-xs font-medium mt-1">Solution: {bottleneck.solution}</p>
                    </div>
                  ))}
                </div>
              )}

              {/* Cost Breakdown */}
              {caseStudyFlow.costBreakdown && (
                <div>
                  <p className="font-semibold text-gray-900 mb-2">Monthly Cost Breakdown:</p>
                  <div className="bg-white border border-gray-200 rounded p-2 space-y-1">
                    {Object.entries(caseStudyFlow.costBreakdown).map(([item, cost]) => (
                      <div key={item} className="flex justify-between py-1 border-b border-gray-100 last:border-b-0">
                        <span className="text-gray-700 font-medium">{item}</span>
                        <span className="text-gray-900 font-bold text-yellow-700">{cost}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Optimizations */}
              {caseStudyFlow.optimizations && (
                <div>
                  <p className="font-semibold text-gray-900 mb-2">Optimization Tips:</p>
                  {caseStudyFlow.optimizations.map((opt, idx) => (
                    <div key={idx} className="bg-green-50 border-l-2 border-green-500 p-2 mb-1">
                      <p className="text-green-800 text-xs">{opt}</p>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {/* Connection Patterns Section */}
        <div className="border border-gray-200 rounded-lg overflow-hidden">
          <button
            onClick={() => toggleSection('connections')}
            className="w-full bg-gray-100 hover:bg-gray-200 px-4 py-3 flex items-center justify-between transition"
          >
            <span className="font-semibold text-gray-900 text-sm">Connection Patterns</span>
            {expandedSections.connections ? (
              <ChevronDown className="w-4 h-4" />
            ) : (
              <ChevronRight className="w-4 h-4" />
            )}
          </button>

          {expandedSections.connections && (
            <div className="p-3 space-y-2 bg-gray-50 border-t border-gray-200 text-xs divide-y">
              {Object.entries(CONNECTION_PATTERNS).map(([name, pattern]) => (
                <div key={name} className="py-2 first:pt-0">
                  <p className="font-semibold text-gray-900">{name}</p>
                  <p className="text-gray-600 mt-1">{pattern.description}</p>
                  <div className="bg-white p-2 rounded mt-1 border border-gray-200 space-y-1">
                    <div>
                      <span className="font-medium text-gray-800">Flow:</span>{' '}
                      <span className="text-gray-600 text-xs break-words">{pattern.flow}</span>
                    </div>
                    <div>
                      <span className="font-medium text-gray-800">Latency:</span>{' '}
                      <span className="text-gray-600">{pattern.latency}</span>
                    </div>
                    <div>
                      <span className="font-medium text-gray-800">Use Case:</span>{' '}
                      <span className="text-gray-600">{pattern.useCase}</span>
                    </div>
                    <div>
                      <span className="font-medium text-yellow-700">Cost Impact:</span>{' '}
                      <span className="text-yellow-600 font-medium">{pattern.costImpact}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
