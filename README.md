# Career Sniper 🎯

Your Personal Job Hunting OS - Quality over Quantity.

## Current Status

### ✅ Implemented (ALL Steps 1-6 Complete!)

#### 1. Setup & Database
- ✅ Next.js 15 + TypeScript + Tailwind v4
- ✅ SQLite Database with Drizzle ORM
- ✅ All dependencies installed (Stagehand, Framer Motion, Vercel AI SDK)

#### 2. Agent A: "The Hunter" (Job Scraper)
- ✅ Stagehand browser automation (LOCAL mode, no proxy costs)
- ✅ Google Jobs search (LinkedIn, StepStone, Indeed)
- ✅ DOM extraction with rate limiting (2-5 sec delays)
- ✅ Duplicate detection via URL
- ✅ Auto-save to SQLite

**Files:**
- `src/lib/hunter.ts` - Scraping engine
- `src/app/actions.ts` - Server actions
- `src/components/HuntButton.tsx` - UI trigger

#### 3. Agent B: "The Detective" (Deep Research)
- ✅ Multi-source research: Kununu, Reddit, WiWi-Treff
- ✅ AI Analysis with Claude Sonnet 4.5
- ✅ Red Flag Score (0-10)
- ✅ Interview questions extraction
- ✅ Cultural insights
- ✅ UI integration with expandable reports

**Files:**
- `src/lib/detective.ts` - Research engine
- `src/components/JobCard.tsx` - Report display

#### 4. Dashboard UI
- ✅ Hunt Jobs form (role + location)
- ✅ Live statistics (Total, New, Shortlisted, Applied)
- ✅ Job cards with filters
- ✅ Investigate button per job
- ✅ Red Flag badges

#### 5. Agent D: "The Closer" (Application Generator)
- ✅ Master CV integration (`/data/Master_CV.md`)
- ✅ AI-powered tailored CV generation
- ✅ Personalized cover letter (using Detective insights)
- ✅ Email draft generator
- ✅ Application preview modal with tabs
- ✅ Copy-to-clipboard functionality

**Files:**
- `src/lib/closer.ts` - Application generation engine
- `src/components/ApplicationModal.tsx` - Preview modal
- `data/Master_CV.md` - Your master CV template

## Getting Started

### Prerequisites
- Node.js 18+
- Google Gemini API Key (kostenlos bei https://aistudio.google.com/apikey)

### Installation

1. Clone and install:
```bash
npm install
```

2. Set up environment:
```bash
cp .env.example .env
# Add your Gemini API key to .env
# GOOGLE_GENERATIVE_AI_API_KEY=your_key_here
```

3. Run migrations:
```bash
npm run db:migrate
```

4. Start dev server:
```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000)

### Database Commands

```bash
npm run db:generate    # Generate migrations
npm run db:migrate     # Apply migrations
npm run db:studio      # Open Drizzle Studio
```

## Usage

### Complete Workflow

1. **Hunt Jobs**: Enter role and location, click "Hunt Jobs"
   - The Hunter Agent scrapes LinkedIn, StepStone, Indeed via Google
   - Jobs are automatically saved to local database

2. **Investigate Companies**: Click "🕵️ Investigate" on any job card
   - Detective Agent researches Kununu, Reddit, WiWi-Treff
   - AI analyzes and generates Red Flag Score (0-10)
   - View detailed cultural insights and interview questions

3. **Generate Application**: Click "📝 Generate Application" (appears after investigation)
   - AI tailors your CV to match job requirements
   - Creates personalized cover letter mentioning company insights
   - Generates ready-to-send email draft
   - Preview in modal with copy-to-clipboard

4. **Filter & Track**: Use status tabs to organize jobs
   - New, Shortlisted, Applied, Rejected

### First Time Setup

**Important**: Edit `data/Master_CV.md` with your actual CV before generating applications!

## Architecture

```
/src
  /app
    actions.ts          # Server Actions
    page.tsx            # Dashboard
  /components
    HuntButton.tsx      # Job search trigger
    JobCard.tsx         # Job display + Detective
    JobsList.tsx        # Jobs grid + filters
  /db
    schema.ts           # Database schema
    index.ts            # Drizzle client
    migrate.ts          # Migration runner
  /lib
    hunter.ts           # Scraper Agent
    detective.ts        # Research Agent
    closer.ts           # Application Generator
/data
  Master_CV.md          # Your master CV template
```

## Key Features

### 🎯 Sniper Approach
- No mass-spam bots
- Quality over quantity
- Deep research on every company

### 💰 Zero Cost Architecture
- SQLite (no DB hosting)
- Local browser (no proxy fees)
- Anthropic API only (pay-per-use)

### 🛡️ Safety First
- Rate limiting (2-5 sec delays)
- Human-like behavior simulation
- Stealth browser automation

## Implementation Status

1. ~~Setup~~ ✅
2. ~~Database~~ ✅
3. ~~Scraper (Hunter Agent)~~ ✅
4. ~~UI (Dashboard)~~ ✅
5. ~~Research (Detective Agent)~~ ✅
6. ~~Application Generator (Closer Agent)~~ ✅

**ALL FEATURES COMPLETE! 🎉**

### What's Working
- ✅ Job scraping from multiple sources
- ✅ Deep company research with AI
- ✅ Red flag analysis
- ✅ Automated application generation
- ✅ Beautiful, responsive UI
- ✅ Zero-cost architecture (except API usage)

## Tech Stack

- **Framework**: Next.js 15 (App Router)
- **Language**: TypeScript (Strict)
- **Database**: SQLite + Drizzle ORM
- **UI**: Tailwind v3 + Framer Motion
- **Browser**: Demo Mode (Stagehand optional)
- **AI**: Vercel AI SDK + Google Gemini 2.0 Flash

---

Made with 🎯 by Career Sniper
