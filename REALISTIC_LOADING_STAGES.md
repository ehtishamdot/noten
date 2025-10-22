# Realistic Loading Stages

## Overview
The loader now shows stages that reflect actual backend API progress instead of time-based animation.

## Implementation

### Loading Stages
1. **Stage 0**: "Considering patient condition…" 
   - Shown when API calls start
   - Backend is analyzing input and starting recommendation generation

2. **Stage 1**: "Generating treatment options…"
   - Shown when first subsection arrives from backend
   - Backend is actively generating multiple treatment recommendations

3. **Stage 2**: "Finalizing details…"
   - Shown when 4+ subsections have loaded (more than halfway done)
   - Backend is completing final recommendations

## Code Changes

### 1. Added Loading Stage State
**File**: `app/note-ninjas/suggestions/page.tsx`

```javascript
const [loadingStage, setLoadingStage] = useState(0);
```

### 2. Update Stage on API Start
```javascript
setIsLoading(true);
setLoadingStage(0); // Stage 1: Considering patient condition
```

### 3. Update Stage on First Response
```javascript
onUpdate: (subsection: any, index: number) => {
  // Move to stage 2 when first subsection arrives
  if (index === 0) {
    setLoadingStage(1); // Stage 2: Generating treatment options
  }
  
  // Move to stage 3 when we have 4+ subsections
  const loadedCount = updated.filter(Boolean).length;
  if (loadedCount >= 4) {
    setLoadingStage(2); // Stage 3: Finalizing details
  }
}
```

### 4. Reset on Complete
```javascript
onComplete: () => {
  setIsLoading(false);
  setLoadingStage(0); // Reset for next time
}
```

### 5. Updated MultiStepLoader Component
**File**: `app/components/MultiStepLoader.tsx`

Added `currentStage` prop:
```javascript
export const MultiStepLoader = ({
  loadingStates,
  loading,
  currentStage, // NEW: Accept current stage from parent
  // ...
}) => {
  // Use provided currentStage if available
  if (currentStage !== undefined) {
    setCurrentState(currentStage);
    return;
  }
  // Otherwise fall back to auto-progress
}
```

## User Experience

### Before (Time-based)
- Stages changed every 3 seconds regardless of backend progress
- Could show "Finalizing details" when nothing was loaded yet
- Not aligned with actual system state

### After (API-driven)
- ✅ Stage 1 shows immediately when processing starts
- ✅ Stage 2 shows when first results arrive (proves backend is working)
- ✅ Stage 3 shows when most results are ready (68% complete)
- ✅ Reflects actual backend progress

## Timeline Example

Typical flow:
```
0s:  Start → Stage 0 "Considering patient condition…"
     ↓ (Analyzing input, starting API calls)
     
5s:  First subsection arrives → Stage 1 "Generating treatment options…"
     ↓ (2 of 6 subsections loaded)
     
15s: 4th subsection arrives → Stage 2 "Finalizing details…"
     ↓ (4 of 6 subsections loaded)
     
30s: All complete → Loader disappears
     (6 of 6 subsections loaded + progression text)
```

## Benefits

1. **Honest Progress Indication**: Users see actual backend state
2. **Better Trust**: Loader reflects real work being done
3. **Informative**: Users know system is actively processing when stage advances
4. **No False Progress**: Won't show "Finalizing" if stuck on first API call
5. **Debugging**: Easier to identify if backend is stuck (stage won't advance)

## Fallback Behavior

If `currentStage` prop is not provided, the component falls back to time-based progression (original behavior). This ensures compatibility and prevents breaking changes.

## Testing

To verify stages update correctly:

1. Open browser DevTools console
2. Create a new case
3. Watch console logs:
   - "🚀 Starting parallel API calls!" → Should show Stage 0
   - "✅ Received subsection 0:" → Should advance to Stage 1
   - "✅ Received subsection 3:" → Should advance to Stage 2
   - "✅ All API calls complete!" → Loader disappears

4. Visual check:
   - Loader text should change when subsections start arriving
   - Stage 2 should show when more than half are loaded
   - Loader should disappear only when all complete
