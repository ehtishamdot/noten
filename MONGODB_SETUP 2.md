# MongoDB Setup Guide

## Overview
This project uses **MongoDB** for storing users, cases, sessions, and feedback. MongoDB is a NoSQL database that's perfect for flexible, JSON-like documents.

---

## ✅ What You'll Get

### Collections (like tables)
- `users` - User accounts
- `sessions` - Authentication tokens
- `cases` - Saved patient cases with recommendations
- `feedback` - Granular feedback on exercises, cues, docs, CPT codes

### Indexes (for performance)
- User email lookup
- Session token lookup
- Case user_id lookup
- Feedback queries

---

## 🚀 Quick Setup Options

### Option 1: MongoDB Atlas (Cloud - Recommended)

**100% Free tier available!**

1. **Create Free Account**
   - Go to https://www.mongodb.com/cloud/atlas
   - Click "Try Free"
   - Sign up with email or Google

2. **Create Cluster**
   - Choose "M0 Sandbox" (FREE)
   - Select region closest to you
   - Click "Create Cluster"

3. **Set Up Access**
   ```
   Security > Database Access
   - Add Database User
   - Username: admin
   - Password: (generate secure password)
   - Database User Privileges: Read and write to any database
   ```

4. **Allow Network Access**
   ```
   Security > Network Access
   - Add IP Address
   - Choose "Allow Access from Anywhere" (0.0.0.0/0)
   - (For production, use specific IPs)
   ```

5. **Get Connection String**
   ```
   - Click "Connect" on your cluster
   - Choose "Connect your application"
   - Copy connection string
   - Replace <password> with your password
   ```

6. **Add to .env.local**
   ```bash
   MONGODB_URI=mongodb+srv://admin:YOUR_PASSWORD@cluster0.xxxxx.mongodb.net/note_ninjas?retryWrites=true&w=majority
   ```

---

### Option 2: Local MongoDB

#### macOS (Homebrew)
```bash
# Install MongoDB
brew tap mongodb/brew
brew install mongodb-community@7.0

# Start MongoDB
brew services start mongodb-community@7.0

# Verify it's running
mongosh
```

#### Windows
```bash
# Download installer from:
# https://www.mongodb.com/try/download/community

# Run installer
# MongoDB will start automatically as a service

# Open MongoDB Compass (GUI) or use mongosh
```

#### Linux (Ubuntu/Debian)
```bash
# Import public key
wget -qO - https://www.mongodb.org/static/pgp/server-7.0.asc | sudo apt-key add -

# Create list file
echo "deb [ arch=amd64,arm64 ] https://repo.mongodb.org/apt/ubuntu jammy/mongodb-org/7.0 multiverse" | sudo tee /etc/apt/sources.list.d/mongodb-org-7.0.list

# Install MongoDB
sudo apt-get update
sudo apt-get install -y mongodb-org

# Start MongoDB
sudo systemctl start mongod
sudo systemctl enable mongod
```

#### Add to .env.local
```bash
MONGODB_URI=mongodb://localhost:27017
```

---

### Option 3: Docker (Easy & Portable)

```bash
# Run MongoDB container
docker run -d \
  --name note-ninjas-mongo \
  -p 27017:27017 \
  -e MONGO_INITDB_DATABASE=note_ninjas \
  -v mongodb_data:/data/db \
  mongo:7.0

# Verify it's running
docker ps

# View logs
docker logs note-ninjas-mongo
```

#### Add to .env.local
```bash
MONGODB_URI=mongodb://localhost:27017
```

---

## 📊 Create Indexes (Optional but Recommended)

After first run, create indexes for better performance:

```javascript
// Connect to MongoDB (using mongosh or Compass)
use note_ninjas

// Create indexes
db.users.createIndex({ "email": 1 }, { unique: true })
db.sessions.createIndex({ "token": 1 }, { unique: true })
db.sessions.createIndex({ "expires_at": 1 })
db.cases.createIndex({ "user_id": 1 })
db.cases.createIndex({ "created_at": -1 })
db.feedback.createIndex({ "user_id": 1 })
db.feedback.createIndex({ "case_id": 1 })
db.feedback.createIndex({ "created_at": -1 })
```

Or use this single command:
```javascript
// Create all indexes at once
db.users.createIndex({ "email": 1 }, { unique: true });
db.sessions.createIndex({ "token": 1 }, { unique: true });
db.sessions.createIndex({ "expires_at": 1 });
db.cases.createIndex({ "user_id": 1 });
db.cases.createIndex({ "created_at": -1 });
db.feedback.createIndex({ "user_id": 1 });
db.feedback.createIndex({ "case_id": 1 });
db.feedback.createIndex({ "created_at": -1 });
```

---

## 🔍 View Your Data

### Using MongoDB Compass (GUI)
1. Download from https://www.mongodb.com/products/compass
2. Connect using your MONGODB_URI
3. Browse collections visually
4. Run queries with UI

### Using mongosh (CLI)
```javascript
// Connect
mongosh "your-connection-string"

// Or if local
mongosh

// Switch to database
use note_ninjas

// View users
db.users.find().pretty()

// View cases
db.cases.find().limit(5).pretty()

// View feedback
db.feedback.find().sort({created_at: -1}).limit(10).pretty()

// Count documents
db.cases.countDocuments()
db.feedback.countDocuments()

// Find cases for specific user
db.cases.find({ user_id: ObjectId("...") })
```

---

## 🧪 Test Your Connection

Create a test file:

```javascript
// test-mongodb.js
const { MongoClient } = require('mongodb');

const uri = process.env.MONGODB_URI || 'mongodb://localhost:27017';

async function test() {
  const client = new MongoClient(uri);
  
  try {
    await client.connect();
    console.log('✅ Connected to MongoDB!');
    
    const db = client.db('note_ninjas');
    const collections = await db.listCollections().toArray();
    console.log('📦 Collections:', collections.map(c => c.name));
    
  } catch (error) {
    console.error('❌ Connection failed:', error);
  } finally {
    await client.close();
  }
}

test();
```

Run it:
```bash
node test-mongodb.js
```

---

## 📝 Collection Schemas

### users
```javascript
{
  _id: ObjectId,
  name: String,
  email: String (unique),
  created_at: Date,
  updated_at: Date
}
```

### sessions
```javascript
{
  _id: ObjectId,
  user_id: ObjectId (ref: users),
  token: String (unique),
  created_at: Date,
  expires_at: Date
}
```

### cases
```javascript
{
  _id: ObjectId,
  user_id: ObjectId (ref: users),
  name: String,
  input_json: Object,
  output_json: Object,
  created_at: Date,
  updated_at: Date
}
```

### feedback
```javascript
{
  _id: ObjectId,
  user_id: ObjectId (ref: users),
  case_id: String (optional),
  feedback_type: String,
  exercise_name: String (optional),
  cue_type: String (optional),
  cpt_code: String (optional),
  example_number: Number (optional),
  rating: String,
  comments: String (optional),
  context_json: Object (optional),
  created_at: Date
}
```

---

## 🔧 Troubleshooting

### Connection Refused
```
Error: connect ECONNREFUSED 127.0.0.1:27017
```
**Solution:** Make sure MongoDB is running
```bash
# macOS
brew services start mongodb-community@7.0

# Linux
sudo systemctl start mongod

# Docker
docker start note-ninjas-mongo
```

### Authentication Failed
```
Error: Authentication failed
```
**Solution:** 
- Check username/password in connection string
- Verify user exists in MongoDB Atlas
- Check network access whitelist

### Cannot Connect to Atlas
```
Error: connection timeout
```
**Solution:**
- Check network access in Atlas (add 0.0.0.0/0 for testing)
- Verify connection string format
- Check firewall settings

### Database Not Found
**This is normal!** MongoDB creates databases and collections automatically when you first write data.

---

## 🚢 Deployment

### Vercel + MongoDB Atlas
```bash
# 1. Deploy to Vercel
vercel

# 2. Add environment variable in Vercel dashboard:
# Settings > Environment Variables
# Name: MONGODB_URI
# Value: mongodb+srv://...

# 3. Redeploy
vercel --prod
```

### Other Platforms
Works on any platform that supports:
- Node.js 18+
- Environment variables
- Network access to MongoDB

---

## 💡 Why MongoDB?

### Advantages
✅ **No schema migrations** - Add fields anytime  
✅ **Flexible data** - Store JSON directly  
✅ **Free tier** - MongoDB Atlas M0 is free forever  
✅ **Easy setup** - No SQL commands needed  
✅ **Great for prototyping** - Change structure on the fly  
✅ **Scalable** - Handles millions of documents  
✅ **JSON native** - Perfect for Next.js/JavaScript  

### Perfect For
- Rapid development
- Flexible data structures
- Document-based storage
- Cloud deployment
- Serverless functions

---

## 🎯 Next Steps

1. **Choose setup option** (Atlas recommended for beginners)
2. **Get connection string**
3. **Add to .env.local**
4. **Run `npm install`**
5. **Start app**: `npm run dev`
6. **Indexes created automatically** on first use

That's it! MongoDB is ready to go! 🎉

---

## 📚 Resources

- MongoDB Atlas: https://www.mongodb.com/cloud/atlas
- MongoDB Compass: https://www.mongodb.com/products/compass
- MongoDB Docs: https://www.mongodb.com/docs/
- Node.js Driver: https://www.mongodb.com/docs/drivers/node/current/

