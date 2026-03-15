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

## What This Project Does

ATUM Scout is a deep-tech researcher and technology scouting platform for ATUM Ventures (Singapore). It manages 256 researchers and 313 tech offers from research institutions, enabling:

- **Researcher Management**: Browse, filter, and track top researchers in deep tech (Advanced Manufacturing, Biotech/Medtech, Energy/Climate)
- **Tech Offer Scouting**: Discover and evaluate technology offerings from universities and research institutes
- **Contact Tracking**: Log contact history with researchers
- **AI-Powered Outreach**: Generate personalized outreach emails using OpenAI
- **Fuzzy Matching**: Link tech offers to likely principal investigators

**Context**: This is a rebuild of an existing Streamlit app to gain codebase ownership and achieve professional SaaS-quality UI matching a consultant's "ATUM Scout" reference design.

## Architecture

### Tech Stack
- **Frontend**: Next.js 15.1.6 (App Router, Server Components), React 19, TypeScript
- **Styling**: Tailwind CSS v4, shadcn/ui components
- **Backend**: Next.js API Routes (serverless functions)
- **Database**: SQLite (local dev) with Prisma ORM v5.22.0
- **AI**: OpenAI API (gpt-4o-mini) for email generation
- **Data Import**: Excel files parsed with `xlsx` library

### Database Schema (Prisma)

**Researcher** (256 records):
- id, fullName, email, affiliation, tier (A/B/C/D)
- hIndex, citations, cScore, globalRank
- domainTags, subfield, category, noteOnResearch, origin
- contacted, contactDate, contactedBy (contact tracking)
- createdAt, updatedAt

**TechOffer** (313 records):
- id, techId, technology, institution, trl, sector
- venturePotential, description, useCase, vsExisting
- commercializationPath, atumPursue, likelyPi, qualityTier, notes
- createdAt, updatedAt

### Design System

Documented in `.interface-design/system.md`. Key principles:
- **Intent**: Data-dense tools (Bloomberg terminal meets Notion)
- **Palette**: Gray foundation (50/100/200/600/900), ATUM orange (#F0602C) for Tier A and primary CTAs only
- **Depth**: Minimal - borders not shadows
- **Typography**: Geist Sans, text-sm default, text-xs uppercase headers, font-mono for metrics
- **Spacing**: 4px base unit, h-9 inputs, py-3 rows, max-w-4xl detail pages, max-w-[1400px] tables
- **Components**: Circular tier badges, dot+text status, native `<table>` over component libraries

## Key Files and Their Roles

### Configuration
- `prisma/schema.prisma` - Database schema (Researcher, TechOffer models)
- `prisma/dev.db` - SQLite database file
- `.env` - Environment variables (DATABASE_URL, OPENAI_API_KEY, OPENAI_MODEL)
- `.interface-design/system.md` - Design system documentation
- `tailwind.config.ts` - Tailwind configuration
- `app/globals.css` - Global styles, CSS variables, ATUM orange theme

### Data Loading
- `lib/excel-loader.ts` - Excel parsing logic (ported from Python)
- `lib/prisma.ts` - Prisma client singleton
- `app/api/seed/route.ts` - POST endpoint to seed database from Excel files
- `Funnel 2 - TTO Tech Offers.xlsx` - Tech offers data source (313 records)
- `Funnel 3 - Top researchers SCORED.xlsx` - Researchers data source (256 records)

### API Endpoints
- `app/api/researchers/route.ts` - GET with filters (tier, affiliation, category, search)
- `app/api/researchers/[id]/route.ts` - GET, PATCH single researcher
- `app/api/researchers/[id]/outreach/route.ts` - POST AI email generation
- `app/api/tech-offers/route.ts` - GET with filters (institution, sector, venturePotential, trl)
- `app/api/tech-offers/[id]/route.ts` - GET single tech offer

### Pages
- `app/layout.tsx` - Root layout with navigation (Researchers, Tech Offers links)
- `app/page.tsx` - Home page (currently redirects to /researchers)
- `app/researchers/page.tsx` - Researchers table with filters (tier, affiliation, category, search)
- `app/researchers/[id]/page.tsx` - Researcher detail (3 tabs: Overview, Linked Tech, Contact & Outreach)
- `app/tech-offers/page.tsx` - Tech offers table with filters (institution, sector, venturePotential, trl)
- `app/tech-offers/[id]/page.tsx` - Tech offer detail (3 tabs: Overview, Linked Researcher, Analysis)

### UI Components
- `components/ui/select.tsx` - Custom Select dropdown (styled for data-dense UI)
- `components/ui/input.tsx` - Input component
- `components/ui/tabs.tsx` - Tabs component (used in detail pages)
- `components/ui/card.tsx` - Card component
- `components/ui/button.tsx` - Button component

## Current Milestone

**Phase 2: Enrichment Features** (Partially Complete)

✅ Completed:
- Researchers table page with sleek, data-dense UI
- Tech offers table page with proper column widths
- Researcher detail page (3 tabs)
- Tech offer detail page (3 tabs)
- AI outreach email generation (OpenAI integration)
- Contact tracking (mark as contacted, date, contacted by)
- Search and filtering (all tables)
- Fuzzy matching (tech offers ↔ researchers via likelyPi field)
- Design system established and documented
- Affiliation abbreviations (NUS, NTU, I2R, etc.)
- Clean filter dropdowns (Venture Potential: High/Medium/Low, TRL: 1-9)

🚧 In Progress:
- None currently

❌ Not Started:
- Export to CSV/Excel
- Dashboard overview page
- Performance optimization (pagination, caching)
- Responsive design refinements
- Advanced features (bulk actions, notes system)

## Next Tasks

1. **Export Functionality** - CSV/Excel download buttons on table pages
2. **Dashboard Page** - Landing page with stats, charts, quick actions
3. **Performance Optimization** - Pagination (20/page), SWR caching
4. **Responsive Design** - Mobile/tablet breakpoints, table scrolling
5. **Polish** - Loading states, error handling, keyboard navigation

## Constraints and Important Rules

### Data Integrity
- **Never modify Excel source files** - they are the source of truth
- **Abbreviation mapping** - Must maintain consistency (see `abbreviateAffiliation()` in researchers/page.tsx)
- **Fuzzy matching threshold** - Currently simple substring match, may need improvement

### Design Rules (CRITICAL)
- **ATUM orange (#F0602C)** - Use ONLY for Tier A badges and primary CTAs. Do NOT overuse.
- **Borders not shadows** - Minimal depth, use `border border-gray-200` instead of shadows
- **Data-dense** - Tight spacing (h-9 inputs, py-3 rows, text-sm), maximize visible data
- **Native tables** - Use `<table>` instead of component libraries for full control
- **Column widths** - Always use `table-fixed` and explicit widths, test with real data
- **Abbreviations** - Keep affiliations short for readability (NUS not "National University of Singapore")

### Code Standards
- **Next.js 15 params** - All route params must be awaited: `const { id } = await params`
- **Prisma v5** - Using v5, not v7 (v7 has breaking config changes)
- **SQLite limitations** - No `skipDuplicates` in createMany, use standard SQL patterns
- **Excel loading** - Use buffer-based reading: `fs.readFileSync()` + `XLSX.read(buffer, { type: 'buffer' })`
- **Type safety** - All data types defined, use TypeScript strictly

### Performance
- **Client-side filtering** - Currently filtering in React state, works fine for 256/313 records
- **Future optimization** - If dataset grows significantly, move filtering to API with Prisma queries
- **SWR caching** - Use 5-minute stale time for list queries

### AI Outreach
- **Model**: gpt-4o-mini (from .env OPENAI_MODEL)
- **Prompt structure**: System prompt + user prompt with researcher details
- **Tone options**: Formal vs Casual, with "know personally" checkbox
- **Output format**: JSON with subject + body fields

### Git Workflow
- **Main branch** - Current development branch
- **Commit messages** - Use conventional format, include "Co-Authored-By: Claude Sonnet 4.5 <noreply@anthropic.com>"
- **Never force push to main** - Always create new commits

## Development Setup

```bash
# Install dependencies
npm install

# Set up database
npx prisma generate
npx prisma migrate dev

# Seed data from Excel files
# POST to http://localhost:3000/api/seed

# Run dev server
npm run dev
# → http://localhost:3000
```

## Environment Variables

Required in `.env`:
```
DATABASE_URL="file:./prisma/dev.db"
OPENAI_API_KEY="sk-proj-..."
OPENAI_MODEL="gpt-4o-mini"
```

## Common Operations

**Add new researcher/tech offer fields:**
1. Update Prisma schema
2. Run `npx prisma migrate dev`
3. Update TypeScript types in page components
4. Update Excel loader mapping if needed

**Add new filter:**
1. Add state variable in page component
2. Add to `uniqueXxx` extraction logic
3. Add Select dropdown to filter bar
4. Update `applyFilters()` function

**Modify design system:**
1. Update `.interface-design/system.md` with new patterns
2. Apply consistently across all pages
3. Document anti-patterns to avoid

## Known Issues

- TRL values sometimes contain non-numeric data (handled with regex extraction)
- Venture Potential field contains full explanations, not just tier (extracted first word)
- Some affiliations not in abbreviation map (falls back to truncation)
- Fuzzy matching is simple substring match, could be more sophisticated

## Future Considerations

- **Deployment**: Vercel (zero-config Next.js hosting)
- **Production DB**: Consider PostgreSQL or PlanetScale for better scalability
- **Authentication**: NextAuth.js with Google OAuth if multi-user access needed
- **Real-time updates**: Consider Prisma Pulse or polling for collaborative editing
- **Advanced search**: Full-text search with Prisma or external service (Algolia, Meilisearch)
