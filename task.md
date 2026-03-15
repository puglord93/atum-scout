# ATUM Scout — Task Tracker

## ✅ Completed

- [x] Researchers table page — data-dense UI, filters, search
- [x] Tech offers table page — proper column widths, filters, search
- [x] Researcher detail page — 3 tabs (Overview, Linked Tech, Contact & Outreach)
- [x] Tech offer detail page — 3 tabs (Overview, Linked Researcher, Analysis)
- [x] AI outreach email generation (OpenAI gpt-4o-mini, formal/casual, subject + body)
- [x] Contact tracking — mark as contacted, date, contacted by
- [x] Fuzzy matching — tech offers ↔ researchers via likelyPi field
- [x] Design system established (`.interface-design/system.md`)
- [x] Affiliation abbreviations (NUS, NTU, I2R, etc.)
- [x] Export CSV — download current filtered view on both Researchers and Tech Offers pages

## ✅ Completed (continued)

- [x] Pagination — 50 rows/page on both table pages, smart ellipsis page buttons, resets on filter change
- [x] Dashboard — Overview page with stat cards, tier breakdown, VP breakdown, recently contacted, top Tier A

## ✅ Completed (continued)

- [x] Detail page redesign — researcher and tech offer pages rebuilt as single-scroll 2-col layouts (no tab-clicking for core info)
- [x] Fix Next.js 15 params bug — all /api/researchers/[id] routes now correctly await params
- [x] Ingest feature — `/ingest` page with 3 modes:
  - URL ingest: paste arXiv/DOI/any URL → Semantic Scholar API first, GPT fallback → pre-filled review form → saves TechOffer + optional Researcher
  - Manual tech offer: free-form add with all fields
  - Manual researcher: free-form add with Semantic Scholar enrichment (auto-fill h-index, citations, affiliation)
- [x] `source` provenance field added to both Researcher and TechOffer models (excel_import / manual / url_ingest)
- [x] `POST /api/researchers` and `POST /api/tech-offers` — create endpoints
- [x] `POST /api/ingest` — URL extraction endpoint (Semantic Scholar → GPT-4o fallback)
- [x] `GET /api/enrich/researcher` — Semantic Scholar author lookup
- [x] "Add" button in nav → /ingest

## ✅ Completed (continued)

- [x] Scouting pipeline / CRM stages — 6-stage stepper on researcher detail page (Identified → Reached Out → Replied → Meeting → POC → Partner)
- [x] Pipeline funnel on dashboard — stage counts with color badges
- [x] Stage filter on researchers table

## ✅ Completed (continued)

- [x] AI tech offer scoring — structured GPT scores (Market Size, IP Moat, TRL Trajectory, ATUM Fit 1-10), rationale per dimension, summary, persisted to DB, color-coded score bars on detail page, avg score badge in header

## ✅ Completed (continued)

- [x] Notes system — per-researcher activity log with 4 note types (Note/Call/Email/Meeting), optimistic updates, localStorage author persistence, inline compose, delete on hover

## ✅ Completed (continued)

- [x] Postgres migration — SQLite → Neon PostgreSQL (ap-southeast-1), single clean migration
- [x] Oracle Cloud deployment — Ubuntu 22.04 AMD VM, Nginx reverse proxy, PM2 process manager
- [x] Password gate — private beta login page, 30-day cookie, consistent with app design system

## ✅ Completed (continued)

- [x] Bulk actions — multi-select rows, batch stage update, export selected
- [x] Responsive design — mobile/tablet breakpoints, hamburger nav, horizontal table scroll, stacked detail layouts

## ✅ Completed (continued)

- [x] HTTPS / SSL — Let's Encrypt cert (sslip.io), secure cookie in production, auto-renews via certbot
- [x] Deploy script — GitHub Actions: push to main → SSH → git pull → build → pm2 restart (zero manual steps)

## ✅ Completed (continued)

- [x] Performance optimization — SWR caching (5-min stale time for list queries, global SWRConfig provider, optimistic bulk-update mutation)

## ✅ Completed (continued)

- [x] Ventures workspace — `/ventures` section with full venture diligence workflow:
  - Venture cases list page — card grid with status badges, linked researcher/tech offer, input/question/action counts
  - Create venture form — link to existing researcher + tech offer
  - Workspace (Layout A) — sticky sidebar nav with section status dots, all analysis sections stacked
  - 6 AI-analyzed sections: Summary, Market Context, Use Cases, vs. Existing, Unit Economics, Market Sizing
  - Per-section regenerate + "Analyze All" dropdown (orange CTA)
  - "Last generated [date] · after N inputs" provenance on each section
  - Inline title editing (click to edit)
  - Add Input modal — Call Notes / Deck / Paper / Email / Other, "Save & Re-analyze" option
  - Open Questions — add, answer inline, mark resolved, AI auto-extracts on first analysis
  - Action Items — add, toggle done
  - Re-analyze with answered questions trigger
  - "Ventures" nav link added (desktop + mobile hamburger)
  - Action items — inline edit (click pencil icon or double-click text), Enter to save, Escape to cancel
  - Assumptions — priority badges (critical/high/medium), sorted by priority, clear all button
  - AI-suggested actions from unvalidated assumptions
  - Methodology info panels (ⓘ) per section — why/how to read/red flag
  - Mobile responsive — scrollable section nav pills, icon-only analyze button, wrapping title
  - Auto-deploy via GitHub Actions on every push to main

## 🔜 Next Up

- [ ] Layout C — Validation Board view for ventures (kanban-style assumption tracking)
- [ ] Action edit (done ✅ above)
- [ ] Mobile responsiveness for researchers/tech-offers tables
- [ ] Notes on venture cases
- [ ] Export venture analysis to PDF/doc
