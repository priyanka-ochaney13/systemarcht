# SystemArcht Frontend - Visual Architecture & Navigation Flow

## 🗺️ Application Navigation Map

```
┌─────────────────────────────────────────────────────────────────┐
│                        SYSTEMARCHT                              │
│                  Cloud Architecture Learning Platform            │
└─────────────────────────────────────────────────────────────────┘
                              │
                    ┌─────────┬─────────┐
                    ▼         ▼         ▼
            ┌──────────┐  ┌──────────┐  ┌──────────┐
            │ Landing  │  │  Case    │  │Playground│
            │  Page    │  │ Studies  │  │  (Blank) │
            │   (/)    │  │(/case... │  │ (/play...) │
            └──────────┘  └────┬─────┘  └──────────┘
                               │
                  ┌────────────└─────────────┬──────┐
                  ▼                         ▼      ▼
            ┌──────────────┐        ┌────────────────┐
            │  Netflix     │        │   Real-Time    │
            │  Pattern     │        │   Analytics    │
            │  Case Study  │        │   Case Study   │
            └──────────────┘        └────────────────┘
                                            ▼
                                    ┌──────────────────┐
                                    │ Photo Sharing    │
                                    │ Case Study       │
                                    └──────────────────┘

Each Case Study & Playground Contains:
  ┌─────────────────────────────────────────────────────┐
  │         CANVAS (Drag-and-Drop Architecture)          │
  │  ┌──────────────────────────────────────────────┐   │
  │  │  [Service]─[Service]─[Service]               │   │
  │  │     │           │          │                  │   │
  │  │   [Service]  [Service]   [Service]           │   │
  │  └──────────────────────────────────────────────┘   │
  │                                                      │
  │  Toolbar: + API Gateway | + Lambda | + S3 | Delete │
  └─────────────────────────────────────────────────────┘
                          │
                          ▼
  ┌─────────────────────────────────────────────────────┐
  │  CONFIG PANEL (Click Service to Configure)          │
  │  ┌──────────────────────────────────────────────┐   │
  │  │ ☁️  API Gateway Configuration         [X]    │   │
  │  │                                               │   │
  │  │ Region: [Asia Pacific (Mumbai) ▼]           │   │
  │  │                                               │   │
  │  │ ⚙️ API TYPE                                  │   │
  │  │ (•) REST API  ($3.50/1M)                     │   │
  │  │ ( ) HTTP API  ($1.00/1M)                     │   │
  │  │                                               │   │
  │  │ Requests/month: [1000000    ]               │   │
  │  │                                               │   │
  │  │ 💰 Cost: $3.50/month                         │   │
  │  │                                               │   │
  │  │ [Calculate] [Close]                          │   │
  │  └──────────────────────────────────────────────┘   │
  └─────────────────────────────────────────────────────┘
```

---

## 📊 Component Relationship Diagram

```
                        ┌──────────────────┐
                        │   RootLayout     │
                        │  (layout.js)     │
                        └────────┬─────────┘
                                 │
        ┌────────────────────────┼────────────────────────┐
        ▼                        ▼                        ▼
   ┌─────────────┐      ┌──────────────┐      ┌──────────────┐
   │Landing Page │      │  Playground  │      │ CaseStudies  │
   │  (page.js)  │      │  (page.js)   │      │  (page.js)   │
   └─────┬───────┘      └──────┬───────┘      └──────┬───────┘
         │                     │                     │
         ▼                     ▼                     ▼
  ┌─────────────┐      ┌──────────────┐      ┌──────────────┐
  │LandingPage  │      │PlaygroundPage│      │CaseStudyList│
  │Component    │      │ Component    │      │ Component    │
  └─────┬───────┘      └──────┬───────┘      └──────┬───────┘
        │                     │                     │
        │                     ├─────────────────────┤
        │                     ▼                     ▼
        │              ┌──────────────────────────────────┐
        │              │     PlaygroundCanvas             │
        │              │      (ReactFlow)                 │
        │              ├──────────────────────────────────┤
        │              │ - Drag/drop services             │
        │              │ - Connect nodes                  │
        │              │ - Toolbar + controls             │
        │              │ - MiniMap display                │
        │              └────────┬─────────────────────────┘
        │                       │
        │        ┌──────────────┼──────────────┐
        │        ▼              ▼              ▼
        │   ┌────────┐   ┌─────────────┐  ┌─────────┐
        │   │Service │   │  Config     │  │Pricing  │
        │   │Nodes   │   │  Panels     │  │Storage  │
        │   │(React  │   │             │  │(Zustand)│
        │   │ Flow)  │   │ API Gateway │  │         │
        │   │        │   │ Lambda      │  │Aggregate│
        │   │        │   │ S3          │  │Total $  │
        │   └────────┘   └─────────────┘  └─────────┘
        │
        └─→ [Back to Home]
```

---

## 🔄 Data Flow Diagram

```
User Interaction (Click Service)
        │
        ▼
┌──────────────────────┐
│ setSelectedNodeId    │
│ in PlaygroundCanvas  │
└──────┬───────────────┘
       │
       ▼
┌──────────────────────────────────┐
│ Call onNodeSelect() callback      │
│ → Determine service type          │
│ → Set openConfigPanel             │
└──────┬───────────────────────────┘
       │
       ▼
┌──────────────────────────────────┐
│ Render Appropriate Config Panel   │
│ (API Gateway / Lambda / S3)       │
└──────┬───────────────────────────┘
       │
       ▼
┌──────────────────────────────────┐
│ User Updates Config Fields        │
│ → handleChange() updates local    │
└──────┬───────────────────────────┘
       │
       ▼
┌──────────────────────────────────┐
│ User Clicks [Calculate]          │
└──────┬───────────────────────────┘
       │
       ▼
┌──────────────────────────────────┐
│ Call API: calculateService()      │
│ (Uses mock in development)        │
└──────┬───────────────────────────┘
       │
       ▼
┌──────────────────────────────────┐
│ Receive Cost Response             │
│ {service, breakdown, details}     │
└──────┬───────────────────────────┘
       │
       ▼
┌──────────────────────────────────┐
│ Update Zustand Stores:            │
│ ✓ usePricingStore.setXCost()      │
│ ✓ useServiceConfigStore.update()  │
└──────┬───────────────────────────┘
       │
       ▼
┌──────────────────────────────────┐
│ Components Re-render:             │
│ ✓ Cost Panel (real-time)          │
│ ✓ Header Cost Display (updated)   │
│ ✓ All subscribed components       │
└──────────────────────────────────┘
```

---

## 🎨 UI Layout Breakdown

### Landing Page Layout
```
┌─────────────────────────────────────────┐
│         Navigation Bar                  │
│    Logo (Zap Icon)  [Features] [...]    │
├─────────────────────────────────────────┤
│                                         │
│    ┌─────────────────────────────────┐  │
│    │       HERO SECTION              │  │
│    │                                 │  │
│    │  🔌 Zap Icon (Large, Yellow)    │  │
│    │                                 │  │
│    │  Design, Simulate, Learn        │  │
│    │  AWS Architectures (Yellow)     │  │
│    │                                 │  │
│    │  [Start Building] [Case Studies]│  │
│    └─────────────────────────────────┘  │
│                                         │
├─────────────────────────────────────────┤
│  FEATURES (3 Columns)                   │
│  ┌────────┐ ┌────────┐ ┌────────┐      │
│  │Design  │ │Simulate│ │Learn   │      │
│  │Drag-   │ │Real    │ │5       │      │
│  │Drop    │ │world   │ │Patterns│      │
│  └────────┘ └────────┘ └────────┘      │
├─────────────────────────────────────────┤
│  PATTERNS (5 Overview Cards)             │
│  ┌──────────────────────────────────┐   │
│  │ Event-Driven → Est: $13,020/mo   │   │
│  └──────────────────────────────────┘   │
│  ┌──────────────────────────────────┐   │
│  │ Real-Time Analytics → $86/mo     │   │
│  └──────────────────────────────────┘   │
│  ┌──────────────────────────────────┐   │
│  │ Photo Sharing → $253,000/mo      │   │
│  └──────────────────────────────────┘   │
├─────────────────────────────────────────┤
│  CTA SECTION                            │
│  "Ready to Learn?"                      │
│  [Launch Playground]                    │
├─────────────────────────────────────────┤
│  FOOTER                                 │
│  © 2025 SystemArcht                     │
└─────────────────────────────────────────┘
```

---

### Playground Layout
```
┌─────────────────────────────────────────────────────────────────┐
│  [Back] Engineering Playground          Est. Cost: $X.XX/month  │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  [+ API Gateway] [+ Lambda] [+ S3] [Delete] [Clear]             │
│                                                                  │
│  ┌──────────────────────────────────────────────────────────┐   │
│  │                                                          │   │
│  │              🔌 API Gateway                             │   │
│  │                   │                                     │   │
│  │                   ▼                                     │   │
│  │     ⚡ Lambda                    🪣 S3                  │   │
│  │        │                                               │   │
│  │        ▼─────────────────────────────────────────┐     │   │
│  │                 Additional Lambdas             │   │   │   │
│  │                                                │   │   │   │
│  │  [MiniMap in corner]       [+ Zoom Controls]  │   │   │   │
│  │                                                │   │   │   │
│  └──────────────────────────────────────────────────────────┘   │
│                                                                  │
└──────────┬───────────────────────────────────────────────────────┘
           │
           ▼ (When service clicked)
┌──────────────────────────────────────────────────────────────────┐
│  CONFIG PANEL (Right Sidebar)                                    │
│  ┌────────────────────────────────────────────────────────────┐  │
│  │  🌐 API Gateway Configuration           [X Close]          │  │
│  │                                                            │  │
│  │  Region: [Asia Pacific (Mumbai) ▼]                        │  │
│  │                                                            │  │
│  │  ⚙️ API TYPE                                              │  │
│  │  (•) REST API - $3.50/million  💡 Full features           │  │
│  │  ( ) HTTP API - $1.00/million  💡 71% cheaper             │  │
│  │  ( ) WebSocket- $1.00/million  💡 Real-time               │  │
│  │                                                            │  │
│  │  Requests/Month:                                           │  │
│  │  [________1000000_______] requests                         │  │
│  │  💡 Each request billable regardless of success            │  │
│  │                                                            │  │
│  │  ┌──────────────────────────────────────────────┐         │  │
│  │  │  💰 COST BREAKDOWN                           │         │  │
│  │  │                                               │         │  │
│  │  │  API Requests: $3.50                         │         │  │
│  │  │  Cache:        $0.00                         │         │  │
│  │  │  ──────────────────                          │         │  │
│  │  │  TOTAL:        $3.50/month                   │         │  │
│  │  └──────────────────────────────────────────────┘         │  │
│  │                                                            │  │
│  │  [Calculate]  [Close]                                     │  │
│  └────────────────────────────────────────────────────────────┘  │
└──────────────────────────────────────────────────────────────────┘
```

---

## 📱 Component Export Dependencies

```
Page Component
    │
    ├── imports
    │   ├── CaseStudyDetail.jsx
    │   │   ├── imports: PlaygroundCanvas
    │   │   ├── imports: APIGatewayConfigPanel
    │   │   ├── imports: LambdaConfigPanel
    │   │   ├── imports: S3ConfigPanel
    │   │   └── imports: useArchitectureStore
    │   │
    │   └── PlaygroundCanvas.jsx
    │       ├── imports: ServiceNode
    │       ├── imports: useArchitectureStore
    │       ├── imports: ReactFlow, Controls, Background
    │       └── depends on: store/index.js
    │
    ├── stores
    │   └── Zustand Stores (store/index.js)
    │       ├── useArchitectureStore
    │       ├── useServiceConfigStore
    │       └── usePricingStore
    │
    └── api
        └── client.js
            ├── calculateAPIGatewayCost()
            ├── calculateLambdaCost()
            └── calculateS3Cost()
                ├── uses: mockAPIGatewayCalculate (lib/mocks.js)
                ├── uses: mockLambdaCalculate
                └── uses: mockS3Calculate
```

---

## 🎯 Service Configuration State Flow

```
APIGatewayConfigPanel Component
    │
    ├── State: localConfig (useState)
    ├── State: cost (useState)
    ├── State: loading (useState)
    │
    ├── useServiceConfigStore
    │   ├── Get: apiGatewayConfig
    │   └── Action: updateAPIGatewayConfig
    │
    └── usePricingStore
        └── Action: setAPIGatewayCost
            │
            └── Triggers auto-calculation of total cost
                ├── totalCost = api_gw_cost + lambda_cost + s3_cost
                └── Re-renders: PlaygroundPage (header)
```

---

## 💾 Architecture Data Structure

```javascript
// Stored in useArchitectureStore
{
  nodes: [
    {
      id: "api-gateway-123456",
      label: "API Gateway",
      serviceType: "api_gateway",
      position: { x: 100, y: 100 }
    },
    {
      id: "lambda-789012",
      label: "Lambda",
      serviceType: "lambda",
      position: { x: 300, y: 100 }
    },
    {
      id: "s3-345678",
      label: "S3",
      serviceType: "s3",
      position: { x: 500, y: 100 }
    }
  ],
  
  connections: [
    {
      id: "api-gateway-123456-lambda-789012",
      source: "api-gateway-123456",
      target: "lambda-789012"
    },
    {
      id: "lambda-789012-s3-345678",
      source: "lambda-789012",
      target: "s3-345678"
    }
  ]
}
```

---

## 🔌 API Response Structure

```javascript
// From calculateAPIGatewayCost()
{
  service: "api_gateway",
  breakdown: {
    total_cost: 2.00,
    api_requests_cost: 2.00,
    cache_cost: 0.00,
    websocket_connection_cost: 0.00
  },
  details: {
    http_api: {
      actual_requests: 1000000,
      request_chunks: 1,
      response_chunks: 1,
      billable_requests: 2000000,
      cost_usd: 2.00
    }
  }
}
```

---

## 🧭 Routing Map (Next.js)

```
/                          → Landing Page
                              └─ Hero + Features + CTA

/playground                 → Blank Playground
                              └─ PlaygroundCanvas + Config Panels

/case-studies               → Case Studies List
                              └─ CaseStudyCard[] (clickable)

/case-studies/netflix-like  → Event-Driven Case Study
                              ├─ Header (Problem & Scale)
                              └─ PlaygroundCanvas (Pre-loaded)

/case-studies/real-time-analytics → Analytics Case Study
                                    ├─ Header
                                    └─ PlaygroundCanvas

/case-studies/photo-sharing → Photo Sharing Case Study
                              ├─ Header
                              └─ PlaygroundCanvas
```

---

## ✨ Styling Layer Breakdown

```
Global (globals.css)
  └─ Tailwind directives
      └─ @tailwind base, components, utilities

Component-level (Tailwind classes)
  ├─ Layout: flex, grid, container, w-full, h-full
  ├─ Colors: bg-white, bg-yellow-500, text-gray-900
  ├─ Typography: font-bold, text-xl, font-sans
  ├─ Spacing: px-4, py-6, gap-2, m-auto
  ├─ Borders: border, border-gray-200, rounded-lg
  ├─ Effects: shadow-lg, hover:shadow-xl, transition
  ├─ Responsive: md:, lg:, sm: breakpoints
  └─ States: disabled:opacity-50, focus:ring-2

Shadcn/UI Integration
  └─ Button, Card, Dialog, Dropdown, Sheet, Tabs
      └─ Uses Tailwind + Radix UI under the hood
```

---

## 🚀 Deployment Architecture

```
Development (npm run dev)
  └─ http://localhost:3000
      ├─ Hot reload enabled
      ├─ Mock APIs (no backend needed)
      └─ Source maps for debugging

Production Build (npm run build)
  └─ Optimized bundle
      ├─ Code splitting
      ├─ Asset optimization
      ├─ Tree shaking
      └─ Minified CSS/JS

Deployment Options
  ├─ Vercel (recommended, Next.js native)
  ├─ Netlify (with build config)
  ├─ Traditional server (self-hosted)
  └─ Docker container
```

---

This visual architecture clearly shows how all components work together to create a seamless user experience for learning AWS cloud architecture!
