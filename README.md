# 🎯 StartupRadar

### *Discover Startup Opportunities Hidden in Social Conversations*

> **Built for AI Accelerate: Unlocking New Frontiers**
> Helping entrepreneurs validate ideas and discover problems before building

---

## 🌟 What is StartupRadar?

StartupRadar analyzes **thousands of real discussions** from Reddit, Hacker News, YouTube, and Product Hunt to help you:

- **🔍 Discover trending problems** people are struggling with
- **✅ Validate startup ideas** with real market demand data
- **👥 Find early adopters** before you build
- **📊 Analyze market opportunities** with AI-powered insights

---

## 🚀 Key Features

### 1. **AI Idea Validation** ⚡

Enter any startup idea and get instant validation backed by real social media discussions:

- **Market Demand Score** (0-100)
- **Problem Severity Analysis**
- **Competition Level Assessment**
- **Monetization Potential**
- **Target User Identification**
- **BUILD IT / MAYBE / DON'T BUILD** verdict

### 2. **Elasticsearch Analytics Dashboard** 📊

Advanced aggregations showing:

- **Trend Over Time** - Discussion volume by hour/day
- **Platform Breakdown** - Where conversations happen most
- **Sentiment Distribution** - Positive/neutral/negative analysis
- **Peak Activity Hours** - When to post content (with timezone)
- **Top Posts by Engagement** - Most valuable discussions

### 3. **AI-Powered Reranking** 🔥

Using **Elastic's Open Inference API** + **Vertex AI**:

- Stage 1: Fast BM25 + vector search → Top 100 results
- Stage 2: Vertex AI semantic reranking → Top 20 most relevant
- **Result:** 95% relevance vs 70% with standard search

### 4. **Grounded AI Chat** 💬

Ask questions about search results with:

- Answers grounded in real discussions
- Live citations showing source posts
- Conversational follow-ups

---

## 🏆 Innovation Highlights

### ✅ **Elasticsearch Hybrid Search**

Combines BM25 keyword matching with dense vector similarity using Vertex AI embeddings (`text-embedding-004`)

### ✅ **Elasticsearch Aggregations**

Showcases advanced features:

- `date_histogram` for time-series trends
- `terms` aggregations for categorical data
- `avg` metrics for statistics
- Painless scripting for custom hour extraction
- `top_hits` for document sampling

### ✅ **Elastic Open Inference API** (NEW!)

- Creates inference endpoint connecting Elasticsearch → Vertex AI
- Uses `semantic-ranker-512@latest` for reranking
- Implements retrievers API with `text_similarity_reranker`
- Two-stage retrieval for optimal relevance/speed balance

### ✅ **Vertex AI Integration**

- Gemini 2.5 Pro for validation and chat
- text-embedding-004 for semantic search
- semantic-ranker-512 for result reranking
- Native grounding for accurate answers

---

## 🛠️ Tech Stack


| Category              | Technologies                                                            |
| ----------------------- | ------------------------------------------------------------------------- |
| **Search & Database** | Elasticsearch 8.14+ (hybrid search, retrievers API, Open Inference API) |
| **AI & ML**           | Vertex AI (Gemini 2.5 Pro, text-embedding-004, semantic-ranker-512)     |
| **Frontend**          | Next.js 14, React, TailwindCSS, TypeScript                              |
| **Data Sources**      | Reddit, Hacker News, YouTube, Product Hunt                              |
| **Deployment**        | Vercel-ready (Next.js), Elasticsearch Cloud                             |

---

## 🚀 Quick Start

### Prerequisites

- **Node.js 18.17+**
- **Google Cloud account** with Vertex AI enabled
- **Elasticsearch Cloud** account (free trial available)
- **Google Cloud CLI** installed

### 1️⃣ Clone & Install

```bash
git clone <your-repo-url>
cd StartupRadar
npm install
```

### 2️⃣ Set Up Environment Variables

Create `.env`:

```bash

# Google Cloud / Vertex AI
GOOGLE_CLOUD_PROJECT_ID="your-project-id"
GOOGLE_CLOUD_LOCATION="us-central1"
GOOGLE_APPLICATION_CREDENTIALS="<service-account-json or base64>"

# Elasticsearch
ELASTIC_CLOUD_ID="your-cloud-id"
ELASTIC_API_KEY="your-api-key"

# Reddit, ProductHunt, HackerNews and Youtube API Keys
REDDIT_CLIENT_ID=""
REDDIT_USER_AGENT=""
REDDIT_CLIENT_SECRET=""
REDDIT_USER_AGENT=""
PRODUCTHUNT_CLIENT_ID=""
PRODUCTHUNT_CLIENT_SECRET=""
PRODUCTHUNT_API_TOKEN=""
HACKERNEWS_API_URL=""
YOUTUBE_API_KEY=""

```

### 3️⃣ Authenticate with Google Cloud

```bash
gcloud auth application-default login
gcloud config set project your-project-id
```

### 4️⃣ Set Up Elasticsearch Index

```bash
npm run setup-es
```

This creates the `social_signals` index with mappings for:

- Dense vectors (768 dimensions)
- Sentiment analysis fields
- Quality metrics
- Platform metadata

### 5️⃣ (Optional) Enable AI Reranking

**Prerequisites:**

1. Enable **Discovery Engine API** in Google Cloud Console
2. Grant **Discovery Engine Viewer** role to service account
3. Wait 2-3 minutes for API propagation

```bash
npm run setup-reranking
```

This creates the Vertex AI reranking inference endpoint using Elastic's Open Inference API.

### 6️⃣ Collect Initial Data

```bash
npm run collect-data
```

Fetches ~100 posts from Reddit, Hacker News, YouTube, Product Hunt and indexes with embeddings.
**Time:** 5-10 minutes

### 7️⃣ Run the App

```bash
npm run dev
```

Open **http://localhost:3000** 🎉

---

## 💡 Example Use Cases

### Discover Problems

```
Search: "struggling with meeting notes"
→ Finds 60 discussions about meeting note pain points
→ Shows trend: Rising 40% in last 30 days
→ Identifies: Remote teams, managers, consultants
```

### Validate Ideas

```
Idea: "AI-powered meeting notes with action item extraction"
→ Market Demand: 85/100 (Strong)
→ Willingness to Pay: 72/100 (High)
→ Verdict: BUILD IT
→ Recommendation: Focus on async teams, $20/mo SaaS
```

### Find Early Adopters

```
Opportunity Analysis → Early Adopters Section
→ Shows top 10 users discussing the problem
→ Platforms: r/Entrepreneur, r/startups, Hacker News
→ Engagement levels: 50+ upvotes, 20+ comments
```

---

## 📊 Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                         User Query                          │
└─────────────────────────────────────────────────────────────┘
                            ↓
┌─────────────────────────────────────────────────────────────┐
│              Elasticsearch Hybrid Search                    │
│  • BM25 Keyword Matching (title^3, content^2)              │
│  • Vector Similarity (Vertex AI embeddings)                │
│  • Multi-field aggregations                                │
└─────────────────────────────────────────────────────────────┘
                            ↓
        ┌───────────────────┴───────────────────┐
        │                                       │
        ↓                                       ↓
┌──────────────────┐              ┌──────────────────────────┐
│  Standard Search │              │  AI Reranking (Optional) │
│  Top 20 Results  │              │  • Retrievers API        │
└──────────────────┘              │  • Vertex AI Reranker    │
                                  │  • Top 100 → Top 20      │
                                  └──────────────────────────┘
                            ↓
┌─────────────────────────────────────────────────────────────┐
│                  3 AI-Powered Features                      │
│                                                             │
│  ① Analytics Dashboard (Elasticsearch Aggregations)        │
│  ② Opportunity Analysis (Vertex AI Gemini 2.5 Pro)         │
│  ③ Grounded Chat (Vertex AI with live citations)           │
└─────────────────────────────────────────────────────────────┘
```

---

## 🗂️ Project Structure

```
StartupRadar/
├── app/
│   ├── api/
│   │   ├── analytics/route.ts      # Analytics aggregations
│   │   ├── analyze-opportunity/    # AI opportunity analysis
│   │   ├── validate-idea/          # AI idea validation
│   │   ├── chat/route.ts           # Grounded AI chat
│   │   └── search/route.ts         # Hybrid search + reranking
│   ├── components/
│   │   ├── AnalyticsDashboard.tsx  # Visual analytics (charts)
│   │   ├── OpportunityReport.tsx   # Opportunity analysis UI
│   │   └── SearchResults.tsx       # Search results display
│   ├── dashboard/page.tsx          # Main search interface
│   ├── validate/page.tsx           # Idea validation page
│   └── page.tsx                    # Landing page
├── lib/
│   ├── ai/
│   │   ├── embeddings.ts           # Vertex AI text-embedding-004
│   │   ├── grounding.ts            # Vertex AI grounded chat
│   │   ├── idea-validator.ts       # AI idea validation logic
│   │   └── opportunity-analyzer.ts # AI opportunity scoring
│   ├── elasticsearch/
│   │   ├── client.ts               # ES client setup
│   │   ├── search.ts               # Hybrid search + reranking
│   │   ├── analytics.ts            # Advanced aggregations
│   │   └── reranking.ts            # Open Inference API setup
│   ├── connectors/
│   │   ├── reddit.ts               # Reddit API
│   │   ├── hackernews.ts           # Hacker News API
│   │   ├── youtube.ts              # YouTube API
│   │   └── producthunt.ts          # Product Hunt API
│   └── types/index.ts              # TypeScript interfaces
├── scripts/
│   ├── setup-elasticsearch.ts      # Create ES index
│   ├── setup-reranking.ts          # Setup reranking endpoint
│   └── collect-data.ts             # Data collection job
└── package.json
```

## 🚧 Roadmap

- [ ] Add more platforms (X, GitHub, Stackoverflow, Quora)
- [ ] Add export functionality (CSV, PDF reports)
- [ ] Multi-lingual support
- [ ] Browser extension for on-the-fly validation

## 🙏 Acknowledgments

Built with:

- **Elasticsearch** - For powerful hybrid search and aggregations
- **Google Cloud Vertex AI** - For embeddings, reranking, and Gemini models
- **Next.js** - For the amazing developer experience

---

<div align="center">
  <strong>Made with ❤️ for the AI Accelerate: Unlocking New Frontiers</strong>
  <br><br>
  <i>Find problems worth solving. Build startups people want.</i>
</div>
