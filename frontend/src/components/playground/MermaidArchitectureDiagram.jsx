'use client';

import { useEffect, useState } from 'react';
import mermaid from 'mermaid';

let mermaidInitialized = false;

function initializeMermaid() {
  if (!mermaidInitialized) {
    mermaid.initialize({ startOnLoad: false, securityLevel: 'strict', theme: 'neutral' });
    mermaidInitialized = true;
  }
}

export function MermaidArchitectureDiagram({ mermaidSource, valid = false }) {
  const [svg, setSvg] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    let cancelled = false;
    if (!valid || !mermaidSource) {
      return undefined;
    }

    initializeMermaid();
    const renderDiagram = async () => {
      try {
        const id = `architecture-diagram-${Date.now()}`;
        const result = await mermaid.render(id, mermaidSource);
        if (!cancelled) {
          setSvg(result.svg);
          setError('');
        }
      } catch (renderError) {
        if (!cancelled) {
          setSvg('');
          setError('Unable to render architecture diagram.');
          console.error('Mermaid rendering failed:', renderError);
        }
      }
    };

    renderDiagram();
    return () => {
      cancelled = true;
    };
  }, [mermaidSource, valid]);

  if (!valid || !mermaidSource) return null;
  if (error) return <p className="p-4 text-sm text-destructive">{error}</p>;
  return <div className="h-full w-full overflow-auto p-4" dangerouslySetInnerHTML={{ __html: svg }} />;
}
