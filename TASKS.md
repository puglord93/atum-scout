# ATUM Scout - Development Tasks

## ✅ Completed Work

### Phase 1: Core Features (COMPLETE)
- [x] **Project Setup**
  - Next.js 15 with TypeScript, Tailwind CSS v4, App Router
  - Prisma ORM v5 with SQLite database
  - shadcn/ui component library installation
  - Git repository initialized

- [x] **Database & Data Loading**
  - Prisma schema created (Researcher, TechOffer models)
  - Excel loader ported from Python (`lib/excel-loader.ts`)
  - Seed API endpoint (`/api/seed`)
  - Successfully loaded 256 researchers + 313 tech offers from Excel files

- [x] **API Endpoints**
  - `GET /api/researchers` - With filters (tier, affiliation, category, search)
  - `GET /api/researchers/[id]` - Single researcher
  - `PATCH /api/researchers/[id]` - Update researcher (contact tracking)
  - `GET /api/tech-offers` - With filters (institution, sector, venturePotential, trl)
  - `GET /api/tech-offers/[id]` - Single tech offer

- [x] **Researchers Table Page** (`/researchers`)
  - Data-dense table design (Bloomberg/Notion aesthetic)
  - Filters: Tier (A/B/C/D), Affiliation, Category, Search
  - Circular tier badges (Tier A = ATUM orange)
  - Affiliation abbreviations (NUS, NTU, I2R, IMRE, etc.)
  - Proper column widths (name: 320px, domain: 224px fixed)
  - Native `<table>` with `table-fixed` for width control
  - Dot + text status indicators
  - 256 results with real-time filtering

- [x] **Researcher Detail Page** (`/researchers/[id]`)
  - 3-tab layout (Overview, Linked Tech, Contact & Outreach)
  - **Tab 1 - Overview**: Contact info, metrics (h-index, citations, c-score, global rank), research profile
  - **Tab 2 - Linked Tech**: Fuzzy matched tech offers (by likelyPi field)
  - **Tab 3 - Contact & Outreach**: Contact tracking form + AI email generation
  - Narrower max-width (896px) for better readability

- [x] **Tech Offers Table Page** (`/tech-offers`)
  - Consistent design with researchers table
  - Filters: Institution, Sector, Venture Potential (High/Medium/Low only), TRL (1-9)
  - Proper column widths (Institution: 112px, Technology: 320px)
  - Clean filter extraction (removed full comment text from dropdowns)
  - TRL regex to filter out bad data (46176, etc.)
  - 3-line clamp for long text columns
  - 313 results with filtering

- [x] **Tech Offer Detail Page** (`/tech-offers/[id]`)
  - 3-tab layout (Overview, Linked Researcher, Analysis)
  - **Tab 1 - Overview**: Tech details, description, use case, vs existing, commercialization path
  - **Tab 2 - Linked Researcher**: Fuzzy matched researcher (by likelyPi), full researcher card
  - **Tab 3 - Analysis**: Venture potential, quality tier, ATUM pursue decision, notes
  - Small badges in header (TRL, Venture Potential tier)
  - Max-width 896px for readability

### Phase 2: Enrichment Features (PARTIAL)
- [x] **Contact Tracking**
  - Mark as contacted checkbox
  - Contact date picker
  - Contacted by text input
  - Undo functionality
  - Persisted to database via PATCH /api/researchers/[id]

- [x] **AI Outreach Email Generation**
  - OpenAI API integration (gpt-4o-mini)
  - "Know personally" checkbox
  - Tone selector (Formal / Casual)
  - Generate button with loading state
  - Subject + Body output with copy buttons
  - Personalized based on researcher profile (domain, h-index, research notes)
  - API endpoint: `POST /api/researchers/[id]/outreach`

- [x] **Search Functionality**
  - Researchers: Search by name, affiliation, domain, subfield
  - Tech Offers: Search by technology, description, sector
  - Debounced input (300ms delay)
  - Client-side filtering (fast for current dataset size)

- [x] **Fuzzy Matching**
  - Simple substring matching (likelyPi ↔ researcher name)
  - 85% threshold concept (not yet implemented)
  - Links tech offers to researchers in detail pages

### Design System
- [x] **Interface Design System Established**
  - Documented in `.interface-design/system.md`
  - Data-dense aesthetic (Bloomberg terminal meets Notion)
  - ATUM orange (#F0602C) used sparingly (Tier A + primary CTAs)
  - Borders not shadows (minimal depth)
  - Typography scale (text-sm default, text-xs headers, font-mono metrics)
  - Component patterns (circular badges, dot+text status, native tables)
  - Spacing system (4px base, h-9 inputs, py-3 rows)

- [x] **UI Refinements**
  - Fixed dropdown transparency issues (added CSS variables)
  - Fixed column width disasters (multiple iterations)
  - Removed venture potential full text from filters (extract first word only)
  - Cleaned up TRL filter (regex to remove bad data)
  - Added title tooltips for truncated text
  - Narrowed detail page width for better readability (max-w-4xl)

---

## 🚧 Current Task

**NONE** - Awaiting next priority from user.

Last completed: UI fixes for filter dropdowns (Venture Potential, TRL) and column width optimization.

---

## 📋 Next 5 Development Tasks

### 1. **Export to CSV/Excel** (High Priority)
**Why**: Common workflow for users to export filtered data for analysis or sharing.

**Scope**:
- API endpoints: `GET /api/researchers/export?format=csv|xlsx`, `GET /api/tech-offers/export?format=csv|xlsx`
- Export button in table page headers (top-right corner)
- Dropdown: CSV / Excel options
- Export respects current filters
- Column mapping (similar to Excel loader)
- Filename with timestamp: `atum_researchers_20260312_143022.csv`
- Libraries: `papaparse` (CSV), `xlsx` (Excel)
- Success toast notification

**Files to create/modify**:
- `app/api/researchers/export/route.ts`
- `app/api/tech-offers/export/route.ts`
- `components/shared/ExportButton.tsx` (reusable)
- Update `app/researchers/page.tsx` (add export button)
- Update `app/tech-offers/page.tsx` (add export button)
- Install packages: `npm install papaparse @types/papaparse xlsx`

---

### 2. **Dashboard Overview Page** (High Value)
**Why**: Landing page provides quick insights and navigation.

**Scope**:
- Page: `app/page.tsx` (replace current placeholder)
- **Stats Cards**:
  - Total researchers (breakdown by tier: A/B/C/D counts)
  - Total tech offers (breakdown by venture potential: High/Medium/Low)
  - Contact tracking: X contacted, Y pending, last contacted date
- **Charts** (optional, use `recharts`):
  - Researchers by category (bar chart)
  - Tech offers by institution (pie chart)
  - Contact timeline (line chart: contacts per month)
- **Quick Actions**:
  - "View All Researchers" button
  - "View All Tech Offers" button
  - "Export All Data" button
- **Layout**: max-w-[1400px], grid layout for stats cards
- **Design**: Consistent with data-dense aesthetic, minimal depth

**Files to create/modify**:
- `app/page.tsx` (rebuild from scratch)
- Potentially: `components/dashboard/StatsCard.tsx`, `components/dashboard/QuickActions.tsx`
- Install if using charts: `npm install recharts`

---

### 3. **Performance Optimization** (Medium Priority)
**Why**: Prepare for larger datasets, improve UX.

**Scope**:
- **Pagination**: 20 items per page for tables
  - Add page number buttons
  - "Previous" / "Next" navigation
  - Show "Showing 1-20 of 256 results"
- **Database Indexes**: Add Prisma indexes for frequently filtered fields
  - `@@index([tier])` on Researcher
  - `@@index([affiliation])` on Researcher
  - `@@index([institution])` on TechOffer
  - `@@index([venturePotential])` on TechOffer
- **Server-side filtering**: Move from client-side to API queries (Prisma where clauses)
- **SWR caching config**: 5-minute stale time for list queries
- **Lazy loading**: Dynamic imports for detail pages
- **Optimize images**: If adding logos/photos later

**Files to modify**:
- `prisma/schema.prisma` (add indexes)
- `app/researchers/page.tsx` (add pagination UI + logic)
- `app/tech-offers/page.tsx` (add pagination UI + logic)
- `app/api/researchers/route.ts` (add pagination query params)
- `app/api/tech-offers/route.ts` (add pagination query params)

---

### 4. **Responsive Design** (Medium Priority)
**Why**: Support mobile and tablet usage.

**Scope**:
- **Mobile (< 768px)**:
  - Tables: Horizontal scroll with sticky first column
  - Filters: Collapse into accordion or drawer
  - Detail pages: Stack tabs vertically
  - Reduce font sizes slightly
- **Tablet (768px - 1024px)**:
  - 2-column grid for stats dashboard
  - Condensed table columns (hide less critical fields)
  - Adjust spacing
- **Desktop (> 1024px)**:
  - Full layout, all columns visible
  - Current design optimized for desktop
- **Test devices**: iPhone SE (375px), iPad (768px), Desktop (1920px)

**Files to modify**:
- All page components (add responsive Tailwind classes)
- `app/globals.css` (add mobile-specific styles if needed)
- Test thoroughly on multiple devices

---

### 5. **Advanced Features** (Lower Priority)
**Why**: Power user features, nice-to-have enhancements.

**Scope**:
- **Bulk Actions**:
  - Checkbox column in tables
  - "Select all" / "Select filtered" buttons
  - Bulk export selected rows
  - Bulk mark as contacted (researchers only)
- **Advanced Filters**:
  - h-index range slider (researchers)
  - Citations range slider (researchers)
  - Global rank range (researchers)
  - Date range for contactDate (researchers)
- **Notes System**:
  - Add notes field to researcher detail page
  - Save to database (add `notes` TEXT column to Researcher model)
  - Show notes history with timestamps (requires array of note objects)
- **Sorting**:
  - Click column headers to sort
  - Ascending / descending toggle
  - Sort indicators (up/down arrows)
- **Keyboard Shortcuts**:
  - `/` to focus search
  - `Esc` to clear filters
  - Arrow keys for table navigation

**Files to create/modify**:
- Multiple files across the app
- Prisma schema updates for new fields
- New UI components for sliders, checkbox columns, notes editor

---

## 🔮 Future Considerations (Not Prioritized)

- **Authentication**: NextAuth.js with Google OAuth for multi-user access
- **Role-based permissions**: Admin vs. Viewer roles
- **Activity log**: Track who contacted whom and when
- **Email integration**: Send emails directly from app
- **Collaboration**: Real-time updates with Prisma Pulse or WebSockets
- **Full-text search**: Algolia or Meilisearch for advanced search
- **Deployment**: Vercel deployment with production PostgreSQL
- **Backup system**: Automated database backups
- **API documentation**: Swagger/OpenAPI spec
- **Testing**: Unit tests (Jest), E2E tests (Playwright)

---

## 📝 Notes

**Completed in this session:**
- Rebuilt researchers table UI (fixed column widths, added abbreviations)
- Rebuilt tech offers table UI (fixed column widths, cleaned filters)
- Built tech offer detail page (3 tabs, proper layout)
- Implemented AI outreach email generation
- Fixed dropdown transparency issues
- Cleaned up Venture Potential and TRL filters (extracted tier only)
- Created design system documentation (`.interface-design/system.md`)

**Next session should focus on:**
1. Export functionality (most requested feature)
2. Dashboard page (strong landing page experience)
3. Performance optimizations as dataset grows

**User preferences observed:**
- Prefers data-dense, professional UI (not flashy)
- Values readability (narrower content widths)
- Wants abbreviations for long text (affiliations)
- Prioritizes clean filters (no clutter)
- Appreciates attention to spacing and typography
