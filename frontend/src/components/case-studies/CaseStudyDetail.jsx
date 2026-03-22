import React, { useState, useMemo, useRef } from 'react';
import { useArchitectureStore } from '@/store';
import { PlaygroundCanvas } from '@/components/playground/PlaygroundCanvas';
import { APIGatewayConfigPanel } from '@/components/services/APIGatewayConfigPanel';
import { LambdaConfigPanel } from '@/components/services/LambdaConfigPanel';
import { S3ConfigPanel } from '@/components/services/S3ConfigPanel';
import { ServiceGuidePanel } from '@/components/case-studies/ServiceGuidePanel';
import { CASE_STUDIES } from '@/lib/constants';
import { X, ChevronRight, ChevronLeft, GripVertical } from 'lucide-react';

export const CaseStudyDetail = ({ caseStudyId }) => {
  const caseStudy = CASE_STUDIES.find(cs => cs.id === caseStudyId);
  const [selectedNodeId, setSelectedNodeId] = useState(null);
  const [openConfigPanel, setOpenConfigPanel] = useState(null);
  const [guideWidth, setGuideWidth] = useState(320); // in pixels
  const [isResizing, setIsResizing] = useState(false);
  const resizeDividerRef = useRef(null);
  const containerRef = useRef(null);

  const loadArchitecture = useArchitectureStore(s => s.loadArchitecture);
  const nodes = useArchitectureStore(s => s.nodes);

  React.useEffect(() => {
    // Load case study architecture when component mounts
    if (caseStudy?.architecture) {
      loadArchitecture(caseStudy.architecture);
    }
  }, [caseStudyId, caseStudy, loadArchitecture]);

  // Get unique service types from nodes
  const selectedServices = useMemo(() => {
    const services = new Set();
    nodes.forEach(node => {
      if (node.serviceType) {
        services.add(node.serviceType);
      }
    });
    return Array.from(services);
  }, [nodes]);

  const handleNodeSelect = (node) => {
    setSelectedNodeId(node.id);
    
    // Get serviceType from node.data (where it's stored by PlaygroundCanvas)
    const serviceType = node?.data?.serviceType || node?.serviceType;
    
    // Log for debugging
    console.log('Node clicked:', { nodeId: node.id, serviceType, nodeData: node.data });
    
    // Determine which config panel to open based on service type
    if (serviceType === 'api_gateway') {
      setOpenConfigPanel('api_gateway');
    } else if (serviceType === 'lambda') {
      setOpenConfigPanel('lambda');
    } else if (serviceType === 's3') {
      setOpenConfigPanel('s3');
    } else {
      console.warn('Unknown service type:', serviceType);
    }
  };

  // Handle resize start
  const handleResizeStart = () => {
    setIsResizing(true);
  };

  // Handle resize move
  React.useEffect(() => {
    if (!isResizing) return;

    const handleMouseMove = (e) => {
      if (containerRef.current) {
        const containerRect = containerRef.current.getBoundingClientRect();
        const newWidth = e.clientX - containerRect.left;
        
        // Min width 250px, max width 50% of container
        const minWidth = 250;
        const maxWidth = containerRect.width * 0.5;
        
        if (newWidth >= minWidth && newWidth <= maxWidth) {
          setGuideWidth(newWidth);
        }
      }
    };

    const handleMouseUp = () => {
      setIsResizing(false);
    };

    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);

    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isResizing]);

  if (!caseStudy) {
    return (
      <div className="flex items-center justify-center h-screen">
        <p className="text-gray-500">Case study not found</p>
      </div>
    );
  }

  return (
    <div className="w-full h-screen flex flex-col bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 p-6">
        <div className="max-w-full mx-auto">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">{caseStudy.title}</h1>
          <p className="text-gray-600 mb-4">{caseStudy.description}</p>
          <div className="grid grid-cols-4 gap-4">
            <div>
              <p className="text-xs text-gray-500 font-semibold uppercase mb-1">Scale</p>
              <p className="text-sm font-semibold text-gray-900">{caseStudy.scale}</p>
            </div>
            <div>
              <p className="text-xs text-gray-500 font-semibold uppercase mb-1">Cost</p>
              <p className="text-sm font-semibold text-yellow-600">{caseStudy.cost}</p>
            </div>
            <div>
              <p className="text-xs text-gray-500 font-semibold uppercase mb-1">Key Insight</p>
              <p className="text-sm text-gray-900 line-clamp-1">{caseStudy.keyInsight}</p>
            </div>
            <div>
              <p className="text-xs text-gray-500 font-semibold uppercase mb-1">Services</p>
              <p className="text-sm font-semibold text-gray-900">{selectedServices.length}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div ref={containerRef} className="flex-1 flex overflow-hidden relative">
        {/* LEFT: Service Guide Panel (Resizable) */}
        <div style={{ width: `${guideWidth}px` }} className="flex flex-col border-r border-gray-200 bg-white overflow-hidden">
          <ServiceGuidePanel caseStudyId={caseStudyId} selectedServices={selectedServices} />
        </div>

        {/* Resize Divider */}
        <div
          ref={resizeDividerRef}
          onMouseDown={handleResizeStart}
          className={`w-1 bg-gray-300 hover:bg-yellow-500 cursor-col-resize transition-colors ${
            isResizing ? 'bg-yellow-500' : ''
          }`}
          style={{ userSelect: isResizing ? 'none' : 'auto' }}
        />

        {/* CENTER: Playground Canvas */}
        <div className="flex-1 flex flex-col overflow-hidden">
          <PlaygroundCanvas onNodeSelect={handleNodeSelect} />
        </div>

        {/* RIGHT: Config Panel (slides in from right) */}
        <div
          className={`border-l border-gray-200 bg-white overflow-y-auto transition-all duration-300 ease-in-out ${
            openConfigPanel ? 'w-96 shadow-lg' : 'w-0'
          }`}
          style={{
            minWidth: openConfigPanel ? '384px' : '0',
          }}
        >
          {openConfigPanel && (
            <>
              <div className="bg-gradient-to-r from-yellow-50 to-white border-b border-gray-200 p-3 flex items-center justify-between sticky top-0 z-50">
                <span className="font-semibold text-gray-900 text-sm">
                  {openConfigPanel === 'api_gateway' && 'API Gateway'}
                  {openConfigPanel === 'lambda' && 'Lambda'}
                  {openConfigPanel === 's3' && 'S3 Bucket'}
                </span>
                <button
                  onClick={() => setOpenConfigPanel(null)}
                  className="p-1 hover:bg-gray-200 rounded transition"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <div className="p-4">
                {openConfigPanel === 'api_gateway' && (
                  <APIGatewayConfigPanel onClose={() => setOpenConfigPanel(null)} />
                )}
                {openConfigPanel === 'lambda' && (
                  <LambdaConfigPanel onClose={() => setOpenConfigPanel(null)} />
                )}
                {openConfigPanel === 's3' && (
                  <S3ConfigPanel onClose={() => setOpenConfigPanel(null)} />
                )}
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
};
