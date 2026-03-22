# Config Panel Fixes - March 22, 2026

## Issues Fixed

### 1. React Flow Warning: nodeTypes Object Recreation
**Problem**: React Flow was warning about nodeTypes being recreated on every render
**Location**: `src/components/playground/PlaygroundCanvas.jsx` line 16-18

**Solution**:
- Moved `nodeTypes` object outside the component
- Renamed to `nodeTypesConfig` and defined at module level
- Updated ReactFlow to use `nodeTypes={nodeTypesConfig}`

**Code Change**:
```javascript
// BEFORE (inside component)
const PlaygroundCanvas = ({ onNodeSelect }) => {
  const nodeTypes = { serviceNode: ServiceNode };
  ...
}

// AFTER (outside component)
const nodeTypesConfig = { serviceNode: ServiceNode };

export const PlaygroundCanvas = ({ onNodeSelect }) => {
  ...
}
```

**Impact**: Eliminates React Flow warning without functional changes

---

### 2. Config Panel Not Appearing on Node Click
**Problem**: When clicking a service node, the configuration panel didn't slide in from the left

**Root Causes**:
1. Config panel was positioned absolutely inside a container with `overflow: hidden`, which clipped it
2. The fixed positioning of the panel was relative to the wrong ancestor

**Solution**:
- Moved config panel from absolute to fixed positioning
- Positioned it at `left: guideWidth` so it appears right next to the service guide
- Set `position: fixed` with full viewport height (`height: 100vh`)
- Removed from canvas container to avoid overflow clipping

**Code Structure**:
```jsx
// Config Panel now positioned at this level (not inside canvas)
<div ref={containerRef} className="flex-1 flex">
  <ServiceGuide />
  <Divider />
  <Canvas />         {/* No config panel inside */}
  
  {/* Config Panel at same level as Canvas - can overflow */}
  <ConfigPanel 
    fixed
    left={guideWidth}
    width="384px"
    zIndex="50"
  />
</div>
```

---

### 3. Enhanced Debugging
**Added Console Logging**:

In `PlaygroundCanvas.jsx` - onNodeClick:
```javascript
console.log('onNodeClick triggered:', { nodeId: node.id, node });
```

In `CaseStudyDetail.jsx` - handleNodeSelect:
```javascript
console.log('Node clicked:', { nodeId: node.id, serviceType, nodeData: node.data });
console.warn('Unknown service type:', serviceType); // If not matched
```

**Benefits**: 
- Verify node click is detected
- Confirm serviceType is extracted correctly
- Debug if panel doesn't open

---

## Testing the Fixes

### Step 1: Check React Flow Warning is Gone
- Open browser console
- Refresh `/case-studies/[id]` page
- Should NOT see warning about nodeTypes

### Step 2: Test Config Panel Appearing
1. Navigate to a case study detail page
2. Look for pre-populated architecture (e.g., Netflix case study)
3. Click any service node (blue box) on the canvas
4. **Expected**: Configuration panel should slide in from the LEFT
5. Check browser console for debugging logs

### Troubleshooting

**If config panel still doesn't appear:**

1. **Check Console Logs**:
   - Look for "onNodeClick triggered" log
   - If not present: Click handler may not be firing
   - Look for "Node clicked" log with serviceType
   - If serviceType is undefined: Data structure issue

2. **Check Element Inspector**:
   - Right-click config panel area → Inspect Element
   - Should see `<div class="fixed ... translate-x-0">` (when panel open)
   - Check if z-index: 50 is applied
   - Check if `translateX` is 0 (not `-full`)

3. **Common Issues**:
   - **Config panel behind canvas**: Check z-index values
   - **Config panel not visible**: Check `translate-x` value (should be `translate-x-0` when open)
   - **Node click not detected**: Check React Flow onNodeClick is firing

---

## CSS Classes Used

### Config Panel Animation
```css
transform transition-transform duration-300  /* Smooth 300ms slide */
translate-x-0                                 /* Visible position: left=guideWidth */
-translate-x-full                             /* Hidden position: off-screen left */
```

### Fixed Positioning
```css
fixed                           /* Fixed to viewport, not container */
z-50                           /* High z-index to avoid being covered */
top-0 left-[{guideWidth}px]   /* Dynamic positioning based on guide width */
```

---

## Data Flow Verification

### Node Data Structure
When a service is clicked, this data flows through:

```javascript
// 1. ReactFlow node structure (created in PlaygroundCanvas)
{
  id: "api_gateway-1234567890",
  data: { 
    label: "API GATEWAY",
    serviceType: "api_gateway"  // ← This is extracted
  },
  position: { x: 100, y: 100 },
  type: "serviceNode"
}

// 2. PlaygroundCanvas passes to CaseStudyDetail
onNodeSelect?.(node)  // Passes entire node object

// 3. CaseStudyDetail extracts serviceType
const serviceType = node?.data?.serviceType

// 4. Sets correct config panel
if (serviceType === 'api_gateway') {
  setOpenConfigPanel('api_gateway')  // ← Panel now visible
}
```

---

## Next Steps if Issues Persist

1. **Verify node structure**:
   ```javascript
   // In handleNodeSelect, add:
   console.log('Full node structure:', JSON.stringify(node, null, 2));
   ```

2. **Check event propagation**:
   - Verify onNodeClick is called (log should appear)
   - ReactFlow might have event handling issues

3. **Check CSS transforms**:
   - Developer tools → Elements → config panel div
   - Look for `transform: translateX(0px)` or `translateX(-384px)`

4. **Verify state updates**:
   - Add console.log in useEffect for openConfigPanel changes
   - Confirm state is being set correctly

---

## Performance Notes

- Fixed positioning avoids layout recalculations
- CSS transforms use GPU acceleration
- No functional performance impact from these fixes

---

## Rollback Info

If issues arise, can revert to absolute positioning inside canvas:
- Move config panel back inside canvas div
- Use `absolute left-0 top-0` positioning
- May need to adjust z-index

However, fixed positioning is the correct solution to avoid overflow clipping.
