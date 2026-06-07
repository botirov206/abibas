# StockPilot WMS — Frontend Design System

> Adapted from the InventiEase visual style guide. Read this file before touching any component.
> Icon library: `lucide-react` — use large sizes throughout (nav: 28px, cards: 24px, KPIs: 32px).
> Font: Plus Jakarta Sans (closest free equivalent to General Sans from the style guide).

---

## 1. Color System

### Core Palette (adapted from InventiEase guide)

| Token | Hex | Usage |
|---|---|---|
| `slate-950` | `#020617` | Sidebar background |
| `slate-900` | `#0F172A` | Sidebar active/hover, dark text |
| `lime-400` | `#A3E635` | Primary accent (CTA buttons, active nav, badges) — "Fresh Pineapple" |
| `cyan-400` | `#22D3EE` | Secondary accent (charts, secondary badges) — "Ledge Bay" |
| `white` | `#FFFFFF` | Card backgrounds, main surface |
| `slate-50` | `#F8FAFC` | Page background |
| `slate-100` | `#F1F5F9` | Input/subtle background |
| `slate-200` | `#E2E8F0` | Borders, dividers |
| `slate-500` | `#64748B` | Secondary text, icons (inactive) |
| `slate-800` | `#1E293B` | Primary text |

### Status Colors

| Status | Color | Tailwind class |
|---|---|---|
| Released / Success | `#22C55E` | `text-green-500 bg-green-50` |
| Quarantine / Warning | `#F59E0B` | `text-amber-500 bg-amber-50` |
| Failed / Danger | `#EF4444` | `text-red-500 bg-red-50` |
| Passed / Info | `#3B82F6` | `text-blue-500 bg-blue-50` |
| Draft / Neutral | `#94A3B8` | `text-slate-400 bg-slate-100` |
| Pending | `#8B5CF6` | `text-violet-500 bg-violet-50` |
| Received / Done | `#22C55E` | `text-green-600 bg-green-50` |

---

## 2. Typography

**Font family:** `Plus Jakarta Sans` (Google Fonts)
**Import in `layout.tsx`:** `import { Plus_Jakarta_Sans } from 'next/font/google'`

| Role | Size | Weight | Class |
|---|---|---|---|
| Page title | 28px | 700 | `text-2xl font-bold` |
| Section heading | 20px | 600 | `text-xl font-semibold` |
| Card title | 16px | 600 | `text-base font-semibold` |
| Body / table | 14px | 400 | `text-sm` |
| Caption / meta | 12px | 400 | `text-xs` |
| KPI number | 32px | 700 | `text-3xl font-bold` |
| Badge | 11px | 600 | `text-[11px] font-semibold uppercase tracking-wide` |

---

## 3. Spacing & Shape

| Token | Value | Usage |
|---|---|---|
| Card border radius | `16px` | `rounded-2xl` |
| Button border radius | `10px` | `rounded-xl` |
| Badge border radius | `999px` | `rounded-full` |
| Input border radius | `10px` | `rounded-xl` |
| Card padding | `24px` | `p-6` |
| Card gap | `16px` | `gap-4` |
| Section gap | `24px` | `gap-6` |
| Card shadow | subtle | `shadow-sm hover:shadow-md transition-shadow` |

---

## 4. Layout — Shell

```
┌──────────────────────────────────────────────────────────────┐
│  Sidebar (w-64 expanded / w-20 collapsed)  │  Main content   │
│  bg-slate-950 text-white                   │  bg-slate-50    │
│                                            │                 │
│  ┌─ Logo / Brand ─────────────────┐        │  ┌─ Topbar ──┐  │
│  │  ⚡ StockPilot                 │        │  │ Search    │  │
│  └────────────────────────────────┘        │  │ + Avatar  │  │
│                                            │  └───────────┘  │
│  ┌─ Nav items (icon + label) ─────┐        │                 │
│  │  🏠 Dashboard                  │        │  ┌─ Page ────┐  │
│  │  📦 Products                   │        │  │           │  │
│  │  🏭 Inventory                  │        │  │           │  │
│  │  🚛 Suppliers                  │        │  └───────────┘  │
│  │  📋 Purchase Orders            │        │                 │
│  │  🛒 Sales Orders               │        │                 │
│  │  🔬 Quality Control            │        │                 │
│  │  📊 Movements                  │        │                 │
│  │  🔔 Alerts                     │        │                 │
│  │  👥 Users (ADMIN only)         │        │                 │
│  └────────────────────────────────┘        │                 │
│                                            │                 │
│  ┌─ User info ────────────────────┐        │                 │
│  │  Avatar + Name + Role          │        │                 │
│  │  Logout button                 │        │                 │
│  └────────────────────────────────┘        │                 │
└──────────────────────────────────────────────────────────────┘
```

### Sidebar specs
- Width expanded: `w-64` (256px)
- Background: `bg-slate-950`
- Nav item: `flex items-center gap-3 px-4 py-3 rounded-xl mx-2 text-slate-400`
- Nav item active: `bg-lime-400/10 text-lime-400`
- Nav icon size: `w-7 h-7` (28px) — large as per user requirement
- Nav label: `text-sm font-medium`
- Active indicator: left border `border-l-2 border-lime-400` OR lime background pill
- Logo area: `px-6 py-5 border-b border-slate-800`

### Topbar specs
- Height: `h-16`
- Background: `bg-white border-b border-slate-200`
- Search bar: `w-80 bg-slate-100 rounded-xl px-4 py-2 text-sm`
- Avatar: `w-9 h-9 rounded-full bg-lime-400 text-slate-900 font-bold text-sm`

---

## 5. Component Library

### 5.1 KPI Card (dashboard)
```
┌─────────────────────────────────┐
│  ┌──────┐                       │
│  │ Icon │  Card Title           │
│  └──────┘  (text-slate-500 sm)  │
│                                 │
│  32px Bold Number               │
│  ± change indicator             │
└─────────────────────────────────┘
```
- Background: white with `rounded-2xl shadow-sm p-6`
- Icon container: `w-12 h-12 rounded-xl flex items-center justify-center`
  - Dashboard: lime bg `bg-lime-400/15 text-lime-600`
  - Inventory: cyan bg `bg-cyan-400/15 text-cyan-600`
  - Alerts: amber bg `bg-amber-400/15 text-amber-600`
  - Orders: violet bg `bg-violet-400/15 text-violet-600`
- Icon size inside KPI: `w-6 h-6` (24px)
- Number: `text-3xl font-bold text-slate-900`
- Label: `text-sm text-slate-500`

### 5.2 Product Card (grid layout)
```
┌───────────────────────┐
│  ┌─────────────────┐  │
│  │   Icon/Image    │  │   bg-slate-100 rounded-xl h-32
│  │   (large icon)  │  │
│  └─────────────────┘  │
│  Part Number (xs)     │
│  Product Name (sm bold)│
│  Category badge       │
│  Reorder: X units     │
│  [View Details →]     │
└───────────────────────┘
```
- Card: `bg-white rounded-2xl p-4 shadow-sm hover:shadow-md cursor-pointer`
- Image area: use a large `Cpu`, `Zap`, `Wrench`, etc. lucide icon in `w-16 h-16` at center

### 5.3 Status Badge
```jsx
<span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-semibold uppercase tracking-wide bg-green-50 text-green-600">
  <span className="w-1.5 h-1.5 rounded-full bg-green-500" />
  Released
</span>
```

### 5.4 Data Table
- Container: `bg-white rounded-2xl shadow-sm overflow-hidden`
- Header row: `bg-slate-50 border-b border-slate-200`
- Header cell: `px-5 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider`
- Body row: `border-b border-slate-100 hover:bg-slate-50/50 transition-colors`
- Body cell: `px-5 py-4 text-sm text-slate-700`

### 5.5 Primary Button
```
bg-lime-400 text-slate-900 font-semibold rounded-xl px-4 py-2.5
hover:bg-lime-300 transition-colors shadow-sm
icon: w-4 h-4 (inline, left of text)
```

### 5.6 Secondary Button
```
bg-slate-100 text-slate-700 font-semibold rounded-xl px-4 py-2.5
hover:bg-slate-200 transition-colors
```

### 5.7 Input / Select
```
w-full bg-slate-100 border border-slate-200 rounded-xl px-4 py-2.5 text-sm
focus:outline-none focus:ring-2 focus:ring-lime-400 focus:border-lime-400
placeholder:text-slate-400
```

### 5.8 Modal / Drawer
- Overlay: `fixed inset-0 bg-black/40 backdrop-blur-sm z-50`
- Panel: `bg-white rounded-2xl shadow-2xl p-6 w-full max-w-lg`
- Header: title `text-xl font-bold` + close X button
- Footer: Cancel (secondary) + Confirm (primary) buttons

### 5.9 Page Header
```
┌────────────────────────────────────────────────┐
│  Page Title (2xl bold)    [+ Action Button]     │
│  Breadcrumb / description (sm slate-500)        │
└────────────────────────────────────────────────┘
```

### 5.10 Empty State
- Centered in card, large icon `w-16 h-16 text-slate-300`
- Title `text-lg font-semibold text-slate-400`
- Sub `text-sm text-slate-400`
- Action button if relevant

---

## 6. Page-by-Page Design Spec

### 6.1 `/login`
- Full-screen split: left panel (slate-950 bg, brand + tagline), right panel (white, form)
- Left: Large `⚡` logo, "StockPilot WMS", subtitle, decorative product icons grid (opacity-20)
- Right: Card centered, "Welcome back" heading, email + password inputs, Sign in button (lime)
- No nav/sidebar

### 6.2 `/dashboard`
Layout: 4-col KPI row → 2-col (chart + recent movements table)

**KPI cards (4 across):**
- Total Products — `Package` icon, lime
- Total Stock Units — `Warehouse` icon, cyan
- Open Purchase Orders — `ShoppingCart` icon, violet
- Low Stock Alerts — `AlertTriangle` icon, amber (links to /alerts)

**Charts row:**
- Left (2/3): Bar chart — stock movements by type (recharts, lime bars, cyan bars)
- Right (1/3): Stat card — Quarantine batches count with `Shield` icon

**Recent Movements table:** last 10, columns: Type badge | Product | From→To bin | Qty | Time

### 6.3 `/products`
- Top: search bar + "Add Product" button
- Product cards grid: `grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4`
- Each card: icon (category-based lucide icon, `w-16 h-16`), part number, name, category badge, reorder point
- Click card → side panel slides in with full specs table

**Category icons mapping:**
- Passive Components / Resistors → `Zap`
- Capacitors → `Activity`
- Active Components → `Cpu`
- Microcontrollers → `Cpu`
- Tools & Equipment → `Wrench`
- Default → `Package`

### 6.4 `/inventory`
- Top: filter bar (warehouse dropdown, quality status filter, search)
- Table view (not grid — more data density needed)
- Columns: Bin Code | Product | Part # | Lot # | Qty | Quality Status | Received Date | Expiry
- Quality status badge colored as per system
- Row with QUARANTINE → amber left border `border-l-4 border-amber-400`
- "Adjust Stock" button per row (WAREHOUSE_OPERATOR / ADMIN only)

### 6.5 `/suppliers`
- Grid layout: `grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4`
- Supplier card: `Building2` icon (large), company name, contact, country flag emoji, lead time badge
- "Add Supplier" button top right
- Lead time badge: green ≤3 days, amber 4–7 days, red >7 days

### 6.6 `/purchase-orders`
- Top: status filter tabs (All | Draft | Sent | Partial | Received | Cancelled) + "Create PO" button
- Table: PO# | Supplier | Status | Items | Expected Date | Created By | Actions
- Row expand: shows PO items sub-table (product, ordered qty, received qty, cost)
- "Receive Items" button on SENT/PARTIAL rows → modal with quantity inputs per line item

### 6.7 `/sales-orders`
- Same tab pattern as POs (status filter)
- Table: SO# | Customer Ref | Customer Email | Status | Ship By | Items | Actions
- Status update dropdown inline (ADMIN only)
- Row expand: SO items (product, qty, unit price)

### 6.8 `/quality`
- Heading with quarantine count badge
- Card grid for quarantine batches (not table — more visual)
- Each batch card: large `ShieldAlert` icon (amber), product name, lot number, bin location, received date
- Two action buttons: ✓ Approve (green) and ✗ Reject (red)
- Approved batch → moves to RELEASED, card disappears
- Empty state: large green `ShieldCheck` icon + "All clear — no batches in quarantine"

### 6.9 `/movements`
- Top: movement type filter chips (All | Receive | Ship | Transfer | Adjustment | Return) + search
- Timeline-style table: icon per type | Product | From→To | Qty | Performed By | Date
- Movement type icons:
  - RECEIVE → `PackagePlus` (green)
  - SHIP → `PackageMinus` (blue)
  - TRANSFER → `ArrowLeftRight` (cyan)
  - ADJUSTMENT → `SlidersHorizontal` (amber)
  - RETURN → `RotateCcw` (violet)
- "Log Movement" button → modal form

### 6.10 `/alerts`
- Alert cards in a list (not grid) with urgency indication
- Each row: `AlertTriangle` icon (amber/red based on deficit%) | product name | part # | current stock | reorder point | deficit | "Create PO" button
- Deficit bar: progress bar showing stock vs reorder point (lime filled, slate bg)
- Sort by deficit (highest first)

### 6.11 `/users` (ADMIN only)
- Table: Avatar initial circle | Name | Email | Role badge | Status | Created
- Role badges colored: ADMIN=red, WAREHOUSE_OPERATOR=blue, PROCUREMENT=violet, QC_INSPECTOR=amber, MANAGER=green
- "Add User" button → modal

---

## 7. Icon Usage Guide

**Library:** `lucide-react`

| Feature | Icon | Size in nav | Size in card |
|---|---|---|---|
| Dashboard | `LayoutDashboard` | `w-7 h-7` | `w-6 h-6` |
| Products | `Package` | `w-7 h-7` | `w-6 h-6` |
| Inventory | `Warehouse` | `w-7 h-7` | `w-6 h-6` |
| Suppliers | `Building2` | `w-7 h-7` | `w-6 h-6` |
| Purchase Orders | `ClipboardList` | `w-7 h-7` | `w-6 h-6` |
| Sales Orders | `ShoppingBag` | `w-7 h-7` | `w-6 h-6` |
| Quality Control | `ShieldCheck` | `w-7 h-7` | `w-6 h-6` |
| Movements | `ArrowLeftRight` | `w-7 h-7` | `w-6 h-6` |
| Alerts | `BellRing` | `w-7 h-7` | `w-6 h-6` |
| Users | `Users` | `w-7 h-7` | `w-6 h-6` |
| Add/Create | `Plus` | — | `w-5 h-5` |
| Search | `Search` | — | `w-4 h-4` |
| Settings | `Settings` | `w-6 h-6` | — |
| Logout | `LogOut` | `w-5 h-5` | — |
| Electronic parts (product card) | `Cpu`, `Zap`, `Activity`, `Wrench`, `FlaskConical` | — | `w-16 h-16` |

---

## 8. Tailwind Config Extensions

```js
// tailwind.config.js additions
fontFamily: {
  sans: ['Plus Jakarta Sans', ...defaultTheme.fontFamily.sans],
},
```

---

## 9. Animation & Interaction

- Page transitions: none (fast SPA navigation)
- Modal open: `transition-all duration-200 ease-out scale-95→scale-100 opacity-0→opacity-100`
- Card hover: `hover:shadow-md hover:-translate-y-0.5 transition-all duration-150`
- Button click: `active:scale-95 transition-transform`
- Row hover: `hover:bg-slate-50/80`
- Sidebar nav item: `transition-colors duration-150`
- Loading state: skeleton shimmer `animate-pulse bg-slate-200 rounded-xl`

---

## 10. Responsive Breakpoints

This is a **desktop-first** app (warehouse management is always on desktop/tablet).

| Breakpoint | Layout |
|---|---|
| `xl` 1280px+ | Sidebar expanded (w-64) + 4-col KPI grid |
| `lg` 1024px+ | Sidebar expanded + 3-col grids |
| `md` 768px+ | Sidebar collapsed (icons only, w-20) + 2-col grids |
| `sm` 640px- | Sidebar hidden (hamburger) + 1-col |

---

## 11. File Structure for Frontend

```
frontend/src/
├── app/
│   ├── layout.tsx              ← font import, Providers wrapper
│   ├── page.tsx                ← redirect to /dashboard
│   ├── (auth)/
│   │   └── login/page.tsx
│   └── (dashboard)/
│       ├── layout.tsx          ← Sidebar + Topbar shell
│       ├── dashboard/page.tsx
│       ├── products/page.tsx
│       ├── inventory/page.tsx
│       ├── suppliers/page.tsx
│       ├── purchase-orders/page.tsx
│       ├── sales-orders/page.tsx
│       ├── quality/page.tsx
│       ├── movements/page.tsx
│       ├── alerts/page.tsx
│       └── users/page.tsx
├── components/
│   ├── Sidebar.tsx
│   ├── Topbar.tsx
│   ├── KpiCard.tsx
│   ├── StatusBadge.tsx
│   ├── Modal.tsx
│   ├── LoadingSkeleton.tsx
│   └── EmptyState.tsx
├── lib/
│   ├── api.ts                  ← axios instance
│   └── auth.tsx                ← AuthProvider, useAuth
└── types/
    └── index.ts
```
