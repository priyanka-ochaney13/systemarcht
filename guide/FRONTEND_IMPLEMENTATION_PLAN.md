# SystemArcht: Frontend Implementation Plan

## Overview
**Technology Stack**: Next.js 14, TypeScript, React Flow, Zustand, Recharts, Tailwind CSS, Framer Motion
**Timeline**: 8 weeks
**Team**: 1-2 Frontend Developers

---

## Phase 1: Foundation (Weeks 1-2)

### Week 1: Project Setup & Basic Canvas

#### Tasks
- [ ] Initialize Next.js 14 with TypeScript and Tailwind CSS
- [ ] Install core dependencies:
  ```bash
  npm install react-flow-renderer zustand recharts framer-motion lucide-react
  npm install -D @types/react-flow-renderer
  ```
- [ ] Setup folder structure:
  ```
  src/
  ├── app/                 # Next.js 14 app directory
  │   ├── page.tsx         # Landing page
  │   └── playground/
  │       └── page.tsx     # Main playground
  ├── components/
  │   ├── canvas/          # React Flow components
  │   ├── inspector/       # Service configuration panels
  │   ├── metrics/         # Visualization components
  │   ├── sidebar/         # Service library
  │   └── ui/              # Reusable UI components
  ├── store/               # Zustand state management
  ├── types/               # TypeScript definitions
  ├── utils/               # Helper functions
  └── lib/                 # Third-party configurations
  ```

#### Deliverables
- ✅ Next.js project with TypeScript configured
- ✅ Basic routing structure
- ✅ Empty canvas with React Flow initialized
- ✅ Service library sidebar (static, no drag yet)

---

### Week 2: Canvas Interaction & Service Cards

#### Tasks
- [ ] Implement React Flow canvas with drag-and-drop
- [ ] Create service node components for 6 services:
  - EC2, Lambda, RDS, DynamoDB, S3, API Gateway
- [ ] Design service card UI:
  ```tsx
  interface ServiceCardProps {
    id: string;
    type: ServiceType;
    config: ServiceConfig;
    metrics?: ServiceMetrics;
    selected: boolean;
  }
  ```
- [ ] Add custom connection lines with arrow indicators
- [ ] Implement node selection and highlighting
- [ ] Add minimap and controls (zoom, pan, fit view)

#### Deliverables
- ✅ Draggable service nodes from sidebar to canvas
- ✅ Visual connection between services
- ✅ Service cards with icons and basic info
- ✅ Canvas controls (zoom, pan, reset)

---

## Phase 2: Configuration & Inspector (Weeks 3-4)

### Week 3: Inspector Panel Foundation

#### Tasks
- [ ] Create Inspector panel component (right sidebar)
- [ ] Implement service-specific configuration panels:
  - **EC2Inspector**: Instance type dropdown, count slider, Multi-AZ toggle
  - **LambdaInspector**: Memory slider (128-10240 MB), runtime selector, timeout
  - **RDSInspector**: Instance class, storage, Multi-AZ, engine
  - **DynamoDBInspector**: Billing mode, RCU/WCU sliders, storage
  - **S3Inspector**: Storage class selector, size input, versioning
  - **APIGatewayInspector**: API type (HTTP/REST), caching, throttling
- [ ] Add real-time cost display in each inspector
- [ ] Implement preset configurations dropdown (Small, Medium, Large, Enterprise)

#### Deliverables
- ✅ Inspector panel opens when service selected
- ✅ All 6 service configuration panels functional
- ✅ Real-time cost calculation display
- ✅ Configuration changes update service card

---

### Week 4: State Management & Persistence

#### Tasks
- [ ] Setup Zustand store for architecture state:
  ```typescript
  interface ArchitectureStore {
    nodes: ServiceNode[];
    connections: Connection[];
    selectedNodeId: string | null;
    workload: number;
    simulationRunning: boolean;
    metrics: SimulationMetrics | null;
    
    // Actions
    addNode: (node: ServiceNode) => void;
    updateNode: (id: string, updates: Partial<ServiceNode>) => void;
    deleteNode: (id: string) => void;
    addConnection: (connection: Connection) => void;
    deleteConnection: (id: string) => void;
    setWorkload: (workload: number) => void;
    startSimulation: () => void;
    stopSimulation: () => void;
  }
  ```
- [ ] Implement local storage persistence (save/load architectures)
- [ ] Add undo/redo functionality (using immer for immutable updates)
- [ ] Create architecture export (JSON download)
- [ ] Create architecture import (JSON upload)

#### Deliverables
- ✅ Centralized state management with Zustand
- ✅ Architecture auto-save to localStorage
- ✅ Export/Import architecture as JSON
- ✅ Undo/Redo (Cmd+Z, Cmd+Shift+Z)

---

## Phase 3: Simulation & Visualization (Weeks 5-6)

### Week 5: Simulation Controls & Animation

#### Tasks
- [ ] Create Simulation Control panel (top bar):
  - Workload slider (1-10000 req/sec)
  - Run/Stop/Reset buttons
  - Simulation speed control (0.5x, 1x, 2x, 5x)
  - Time elapsed counter
- [ ] Implement request flow animation:
  - Animated dots traveling along connection lines
  - Color-coded by status (green = success, red = error)
  - Speed based on latency (faster = lower latency)
- [ ] Add service state indicators:
  - 🟢 Healthy
  - 🟡 Warning (>70% utilization)
  - 🔴 Critical (>90% utilization or bottleneck)
  - ⚫ Error (failed)
- [ ] Integrate with backend API for simulation runs
- [ ] Implement WebSocket connection for real-time metrics

#### Deliverables
- ✅ Simulation control panel functional
- ✅ Animated request flow visualization
- ✅ Real-time status indicators on service cards
- ✅ WebSocket integration for live metrics

---

### Week 6: Metrics Dashboard & Charts

#### Tasks
- [ ] Create Metrics Panel component (bottom expandable panel)
- [ ] Implement charts using Recharts:
  - **Latency Graph**: Line chart showing P50, P95, P99 over time
  - **Throughput Chart**: Area chart of requests/sec completed
  - **Resource Utilization**: Multi-line chart for CPU, memory, connections
  - **Cost Breakdown**: Donut chart showing cost per service
  - **Error Rate**: Line chart of failures over time
- [ ] Add metrics filtering (show/hide specific services)
- [ ] Implement time range selector (last 1min, 5min, 30min, 1h)
- [ ] Add export metrics as CSV functionality
- [ ] Create bottleneck alert panel:
  ```tsx
  interface Bottleneck {
    serviceId: string;
    serviceName: string;
    issue: string;
    severity: 'warning' | 'critical';
    suggestion: string;
  }
  ```

#### Deliverables
- ✅ Interactive metrics dashboard with 5 charts
- ✅ Bottleneck alerts with actionable suggestions
- ✅ Time range filtering
- ✅ CSV export of metrics

---

## Phase 4: Templates & Learning Features (Week 7)

### Week 7: Pre-built Templates & Challenge Mode

#### Tasks
- [ ] Create template library with 5 pre-built architectures:
  - **Netflix**: API Gateway → Lambda (4 functions) → DynamoDB + S3
  - **Uber Analytics**: Event stream → Lambda batch → DynamoDB
  - **Instagram**: Presigned S3 URLs → Lambda processing → Multi-resolution storage
  - **Amazon Search**: API Gateway → EC2 cluster → DynamoDB + S3 index
  - **Airbnb Booking**: API Gateway → Lambda → DynamoDB (atomic writes)
- [ ] Implement template selector modal:
  - Preview diagram
  - Expected cost
  - Use case description
  - "Load Template" button
- [ ] Create challenge mode:
  - Challenge description (e.g., "Scale to 10,000 req/sec with <200ms latency")
  - Success criteria checker
  - Progress indicators
  - Hints system (3 hints per challenge)
- [ ] Add guided tutorial (first-time user experience):
  - Step-by-step walkthrough
  - Interactive tooltips
  - "Next" button flow

#### Deliverables
- ✅ 5 pre-built templates loadable from UI
- ✅ Challenge mode with 3-5 challenges
- ✅ First-time user tutorial
- ✅ Template preview and metadata

---

## Phase 5: Polish & Advanced Features (Week 8)

### Week 8: UI/UX Polish & Optimization

#### Tasks
- [ ] Implement dark mode / light mode toggle
- [ ] Add keyboard shortcuts:
  - `Cmd+S`: Save architecture
  - `Cmd+Z`: Undo
  - `Cmd+Shift+Z`: Redo
  - `Space`: Run/Stop simulation
  - `Delete`: Remove selected node
  - `Cmd+D`: Duplicate selected node
- [ ] Implement responsive design for tablets (iPad)
- [ ] Add loading states and skeleton screens
- [ ] Implement error boundaries and error handling
- [ ] Add toast notifications (success, error, info)
- [ ] Optimize performance:
  - Virtualize long lists
  - Memoize expensive calculations
  - Debounce user inputs
  - Code splitting for heavy components
- [ ] Add accessibility features:
  - ARIA labels
  - Keyboard navigation
  - Screen reader support
- [ ] Create onboarding tooltips
- [ ] Implement search functionality for services

#### Deliverables
- ✅ Dark/Light mode
- ✅ All keyboard shortcuts functional
- ✅ Responsive design for tablets
- ✅ Production-ready performance
- ✅ Accessibility compliance (WCAG 2.1 AA)
- ✅ Error handling and user feedback

---

## Component Architecture

### Core Components

#### 1. Canvas Component
```tsx
// src/components/canvas/Canvas.tsx
import ReactFlow, { Background, Controls, MiniMap } from 'react-flow-renderer';
import { useArchitectureStore } from '@/store/architectureStore';
import ServiceCard from './ServiceCard';
import ConnectionLine from './ConnectionLine';

const nodeTypes = {
  EC2: ServiceCard,
  Lambda: ServiceCard,
  RDS: ServiceCard,
  DynamoDB: ServiceCard,
  S3: ServiceCard,
  APIGateway: ServiceCard,
};

export default function Canvas() {
  const { nodes, connections, addConnection } = useArchitectureStore();
  
  return (
    <ReactFlow
      nodes={nodes}
      edges={connections}
      nodeTypes={nodeTypes}
      onConnect={addConnection}
      fitView
    >
      <Background />
      <Controls />
      <MiniMap />
    </ReactFlow>
  );
}
```

#### 2. Service Card Component
```tsx
// src/components/canvas/ServiceCard.tsx
import { Handle, Position } from 'react-flow-renderer';
import { useArchitectureStore } from '@/store/architectureStore';
import { getServiceIcon, getServiceColor } from '@/utils/serviceUtils';

interface ServiceCardProps {
  id: string;
  type: ServiceType;
  data: {
    config: ServiceConfig;
    metrics?: ServiceMetrics;
  };
  selected: boolean;
}

export default function ServiceCard({ id, type, data, selected }: ServiceCardProps) {
  const Icon = getServiceIcon(type);
  const color = getServiceColor(type);
  const cost = calculateCost(type, data.config);
  const status = getStatus(data.metrics);
  
  return (
    <div className={`service-card ${selected ? 'selected' : ''} ${status}`}>
      <Handle type="target" position={Position.Top} />
      
      <div className="service-header">
        <Icon className="service-icon" style={{ color }} />
        <span className="service-name">{type}</span>
        <StatusIndicator status={status} />
      </div>
      
      <div className="service-config">
        {getConfigSummary(type, data.config)}
      </div>
      
      <div className="service-cost">
        ${cost.toFixed(2)}/hr
      </div>
      
      <Handle type="source" position={Position.Bottom} />
    </div>
  );
}
```

#### 3. Inspector Panel
```tsx
// src/components/inspector/Inspector.tsx
import { useArchitectureStore } from '@/store/architectureStore';
import EC2Inspector from './EC2Inspector';
import LambdaInspector from './LambdaInspector';
// ... other inspectors

export default function Inspector() {
  const { selectedNodeId, nodes } = useArchitectureStore();
  
  if (!selectedNodeId) {
    return <EmptyState />;
  }
  
  const node = nodes.find(n => n.id === selectedNodeId);
  
  const InspectorComponent = {
    EC2: EC2Inspector,
    Lambda: LambdaInspector,
    RDS: RDSInspector,
    DynamoDB: DynamoDBInspector,
    S3: S3Inspector,
    APIGateway: APIGatewayInspector,
  }[node.type];
  
  return (
    <div className="inspector-panel">
      <InspectorComponent nodeId={node.id} config={node.data.config} />
    </div>
  );
}
```

#### 4. Metrics Dashboard
```tsx
// src/components/metrics/MetricsPanel.tsx
import { LineChart, AreaChart, PieChart } from 'recharts';
import { useArchitectureStore } from '@/store/architectureStore';

export default function MetricsPanel() {
  const { metrics, simulationRunning } = useArchitectureStore();
  
  return (
    <div className="metrics-panel">
      <LatencyChart data={metrics?.latency} />
      <ThroughputChart data={metrics?.throughput} />
      <ResourceUtilizationChart data={metrics?.resources} />
      <CostBreakdownChart data={metrics?.costs} />
      <BottleneckAlerts alerts={metrics?.bottlenecks} />
    </div>
  );
}
```

---

## State Management Structure

### Zustand Store
```typescript
// src/store/architectureStore.ts
import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface ArchitectureStore {
  // State
  nodes: ServiceNode[];
  connections: Connection[];
  selectedNodeId: string | null;
  workload: number;
  simulationRunning: boolean;
  simulationSpeed: number;
  metrics: SimulationMetrics | null;
  
  // Actions
  addNode: (node: ServiceNode) => void;
  updateNode: (id: string, updates: Partial<ServiceNode>) => void;
  deleteNode: (id: string) => void;
  selectNode: (id: string | null) => void;
  addConnection: (connection: Connection) => void;
  deleteConnection: (id: string) => void;
  setWorkload: (workload: number) => void;
  setSimulationSpeed: (speed: number) => void;
  startSimulation: () => Promise<void>;
  stopSimulation: () => void;
  resetSimulation: () => void;
  loadTemplate: (templateId: string) => void;
  exportArchitecture: () => string;
  importArchitecture: (json: string) => void;
}

export const useArchitectureStore = create<ArchitectureStore>()(
  persist(
    (set, get) => ({
      // Initial state
      nodes: [],
      connections: [],
      selectedNodeId: null,
      workload: 100,
      simulationRunning: false,
      simulationSpeed: 1,
      metrics: null,
      
      // Implementations
      addNode: (node) => set((state) => ({ nodes: [...state.nodes, node] })),
      updateNode: (id, updates) => set((state) => ({
        nodes: state.nodes.map(n => n.id === id ? { ...n, ...updates } : n)
      })),
      // ... other implementations
    }),
    {
      name: 'systemarcht-storage',
      partialize: (state) => ({
        nodes: state.nodes,
        connections: state.connections,
      }),
    }
  )
);
```

---

## API Integration

### Backend API Calls
```typescript
// src/lib/api.ts
const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

export async function startSimulation(architecture: Architecture, workload: number) {
  const response = await fetch(`${API_BASE_URL}/api/simulations`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ architecture, workload }),
  });
  return response.json();
}

export async function getSimulationMetrics(simulationId: string) {
  const response = await fetch(`${API_BASE_URL}/api/simulations/${simulationId}/metrics`);
  return response.json();
}

export async function getServicePricing(serviceType: ServiceType, region: string) {
  const response = await fetch(`${API_BASE_URL}/api/pricing/${serviceType}/${region}`);
  return response.json();
}
```

### WebSocket Connection
```typescript
// src/lib/websocket.ts
import { io } from 'socket.io-client';

export function connectToSimulation(simulationId: string, onMetrics: (metrics: SimulationMetrics) => void) {
  const socket = io(API_BASE_URL);
  
  socket.emit('subscribe', { simulationId });
  
  socket.on('metrics', (data) => {
    onMetrics(data);
  });
  
  return () => {
    socket.emit('unsubscribe', { simulationId });
    socket.disconnect();
  };
}
```

---

## Styling Approach

### Tailwind CSS Configuration
```javascript
// tailwind.config.js
module.exports = {
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        aws: {
          orange: '#FF9900',
          blue: '#232F3E',
        },
        service: {
          ec2: '#FF9900',
          lambda: '#FF9900',
          rds: '#3B48CC',
          dynamodb: '#4053D6',
          s3: '#569A31',
          apigateway: '#E7157B',
        },
        status: {
          healthy: '#10B981',
          warning: '#F59E0B',
          critical: '#EF4444',
          error: '#DC2626',
        },
      },
      animation: {
        'flow': 'flow 2s linear infinite',
      },
    },
  },
};
```

---

## Performance Optimization Checklist

- [ ] **Code Splitting**: Dynamic imports for heavy components
- [ ] **Memoization**: React.memo for service cards and inspectors
- [ ] **Virtualization**: For long service lists (if needed)
- [ ] **Debouncing**: User inputs (sliders, text fields)
- [ ] **Lazy Loading**: Charts only render when visible
- [ ] **Service Workers**: Cache static assets
- [ ] **Image Optimization**: Next.js Image component for icons
- [ ] **Bundle Analysis**: Keep bundle size < 300KB
- [ ] **Web Vitals**: LCP < 2.5s, FID < 100ms, CLS < 0.1

---

## Testing Strategy

### Unit Tests (Jest + React Testing Library)
```typescript
// Example: ServiceCard.test.tsx
import { render, screen } from '@testing-library/react';
import ServiceCard from '@/components/canvas/ServiceCard';

test('renders EC2 service card with config', () => {
  const config = { instanceType: 't3.medium', count: 2, multiAZ: false };
  render(<ServiceCard id="1" type="EC2" data={{ config }} selected={false} />);
  
  expect(screen.getByText('EC2')).toBeInTheDocument();
  expect(screen.getByText('t3.medium')).toBeInTheDocument();
});
```

### Integration Tests (Cypress)
```typescript
// cypress/e2e/simulation.cy.ts
describe('Simulation Flow', () => {
  it('should run simulation and display metrics', () => {
    cy.visit('/playground');
    cy.get('[data-testid="service-ec2"]').drag('[data-testid="canvas"]');
    cy.get('[data-testid="workload-slider"]').setValue(100);
    cy.get('[data-testid="run-simulation"]').click();
    cy.get('[data-testid="metrics-panel"]').should('be.visible');
  });
});
```

---

## Accessibility Requirements

- [ ] All interactive elements keyboard accessible
- [ ] ARIA labels on all controls
- [ ] Color contrast ratio ≥ 4.5:1
- [ ] Focus indicators visible
- [ ] Screen reader announcements for state changes
- [ ] Alternative text for all icons
- [ ] Semantic HTML structure

---

## Documentation

### Component Documentation (Storybook)
- [ ] Setup Storybook for component library
- [ ] Document all reusable components
- [ ] Include usage examples
- [ ] Show all variants and states

### User Guide
- [ ] Getting started guide
- [ ] Video tutorials for each feature
- [ ] Keyboard shortcuts reference
- [ ] FAQ section

---

## Deployment

### Production Build
```bash
npm run build
npm run start
```

### Vercel Deployment
```bash
vercel --prod
```

### Environment Variables
```env
NEXT_PUBLIC_API_URL=https://api.systemarcht.com
NEXT_PUBLIC_WS_URL=wss://api.systemarcht.com
NEXT_PUBLIC_ENABLE_ANALYTICS=true
```

---

## Success Metrics

### Performance
- [ ] First Contentful Paint < 1.5s
- [ ] Time to Interactive < 3s
- [ ] Bundle size < 300KB (gzipped)
- [ ] Lighthouse score > 90

### User Experience
- [ ] Tutorial completion rate > 60%
- [ ] Average session duration > 10 minutes
- [ ] Template usage rate > 40%
- [ ] Challenge completion rate > 25%

---

## Future Enhancements (Phase 2)

- [ ] Collaboration mode (real-time multi-user editing)
- [ ] Architecture version history
- [ ] Cost optimization suggestions (AI-powered)
- [ ] Custom service creation
- [ ] Integration with actual AWS accounts (read-only)
- [ ] Mobile app (React Native)
- [ ] VS Code extension for architecture-as-code

---

**Total Estimated Development Time**: 8 weeks (1 frontend developer)
**Lines of Code**: ~15,000-20,000 LOC
**Components**: ~50 components
**Pages**: 3 (Landing, Playground, Templates)
