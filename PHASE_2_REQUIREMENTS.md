# Phase 2 Requirements - Implementation Plan

## Date: October 14, 2025

## Overview
This document outlines the requirements for Phase 2 of Note Ninjas development, focusing on RAG implementation, user authentication, case history, and feedback system.

---

## 1. GPT with RAG (No Explicit Instructions)

### Requirements
- Add documents via RAG system
- **Do NOT** explicitly tell the model to use RAG or how to use it
- Let GPT naturally come up with best answers using available context
- Remove all source citations from output

### Implementation
```python
# backend/simple_main.py modifications needed:

# 1. Enable RAG system
# 2. Pass retrieved context to GPT implicitly
# 3. Remove citation requirements from prompt
# 4. Let GPT use context naturally without explicit instructions

# Example approach:
# - Retrieve relevant chunks from vector store
# - Include in system context without telling model it's RAG
# - Model generates answers naturally using available information
```

### Benefits
- More natural recommendations
- No citation overhead
- Faster processing (no source tracking)

---

## 2. Risk Factor Detection & Validation

### Requirements
- Identify patient risk factors: age, diabetes, cancer, concussion, injury history
- Check GPT recommendations against risk factors
- Flag or filter bad recommendations

### Implementation Steps

#### 2.1 Risk Factor Extraction
```python
def extract_risk_factors(patient_input: dict) -> list:
    """
    Extract risk factors from patient condition using GPT
    
    Returns: [
        {"type": "age", "value": "elderly", "severity": "moderate"},
        {"type": "diabetes", "present": true, "severity": "controlled"},
        {"type": "injury_history", "details": "previous rotator cuff surgery"}
    ]
    """
    pass
```

#### 2.2 Recommendation Validation
```python
def validate_recommendations(recommendations: dict, risk_factors: list) -> dict:
    """
    Use GPT to check recommendations against risk factors
    
    Prompt: "Given these risk factors: {risk_factors}
             Check if these recommendations are safe: {recommendations}
             Flag any contraindications or dangerous suggestions."
    
    Returns: {
        "safe": true/false,
        "warnings": [...],
        "filtered_exercises": [...]
    }
    """
    pass
```

#### 2.3 Integration Flow
```
User Input → Extract Risk Factors → Generate Recommendations (with RAG)
          ↓
    Validate Against Risk Factors → Filter/Warn → Return Safe Recommendations
```

---

## 3. Elimination of Sources

### Changes Required
- ✅ Remove all citation tracking
- ✅ Remove source references from output
- ✅ Simplify prompt (no citation instructions)
- ✅ Reduce backend processing overhead

### Files to Modify
- `backend/simple_main.py` - Remove citation logic
- Frontend - Already has no citations (no changes needed)

---

## 4. Feedback System

### Requirements
- Add feedback modal to each element of output
- Feedback structure:
  - **Exercise Recommendation**: "{exercise_name} Recommendation"
  - **Exercise Description**: "{exercise_name} Exercise Description"
  - **Cue**: "{cue_type} Cue" (Tactile/Visual/Verbal)
  - **Documentation Example**: "Documentation Example {example_number}"
  - **CPT Code**: "CPT Code {cpt_code}"

### Database Schema
```sql
CREATE TABLE feedback (
    id UUID PRIMARY KEY,
    user_id UUID REFERENCES users(id),
    case_id UUID REFERENCES cases(id),
    feedback_type VARCHAR(50), -- 'exercise_recommendation', 'cue', 'documentation', 'cpt_code'
    exercise_name VARCHAR(255),
    cue_type VARCHAR(50), -- 'verbal', 'tactile', 'visual'
    cpt_code VARCHAR(10),
    example_number INT,
    rating VARCHAR(20), -- 'good', 'needs-work'
    comments TEXT,
    context_json JSONB, -- Full context for retraining
    created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_feedback_type ON feedback(feedback_type);
CREATE INDEX idx_feedback_rating ON feedback(rating);
```

### Implementation
```python
# backend/routes/feedback.py

@app.post("/api/feedback")
async def submit_feedback(feedback: FeedbackSubmission):
    """
    Store feedback for model retraining
    
    Structure feedback for easy incorporation into training data
    """
    pass
```

### Frontend Integration
- ✅ Feedback modal already exists
- ✅ No changes needed to UI
- Need to wire up API calls for each feedback button

---

## 5. User Authentication System

### Requirements
- **Simplest possible authentication**
- Only name + email (unique)
- No password (for now)
- Store in database
- Block access until signed in
- "Your Account" button to view/edit details

### Database Schema
```sql
CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(255) NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

CREATE UNIQUE INDEX idx_users_email ON users(email);
```

### Implementation
```python
# backend/routes/auth.py

@app.post("/api/auth/login")
async def login(email: str, name: str):
    """
    Create or get user by email
    Return session token
    """
    user = get_or_create_user(email, name)
    token = create_session_token(user.id)
    return {"token": token, "user": user}

@app.get("/api/auth/me")
async def get_current_user(token: str):
    """
    Get current user from token
    """
    pass

@app.put("/api/auth/profile")
async def update_profile(token: str, name: str, email: str):
    """
    Update user profile
    """
    pass
```

### Session Management
- Use JWT tokens or simple session tokens
- Store in sessionStorage on frontend
- Include in all API requests

### Future Kajabi Integration
- Option 1: Use Kajabi API to validate users
- Option 2: Give users code from Kajabi, validate with webhooks
- Option 3: Build outside Kajabi completely
- **For now**: Simple email-based auth

---

## 6. Saving Cases

### Database Schema

#### Option 1: Simple JSON Approach
```sql
CREATE TABLE cases (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES users(id),
    name VARCHAR(255) NOT NULL, -- Auto-generated, editable
    input_json JSONB NOT NULL,
    output_json JSONB NOT NULL,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_cases_user_id ON cases(user_id);
CREATE INDEX idx_cases_created_at ON cases(created_at DESC);
```

#### Option 2: Normalized Approach (Better for Training)
```sql
CREATE TABLE cases (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES users(id),
    name VARCHAR(255) NOT NULL,
    input_simple JSONB,
    input_detailed JSONB,
    progression_output TEXT,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE exercises (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    case_id UUID REFERENCES cases(id) ON DELETE CASCADE,
    title VARCHAR(255) NOT NULL,
    description TEXT
);

CREATE TABLE cues (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    exercise_id UUID REFERENCES exercises(id) ON DELETE CASCADE,
    cue_type VARCHAR(50), -- 'verbal', 'tactile', 'visual'
    cue TEXT NOT NULL
);

CREATE TABLE documentation_examples (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    exercise_id UUID REFERENCES exercises(id) ON DELETE CASCADE,
    example_text TEXT NOT NULL
);

CREATE TABLE cpt_codes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    exercise_id UUID REFERENCES exercises(id) ON DELETE CASCADE,
    code VARCHAR(10) NOT NULL,
    title VARCHAR(255),
    description TEXT
);
```

### Auto-Generate Case Names
```python
def generate_case_name(input_data: dict) -> str:
    """
    Auto-generate case name using GPT
    
    Examples:
    - "21 Y/o Rotator Cuff Injury"
    - "81 Y/o Hip Reconstruction"
    - "Post-Concussion Balance Issues"
    
    User can edit later
    """
    prompt = f"Generate a short case name (max 50 chars) for: {input_data}"
    # Use GPT to generate name
    pass
```

### Implementation
```python
# backend/routes/cases.py

@app.post("/api/cases")
async def create_case(user_id: str, input_data: dict, output_data: dict):
    """
    Save case to database
    Auto-generate name
    """
    name = generate_case_name(input_data)
    case = save_case(user_id, name, input_data, output_data)
    return case

@app.get("/api/cases")
async def get_user_cases(user_id: str):
    """
    Get all cases for user
    Order by created_at DESC
    """
    pass

@app.get("/api/cases/{case_id}")
async def get_case(case_id: str):
    """
    Get specific case with all details
    """
    pass

@app.put("/api/cases/{case_id}/name")
async def update_case_name(case_id: str, name: str):
    """
    Update case name
    """
    pass

@app.delete("/api/cases/{case_id}")
async def delete_case(case_id: str):
    """
    Delete case (with confirmation)
    """
    pass
```

---

## 7. History Sidebar and Page

### Requirements
- ✅ History sidebar already exists in frontend
- ✅ "View All" button to go to history page
- ✅ History page allows rename/delete
- Delete requires confirmation
- Clicking case title navigates to output
- No editing (version control issues)

### Features Needed
1. **Sidebar**
   - Show recent cases (last 10)
   - "View All" button
   - Quick access to past cases

2. **History Page**
   - List all cases
   - Rename functionality
   - Delete with confirmation
   - Click to view case output

3. **No Editing**
   - Use "Create from Details" instead
   - Avoids version control complexity

---

## 8. Create from Details

### Requirements
- Button below "Case Details" on output page
- Clicking returns to input page
- Auto-populate with same details as past case
- Populate both simple and detailed inputs
- Land user on same input mode they used originally

### Implementation
```python
# On output page, add button:
# "Create New Case from Details"

# Store in sessionStorage:
sessionStorage.setItem('note-ninjas-form-data', JSON.stringify({
    patientCondition: case.input_json.patient_condition,
    desiredOutcome: case.input_json.desired_outcome,
    // ... all other fields
}))

# Navigate to input page
router.push('/note-ninjas')

# Input page checks for pre-filled data and populates fields
```

---

## Implementation Priority

### Phase 2.1 - Foundation
1. ✅ Set up PostgreSQL database
2. ✅ Create database schema (users, cases, feedback)
3. ✅ Implement simple authentication
4. ✅ User profile management

### Phase 2.2 - Case Management
1. ✅ Save cases to database
2. ✅ Auto-generate case names
3. ✅ Case history API endpoints
4. ✅ Frontend integration (no UI changes)

### Phase 2.3 - RAG & Validation
1. ✅ Enable RAG system (implicit mode)
2. ✅ Remove citations
3. ✅ Risk factor extraction
4. ✅ Recommendation validation

### Phase 2.4 - Feedback System
1. ✅ Feedback database tables
2. ✅ Feedback API endpoints
3. ✅ Wire up existing feedback modals
4. ✅ Store feedback for retraining

### Phase 2.5 - History & UX
1. ✅ History page implementation
2. ✅ Rename/delete functionality
3. ✅ "Create from Details" feature
4. ✅ Testing and refinement

---

## Database Technology Choice

### Recommendation: PostgreSQL
- Mature, reliable
- Excellent JSON support (JSONB)
- Full-text search capabilities
- Good for both simple and normalized schemas
- Easy to deploy on AWS RDS

### Alternative: MongoDB
- Native JSON storage
- Flexible schema
- Good for rapid development
- Less mature for complex queries

**Decision**: Use PostgreSQL for robustness and SQL capabilities

---

## Next Steps

1. Review this document
2. Confirm approach for each section
3. Set up database infrastructure
4. Begin implementation in priority order
5. No frontend changes (as requested)

---

## Notes

- Frontend is already built and should not be changed
- Focus on backend implementation
- Database design is crucial for feedback training
- Keep authentication simple for now
- Kajabi integration is future work
