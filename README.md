<div align="center">

# Cifra

### Personal Finance, made simple.

Track expenses, manage budgets, build savings goals and understand your money from one mobile-first app.

`Next.js` · `React` · `Supabase` · `PostgreSQL` · `Capacitor`

</div>

---

## Preview

> Aquí pondremos 2 o 3 capturas de la app.

---

## What Cifra does

- Track income and expenses
- Create custom categories and payment methods
- Set monthly budgets
- Manage savings goals
- Automate recurring payments
- Generate financial analytics and insights
- Export monthly reports to PDF
- Receive in-app alerts
- Protect every user's data with Supabase RLS

---

## Architecture

```text
Mobile / Web UI
      │
      ▼
Next.js + React
      │
      ▼
Supabase
 ├─ Authentication
 ├─ PostgreSQL
 ├─ Row Level Security
 └─ RPC / database logic
      │
      ▼
Capacitor
      │
      ▼
Android APK
