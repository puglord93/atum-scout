# ATUM Scout — Roadmap

Last updated: Mar 2026

## What ATUM Scout does

Three workflows in one tool:
1. **Tech Sourcing** — discover and evaluate deep-tech from research institutes
2. **Venture Building** — AI-powered venture diligence, assumptions validation, action tracking
3. **Startup Sourcing** — (future) VC-style deal flow for startups

---

## ✅ Shipped

- Researchers table — filters, search, tier badges, affiliations
- Tech offers table — filters, search, VP/TRL scoring
- Researcher detail — overview, linked tech, contact & outreach
- Tech offer detail — overview, linked researcher, AI scoring
- AI outreach email generation (formal/casual, subject + body)
- Contact tracking — mark contacted, date, by whom
- Fuzzy matching — tech offers ↔ researchers via likelyPi
- CSV export — filtered views on both tables
- Pagination — 50 rows/page, smart ellipsis
- Dashboard — stat cards, tier/VP breakdown, pipeline funnel, recently contacted
- Ingest — URL (arXiv/DOI via Semantic Scholar + GPT fallback), manual tech offer, manual researcher
- Semantic Scholar enrichment — auto-fill h-index, citations, affiliation
- PDF/PPTX/DOCX text extraction + AI Vision mode for scanned PDFs
- Scouting pipeline — 6 CRM stages per researcher (Identified → Reached Out → Replied → Meeting → POC → Partner)
- AI tech offer scoring — Market Size, IP Moat, TRL Trajectory, ATUM Fit (1–10), color bars
- Notes system — per-researcher activity log (Note / Call / Email / Meeting)
- Bulk actions — multi-select, batch stage update, export selected
- Postgres migration — SQLite → Neon PostgreSQL (ap-southeast-1)
- Deployment — Oracle Cloud + Nginx + PM2 + HTTPS (sslip.io) + GitHub Actions auto-deploy
- Password gate — private beta login, 30-day cookie
- SWR caching — 5-min stale time, optimistic mutations
- Responsive design — mobile/tablet across all pages
- **Ventures workspace (Layout A)**
  - Venture cases list — card grid, status badges, linked researcher/tech offer
  - Create venture — link to researcher + tech offer
  - 6 AI-analyzed sections: Summary, Market Context, Use Cases, vs. Existing, Unit Economics, Market Sizing
  - Per-section regenerate + Analyze All dropdown
  - Input management — Call Notes, Deck, Paper, Email, Other (with file upload + AI Vision)
  - Assumptions to Validate — priority badges (Critical/High/Medium), AI auto-extract, clear all
  - AI-suggested actions from unvalidated assumptions
  - Action items — add, toggle done, inline edit
  - Methodology info panels (ⓘ) per section
  - Mobile responsive — scrollable section nav pills, responsive layout
  - Activity Log per venture (Note / Call / Email / Meeting / Customer Interview)

---

## 🔜 Next Up (prioritised)

### 1. AI Enrichment ← current
Deep AI-powered enrichment for researchers and tech offers — beyond Semantic Scholar.
- **Researcher**: research focus summary, recent publications/patents, citation trends, web presence hints, why they're relevant to ATUM's thesis
- **Tech offer**: comparable startups/companies, recent funding in the space, "why now" signals (regulatory changes, cost curves, new enabling tech), market context
- Triggered manually per record via "Enrich with AI" button — results saved to DB, shown inline on detail pages

### 2. Validation Board — Layout C
Kanban view for assumptions on a venture. Columns: **Untested → Testing → Validated → Invalidated**. Visual snapshot of where validation work stands. Toggle between current scroll view (Layout A) and board view.

### 3. Grant Pipeline
Per-venture tracking of Singapore deep-tech grant opportunities.
- Log grants being pursued per venture (Enterprise Singapore, NRF, SEEDS, MAS, etc.)
- Fields: grant name, amount, stage (Identified / Drafting / Submitted / Approved / Rejected), deadline, notes
- Dashboard widget showing grant pipeline across all active ventures

---

## 🗂 KIV (revisit later)

- **Weekly Sprint View** — "this week" dashboard across ventures: active assumptions, overdue actions, upcoming calls. Useful but overlaps with Notion — revisit when internal workflow is clearer.

---

## 🚫 Tabled

- **Startup Deal Flow** — separate pipeline for VC-style startup sourcing. Good idea but needs a clearer internal evaluation process first at ATUM. Revisit in Q3.
- **Customer Discovery Tracker** — structured customer interview log tied to assumptions. Current workaround (add as input, re-analyze) is good enough for now.
- **Co-founder Tracker** — using Workable for recruitment. No need to duplicate.
- **DD Checklist & Scorecard** — structured startup evaluation framework. Needs internal process to be defined first.
- **IC Memo Generator** — auto-generate investment committee memo. Not needed.
