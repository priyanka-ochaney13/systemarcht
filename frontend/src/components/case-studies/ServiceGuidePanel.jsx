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
    <div className="w-full h-full bg-card border-l border-border overflow-y-auto">
      {/* Header */}
      <div className="sticky top-0 bg-muted/70 border-b border-border p-4">
        <h2 className="text-lg font-bold text-foreground">Service Guide</h2>
        <p className="text-xs text-muted-foreground mt-1">Specifications & Data Flow</p>
      </div>

      <div className="p-4 space-y-4">
        {/* Case Study Overview */}
        {caseStudyFlow && (
          <div className="bg-info border border-info/40 rounded-lg p-3">
            <p className="text-sm font-semibold text-info-foreground">{caseStudyFlow.name}</p>
            <p className="text-xs text-info-foreground mt-1">{caseStudyFlow.overview}</p>
          </div>
        )}

        {/* Services Section */}
        <div className="border border-border rounded-lg overflow-hidden">
          <button
            onClick={() => toggleSection('services')}
            className="w-full bg-muted hover:bg-muted px-4 py-3 flex items-center justify-between transition"
          >
            <span className="font-semibold text-foreground text-sm">Services & Specifications</span>
            {expandedSections.services ? (
              <ChevronDown className="w-4 h-4" />
            ) : (
              <ChevronRight className="w-4 h-4" />
            )}
          </button>

          {expandedSections.services && (
            <div className="divide-y divide-border">
              {selectedServices && selectedServices.length > 0 ? (
                selectedServices.map((serviceId) => {
                  const guide = SERVICE_GUIDES[serviceId];
                  if (!guide) return null;

                  const isExpanded = expandedService === serviceId;

                  return (
                    <div key={serviceId}>
                      <button
                        onClick={() => toggleService(serviceId)}
                        className="w-full p-3 hover:bg-accent transition text-left flex items-center justify-between"
                      >
                        <div className="flex-1">
                          <p className="font-semibold text-foreground text-sm">{guide.name}</p>
                          <p className="text-xs text-muted-foreground line-clamp-1">{guide.description}</p>
                        </div>
                        {isExpanded ? (
                          <ChevronDown className="w-4 h-4 ml-2 flex-shrink-0" />
                        ) : (
                          <ChevronRight className="w-4 h-4 ml-2 flex-shrink-0" />
                        )}
                      </button>

                      {isExpanded && (
                        <div className="bg-muted/50 p-3 border-t border-border space-y-3 text-xs">
                          {/* Key Features */}
                          <div>
                            <p className="font-semibold text-foreground mb-1">Key Features:</p>
                            <ul className="space-y-1">
                              {guide.keyFeatures.slice(0, 4).map((feature, idx) => (
                                <li key={idx} className="text-foreground/80 flex gap-2">
                                  <span className="text-primary font-bold">•</span>
                                  <span>{feature}</span>
                                </li>
                              ))}
                            </ul>
                          </div>

                          {/* Specifications */}
                          {guide.specifications && (
                            <div>
                              <p className="font-semibold text-foreground mb-1">Specifications:</p>
                              {Object.entries(guide.specifications).map(([specName, specItems]) => (
                                <div key={specName} className="mb-2 bg-card p-2 rounded border border-border">
                                  <p className="font-medium text-foreground text-xs">{specName}:</p>
                                  <div className="grid grid-cols-1 gap-1 mt-1">
                                    {typeof specItems === 'object' &&
                                      Object.entries(specItems).map(([key, value]) => (
                                        <div key={key} className="flex items-start justify-between py-1 px-2 bg-muted/50 rounded">
                                          <span className="font-medium text-foreground/80">{key}</span>
                                          <span className="text-muted-foreground text-right">
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
                              <p className="font-semibold text-foreground mb-1">Connection Patterns:</p>
                              {guide.connectionPatterns.map((pattern, idx) => (
                                <div key={idx} className="bg-card p-2 rounded border border-border mb-1">
                                  <p className="font-medium text-foreground">{pattern.name}</p>
                                  <p className="text-muted-foreground text-xs mt-1">{pattern.description}</p>
                                  <p className="text-muted-foreground text-xs mt-1">
                                    <span className="font-medium">Connects to:</span> {pattern.targetServices.join(', ')}
                                  </p>
                                </div>
                              ))}
                            </div>
                          )}

                          {/* Data Flow */}
                          {guide.dataFlow && (
                            <div>
                              <p className="font-semibold text-foreground mb-1">Data Flow:</p>
                              <div className="bg-card p-2 rounded border border-border space-y-1">
                                {Object.entries(guide.dataFlow).map(([phase, description]) => (
                                  <div key={phase} className="py-1">
                                    <span className="font-medium text-foreground">{phase}:</span>{' '}
                                    <span className="text-muted-foreground">{description}</span>
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
                <div className="p-3 text-xs text-muted-foreground">
                  Add services to the canvas to see specifications
                </div>
              )}
            </div>
          )}
        </div>

        {/* Data Flow Section */}
        {caseStudyFlow && expandedSections.dataFlow && (
          <div className="border border-border rounded-lg overflow-hidden">
            <button
              onClick={() => toggleSection('dataFlow')}
              className="w-full bg-muted hover:bg-muted px-4 py-3 flex items-center justify-between transition"
            >
              <span className="font-semibold text-foreground text-sm">Data Flow Analysis</span>
              {expandedSections.dataFlow ? (
                <ChevronDown className="w-4 h-4" />
              ) : (
                <ChevronRight className="w-4 h-4" />
              )}
            </button>

            <div className="p-3 space-y-3 bg-muted/50 border-t border-border text-xs">
              {/* Steps */}
              <div>
                <p className="font-semibold text-foreground mb-2">Request Flow Steps:</p>
                <div className="space-y-2">
                  {caseStudyFlow.steps.map((step) => (
                    <div key={step.number} className="bg-card p-2 rounded border border-border">
                      <div className="flex items-start gap-2">
                        <div className="w-6 h-6 rounded-full bg-accent text-primary flex items-center justify-center font-bold text-xs flex-shrink-0">
                          {step.number}
                        </div>
                        <div className="flex-1">
                          <p className="font-medium text-foreground">{step.description}</p>
                          <p className="text-muted-foreground text-xs mt-1">
                            <span className="font-medium">Services:</span> {step.services.join(' → ')}
                          </p>
                          <p className="text-muted-foreground text-xs">
                            <span className="font-medium">Data:</span> {step.data}
                          </p>
                          {step.cost && (
                            <p className="text-primary text-xs font-medium mt-1">Cost: {step.cost}</p>
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
                  <p className="font-semibold text-foreground mb-2">Potential Bottlenecks:</p>
                  {caseStudyFlow.bottlenecks.map((bottleneck, idx) => (
                    <div key={idx} className="bg-destructive/10 border border-destructive/30 p-2 rounded mb-1">
                      <p className="font-medium text-red-900 text-xs">{bottleneck.service}</p>
                      <p className="text-destructive text-xs">{bottleneck.issue}</p>
                      <p className="text-destructive text-xs font-medium mt-1">Solution: {bottleneck.solution}</p>
                    </div>
                  ))}
                </div>
              )}

              {/* Cost Breakdown */}
              {caseStudyFlow.costBreakdown && (
                <div>
                  <p className="font-semibold text-foreground mb-2">Monthly Cost Breakdown:</p>
                  <div className="bg-card border border-border rounded p-2 space-y-1">
                    {Object.entries(caseStudyFlow.costBreakdown).map(([item, cost]) => (
                      <div key={item} className="flex justify-between py-1 border-b border-gray-100 last:border-b-0">
                        <span className="text-foreground/80 font-medium">{item}</span>
                        <span className="text-foreground font-bold text-primary">{cost}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Optimizations */}
              {caseStudyFlow.optimizations && (
                <div>
                  <p className="font-semibold text-foreground mb-2">Optimization Tips:</p>
                  {caseStudyFlow.optimizations.map((opt, idx) => (
                    <div key={idx} className="bg-success border-l-2 border-green-500 p-2 mb-1">
                      <p className="text-success-foreground text-xs">{opt}</p>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {/* Connection Patterns Section */}
        <div className="border border-border rounded-lg overflow-hidden">
          <button
            onClick={() => toggleSection('connections')}
            className="w-full bg-muted hover:bg-muted px-4 py-3 flex items-center justify-between transition"
          >
            <span className="font-semibold text-foreground text-sm">Connection Patterns</span>
            {expandedSections.connections ? (
              <ChevronDown className="w-4 h-4" />
            ) : (
              <ChevronRight className="w-4 h-4" />
            )}
          </button>

          {expandedSections.connections && (
            <div className="p-3 space-y-2 bg-muted/50 border-t border-border text-xs divide-y">
              {Object.entries(CONNECTION_PATTERNS).map(([name, pattern]) => (
                <div key={name} className="py-2 first:pt-0">
                  <p className="font-semibold text-foreground">{name}</p>
                  <p className="text-muted-foreground mt-1">{pattern.description}</p>
                  <div className="bg-card p-2 rounded mt-1 border border-border space-y-1">
                    <div>
                      <span className="font-medium text-foreground">Flow:</span>{' '}
                      <span className="text-muted-foreground text-xs break-words">{pattern.flow}</span>
                    </div>
                    <div>
                      <span className="font-medium text-foreground">Latency:</span>{' '}
                      <span className="text-muted-foreground">{pattern.latency}</span>
                    </div>
                    <div>
                      <span className="font-medium text-foreground">Use Case:</span>{' '}
                      <span className="text-muted-foreground">{pattern.useCase}</span>
                    </div>
                    <div>
                      <span className="font-medium text-primary">Cost Impact:</span>{' '}
                      <span className="text-primary font-medium">{pattern.costImpact}</span>
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
