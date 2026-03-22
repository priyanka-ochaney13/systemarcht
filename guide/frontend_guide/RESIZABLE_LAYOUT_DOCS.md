# Case Study Detail Page - Resizable Layout

## New Layout Structure

```
┌─────────────────────────────────────────────────────────────┐
│                    Case Study Header                         │
│         Title | Scale | Cost | Key Insight | Services        │
├──────────────┬─────────────────────────────────────────────┐
│              │                                               │
│ SERVICE      │                                               │
│ GUIDE        │         PLAYGROUND CANVAS                    │
│ (Resizable)  │                                               │
│              │    [Config Panel Slides in from left →]      │
│              │                                               │
│ Sections:    │                                               │
│ • Services   │       (Click any service node                │
│ • Data Flow  │        to open config panel)                 │
│ • Patterns   │                                               │
│              │                                               │
└──────────────┴─────────────────────────────────────────────┘
```

## Features

### 1. Resizable Left Panel (Service Guide)
- **Default Width**: 320px
- **Min Width**: 250px
- **Max Width**: 50% of container
- **How to Resize**: 
  - Hover over the dividing line between Service Guide and Canvas
  - Cursor changes to `col-resize`
  - Click and drag left/right to resize
  - Divider highlights in yellow while resizing

### 2. Expandable/Collapsible Service Guide
- **Default State**: Visible
- **Sections**:
  - Services & Specifications (expandable/collapsible)
  - Data Flow Analysis (expandable/collapsible)
  - Connection Patterns (expandable/collapsible)
- **Expandable Services**: Click each service to see full details

### 3. Playground Canvas (Center)
- **Width**: Remaining space after resizing left panel
- **Features**:
  - Drag-and-drop service nodes
  - Connect services with edges
  - Delete nodes
  - Clear entire architecture
- **Interaction**: Click on any node to configure it

### 4. Sliding Configuration Panel
- **Position**: Slides in from LEFT (absolute overlay)
- **Animation**: Smooth 300ms transition
- **Width**: 384px (w-96)
- **Behavior**:
  - Hidden by default (translate-x-full)
  - Slides to visible position (translate-x-0) when a node is clicked
  - Overlays the left portion of the canvas
  - Can be closed by:
    - Clicking X button in header
    - Clicking another node to switch config
    - Clicking outside the panel
- **Z-index**: 50 (above canvas)

### 5. Smart Configuration Panels
- **API Gateway Config**: Region, API type, requests, caching
- **Lambda Config**: Architecture, memory, duration, concurrency
- **S3 Config**: Storage class, storage size, requests, transfer
- **Real-time Pricing**: Calculates cost as you adjust settings

## Interaction Flow

1. **Initial View**:
   ```
   [Service Guide] | [Playground Canvas]
   ```

2. **Click a Service Node**:
   ```
   [Service Guide] | [Config Panel][Playground Canvas]
                      ↑ slides in from left
   ```

3. **Resize Left Panel** (drag divider):
   ```
   [Service Guide (wider)] | [Playground Canvas]
                         or
   [Service Guide (narrower)] | [Playground Canvas]
   ```

4. **Close Config Panel** (X button or click node):
   ```
   [Service Guide] | [Playground Canvas]
   ```

## Code Implementation

### State Management
```javascript
const [guideWidth, setGuideWidth] = useState(320);        // Width in pixels
const [isResizing, setIsResizing] = useState(false);       // Resizing active?
const [openConfigPanel, setOpenConfigPanel] = useState(null); // Which panel to show
```

### Resize Logic
- `onMouseDown` on divider → `setIsResizing(true)`
- Mouse move → Calculate new width from mouse position
- Enforce min/max width constraints
- `onMouseUp` → `setIsResizing(false)`
- Update `guideWidth` state on each move

### Config Panel Position
```jsx
// Slides in from left when openConfigPanel has a value
<div className={`
  absolute left-0 top-0 bottom-0 w-96 
  transform transition-transform duration-300
  ${openConfigPanel ? 'translate-x-0' : '-translate-x-full'}
`}>
```

## Component Props & Refs

### Refs
- `containerRef`: Main flex container (for mouse position calculation)
- `resizeDividerRef`: Divider element (for mouse down detection)

### Event Handlers
- `handleResizeStart()`: Starts resize mode
- `handleMouseMove` (inside useEffect): Calculates new width
- `handleMouseUp` (inside useEffect): Ends resize mode

## CSS Classes Used

### Resize Divider
```css
w-1                           /* 4px width */
bg-gray-300                   /* Default gray */
hover:bg-yellow-500           /* Yellow on hover */
cursor-col-resize             /* Column resize cursor */
transition-colors             /* Smooth color change */
```

### Config Panel
```css
absolute left-0 top-0 bottom-0    /* Full height, left edge */
w-96                               /* 384px fixed width */
transform transition-transform     /* Smooth slide animation */
duration-300                       /* 300ms slide time */
z-50                              /* Above canvas (z-40) */
```

## Responsive Behavior

- **Mobile**: Can still resize but limited by screen width
- **Tablet**: Full functionality
- **Desktop**: Optimal experience with mouse drag resize

## Tips for Users

1. **Resize**: Slowly drag the divider between panels for precise width
2. **Open Config**: Click any service node on canvas
3. **Close Config**: Press X button or click another node
4. **Service Details**: Click service names in guide to expand/collapse
5. **Pan Canvas**: When config is open, scroll/pan the canvas
6. **Search**: Use guide's collapsible sections to find information

## Performance Notes

- Resize updates are throttled by `mousemove` events (natural browser throttling)
- Config panel uses CSS transforms for smooth animation (GPU accelerated)
- No expensive calculations during resize

## Potential Future Enhancements

1. **Persist Panel Widths**: Save user's preferred widths in localStorage
2. **Keyboard Shortcuts**: 
   - Esc to close config panel
   - Ctrl/Cmd+S to collapse all guide sections
3. **Touch Support**: Implement touch-based resizing for mobile
4. **Double-Click Reset**: Double-click divider to reset to default width
5. **Animate on First Load**: Slide config panel in smoothly on initial node click
