# Project Spec: Career Sniper (AI Job Agent)
# Type: Internal Tool (Localhost)
# AI Model: Claude Sonnet 4.5 (Agentic Mode)

## 1. The Vision
A personal "Job Hunting OS" that automates the discovery and research of high-value jobs. Unlike mass-spam bots, this tool acts as a sniper: finding the perfect role, digging up "dirt" or "gold" on the company via social proof (Reddit, Kununu), and preparing a hyper-personalized application that no human Recruiter can ignore.

**Philosophy:** Quality over Quantity. 0€ Monthly Fixed Costs.

## 2. The "God Stack" (Zero Cost Architecture)
- **Framework:** Next.js 15 (App Router) with React 19.
- **Language:** TypeScript (Strict).
- **Database:** SQLite (local file) via **Drizzle ORM**. (No server costs).
- **UI:** Tailwind v4 + shadcn/ui + **Framer Motion** (for Tinder-like Swiping).
- **Browsing Engine:** **Stagehand** (or Playwright with stealth plugins). *Running locally to avoid proxy costs.*
- **AI Logic:** Vercel AI SDK Core (connects to Anthropic API).

## 3. Database Schema (SQLite)
The agent must create a `jobs` table with these columns:
- `id`: uuid
- `title`: text
- `company`: text
- `salary_range`: text (extracted or estimated)
- `source_url`: text
- `description`: text (full job post)
- `detective_report`: text (JSON: sentiment, red_flags, interview_questions)
- `status`: enum ('new', 'rejected', 'shortlisted', 'applied')
- `created_at`: timestamp

## 4. Core Agents & Features

### Agent A: "The Hunter" (Scraping via Stagehand)
- **Trigger:** Button "Hunt Jobs" in Dashboard.
- **Logic:**
  1. Open a local headless browser instance.
  2. Navigate to Google Jobs via search query: `site:linkedin.com/jobs OR site:stepstone.de OR site:indeed.com "[MY_ROLE]" "[MY_LOCATION]"`.
  3. **Cost Saving:** Do NOT use API calls. Extract the job cards directly from the DOM using Stagehand's `extract()` method.
  4. Save unique jobs to DB.
  5. **Safety:** Sleep 2-5 seconds between actions to simulate human behavior.

### Agent B: "The Detective" (Deep Research)
- **Trigger:** Automatic background check for new jobs.
- **Logic:**
  1. Use Stagehand to perform specific Google searches for each company:
     - *"site:kununu.com [Company] marketing salary"*
     - *"site:reddit.com [Company] work culture"*
     - *"site:wiwi-treff.de [Company] bewerbung"*
  2. Scrape the text snippets from the search results.
  3. **Analysis:** Send gathered text to Sonnet 4.5 with the prompt:
     *"Analyze this data. Is this a toxic workplace? What are common interview questions? Give me a 'Red Flag' score from 0-10."*
  4. Save result to `detective_report`.

### Agent C: "The Matcher" (UI)
- **Interface:** A central Card Stack (Tinder Style).
- **Visuals:**
  - Front: Job Title, Salary, Company Logo.
  - **Overlay:** A "Warning Label" if the Detective found Red Flags (e.g., "Warning: Low Kununu Score").
- **Actions:**
  - Swipe Left (Key: ArrowLeft) -> Update status to 'rejected'.
  - Swipe Right (Key: ArrowRight) -> Update status to 'shortlisted'.

### Agent D: "The Closer" (Application Generator)
- **Input:** My `Master_CV.md` (stored in `/data`) + Job Description + Detective Report.
- **Output:**
  1. **Tailored CV:** Re-order bullet points to match the job description keywords.
  2. **Cover Letter:** Write a letter that mentions specific cultural points found by the Detective (e.g., "I read about your focus on X in WiWi-Treff...").
  3. **Email Draft:** Ready-to-send text.

## 5. Step-by-Step Implementation Plan for Claude Code
1. **Setup:** Initialize Next.js 15, install Stagehand, Drizzle, and Framer Motion.
2. **DB:** Create the SQLite schema and run migrations.
3. **Scraper:** Build the "Hunter" script using Stagehand. Test it on Google first to ensure it bypasses bot detection.
4. **UI:** Build the Swipe-Card component.
5. **Research:** Implement the "Detective" logic.
6. **Generation:** Connect the "Closer" to Sonnet 4.5 for text generation.

## 6. Constraints & Rules
- **NO PAID APIs:** Do not suggest SerpApi or Proxycurl. Rely on local browser automation (Stagehand).
- **Rate Limiting:** Crucial. The tool must respect a "Human Speed" to keep my IP safe.
- **Error Handling:** If a selector changes (HTML), the Agent should try to self-heal or log a clear error.