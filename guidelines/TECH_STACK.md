# Tech Stack — Joel LMS

## Core Stack

| Layer | Choice | Reason |
|-------|--------|--------|
| Framework | **Vite + React 18** | Fast dev server, generated from Figma Make |
| Language | **TypeScript** | Type safety across the whole codebase |
| Routing | **React Router v7** | Client-side routing |
| Styling | **Tailwind CSS v4** | Utility-first, matches Figma tokens |
| UI Kit | **shadcn/ui** (Radix UI) | Already installed, accessible, customizable |
| Database | **Supabase (PostgreSQL)** | Managed Postgres, built-in auth, RLS |
| Auth | **Supabase Auth** + Google provider | OAuth 2.0, no password management needed |
| Deployment | **Vercel** | Static/SPA deployment |

---

## Package List (Already Installed)

The project was scaffolded from Figma Make. All key packages are already in `package.json`.
Run `pnpm install` to install them. Key packages:

```
react 18 + react-dom         — UI framework
react-router 7               — Client-side routing
typescript                   — Type safety
tailwindcss 4                — Styling
@radix-ui/*                  — shadcn/ui primitives (all installed)
lucide-react                 — Icons
react-hook-form              — Form management
react-dnd + html5-backend    — Drag and drop (quiz question reordering)
recharts                     — Charts (results/analytics)
motion                       — Animations
sonner                       — Toast notifications
date-fns                     — Date utilities
clsx + tailwind-merge        — Conditional class names
class-variance-authority     — Component variant management
```

To add Supabase (not yet installed):
```bash
pnpm add @supabase/supabase-js
```

---

## Tailwind v4 — Color Tokens

Tailwind v4 uses CSS `@theme` in `src/styles/tailwind.css` instead of `tailwind.config.ts`.
Add these design tokens from the Figma design spec:

```css
/* src/styles/tailwind.css */
@import "tailwindcss";

@theme {
  --color-primary: #4F46E5;
  --color-primary-dark: #3730A3;
  --color-primary-light: #EEF2FF;
  --color-success: #16A34A;
  --color-danger: #DC2626;
  --color-warning: #D97706;
  --color-neutral-900: #111827;
  --color-neutral-600: #4B5563;
  --color-neutral-300: #D1D5DB;
  --color-neutral-100: #F3F4F6;

  --font-family-sans: 'Inter', sans-serif;
  --font-family-mono: 'JetBrains Mono', monospace;

  --radius-card: 12px;
  --radius-btn: 8px;

  --shadow-card: 0 1px 3px rgba(0,0,0,0.08), 0 1px 2px rgba(0,0,0,0.06);
  --shadow-modal: 0 20px 60px rgba(0,0,0,0.15);
  --shadow-dropdown: 0 4px 16px rgba(0,0,0,0.10);
}
```

---

## TypeScript Types

All types go in `/types/index.ts`:

```ts
export type UserRole = 'admin' | 'student'

export interface User {
  id: string
  email: string
  full_name: string | null
  avatar_url: string | null
  role: UserRole
  created_at: string
}

export interface Subject {
  id: string
  name: string
  description: string | null
  enrollment_code: string
  created_by: string
  created_at: string
  updated_at: string
}

export type QuizStatus = 'draft' | 'published'

export interface Quiz {
  id: string
  subject_id: string
  title: string
  instructions: string | null
  time_limit_minutes: number | null
  available_from: string | null
  available_until: string | null
  show_answers_after: boolean
  status: QuizStatus
  created_by: string
  created_at: string
  updated_at: string
}

export type QuestionType =
  | 'multiple_choice'
  | 'true_or_false'
  | 'identification'
  | 'enumeration'
  | 'matching'

export interface Question {
  id: string
  quiz_id: string
  type: QuestionType
  question_text: string
  points: number
  sort_order: number
  case_sensitive: boolean | null
  order_matters: boolean | null
  partial_credit: boolean | null
  correct_boolean: boolean | null
  created_at: string
  options?: QuestionOption[]
}

export type OptionSide = 'left' | 'right' | null

export interface QuestionOption {
  id: string
  question_id: string
  option_text: string
  is_correct: boolean
  sort_order: number
  side: OptionSide
  match_id: string | null
}

export type AttemptStatus = 'in_progress' | 'submitted'

export interface QuizAttempt {
  id: string
  quiz_id: string
  student_id: string
  status: AttemptStatus
  score: number | null
  max_score: number | null
  started_at: string
  submitted_at: string | null
  time_taken_seconds: number | null
}

export interface AttemptAnswer {
  id: string
  attempt_id: string
  question_id: string
  selected_option_id: string | null
  answer_boolean: boolean | null
  answer_text: string | null
  answer_array: string[] | null
  answer_json: Record<string, string> | null
  points_earned: number | null
  is_correct: boolean | null
}

export interface SubjectEnrollment {
  id: string
  subject_id: string
  student_id: string
  enrolled_at: string
}
```

---

## Environment Variables

### `.env.local` (development)

```env
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key
VITE_APP_URL=http://localhost:5173
```

Note: Vite requires the `VITE_` prefix for all env vars exposed to the browser.
Never use a service role key in a Vite app — it would be exposed to the client.

### Vercel (production)

Set the same keys in Vercel → Project Settings → Environment Variables.
`NEXT_PUBLIC_APP_URL` should be your production domain, e.g. `https://joel-lms.vercel.app`.

---

## Supabase Setup Checklist

Before starting development:

- [ ] Create a Supabase project at supabase.com
- [ ] Enable Google provider in Authentication → Providers → Google
  - Create a Google OAuth app at console.cloud.google.com
  - Set redirect URI to `https://your-project.supabase.co/auth/v1/callback`
- [ ] Run all SQL from `DATABASE_SCHEMA.md` in the Supabase SQL editor
- [ ] Run the seed: `UPDATE users SET role = 'admin' WHERE email = 'joelgabatin47@gmail.com';`
- [ ] Copy `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY` from Supabase → Settings → API
- [ ] Enable RLS on all tables (already in schema SQL)

---

## Vercel Deployment Checklist

- [ ] Push project to GitHub
- [ ] Import repo into Vercel (Vercel auto-detects Vite)
- [ ] Set `VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY`, `VITE_APP_URL` in Vercel environment variables
- [ ] Add production Vercel URL to Supabase → Auth → URL Configuration → Site URL
- [ ] Add production Vercel URL to Google OAuth → Authorized Redirect URIs

---

## Key Conventions

- All Supabase calls use the single client from `src/lib/supabase.ts` — import `{ supabase }` everywhere
- No API routes — all data fetching goes directly to Supabase from the browser; RLS enforces security
- Scoring logic lives in `src/lib/scoring.ts` — call it client-side on quiz submit, then write results to Supabase
- Use `cn()` from `src/app/components/ui/utils.ts` (combines `clsx` + `tailwind-merge`) for conditional class names
- All TypeScript types/interfaces live in `src/types/index.ts`
- Component names match Figma component names exactly
- pnpm is the package manager — always use `pnpm add`, not `npm install`
