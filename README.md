# SignalScout 🔍

> Find startup opportunities hidden in social conversations

SignalScout uses **Elasticsearch hybrid search** and **Vertex AI grounding** to analyze real discussions from Reddit, Hacker News, Stack Overflow, and more - helping you discover trending problems, validate ideas, and find early adopters.

## 🎯 Built for AI Accelerate Hackathon - Elastic Challenge

This project demonstrates:
- ✅ **Elasticsearch hybrid search** (BM25 + vector similarity)
- ✅ **Vertex AI native grounding** (LLM + enterprise data)
- ✅ **Conversational AI interface** with real-time citations
- ✅ **Multi-platform data collection** (Reddit, HN, etc.)

## 🚀 Quick Start

### Prerequisites
- Node.js 18.17+
- Google Cloud account with Vertex AI enabled
- Elasticsearch Cloud account (or local instance)
- Google Cloud CLI (for authentication)

### 1. Install Dependencies

```bash
cd signalscout
npm install
```

### 2. Set Up Environment Variables

Copy `.env.local` and fill in your credentials:

```bash
# Google Cloud / Vertex AI
GOOGLE_CLOUD_PROJECT_ID="your-project-id"
GOOGLE_CLOUD_LOCATION="us-central1"

# Elasticsearch
ELASTIC_CLOUD_ID="your-cloud-id"
ELASTIC_API_KEY="your-api-key"

# Reddit (optional - uses public API by default)
REDDIT_USER_AGENT="SignalScout/1.0"
```

### 3. Authenticate with Google Cloud

```bash
gcloud auth application-default login
gcloud config set project your-project-id
```

### 4. Set Up Elasticsearch

```bash
npm run setup-es
```

### 5. Collect Initial Data

```bash
npm run collect-data
```

This will:
- Fetch posts from Reddit (r/startups, r/Entrepreneur, etc.)
- Fetch stories from Hacker News (top, Ask HN, Show HN)
- Generate embeddings using Vertex AI
- Index everything to Elasticsearch

Expected time: 5-10 minutes for ~100 posts

### 6. Run the App

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) 🎉

## 💬 Example Queries

Try asking SignalScout:
- "What problems are fintech founders facing?"
- "Find early adopters for AI developer tools"
- "What are people saying about no-code platforms?"
- "Trending problems in SaaS this week"

## 🏗️ Architecture

```
User Query → Vertex AI Gemini
              ↓ (grounding request)
         Elasticsearch
         (hybrid search: BM25 + vectors)
              ↓
    Top 10 relevant posts
              ↓
         Vertex AI Gemini
         (generates answer with citations)
              ↓
         User sees response
```

### Key Technologies

**Search & Storage:**
- Elasticsearch (hybrid search with dense vectors)
- Cosine similarity for semantic search
- BM25 for keyword matching

**AI & ML:**
- Vertex AI Gemini 1.5 Flash (conversation)
- Vertex AI text-embedding-004 (embeddings)
- Native grounding integration

**Data Sources:**
- Reddit API (public JSON endpoints)
- Hacker News API (Firebase)
- Extensible to Twitter, Product Hunt, etc.

## 📁 Project Structure

```
signalscout/
├── app/
│   ├── api/
│   │   ├── chat/route.ts        # Conversational AI endpoint
│   │   └── search/route.ts      # Search API
│   ├── page.tsx                 # Main UI
│   └── layout.tsx
├── lib/
│   ├── ai/
│   │   ├── embeddings.ts        # Vertex AI embeddings
│   │   └── grounding.ts         # Vertex AI grounding (KEY!)
│   ├── elasticsearch/
│   │   ├── client.ts            # ES client & indexing
│   │   └── search.ts            # Hybrid search
│   ├── connectors/
│   │   ├── reddit.ts            # Reddit data fetcher
│   │   └── hackernews.ts        # HN data fetcher
│   └── types/
│       └── index.ts             # TypeScript types
├── scripts/
│   ├── setup-elasticsearch.ts   # Setup ES index
│   └── collect-data.ts          # Background job
└── package.json
```

## 🔄 Automated Data Collection

Set up a cron job to collect fresh data every 6 hours:

```bash
crontab -e
```

Add:
```
0 */6 * * * cd /path/to/signalscout && npm run collect-data >> /var/log/signalscout.log 2>&1
```

## 🎯 Hackathon Compliance

### Elastic Challenge Requirements

✅ **Hybrid Search:** Combines BM25 (keyword) + vector similarity (semantic)
✅ **Vertex AI Integration:** Native grounding using Elasticsearch as data source
✅ **Conversational/Agent-based:** Chat interface with context awareness
✅ **Real Problem:** Helps founders validate startup ideas

### Key Files for Judges

- `lib/ai/grounding.ts` - Vertex AI grounding implementation
- `lib/elasticsearch/search.ts` - Hybrid search logic
- `lib/connectors/reddit.ts` - Data collection example
- `app/page.tsx` - Conversational UI

## 🚀 Deployment

### Vercel (Recommended)

```bash
vercel deploy
```

Set environment variables in Vercel dashboard.

### Docker

```bash
docker build -t signalscout .
docker run -p 3000:3000 signalscout
```

## 📊 Performance

- **Search latency:** ~200-400ms (hybrid search)
- **AI response:** ~2-4s (with grounding)
- **Data collection:** ~10 min for 100 posts
- **Storage:** ~1KB per post

## 🛠️ Development

```bash
# Run dev server
npm run dev

# Setup Elasticsearch
npm run setup-es

# Collect data
npm run collect-data

# Lint
npm run lint
```

## 📝 License

MIT

## 🙏 Acknowledgments

Built for the AI Accelerate Hackathon using:
- Elastic Cloud
- Google Cloud Vertex AI
- Reddit & Hacker News APIs

---

**Made with ❤️ for the AI Accelerate Hackathon**
