# Interface Design System - ATUM Scout

## Intent

**Who**: JJ, venture builder at ATUM Ventures, scouting deep-tech researchers and tech offers
**What**: Manage 256 researchers + 313 tech offers with filtering, contact tracking, and outreach
**Feel**: Data-dense, professional, fast. Bloomberg terminal meets Notion. Tools, not marketing.

## Visual Language

### Palette
**Foundation**: Gray scale (50/100/200/600/900)
**Accent**: ATUM orange `#F0602C` — used sparingly
  - Tier A researcher badges
  - Primary CTAs only
  - Brand touches (logo, key links)

**Why**: Orange is signature brand color but overpowering if used broadly. Reserve for highest priority elements. Gray foundation keeps focus on data.

### Depth
**Approach**: Minimal — borders, not shadows
  - Cards: `border border-gray-200`
  - Hover states: `hover:bg-gray-50`
  - Active states: `border-[#F0602C]`

**Why**: Shadows add visual noise in data-dense interfaces. Borders are cleaner, faster to scan.

### Surfaces
**Elevation scale**:
1. Base: `bg-[#fafafa]` (warm white background)
2. Card: `bg-white border border-gray-200 rounded-lg`
3. Header rows: `bg-gray-50`
4. Hover: `hover:bg-gray-50 transition-colors`

**Why**: Warm background (#fafafa not pure white) reduces eye strain for long sessions. Subtle elevation keeps hierarchy clear without depth.

### Typography
**Typeface**: Geist Sans (with font features: cv02, cv03, cv04, cv11)
**Scale**:
  - Body: `text-sm` (14px) — default for all text
  - Micro headers: `text-xs font-medium text-gray-600 uppercase tracking-wide`
  - Large headings: `text-2xl font-semibold`
  - Metrics: `font-mono` for numbers (h-index, citations, counts)

**Why**: Geist Sans is clean, modern, highly legible. Text-sm keeps interface compact without sacrificing readability. Uppercase micro headers differentiate structure from content. Mono for numbers aids scanning.

### Spacing
**Base unit**: 4px (Tailwind default)
**Key measurements**:
  - Input height: `h-9` (36px)
  - Row padding: `py-3 px-4` (12px vertical, 16px horizontal)
  - Card padding: `p-4` (16px)
  - Section gaps: `gap-3` (12px)
  - Container: `max-w-[1400px] mx-auto px-6 py-8`

**Why**: Tighter spacing = more data visible. h-9 inputs (not h-10) save vertical space. Consistent 4px multiples create rhythm.

## Component Patterns

### Tier Badges
**Structure**: Circular, centered text
```tsx
<div className={`inline-flex items-center justify-center w-7 h-7 rounded text-xs font-semibold ${
  tier === 'A' ? 'bg-[#F0602C] text-white' :
  tier === 'B' ? 'bg-blue-100 text-blue-700' :
  tier === 'C' ? 'bg-yellow-100 text-yellow-700' :
  'bg-gray-100 text-gray-600'
}`}>
  {tier}
</div>
```
**Why**: Circles are compact, scannable. Color-coding (A=orange, B=blue, C=yellow, D=gray) creates instant visual hierarchy.

### Status Indicators
**Structure**: Dot + text (not badge pill)
```tsx
<span className={`inline-flex items-center gap-1.5 text-xs ${
  contacted ? 'text-green-700' : 'text-gray-400'
}`}>
  <div className={`w-1.5 h-1.5 rounded-full ${
    contacted ? 'bg-green-500' : 'bg-gray-300'
  }`} />
  {contacted ? 'Contacted' : 'Not contacted'}
</span>
```
**Why**: Dot is subtle, text is explicit. No background pill = less visual weight.

### Filter Bar
**Structure**: White card, grid layout, compact inputs
```tsx
<div className="bg-white border border-gray-200 rounded-lg p-4 mb-6">
  <div className="grid grid-cols-4 gap-3 mb-3">
    <div className="col-span-2">
      <Input className="h-9 text-sm border-gray-300" />
    </div>
    <Select>
      <SelectTrigger className="h-9 text-sm border-gray-300">
        <SelectValue />
      </SelectTrigger>
    </Select>
  </div>
</div>
```
**Why**: Single card groups all filters. Grid keeps layout organized. h-9 + text-sm = compact without cramped.

### Data Tables
**Structure**: Native `<table>`, not component library
```tsx
<div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
  <table className="w-full">
    <thead>
      <tr className="border-b border-gray-200 bg-gray-50">
        <th className="text-left py-3 px-4 text-xs font-medium text-gray-600 uppercase tracking-wide">
          Name
        </th>
      </tr>
    </thead>
    <tbody className="divide-y divide-gray-100">
      <tr className="group hover:bg-gray-50 transition-colors">
        <td className="py-3 px-4 text-sm text-gray-900">
          Content
        </td>
      </tr>
    </tbody>
  </table>
</div>
```
**Why**: Native table = full control over spacing and layout. Component libraries (shadcn Table) add unwanted padding. Uppercase headers + gray-50 background differentiate from data rows. divide-y creates subtle row separation.

### Container Widths
**Page container**: `max-w-[1400px] mx-auto px-6 py-8`
**Why**: 1400px accommodates wide tables without excessive horizontal scrolling. Centered with breathing room on ultra-wide screens.

## Anti-Patterns

**Don't**:
- Use shadows (`shadow-sm`, `shadow-md`) — use borders
- Use badge pills for status — use dot + text
- Use h-10 inputs — use h-9 for compactness
- Use text-base (16px) — use text-sm (14px)
- Use orange liberally — reserve for Tier A and primary actions
- Use component library tables (shadcn Table) — use native `<table>` for control

**Why**: These create visual clutter and waste space in data-dense interfaces.

## Signature Elements

**What makes this ATUM Scout**:
1. Circular tier badges with orange Tier A
2. Warm #fafafa background (not pure white)
3. Uppercase micro headers with tracking-wide
4. Font-mono for all metrics
5. Minimal depth (borders > shadows)
6. Data-first (tools not marketing)

If another designer saw this interface, these elements should signal "ATUM Scout" immediately.
