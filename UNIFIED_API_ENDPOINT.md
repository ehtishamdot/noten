# Unified API Endpoint

## Overview
All parallel API calls have been consolidated into a single unified endpoint that handles everything on the backend.

## Changes Made

### 1. New Unified Endpoint
**File**: `app/api/generate-all-recommendations/route.ts`

**Features**:
- Handles all 6 subsection generations + progression text in one call
- Performs parallel processing on the backend (not frontend)
- Returns complete recommendations in a single response

**Request**:
```json
{
  "patientCondition": "21 year old female with torn rotator cuff",
  "desiredOutcome": "increase right shoulder abduction painless arc to 150°",
  "treatmentProgression": "progressed from 130° to 135° in week 1...",
  "sessionId": "session_123"
}
```

**Response**:
```json
{
  "subsections": [
    { "title": "Manual Therapy Techniques", "exercises": [...] },
    { "title": "Progressive Strengthening Protocol", "exercises": [...] },
    // ... 4 more subsections
  ],
  "progression_overview": "Given the patient's current limitation...",
  "session_id": "session_123",
  "high_level": [...],
  "confidence": "high"
}
```

### 2. Simplified Frontend
**File**: `app/note-ninjas/suggestions/page.tsx`

**Before** (Multiple API calls):
```javascript
// 7 separate API calls
fetch('/api/generate-progression', ...)
startStreaming(...) // Triggers 6 more calls internally
```

**After** (Single API call):
```javascript
const response = await fetch('/api/generate-all-recommendations', {
  method: 'POST',
  body: JSON.stringify({
    patientCondition,
    desiredOutcome,
    treatmentProgression,
    sessionId
  })
});

const data = await response.json();
// All subsections + progression in one response
```

### 3. Removed Hooks and Complexity
- **Removed**: `useStreamingRecommendations` hook
- **Removed**: Complex state management for parallel calls
- **Removed**: Individual subsection API calls
- **Simplified**: Loading stage management

## Benefits

### ✅ Simpler Frontend
- Single API call instead of 7
- No complex hook for managing parallel calls
- Easier to maintain and debug
- Clearer code flow

### ✅ Better Backend Control
- Parallel processing happens on server (more efficient)
- Single transaction for all recommendations
- Easier to add caching or rate limiting
- Better error handling (all-or-nothing approach)

### ✅ Performance
- Reduced network overhead (1 request instead of 7)
- Parallel OpenAI calls still happen (on backend)
- Faster perceived performance
- Less browser resource usage

### ✅ Reliability
- Single point of failure instead of 7
- Easier to retry on failure
- Consistent data (all recommendations match the same context)
- Better transaction management

## Loading Stages

Stages now update based on API call progress:

1. **Stage 0**: "Considering patient condition…"
   - When API call starts

2. **Stage 1**: "Generating treatment options…"  
   - Set immediately after request sent

3. **Stage 2**: "Finalizing details…"
   - When response is received

## Backward Compatibility

The old endpoints still exist:
- `/api/generate-recommendations` - Individual subsection generation
- `/api/generate-progression` - Progression text only

These can be removed once confirmed the unified endpoint works correctly.

## Testing

### Test the unified endpoint:
```bash
curl -X POST http://localhost:3000/api/generate-all-recommendations \
  -H "Content-Type: application/json" \
  -d '{
    "patientCondition": "21 year old female with torn rotator cuff",
    "desiredOutcome": "increase right shoulder abduction painless arc to 150°",
    "treatmentProgression": "progressed from 130° to 135° in week 1 with resistance band exercises, but progress stalled",
    "sessionId": "test_123"
  }'
```

### Expected behavior:
1. Single API call made from frontend
2. Backend processes all 7 generations in parallel
3. Response contains all 6 subsections + progression text
4. Loading stages update: 0 → 1 → 2
5. All recommendations display at once

## Performance Comparison

### Before (7 separate calls):
- Network: 7 requests, 7 responses
- Browser: Manages 7 concurrent connections
- Total time: ~30 seconds (limited by slowest call)

### After (1 unified call):
- Network: 1 request, 1 response
- Browser: Manages 1 connection
- Total time: ~30 seconds (same, parallel processing on backend)

**Result**: Same speed, much simpler code, better UX

## Migration Notes

### Frontend Changes:
1. Removed `useStreamingRecommendations` hook
2. Replaced streaming logic with single async/await call
3. Simplified state management
4. Updated loading stage logic

### Backend Changes:
1. Created `/api/generate-all-recommendations` endpoint
2. Consolidated subsection generation logic
3. Added parallel processing with `Promise.all()`
4. Single error handling point

### No Breaking Changes:
- Response format matches previous structure
- Loading stages work the same way
- UI behavior unchanged
- Case history format unchanged

## Future Enhancements

Possible improvements:
1. **Caching**: Cache responses for identical inputs
2. **Rate Limiting**: Single endpoint easier to rate limit
3. **Retries**: Implement retry logic on backend
4. **Progress Updates**: Add SSE for real progress updates
5. **Batching**: Handle multiple case generations in one call
