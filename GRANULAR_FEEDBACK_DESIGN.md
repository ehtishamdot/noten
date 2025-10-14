# Granular Feedback System Design

## Database Schema

### Tables Structure

```
users
├── id (UUID, PK)
├── name (String)
├── email (String, unique)
├── created_at (DateTime)
└── updated_at (DateTime)

cases
├── id (UUID, PK)
├── user_id (UUID, FK → users.id)
├── name (String) - Auto-generated like "21 Y/o Rotator Cuff Injury"
├── input_simple (JSONB, nullable)
├── input_detailed (JSONB, nullable)
├── progression_output (JSONB)
├── created_at (DateTime)
└── updated_at (DateTime)

exercises
├── id (UUID, PK)
├── case_id (UUID, FK → cases.id)
├── title (String)
├── description (Text)
├── rationale (Text, optional)
├── contraindications (Text, optional)
├── progression_options (Text, optional)
├── dosage_specifics (Text, optional)
└── created_at (DateTime)

cues
├── id (UUID, PK)
├── exercise_id (UUID, FK → exercises.id)
├── cue_type (String) - 'Verbal', 'Tactile', 'Visual'
├── cue_text (Text)
├── order_index (Integer)
└── created_at (DateTime)

documentation_examples
├── id (UUID, PK)
├── exercise_id (UUID, FK → exercises.id)
├── example_text (Text)
├── order_index (Integer)
└── created_at (DateTime)

cpt_codes
├── id (UUID, PK)
├── exercise_id (UUID, FK → exercises.id)
├── code (String)
├── title (String)
├── description (Text)
└── created_at (DateTime)

feedback
├── id (UUID, PK)
├── user_id (UUID, FK → users.id)
├── case_id (UUID, FK → cases.id, nullable)
├── exercise_id (UUID, FK → exercises.id, nullable)
├── cue_id (UUID, FK → cues.id, nullable)
├── documentation_example_id (UUID, FK → documentation_examples.id, nullable)
├── cpt_code_id (UUID, FK → cpt_codes.id, nullable)
├── feedback_type (String) - 'helpful', 'not_helpful', 'very_helpful'
├── rating (Integer, 1-5)
├── comment (Text, optional)
├── feedback_scope (String) - 'exercise', 'cue', 'documentation', 'cpt_code'
└── created_at (DateTime)
```

## Feedback UI Implementation

### 1. Exercise Modal - Currently Implemented ✅
- **Location**: Bottom of exercise modal
- **Options**: 👍 Helpful / 👎 Not Helpful buttons
- **Target**: Entire exercise
- **Scope**: `feedback_scope='exercise'`

### 2. Individual Cue Feedback - TO BE ADDED
```tsx
{selectedExercise.cues.map((cue, index) => (
  <li key={index} className="flex items-start justify-between gap-2">
    <span className="flex-1">{cue}</span>
    <button 
      onClick={() => submitCueFeedback(cue.id, 'helpful')}
      className="text-green-600 hover:text-green-700"
    >
      👍
    </button>
    <button 
      onClick={() => submitCueFeedback(cue.id, 'not_helpful')}
      className="text-red-600 hover:text-red-700"
    >
      👎
    </button>
  </li>
))}
```

### 3. Documentation Example Feedback - TO BE ADDED
```tsx
{selectedExercise.documentation_examples.map((doc, index) => (
  <div key={index} className="bg-gray-50 rounded-lg p-4 relative">
    <p className="text-gray-700">{doc}</p>
    <div className="absolute top-2 right-2 flex gap-1">
      <button onClick={() => submitDocFeedback(doc.id, 'helpful')}>👍</button>
      <button onClick={() => submitDocFeedback(doc.id, 'not_helpful')}>👎</button>
    </div>
  </div>
))}
```

### 4. CPT Code Feedback - TO BE ADDED
```tsx
{selectedExercise.cpt_codes.map((cpt, index) => (
  <div key={index} className="bg-green-50 rounded-lg p-4">
    <div className="flex justify-between items-start">
      <div>
        <span className="font-semibold">CPT {cpt.code}</span>
        <p>{cpt.description}</p>
      </div>
      <div className="flex gap-1">
        <button onClick={() => submitCPTFeedback(cpt.id, 'helpful')}>👍</button>
        <button onClick={() => submitCPTFeedback(cpt.id, 'not_helpful')}>👎</button>
      </div>
    </div>
  </div>
))}
```

## Frontend Data Structure

### Current Exercise Structure (to be updated)
```typescript
interface Exercise {
  id: string;
  title: string;
  description: string;
  cues: Cue[];
  documentation_examples: DocumentationExample[];
  cpt_codes: CPTCode[];
}

interface Cue {
  id: string;
  type: 'Verbal' | 'Tactile' | 'Visual';
  text: string;
}

interface DocumentationExample {
  id: string;
  text: string;
}

interface CPTCode {
  id: string;
  code: string;
  title: string;
  description: string;
}
```

### Feedback Submission API

```typescript
// Submit feedback for any element
async function submitFeedback(params: {
  scope: 'exercise' | 'cue' | 'documentation' | 'cpt_code';
  targetId: string;  // exercise_id, cue_id, etc.
  feedbackType: 'helpful' | 'not_helpful' | 'very_helpful';
  rating?: number;
  comment?: string;
  caseId?: string;
}) {
  await fetch('/api/feedback', {
    method: 'POST',
    body: JSON.stringify({
      feedback_scope: params.scope,
      [scope === 'cue' ? 'cue_id' : 
       scope === 'documentation' ? 'documentation_example_id' :
       scope === 'cpt_code' ? 'cpt_code_id' : 'exercise_id']: params.targetId,
      feedback_type: params.feedbackType,
      rating: params.rating,
      comment: params.comment,
      case_id: params.caseId
    })
  });
}
```

## Implementation Steps

### Phase 1: Current State ✅
- [x] Basic feedback on exercises
- [x] Feedback modal with ratings
- [x] Console logging
- [x] Login/signup page

### Phase 2: Granular UI (Next Steps)
- [ ] Add 👍/👎 buttons to each cue
- [ ] Add 👍/👎 buttons to each documentation example
- [ ] Add 👍/👎 buttons to each CPT code
- [ ] Update exercise modal UI

### Phase 3: Database Integration
- [ ] Create new database tables
- [ ] Migrate existing data
- [ ] Update backend API endpoints
- [ ] Connect frontend to database

### Phase 4: Analytics
- [ ] Admin dashboard for feedback
- [ ] Feedback aggregation views
- [ ] ML training data export

## Benefits of Granular Feedback

1. **Better Training Data**: Know exactly which cues work vs don't
2. **Targeted Improvements**: Fix specific weak points
3. **User Engagement**: Quick thumbs up/down is easy
4. **Quality Metrics**: Track quality at component level
5. **Personalization**: Learn which cue styles users prefer

## Migration Path

1. Keep current simple backend running
2. Build frontend with all granular feedback UI
3. Set up new database schema in parallel
4. Test with sample data
5. Migrate and switch over
6. No downtime!

---

**Status**: Design complete, UI partially implemented
**Next**: Add granular feedback buttons to all components
**Database**: Schema designed, ready to implement
