# OpenAI Embeddings Integration Guide

This guide explains how to switch your Note Ninjas RAG system from sentence-transformers to OpenAI embeddings for improved performance and quality.

## 🚀 Quick Start

### 1. Set up OpenAI API Key

```bash
# Method 1: Environment variable
export OPENAI_API_KEY='your-openai-api-key-here'

# Method 2: Create .env file
cp .env.example .env
# Edit .env and set your API key
```

### 2. Install Dependencies

```bash
pip install -r requirements.txt
```

### 3. Test Configuration

```bash
python test_openai_embeddings.py
```

### 4. Regenerate Embeddings

```bash
python regenerate_embeddings_openai.py
```

### 5. Start the Server

```bash
python main.py
```

## 📋 Detailed Setup

### Configuration Options

The system supports several OpenAI embedding models:

| Model | Dimensions | Cost | Performance |
|-------|------------|------|-------------|
| `text-embedding-3-small` | 1536 | Lower | Good |
| `text-embedding-3-large` | 3072 | Higher | Best |
| `text-embedding-ada-002` | 1536 | Medium | Good (legacy) |

**Recommended**: `text-embedding-3-small` for best cost/performance ratio.

### Environment Variables

```bash
# Required
OPENAI_API_KEY=your-key-here

# Optional (with defaults)
USE_OPENAI_EMBEDDINGS=true
OPENAI_EMBEDDING_MODEL=text-embedding-3-small
```

### Configuration in `config.py`

The system automatically detects your OpenAI settings:

```python
USE_OPENAI_EMBEDDINGS: bool = True
OPENAI_API_KEY: str = ""
OPENAI_EMBEDDING_MODEL: str = "text-embedding-3-small"
```

## 🔄 Migration Process

### Step 1: Backup Current Embeddings

Your existing embeddings are automatically backed up when regenerating:

```
vector_store/
├── embeddings.pkl          # New OpenAI embeddings
├── embeddings_backup.pkl   # Your old sentence-transformer embeddings
└── chunks.json             # Document chunks (unchanged)
```

### Step 2: Generate New Embeddings

```bash
python regenerate_embeddings_openai.py
```

This script will:
- Load existing document chunks
- Generate OpenAI embeddings in batches
- Save new embeddings while backing up old ones
- Show progress and usage statistics

**Expected output:**
```
INFO:__main__:Generating embeddings for 5234 texts using text-embedding-3-small
INFO:__main__:Processing batch 1/53
INFO:__main__:Processing batch 2/53
...
==================================================
EMBEDDING REGENERATION COMPLETE
==================================================
Model used: text-embedding-3-small
Total chunks: 5234
Embedding dimensions: 1536
Total embeddings: 5234
==================================================
```

### Step 3: Verify System

Test the complete system:

```bash
# Test configuration and API
python test_openai_embeddings.py

# Test the full RAG system
python test_rag_direct.py
```

## 💰 Cost Estimation

**Text Embedding 3 Small**: $0.00002 per 1K tokens

For a typical Note Ninjas corpus:
- ~5,000 document chunks
- ~1,000 tokens per chunk average
- **Estimated cost**: ~$0.10 for full regeneration
- **Query cost**: ~$0.00002 per query

## 🔧 Troubleshooting

### Common Issues

#### 1. API Key Not Found
```
Error: OPENAI_API_KEY not set
```

**Solution:**
```bash
export OPENAI_API_KEY='your-key-here'
# or add to .env file
```

#### 2. Rate Limiting
```
Error: Rate limit exceeded
```

**Solution:** The system includes automatic rate limiting with delays. For faster processing, upgrade your OpenAI account tier.

#### 3. Model Not Found
```
Error: Invalid model specified
```

**Solution:** Use one of the supported models:
- `text-embedding-3-small` (recommended)
- `text-embedding-3-large`
- `text-embedding-ada-002`

#### 4. Memory Issues
```
Error: Out of memory
```

**Solution:** The system processes embeddings in batches of 100. This should handle large corpora on most systems.

### Fallback Mechanism

The system includes automatic fallback:

1. **Primary**: OpenAI embeddings (if configured and working)
2. **Fallback**: Sentence-transformers (if OpenAI fails)

## 📊 Performance Comparison

| Metric | Sentence Transformers | OpenAI Embeddings |
|--------|----------------------|-------------------|
| **Quality** | Good | Excellent |
| **Speed (Generation)** | Fast (local) | Medium (API) |
| **Speed (Query)** | Fast (local) | Medium (API) |
| **Cost** | Free | ~$0.00002/1K tokens |
| **Dimensions** | 384 (MiniLM) | 1536 (3-small) |
| **Model Updates** | Manual | Automatic |

## 🔄 Switching Back

To revert to sentence-transformers:

1. **Set environment variable:**
   ```bash
   export USE_OPENAI_EMBEDDINGS=false
   ```

2. **Restore backup embeddings:**
   ```bash
   cd vector_store/
   mv embeddings.pkl embeddings_openai.pkl
   mv embeddings_backup.pkl embeddings.pkl
   ```

3. **Restart the system:**
   ```bash
   python main.py
   ```

## 🚀 Advanced Configuration

### Batch Size Optimization

Adjust batch size in `regenerate_embeddings_openai.py`:

```python
class OpenAIEmbeddingGenerator:
    def __init__(self, api_key: str, model: str = "text-embedding-3-small"):
        self.batch_size = 100  # Increase for faster processing (if rate limits allow)
```

### Custom Model Configuration

To use a different OpenAI model:

```bash
export OPENAI_EMBEDDING_MODEL=text-embedding-3-large
```

Or modify in `config.py`:

```python
OPENAI_EMBEDDING_MODEL: str = "text-embedding-3-large"
```

### Monitoring Usage

The system logs OpenAI API usage for each embedding generation:

```python
logger.info(f"Usage: {response.usage}")
# Output: Usage: Usage(prompt_tokens=245, total_tokens=245)
```

## 📚 Additional Resources

- [OpenAI Embeddings Guide](https://platform.openai.com/docs/guides/embeddings)
- [OpenAI API Reference](https://platform.openai.com/docs/api-reference/embeddings)
- [OpenAI Pricing](https://openai.com/pricing)

## 🤝 Support

If you encounter issues:

1. Run the test script: `python test_openai_embeddings.py`
2. Check the logs for detailed error messages
3. Verify your OpenAI API key has sufficient credits
4. Ensure you have internet connectivity for API calls

The system is designed to be robust with automatic fallbacks and detailed logging to help diagnose any issues.