# Product Requirement Document (PRD) — SpendSense (India Edition - SaaS Redesign)

**Product Name:** SpendSense  
**Version:** 3.0.0 (Modern Light SaaS & Time-Period Filter Redesign)  
**Methodology:** BMAD (Agile AI-Driven Development)  
**Status:** Approved & Implemented  
**Author:** Antigravity AI & Harshi  

---

## 1. Executive Summary & Product Vision

**SpendSense** is a modern, premium, minimal, India-first personal finance web application. Designed around a calm, productivity-focused light SaaS aesthetic (`#F7F5F2` canvas, `#FFFFFF` cards, `#6F8F7A` Primary Sage accent), SpendSense operates natively in **Indian Rupees (₹ / INR)** with `en-IN` formatting (`₹1,00,000`), Indian financial categories, Indian payment methods (UPI, Cards, Cash, Bank Transfer), and Indian date conventions (`DD/MM/YYYY`).

SpendSense uses real-time SQLite database calculations to guarantee 100% financial accuracy, zero number hallucination, and total data privacy.

---

## 2. Design System & Visual Specification

### 2.1 Color Palette
- **Canvas Background:** `#F7F5F2`
- **Card Background:** `#FFFFFF`
- **Borders:** `#E8E4DF` (Card border) & `#DDD8D2` (Input border)
- **Primary Text:** `#242321`
- **Secondary Text:** `#5F5B56`
- **Muted Text:** `#8A857F`
- **Primary Sage:** `#6F8F7A` (Buttons & active accents)
- **Dark Sage:** `#4F6F5B` (Active navigation text/icon)
- **Light Sage:** `#E8F0EA` (Active navigation background)
- **Dusty Rose:** `#B78478` (Expense accents)
- **Warning Gold:** `#C49A5A`
- **Danger Red:** `#B56F67`
- **Subtle Shadow:** `0 2px 10px rgba(0,0,0,0.04)`

### 2.2 Typography & Spacing
- **Font Family:** Inter / System Sans-Serif
- **Page Title:** 28px / 700
- **Section Heading:** 20px / 600
- **Card Heading:** 16px / 600
- **Body Text:** 14px / 400
- **Metadata:** 12px / 500
- **Financial Values:** 28–32px / 700
- **Card Border Radius:** 16px
- **Input / Button Border Radius:** 10px

---

## 3. Time-Period Filtering Engine

All application views (Dashboard, Analytics, Charts, AI Analyst) support interactive time-period filtering:
- **Options:** `Daily`, `Weekly`, `Monthly`, `Yearly`
- **Default:** `Monthly`
- Dynamically filters database SQL aggregate calculations for:
  - Total Spending (₹)
  - Total Income (₹)
  - Balance & Remaining Budget (₹)
  - Savings Rate (%)
  - Category Donut Chart (`Where Your Money Goes`)
  - Income vs. Expense Trend Chart (`Spending Overview`)
  - AI Analyst Insights & Recommendations

---

## 4. Navigation & Application Shell

- **Desktop Shell:** Sticky `240px` white left sidebar with `#E8E4DF` right border.
- **Navigation Routes:**
  1. **Dashboard** (`/`)
  2. **Transactions** (`/transactions`)
  3. **Budgets** (`/budgets`)
  4. **AI Analyst** (`/ai-analyst`)
  5. **Analytics** (`/analytics`)
  6. **Settings** (`/settings`)
- **Active Navigation Indicator:** Background `#E8F0EA`, Text/Icon `#4F6F5B`.
- **Mobile Shell:** Compact top header navigation bar.

---

## 5. AI Analyst Analytical Cards (`/ai-analyst`)

Redesigned from a generic chatbot into a structured analytical suite:
1. **Spending Summary Card**
2. **Top Categories Card**
3. **Spending Trends Card**
4. **Unusual Spending / High-Value Audit Card**
5. **Budget Health Card**
6. **Actionable Recommendations Card**
- **Empty State:** Triggered when zero transactions exist: *"Your AI Analyst is ready — Add a few transactions and I'll start finding spending patterns and useful ways to save."* + CTA `Add your first transaction`.
- Includes skeleton loader state and error retry state.

---

## 6. Final Acceptance Criteria Verification

- [x] Modern light India-first UI (`#F7F5F2`, `#6F8F7A`, `#FFFFFF`).
- [x] Consistent design system (16px card radius, 10px button radius, Inter font).
- [x] Time-period filtering (`Daily`, `Weekly`, `Monthly`, `Yearly`) works dynamically across all charts, stats, and AI.
- [x] Monthly is default period.
- [x] All monetary values use `₹` / `INR` / `en-IN`.
- [x] No `$` or USD references remain anywhere.
- [x] No Seed Demo Data button; no fake transactions.
- [x] AI Analyst uses real SQLite data and handles empty/loading/error states cleanly.
- [x] CRUD remains fully functional.
- [x] Responsive layout on desktop (1440px max width), tablet, and mobile.
