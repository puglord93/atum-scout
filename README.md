# ATUM Scout

Internal venture scouting and building platform for **ATUM Ventures** (Singapore).

Built for the team to source deep-tech from research institutes, evaluate technology offers, and manage the full venture building pipeline — from first contact with a PI to market analysis and assumption validation.

---

## What it does

### 🔬 Tech Sourcing
- Browse and filter **256 researchers** across Advanced Manufacturing, Biotech/Medtech, Energy/Climate
- Evaluate **313 tech offers** from NUS, NTU, A\*STAR, and other Singapore research institutions
- AI-powered outreach email generation (formal/casual, personalised per researcher)
- CRM pipeline: Identified → Reached Out → Replied → Meeting → POC → Partner
- Activity log per researcher — calls, emails, meetings, notes
- Semantic Scholar enrichment — auto-fill h-index, citations, affiliation
- URL ingest — paste arXiv/DOI link, auto-extracts tech offer details

### 🏗️ Venture Building
- Venture workspace with **6 AI-analyzed sections**: Summary, Market Context, Use Cases, vs. Existing, Unit Economics, Market Sizing
- Upload decks, papers, call notes as inputs — AI re-analyzes with every new input
- **Assumptions to Validate** — AI-extracted, priority-ranked (Critical / High / Medium), mark as validated
- **AI-suggested actions** based on unvalidated assumptions
- **Activity Log** per venture — customer interviews, calls, meetings, team notes
- Per-section methodology panels explaining why each section exists and what to look for

### 📊 Intelligence
- Dashboard with pipeline funnel, tier breakdown, recently contacted, top researchers
- AI scoring for tech offers (Market Size, IP Moat, TRL Trajectory, ATUM Fit — 1–10)
- Bulk actions — multi-select, batch stage update, CSV export

---

## Stack

| Layer | Tech |
|---|---|
| Frontend | Next.js 15 (App Router), React 19, TypeScript |
| Styling | Tailwind CSS v4 |
| Database | Neon PostgreSQL (serverless) via Prisma v5 |
| AI | OpenAI `gpt-4o-mini` (analysis, outreach, scoring) + `gpt-4o` (vision PDF extraction) |
| Hosting | Oracle Cloud Ubuntu 22.04, Nginx, PM2 |
| CI/CD | GitHub Actions — push to `main` auto-deploys |

---

## Development

```bash
npm install
npx prisma generate
npm run dev
# → http://localhost:3000
```

Requires `.env`:
```
DATABASE_URL="postgresql://..."
OPENAI_API_KEY="sk-..."
OPENAI_MODEL="gpt-4o-mini"
SITE_PASSWORD="..."
```

---

## Deployment

Every push to `main` triggers an automatic deploy via GitHub Actions:
`git pull` → `npm install` → `prisma generate` → `npm run build` → `pm2 restart`

Live at: `https://161-118-225-166.sslip.io`

---

## Roadmap

See [`ROADMAP.md`](./ROADMAP.md) for the full prioritised feature list.

**Next up:** Validation Board (Layout C) · AI Enrichment · Grant Pipeline
