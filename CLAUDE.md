# ATUM Scout - Project Context

## Deployment (IMPORTANT — always do this after pushing code)

**Every `git push` to `main` auto-deploys via GitHub Actions.** No manual steps needed.

- **CI/CD**: `.github/workflows/deploy.yml` — triggers on every push to `main`
- **Server**: Oracle Cloud Ubuntu 22.04, reverse-proxied via Nginx, managed with PM2
- **App name**: `atum-scout` (pm2)
- **Live URL**: https://161-118-225-166.sslip.io (sslip.io domain, Let's Encrypt SSL)
- **Deploy steps** (automated): `git pull` → `npm install` → `npx prisma generate` → `npm run build` → `pm2 restart atum-scout --update-env`
- **Check deploy status**: `gh run list --repo puglord93/atum-scout --limit 3`
- **Typical deploy time**: ~2-3 minutes after push

**Workflow**: Make changes → `git add` → `git commit` → `git push` → deploy runs automatically → check `gh run list` to confirm success.

**DB schema changes**: Prisma migrations can't run cleanly on Neon cold-start. Use the **Neon SQL Editor** to run raw SQL (`ALTER TABLE ...`) and also update `prisma/schema.prisma`. Do NOT rely on `prisma migrate deploy` for production column additions.

---

## What This Project Does

ATUM Scout is a deep-tech venture scouting and building platform for ATUM Ventures (Singapore). It manages researchers, tech offers from research institutions, and full venture case workspaces.

**Three main areas:**
1. **Researcher Management** — 256 researchers across Advanced Manufacturing, Biotech/Medtech, Energy/Climate
2. **Tech Offer Scouting** — 313 tech offers from universities/research institutes
3. **Venture Workspace** — AI-powered venture case builder with analysis, assumptions, and actions

---

## Architecture

### Tech Stack
- **Frontend**: Next.js 15 (App Router, client components), React 19, TypeScript
- **Styling**: Tailwind CSS v4
- **Backend**: Next.js API Routes (serverless)
- **Database**: Neon PostgreSQL (serverless, ap-southeast-1) via Prisma ORM v5
- **AI**: OpenAI API — `gpt-4o-mini` default, `gpt-4o` for vision PDF extraction
- **Auth**: Simple cookie-based gate (`atum_auth=atum_access_granted`), password in `.env` as `SITE_PASSWORD`

### Database Schema (Prisma)

**Researcher** — 256 records
- id, fullName, email, affiliation, tier (A/B/C/D)
- hIndex, citations, cScore, globalRank
- domainTags, subfield, category, noteOnResearch, origin
- contacted, contactDate, contactedBy

**TechOffer** — 313 records
- id, techId, technology, institution, trl, sector
- venturePotential, description, useCase, vsExisting
- commercializationPath, atumPursue, likelyPi, qualityTier, notes

**VentureCase**
- id, title, status (draft/active/archived)
- researcherId (optional FK), techOfferId (optional FK)
- createdAt, updatedAt

**VentureInput** — context fed into AI analysis
- id, ventureCaseId, type (call_notes/deck/paper/email/other)
- label, content, inputDate, createdAt

**VentureSection** — 6 sections per venture (AI-generated, editable)
- id, ventureCaseId, key (summary/market_context/use_case/vs_existing/unit_economics/market_sizing)
- content, generatedAt, editedAt, inputCount

**VentureQuestion** — assumptions to validate
- id, ventureCaseId, question, answer, answered (bool)
- priority (critical/high/medium), order

**VentureAction** — next actions
- id, ventureCaseId, text, done (bool)

---

## Key Files

### Config
- `prisma/schema.prisma` — full DB schema
- `.env` — DATABASE_URL (Neon), OPENAI_API_KEY, OPENAI_MODEL, SITE_PASSWORD
- `.github/workflows/deploy.yml` — auto-deploy pipeline
- `.interface-design/system.md` — design system documentation
- `app/globals.css` — global styles, ATUM orange theme
- `middleware.ts` + `proxy.ts` — simple cookie auth gate

### API Endpoints
- `app/api/researchers/` — GET list with filters, GET/PATCH single, POST outreach email
- `app/api/tech-offers/` — GET list with filters, GET single
- `app/api/ventures/` — GET/POST list, GET/PATCH/DELETE single
- `app/api/ventures/[id]/inputs/` — CRUD venture inputs
- `app/api/ventures/[id]/sections/[key]/` — PATCH section content
- `app/api/ventures/[id]/analyze/` — POST triggers OpenAI analysis (all sections or one)
- `app/api/ventures/[id]/questions/` — GET/POST/DELETE questions
- `app/api/ventures/[id]/questions/[qId]/` — PATCH/DELETE single question
- `app/api/ventures/[id]/actions/` — CRUD actions
- `app/api/ventures/[id]/actions/suggest/` — POST AI-suggests actions from assumptions
- `app/api/extract-text/` — POST file upload, extracts text from PDF/PPTX/DOCX

### Pages
- `app/layout.tsx` — root layout, nav (Researchers, Tech Offers, Ventures)
- `app/researchers/page.tsx` — researchers table with filters
- `app/researchers/[id]/page.tsx` — researcher detail (3 tabs)
- `app/tech-offers/page.tsx` — tech offers table with filters
- `app/tech-offers/[id]/page.tsx` — tech offer detail (3 tabs)
- `app/ventures/page.tsx` — ventures list
- `app/ventures/[id]/page.tsx` — **venture workspace** (main complex page)

---

## Venture Workspace (`app/ventures/[id]/page.tsx`)

The most complex page. Key features:

- **Top bar**: title (click-to-edit), status badge, Analyze All button (split with dropdown for per-section)
- **Sidebar** (desktop only, `hidden lg:flex`): section nav with status dots, inputs list
- **Mobile nav**: scrollable pill buttons for sections (`lg:hidden`)
- **6 analysis sections**: Summary, Market Context, Use Cases, vs. Existing, Unit Economics, Market Sizing
  - Each has: AI generate, edit mode, methodology info panel (ⓘ button)
  - Sections rendered via custom `MarkdownContent` + `InlineMarkdown` components (no external markdown lib)
- **Assumptions to Validate**: sorted by priority (critical→high→medium), mark validated, clear all
- **Actions**: manual + AI-suggested from assumptions
- **Add Input modal**: supports call notes, deck/paper (PDF/PPTX/DOCX upload with text extraction or AI vision)

### AI Analysis Flow
1. POST `/api/ventures/[id]/analyze` with optional `{ key }` for single section
2. Builds context from venture + tech offer + inputs + answered questions
3. Calls GPT for each section sequentially (6 calls if "Analyze All")
4. Separate dedicated call for assumptions generation (only when none exist yet)
5. Returns updated sections + questions

### Key Patterns
- **JSON from GPT**: Always strip markdown fences before `JSON.parse()` — `raw.replace(/^```(?:json)?\s*/i, '').replace(/\s*```$/, '')`
- **Assumptions**: Separate API call with focused system prompt — never piggyback onto section prompts
- **Scroll to section**: Use `window.scrollTo` with 80px header offset, NOT `scrollIntoView` (fixed nav)
- **Neon cold-start**: DB may take 1-2s on first request; migrations via SQL Editor not `prisma migrate deploy`

---

## Design System

- **Intent**: Data-dense (Bloomberg terminal meets Notion). Dense, functional, no fluff.
- **Orange `#F0602C`**: ONLY for Tier A badges and primary CTAs. Never decorative.
- **Depth**: Borders not shadows (`border border-gray-200`)
- **Type**: Geist Sans, `text-sm` default, `text-xs uppercase tracking-wide` for labels, `font-mono` for metrics
- **Spacing**: `h-9` inputs, `py-3` table rows, `max-w-5xl` detail pages, `max-w-[1400px]` tables
- **Tables**: Native `<table>` with `table-fixed` and explicit column widths
- **No truncation on titles** — allow wrapping, use `line-clamp` if needed

---

## Code Standards

- **Next.js 15 params**: Must be awaited — `const { id } = await params`
- **Prisma v5**: Not v7 (different config format)
- **TypeScript**: Strict, all types defined
- **Client components**: `'use client'` at top, `use(params)` for route params in client pages
- **AI model**: `process.env.OPENAI_MODEL || 'gpt-4o-mini'` — always use env var

---

## Current State (as of Mar 2026)

### Completed
- Researchers + Tech Offers tables with filters, search, detail pages
- AI outreach email generation
- Contact tracking
- Venture workspace: full AI analysis pipeline, 6 sections
- Custom markdown renderer (no external lib)
- Assumptions to validate with priority badges (critical/high/medium)
- AI-suggested actions from assumptions
- Methodology info panels per section (ⓘ)
- Add Input modal: text + file upload (PDF/PPTX/DOCX) + AI vision mode
- Mobile responsiveness for ventures page (section nav pills, responsive padding)
- Auto-deploy via GitHub Actions

### Known Issues / Constraints
- TRL values sometimes non-numeric (regex extraction handles it)
- Venture Potential field has full text (first word extracted)
- Neon cold-start means first request can be slow
- Fuzzy PI matching is simple substring (good enough for now)

### Next Features (confirmed — see ROADMAP.md for full detail)
1. **Validation Board (Layout C)** — kanban view for venture assumptions: Untested → Testing → Validated → Invalidated. Toggle with current Layout A.
2. **AI Enrichment** — deep enrichment for researchers (publications, patents, research summary, web presence) and tech offers (comparable startups, market signals, why-now context). "Enrich with AI" button per record.
3. **Grant Pipeline** — per-venture tracking of SG grants (Enterprise Singapore, NRF, SEEDS, etc.). Fields: name, amount, stage, deadline, notes.
4. **Notes on Venture Cases** — activity log per venture, same pattern as researcher notes. Types: Note / Call / Email / Meeting / Customer Interview.

### Tabled / KIV
- Startup Deal Flow (needs internal process defined first)
- Weekly Sprint View (KIV — overlaps with Notion)
- Customer Discovery Tracker, Co-founder Tracker, DD Checklist (all tabled)
