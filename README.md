# SAEC CAFÉ — React Web Management & POS Portal

Modern, responsive web management portal and counter Point-of-Sale (POS) interface built with **React 19**, **TypeScript**, and **Vite** for **SAEC CAFÉ** at Syed Ammal Engineering College (SAEC).

---

## 1. Web Application Architecture

```
+-----------------------------------------------------------------------------------+
|                        React 19 + TypeScript + Vite SPA                           |
+-----------------------------------------+-----------------------------------------+
                                          |
        +---------------------------------+---------------------------------+
        |                                 |                                 |
        v                                 v                                 v
+-----------------------+     +-----------------------+     +-----------------------+
|  Navigation & Layout  |     |  Role-Based Views     |     |  API Services Layer   |
|  - Navbar             |     |  - Admin Dashboard    |     |  - Axios / Fetch API  |
|  - Sidebar            |     |  - Cashier POS View   |     |  - JWT Auth Intercept |
|  - Toast Notification |     |  - Live FCFS Queue    |     |  - Error Handlers     |
+-----------------------+     +-----------------------+     +-----------------------+
        |                                 |                                 |
        v                                 v                                 v
+-----------------------+     +-----------------------+     +-----------------------+
|  Admin Modules        |     |  POS & Receipts       |     |  Analytics Engine     |
|  - Food Catalog & Stock|    |  - 1-Click Counter POS|     |  - Recharts Visualizer|
|  - Calendar Manager   |     |  - 58mm/80mm Thermal  |     |  - Revenue Trends     |
|  - Excel User Roster  |     |  - Daily Order Code   |     |  - Peak Ordering Hours|
|  - Payment Support    |     |  - Reprint Support    |     |  - Category Breakdown |
+-----------------------+     +-----------------------+     +-----------------------+
```

---

## 2. Component Directory & Features

| Component | File Path | Description |
|---|---|---|
| **POS Counter** | `src/components/PosView.tsx` | High-speed counter billing interface for cashiers. Supports product search, category filtering, cart management, instant cash/UPI billing, and automatic thermal receipt generation. |
| **Thermal Receipt** | `src/components/ThermalReceipt.tsx` | Dedicated receipt printing engine optimized for standard **58mm** and **80mm** ESC/POS thermal printers. Features barcode, order ID (`CAN-XXXX`), cashier details, line items, and reprint badges. |
| **Analytics Dashboard** | `src/components/AnalyticsView.tsx` | Interactive PostgreSQL analytics with date range pickers (**Today**, **Yesterday**, **Last 7 Days**, **Last 30 Days**, **This Month**, **Custom Date Range**). Rendered using **Recharts** (AreaChart, BarChart, PieChart). |
| **Food & Stock Manager** | `src/components/FoodManagementView.tsx` | Full food catalogue management, price & cost editor, category organization, live availability toggle (`AVAILABLE`, `OUT_OF_STOCK`, `NOT_AVAILABLE_TODAY`), and preparation time tuning. |
| **FCFS Kitchen Queue** | `src/components/FcfsQueueView.tsx` | Real-time First-Come-First-Served kitchen fulfillment monitor, ordered by `confirmed_at ASC` timestamp with live status progression (`PREPARING` -> `READY` -> `DELIVERED`). |
| **Operating Calendar** | `src/components/CalendarManager.tsx` | Admin calendar controller for setting working days, college holidays, special schedules, and business operating hours (10:00 AM – 3:30 PM). |
| **User & Roster Manager**| `src/components/UserManagementView.tsx` | User management with dual-OTP registration verification, class-wise Excel roster batch upload with audit tracking, password resets, and role assignments. |
| **Order Management** | `src/components/OrderManagementView.tsx` | Unified live order search, order filtering by status/date/customer type, and order cancellation/refund workflows. |
| **Payment Support** | `src/components/PaymentSupportView.tsx` | Admin verification desk for resolving customer-uploaded payment screenshots, transaction IDs, and issue tickets. |
| **Inventory & Suppliers**| `src/components/InventoryView.tsx` | Stock transaction ledger (`STOCK_IN`, `STOCK_OUT`, `ADJUSTMENT`, `DAMAGE`), supplier directory, and low-stock alerts. |
| **Contact Orders** | `src/components/ContactOrdersView.tsx` | Review and approve/reject bulk catering requests and special department meal preparations. |
| **Student Ordering Simulator** | `src/components/StudentOrderingView.tsx` | Interactive customer ordering interface for testing student & faculty mobile workflows directly within the web portal. |

---

## 3. Technology Stack

- **Framework**: React 19 (`react`, `react-dom`)
- **Language**: TypeScript 5.8+ (`tsc`)
- **Bundler & Dev Server**: Vite 6+
- **Charting Library**: Recharts 3+
- **Iconography**: Lucide React
- **Linter**: Oxlint (ultra-fast Rust-based linter)

---

## 4. Local Development Setup

### Prerequisites
- Node.js 18+ or 20+
- npm / yarn / pnpm

### Installation & Execution

```powershell
# Navigate to web directory
cd web

# Install dependencies
npm install

# Start Vite local development server
npm run dev
```

Open `http://localhost:5173/` in your browser.

---

## 5. Available Scripts

| Script | Command | Description |
|---|---|---|
| `dev` | `npm run dev` | Starts Vite dev server on `http://0.0.0.0:5173` with Hot Module Replacement (HMR). |
| `build` | `npm run build` | Compiles TypeScript and builds optimized production bundle into `dist/`. |
| `lint` | `npm run lint` | Runs Oxlint across the TypeScript codebase for code quality checks. |
| `preview` | `npm run preview` | Previews the production build locally before deployment. |

---

## 6. Role-Based Access Control in Web Portal

1. **Administrator Access**:
   - Access to all modules: Analytics, Food Management, Inventory Ledger, Calendar Manager, User Roster & Excel Imports, Contact Orders, Payment Support, System Settings.
   - Login: `admin@saec.ac.in` (Password: `admin123`)

2. **Cashier Access**:
   - Access to POS Counter, Thermal Bill Printing, Live Order Search (`CAN-XXXX`), FCFS Kitchen Queue, Contact Order approvals.
   - Login: `cashier@saec.ac.in` (Password: `cashier123`)

3. **Student / Faculty Simulation**:
   - Integrated testing view for evaluating mobile food ordering flows, cart calculations, and time-window restrictions.

---

## 7. Production Build & Deployment

```powershell
# Build production bundle
npm run build
```

The resulting `dist/` directory contains minified, production-ready static assets ready for deployment to Vercel, Netlify, Cloudflare Pages, or serving via Nginx/Django WhiteNoise.
