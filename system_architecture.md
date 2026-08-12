# System Architecture Document — SpendSense (India Edition - SaaS Redesign)

**Product Name:** SpendSense  
**Architecture Pattern:** Monolithic Full-Stack Next.js (App Router) with Embedded SQLite  
**Theme System:** Modern Light SaaS (`#F7F5F2` canvas, `#FFFFFF` cards, `#6F8F7A` Primary Sage accent)  
**Database Driver:** Node.js 26 Native `node:sqlite` (`DatabaseSync`)  
**Time-Period Engine:** Dynamic Filter (`daily` | `weekly` | `monthly` | `yearly`)  
**Status:** Implemented & Verified  

---

## 1. Time-Period Query Architecture (`src/lib/period.ts`)

SQL time-period filters dynamically generated for `spendsense.db`:

```typescript
export function getPeriodFilter(period: TimePeriod) {
  switch (period) {
    case 'daily':
      return { whereClause: "strftime('%Y-%m-%d', date) = strftime('%Y-%m-%d', 'now', 'localtime')" };
    case 'weekly':
      return { whereClause: "date >= date('now', '-7 days', 'localtime')" };
    case 'yearly':
      return { whereClause: "strftime('%Y', date) = strftime('%Y', 'now', 'localtime')" };
    case 'monthly':
    default:
      return { whereClause: "strftime('%Y-%m', date) = strftime('%Y-%m', 'now', 'localtime')" };
  }
}
```

---

## 2. Directory & Component Architecture

```
src/
├── app/
│   ├── layout.tsx            # Main App Layout with 240px Sticky Left Sidebar
│   ├── page.tsx              # Dashboard View (Time-Filtered KPIs, Donut Chart, Trends)
│   ├── transactions/
│   │   └── page.tsx          # Transactions Page (Search, Category & Payment Method Filters)
│   ├── budgets/
│   │   └── page.tsx          # Monthly Category Budget Manager Page (₹ Caps)
│   ├── analytics/
│   │   └── page.tsx          # Financial Analytics Suite Page (Time-Filtered Audits)
│   ├── ai-analyst/
│   │   └── page.tsx          # Structured AI Analyst Page (Cards, Empty State, Skeletons)
│   ├── settings/
│   │   └── page.tsx          # App Settings & Custom Categories Management Page
│   └── api/
│       ├── transactions/     # GET, POST, PUT, DELETE REST Handlers
│       ├── categories/       # Category Management Handlers
│       ├── budgets/          # Category Budget Allocation Handlers
│       ├── analytics/        # Aggregate SQL Analytics Endpoint (?period=daily|weekly|monthly|yearly)
│       └── ai-analyst/       # AI Analytical Synthesis Endpoint (?period=daily|weekly|monthly|yearly)
├── components/
│   ├── Sidebar.tsx           # 240px Left Sidebar Component (Light Sage Active Item)
│   ├── Header.tsx            # Header with Greeting, TimePeriod Filter & Sage CTA
│   ├── StatCard.tsx          # KPI Metric Card Widget (28-32px Typography)
│   ├── CategoryDonutChart.tsx # Recharts Donut Chart ("Where Your Money Goes" in ₹)
│   ├── MonthlyBarChart.tsx   # Income vs. Expense Bar Chart ("Spending Overview" in ₹)
│   ├── BudgetProgressBar.tsx # Budget Usage Bar & Alert Badges (₹)
│   ├── TransactionModal.tsx  # Add / Edit Dialog (₹ Amount + Payment Method + Sage CTA)
│   ├── TransactionTable.tsx  # Transaction Table (Desktop Table & Mobile Stacked Cards)
│   └── AIAnalystChat.tsx     # Structured AI Analyst Cards Component
├── lib/
│   ├── db.ts                 # SQLite Database Connection & Migrations
│   ├── constants.ts          # Default Indian Categories & Payment Methods
│   ├── formatters.ts         # INR & Indian Date Formatter Utilities
│   ├── period.ts             # Time-Period Filter Helper Engine
│   └── aiEngine.ts           # Database Aggregate Query Engine for AI (Cards Payload)
└── types/
    └── index.ts              # TypeScript Domain Interfaces
```
