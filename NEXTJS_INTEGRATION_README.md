# Next.js Feedback & History Implementation

## Overview
This implementation includes **feedback and history functionality directly in Next.js** using Next.js API routes and PostgreSQL database. No separate Python backend required for these features!

## ✅ What's Implemented

### 1. **Next.js API Routes**
All backend functionality is implemented as Next.js API routes:

- **Authentication**
  - `POST /api/auth/login` - Login or create user

- **Case Management**
  - `GET /api/cases` - List all user cases
  - `POST /api/cases` - Create new case
  - `GET /api/cases/[caseId]` - Get specific case
  - `PUT /api/cases/[caseId]/name` - Update case name
  - `DELETE /api/cases/[caseId]` - Delete case

- **Feedback**
  - `POST /api/feedback` - Submit feedback

### 2. **Database Schema**
PostgreSQL tables:
- `users` - User accounts
- `sessions` - Authentication tokens
- `cases` - Saved cases with input/output
- `feedback` - Granular feedback on exercises, cues, docs, CPT codes

### 3. **Frontend Integration**
- API client (`lib/api.ts`) updated to use Next.js routes
- All pages (suggestions, history) integrated
- Feedback submission with full context
- Case auto-save after recommendations

---

## 🚀 Setup Instructions

### 1. Install Dependencies
```bash
npm install
```

This will install:
- `pg` - PostgreSQL client
- `@types/pg` - TypeScript types

### 2. Set Up PostgreSQL Database

#### Option A: Local PostgreSQL
```bash
# Install PostgreSQL (if not installed)
# macOS
brew install postgresql
brew services start postgresql

# Create database
createdb note_ninjas

# Run schema
psql note_ninjas < database-schema.sql
```

#### Option B: Docker PostgreSQL
```bash
docker run --name note-ninjas-postgres \
  -e POSTGRES_PASSWORD=password \
  -e POSTGRES_DB=note_ninjas \
  -p 5432:5432 \
  -d postgres:15

# Wait a few seconds, then run schema
docker exec -i note-ninjas-postgres psql -U postgres -d note_ninjas < database-schema.sql
```

#### Option C: Vercel Postgres (for deployment)
```bash
# Install Vercel CLI
npm i -g vercel

# Create Vercel Postgres database
vercel postgres create

# Get connection string and add to .env.local
```

### 3. Configure Environment Variables
```bash
# Copy example file
cp .env.local.example .env.local

# Edit .env.local with your values:
# - OPENAI_API_KEY: Your OpenAI API key
# - DATABASE_URL: Your PostgreSQL connection string
```

### 4. Run the Application
```bash
npm run dev
```

Visit http://localhost:3000

---

## 📊 Data Flow

### Case Creation
```
User generates recommendations
→ Streaming completes
→ POST /api/cases (auto-saves to DB)
→ Case appears in history
```

### Feedback Submission
```
User clicks feedback button
→ Selects rating (good/needs-work)
→ Adds optional comment
→ POST /api/feedback (saves to DB)
→ Feedback stored with full context
```

### History Management
```
Load history: GET /api/cases
Select case: GET /api/cases/[caseId]
Rename case: PUT /api/cases/[caseId]/name
Delete case: DELETE /api/cases/[caseId]
```

---

## 🗄️ Database Structure

### Users Table
- Stores user accounts (email-based)
- Auto-created on first login

### Sessions Table
- Token-based authentication
- 30-day expiration
- Automatic cleanup

### Cases Table
- Stores patient input and recommendations
- Auto-generated descriptive names using GPT
- JSONB format for flexible storage

### Feedback Table
- Granular feedback tracking:
  - `feedback_type`: exercise, cue, documentation, cpt_code, suggestion
  - `exercise_name`: Associated exercise
  - `cue_type`: Verbal, Tactile, Visual
  - `cpt_code`: Billing code
  - `example_number`: Documentation example
  - `rating`: good, needs-work
  - `comments`: Optional text
  - `context_json`: Full context for analysis

---

## 🔒 Security Features

- ✅ Token-based authentication
- ✅ SQL injection protection (parameterized queries)
- ✅ User isolation (can only access own data)
- ✅ Session expiration (30 days)
- ✅ Secure password-free email auth

---

## 🎯 Features

### Implemented
- ✅ User authentication
- ✅ Case creation and storage
- ✅ Auto-generated case names
- ✅ Case history loading
- ✅ Case renaming
- ✅ Case deletion
- ✅ Granular feedback system
- ✅ Feedback with full context
- ✅ Database persistence

### UI Features Preserved
- ✅ No UI changes
- ✅ Same user experience
- ✅ Feedback on all items (exercises, cues, docs, CPT codes)
- ✅ History sidebar
- ✅ Rename/delete cases
- ✅ Case selection

---

## 📝 Environment Variables

### Required
```bash
# OpenAI API Key (required for recommendations)
OPENAI_API_KEY=sk-...

# PostgreSQL Database URL (required for feedback & history)
DATABASE_URL=postgresql://username:password@host:port/database
```

### Optional
```bash
# Node environment
NODE_ENV=development

# Custom port (default: 3000)
PORT=3000
```

---

## 🧪 Testing

### Test Authentication
```bash
# Visit http://localhost:3000
# Enter name and email
# Should create user and redirect
```

### Test Case Creation
```bash
# Generate recommendations
# Wait for streaming to complete
# Case should auto-save
# Check PostgreSQL:
psql note_ninjas -c "SELECT id, name, created_at FROM cases ORDER BY created_at DESC LIMIT 5;"
```

### Test Feedback
```bash
# Click feedback button on any item
# Submit rating and optional comment
# Check PostgreSQL:
psql note_ninjas -c "SELECT id, feedback_type, rating, created_at FROM feedback ORDER BY created_at DESC LIMIT 5;"
```

### Test History
```bash
# Visit /history
# Should see saved cases
# Try renaming/deleting
```

---

## 🔧 Troubleshooting

### Database Connection Error
```
Error: connect ECONNREFUSED 127.0.0.1:5432
```
**Solution:** Make sure PostgreSQL is running and DATABASE_URL is correct

### OpenAI API Error
```
Error: OpenAI API key not configured
```
**Solution:** Add OPENAI_API_KEY to .env.local

### Authentication Error
```
Error: Unauthorized
```
**Solution:** Login again (token may have expired)

### Case Not Saving
```
Error: insert or update on table "cases" violates foreign key constraint
```
**Solution:** Make sure you're logged in and user exists in database

---

## 📚 API Documentation

### Authentication

#### POST /api/auth/login
```typescript
Request:
{
  name: string;
  email: string;
}

Response:
{
  user: {
    id: string;
    name: string;
    email: string;
    created_at: string;
  };
  token: string;
}
```

### Cases

#### GET /api/cases
```typescript
Headers: Authorization: Bearer <token>

Response: Array<{
  id: string;
  user_id: string;
  name: string;
  created_at: string;
}>
```

#### POST /api/cases
```typescript
Headers: Authorization: Bearer <token>
Request:
{
  input_json: any;
  output_json: any;
}

Response: Case (full case object)
```

### Feedback

#### POST /api/feedback
```typescript
Headers: Authorization: Bearer <token>
Request:
{
  case_id?: string;
  feedback_type: string;
  exercise_name?: string;
  cue_type?: string;
  cpt_code?: string;
  example_number?: number;
  rating?: string;
  comments?: string;
  context_json?: any;
}

Response: Feedback (full feedback object)
```

---

## 🚢 Deployment

### Vercel (Recommended)
```bash
# Install Vercel CLI
npm i -g vercel

# Deploy
vercel

# Set environment variables in Vercel dashboard:
# - OPENAI_API_KEY
# - DATABASE_URL (use Vercel Postgres or external)
```

### Other Platforms
Works on any platform that supports:
- Next.js 14+
- PostgreSQL
- Node.js 18+

---

## 📦 Project Structure

```
/app
  /api
    /auth
      /login
        route.ts          # Authentication endpoint
    /cases
      route.ts            # List/create cases
      /[caseId]
        route.ts          # Get/delete case
        /name
          route.ts        # Update case name
    /feedback
      route.ts            # Submit feedback
    /generate-recommendations
      route.ts            # GPT streaming (existing)
  /note-ninjas
    /suggestions
      page.tsx            # Integrated with feedback & history
  /history
    page.tsx              # Integrated with backend
  /components
    HistorySidebar.tsx    # Integrated with backend

/lib
  api.ts                  # Updated to use Next.js routes

database-schema.sql       # PostgreSQL schema
.env.local.example        # Environment variables template
```

---

## 💡 Next Steps

1. **Install dependencies**: `npm install`
2. **Set up PostgreSQL**: Run `database-schema.sql`
3. **Configure .env.local**: Add your keys
4. **Run app**: `npm run dev`
5. **Test flow**: Login → Generate → Feedback → History

Everything is ready to use! 🎉

