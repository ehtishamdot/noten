# Next.js with MongoDB - Feedback & History Implementation

## Overview
Feedback and history functionality is now **fully implemented in Next.js** using Next.js API routes and **MongoDB database**. Simple, flexible, and no separate backend required!

---

## ✅ What's Implemented

### **5 Next.js API Routes**
```
/api/auth/login          ✅ User authentication
/api/cases               ✅ List & create cases
/api/cases/[caseId]      ✅ Get & delete cases  
/api/cases/[caseId]/name ✅ Update case names
/api/feedback            ✅ Submit feedback
```

### **MongoDB Collections**
- `users` - User accounts (email-based auth)
- `sessions` - Authentication tokens (30-day expiry)
- `cases` - Saved patient cases with recommendations
- `feedback` - Granular feedback tracking

### **Frontend Integration**
- All existing pages work seamlessly
- Zero UI changes
- Auto-save cases after recommendations
- Complete history management

---

## 🚀 Quick Start

### 1. Install Dependencies
```bash
npm install
```

This installs `mongodb` driver automatically.

### 2. Set Up MongoDB

**Option A: MongoDB Atlas (Cloud - FREE)**
```bash
# 1. Go to https://www.mongodb.com/cloud/atlas
# 2. Create free account
# 3. Create M0 cluster (FREE tier)
# 4. Get connection string
# 5. Add to .env.local
```

**Option B: Local MongoDB**
```bash
# macOS
brew tap mongodb/brew
brew install mongodb-community@7.0
brew services start mongodb-community@7.0

# Windows: Download from mongodb.com
# Linux: See MONGODB_SETUP.md
```

**Option C: Docker**
```bash
docker run -d \
  --name note-ninjas-mongo \
  -p 27017:27017 \
  mongo:7.0
```

### 3. Configure Environment
```bash
# Copy example
cp env.example .env.local

# Edit .env.local:
OPENAI_API_KEY=your_openai_key_here
MONGODB_URI=mongodb://localhost:27017
# Or for Atlas:
# MONGODB_URI=mongodb+srv://user:pass@cluster.mongodb.net/
```

### 4. Run Application
```bash
npm run dev
```

Visit http://localhost:3000 🎉

**That's it!** MongoDB collections and indexes are created automatically on first use.

---

## 📋 Features

### ✅ Authentication
- Email-based login (no password)
- 30-day session tokens
- Auto-create users

### ✅ Case Management
- **Auto-save** after recommendations complete
- **GPT-generated** case names
- **List, view, rename, delete** cases
- Full case history with timestamps

### ✅ Feedback System
- Feedback on **subsections**
- Feedback on **exercises**  
- Feedback on **cues** (Verbal, Tactile, Visual)
- Feedback on **documentation examples**
- Feedback on **CPT codes**
- Rating + optional comments
- Full context stored

### ✅ History
- Sidebar with recent cases
- Full page at `/history`
- Click to load saved cases
- Rename/delete functionality

---

## 🗄️ MongoDB Collections

### users
```javascript
{
  _id: ObjectId,
  name: string,
  email: string,        // unique
  created_at: Date,
  updated_at: Date
}
```

### sessions
```javascript
{
  _id: ObjectId,
  user_id: ObjectId,
  token: string,        // unique
  created_at: Date,
  expires_at: Date      // 30 days
}
```

### cases
```javascript
{
  _id: ObjectId,
  user_id: ObjectId,
  name: string,
  input_json: object,   // patient data
  output_json: object,  // recommendations
  created_at: Date,
  updated_at: Date
}
```

### feedback
```javascript
{
  _id: ObjectId,
  user_id: ObjectId,
  case_id: string,
  feedback_type: string,    // exercise, cue, documentation, cpt_code
  exercise_name: string,
  cue_type: string,         // Verbal, Tactile, Visual
  cpt_code: string,
  example_number: number,
  rating: string,           // good, needs-work
  comments: string,
  context_json: object,     // full context
  created_at: Date
}
```

---

## 🔄 Data Flow

### Generating Recommendations
```
1. User submits form → Streaming starts
2. Recommendations stream in
3. When complete → POST /api/cases (auto-save)
4. Case appears in history
```

### Submitting Feedback
```
1. Click feedback button
2. Select rating + add comment
3. POST /api/feedback
4. Saved to MongoDB with full context
```

### Viewing History
```
1. GET /api/cases (load all)
2. Click case → GET /api/cases/[id]
3. Rename → PUT /api/cases/[id]/name
4. Delete → DELETE /api/cases/[id]
```

---

## 📁 Project Structure

```
/app
  /api
    /auth/login/route.ts        ✅ Authentication
    /cases/route.ts             ✅ List & create
    /cases/[caseId]/route.ts    ✅ Get & delete
    /cases/[caseId]/name/route.ts ✅ Update name
    /feedback/route.ts          ✅ Submit feedback
  /note-ninjas/suggestions/page.tsx  (works as-is)
  /history/page.tsx                  (works as-is)

/lib
  mongodb.ts                     ✅ MongoDB connection
  api.ts                         ✅ API client

MONGODB_SETUP.md                 ✅ Detailed setup guide
env.example                      ✅ Environment template
```

---

## 🧪 Testing

### Test Authentication
```bash
# Visit http://localhost:3000
# Enter name & email
# Should create user in MongoDB
```

### Test Case Creation
```bash
# Generate recommendations
# Wait for completion
# Case auto-saves to MongoDB

# Check MongoDB:
mongosh
use note_ninjas
db.cases.find().pretty()
```

### Test Feedback
```bash
# Click any feedback button
# Submit rating + comment
# Check MongoDB:
db.feedback.find().sort({created_at: -1}).limit(5).pretty()
```

### Test History
```bash
# Visit /history
# Should show all cases
# Try rename/delete
```

---

## 🚢 Deployment

### Vercel (Recommended)
```bash
# 1. Install Vercel CLI
npm i -g vercel

# 2. Deploy
vercel

# 3. Add environment variables in Vercel dashboard:
# - OPENAI_API_KEY
# - MONGODB_URI (use MongoDB Atlas)

# 4. Deploy to production
vercel --prod
```

### Environment Variables in Vercel
```
Settings > Environment Variables:
- OPENAI_API_KEY: sk-...
- MONGODB_URI: mongodb+srv://...
```

---

## 💡 Why MongoDB?

### Advantages
✅ **No schema migrations** - Add fields anytime  
✅ **JSON native** - Perfect for Next.js  
✅ **Free tier** - MongoDB Atlas M0 is free forever  
✅ **Easy setup** - No SQL needed  
✅ **Flexible** - Change structure on the fly  
✅ **Scalable** - Handles millions of documents  
✅ **Cloud-ready** - Works great with serverless

### Perfect For
- Rapid prototyping
- Flexible data structures
- Serverless deployments
- JSON-heavy applications
- Next.js integration

---

## 🔧 Troubleshooting

### Can't Connect to MongoDB
```
Error: connect ECONNREFUSED
```
**Solution:** Start MongoDB
```bash
brew services start mongodb-community@7.0  # macOS
sudo systemctl start mongod                # Linux
docker start note-ninjas-mongo             # Docker
```

### MongoDB Atlas Connection Issues
```
Error: Authentication failed
```
**Solution:**
1. Check username/password
2. Add IP 0.0.0.0/0 to Network Access (testing only)
3. Verify connection string format

### Environment Variable Not Found
```
Error: MONGODB_URI is required
```
**Solution:** Create `.env.local` file with MONGODB_URI

---

## 📚 Documentation

- **Setup Guide**: `MONGODB_SETUP.md` (detailed instructions)
- **This File**: Quick reference and overview
- **Environment**: `env.example`

---

## 🎯 Summary

**Everything works with MongoDB!**

✅ 5 API routes  
✅ 4 MongoDB collections  
✅ Auto-create database & indexes  
✅ Complete CRUD operations  
✅ Granular feedback tracking  
✅ Zero UI changes  
✅ Production-ready  

**Setup Steps:**
1. `npm install`
2. Set up MongoDB (Atlas or local)
3. Add `MONGODB_URI` to `.env.local`
4. `npm run dev`

Done! 🎉

---

## 📦 Files Modified/Created

### Created (7 files)
```
✨ lib/mongodb.ts
✨ app/api/auth/login/route.ts
✨ app/api/cases/route.ts
✨ app/api/cases/[caseId]/route.ts
✨ app/api/cases/[caseId]/name/route.ts
✨ app/api/feedback/route.ts
✨ MONGODB_SETUP.md
```

### Modified (2 files)
```
📝 package.json (mongodb instead of pg)
📝 env.example (MONGODB_URI)
```

### Unchanged (frontend)
```
✅ lib/api.ts (already points to /api/*)
✅ All page components work as-is
✅ Zero UI changes needed
```

---

## 🎉 You're All Set!

MongoDB integration is complete. Just install, configure, and run! 

For detailed MongoDB setup instructions, see **`MONGODB_SETUP.md`**.

Happy coding! 🚀

