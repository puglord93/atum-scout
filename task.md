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

## ❌ Up Next
- [ ] Responsive design — mobile/tablet breakpoints, horizontal table scroll
- [ ] Performance optimization — SWR caching (5-min stale time for list queries)
- [ ] Bulk actions — multi-select rows, batch mark as contacted
- [ ] Notes system — per-researcher freeform notes log
