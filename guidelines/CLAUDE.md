# CLAUDE.md — Joel LMS

## Project Overview

A personal Learning Management System (LMS) built with **Vite + React + TypeScript**, using
**Supabase** as the backend/database/auth, and deployed on **Vercel**. Used by one admin (Joel)
and students. Features subject management, quiz creation (5 question types), enrollment via
subject codes, and result tracking. Authentication is via Google OAuth only.

All guidelines, schema, and product requirements are in the `guidelines/` folder:
- `guidelines/PRD.md` — full feature specifications and acceptance criteria
- `guidelines/DATABASE_SCHEMA.md` — Supabase schema, RLS policies, SQL
- `guidelines/TECH_STACK.md` — packages, types, env vars, conventions
- `guidelines/FIGMA_DESIGN_PROMPT.md` — Figma design reference

---

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Framework | Vite + React 18 |
| Language | TypeScript |
| Routing | React Router v7 |
| Styling | Tailwind CSS v4 |
| UI Components | shadcn/ui (Radix UI primitives, already installed) |
| Database | Supabase (PostgreSQL) |
| Auth | Supabase Auth (Google OAuth provider) |
| Supabase Client | `@supabase/supabase-js` |
| Forms | React Hook Form (already installed) |
| Drag & Drop | react-dnd + react-dnd-html5-backend (already installed) |
| Charts | Recharts (already installed) |
| Animations | Motion / Framer Motion (already installed) |
| Icons | Lucide React (already installed) |
| Toast | Sonner (already installed) |
| Deployment | Vercel |

---

## Project Structure

```
Joelllm/
├── guidelines/              # All project docs — READ THESE FIRST
│   ├── CLAUDE.md            # This file
│   ├── PRD.md               # Product requirements + acceptance criteria
│   ├── DATABASE_SCHEMA.md   # Supabase SQL schema + RLS policies
│   ├── TECH_STACK.md        # Packages, TypeScript types, conventions
│   └── FIGMA_DESIGN_PROMPT.md  # Design reference
├── src/
│   ├── main.tsx             # App entry point
│   ├── app/
│   │   ├── App.tsx          # Root app + React Router setup
│   │   ├── components/
│   │   │   ├── AppLayout.tsx          # Sidebar + shell layout
│   │   │   ├── Login.tsx              # Google OAuth login page
│   │   │   ├── admin/
│   │   │   │   ├── AdminDashboard.tsx
│   │   │   │   ├── AdminSubjects.tsx
│   │   │   │   ├── AdminSubjectDetail.tsx
│   │   │   │   ├── AdminQuizBuilder.tsx
│   │   │   │   └── AdminQuizResults.tsx
│   │   │   ├── student/
│   │   │   │   ├── StudentDashboard.tsx
│   │   │   │   ├── StudentSubjectDetail.tsx
│   │   │   │   ├── StudentQuizTaking.tsx
│   │   │   │   └── StudentQuizResults.tsx
│   │   │   └── ui/                    # shadcn/ui components (already generated)
│   │   └── utils/
│   │       └── clipboard.ts
│   ├── lib/
│   │   ├── supabase.ts        # Supabase client singleton
│   │   ├── utils.ts           # cn() helper + shared utilities
│   │   ├── scoring.ts         # Quiz scoring logic (per question type)
│   │   └── code-generator.ts  # Subject enrollment code generator
│   ├── hooks/
│   │   ├── useAuth.ts         # Auth state + role (React context)
│   │   ├── useSubjects.ts
│   │   ├── useQuizzes.ts
│   │   └── useAttempts.ts
│   ├── types/
│   │   └── index.ts           # All TypeScript interfaces
│   └── styles/
│       ├── index.css
│       ├── tailwind.css
│       ├── theme.css          # CSS variables for design tokens
│       └── fonts.css
├── .env.local                 # Environment variables (never commit)
├── vite.config.ts
└── package.json               # Uses pnpm
```

---

## Environment Variables

Create a `.env.local` file in the project root:

```env
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-supabase-anon-key
VITE_APP_URL=http://localhost:5173
```

In Vercel, set the same keys with the production values.
**Important:** Vite env vars must be prefixed with `VITE_` to be accessible in the browser.

---

## Supabase Client Setup

```ts
// src/lib/supabase.ts
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

export const supabase = createClient(supabaseUrl, supabaseAnonKey)
```

This is a pure client-side Vite app — all Supabase calls are made directly from the browser.
There are no API routes. **Row Level Security (RLS) is the only security layer** — it must be
correctly configured on all tables. See `guidelines/DATABASE_SCHEMA.md`.

---

## Common Commands

```bash
# Install dependencies (uses pnpm)
pnpm install

# Run dev server (http://localhost:5173)
pnpm dev

# Build for production
pnpm build
```

---

## Routing (React Router v7)

```tsx
// App.tsx — route structure
<Routes>
  <Route path="/login" element={<Login />} />

  {/* Admin routes — redirect non-admins away */}
  <Route path="/admin" element={<AdminGuard><AppLayout role="admin" /></AdminGuard>}>
    <Route index element={<Navigate to="dashboard" />} />
    <Route path="dashboard" element={<AdminDashboard />} />
    <Route path="subjects" element={<AdminSubjects />} />
    <Route path="subjects/:id" element={<AdminSubjectDetail />} />
    <Route path="subjects/:id/quizzes/new" element={<AdminQuizBuilder />} />
    <Route path="subjects/:id/quizzes/:quizId/edit" element={<AdminQuizBuilder />} />
    <Route path="subjects/:id/quizzes/:quizId/results" element={<AdminQuizResults />} />
  </Route>

  {/* Student routes — redirect unauthenticated users */}
  <Route path="/student" element={<StudentGuard><AppLayout role="student" /></StudentGuard>}>
    <Route index element={<Navigate to="dashboard" />} />
    <Route path="dashboard" element={<StudentDashboard />} />
    <Route path="subjects/:id" element={<StudentSubjectDetail />} />
    <Route path="quiz/:quizId" element={<StudentQuizTaking />} />
    <Route path="quiz/:quizId/results" element={<StudentQuizResults />} />
  </Route>

  <Route path="/" element={<RootRedirect />} />
</Routes>
```

---

## Key Implementation Notes

### Authentication & Role Guard

- Sign in via Supabase Google OAuth (`supabase.auth.signInWithOAuth({ provider: 'google' })`).
- After sign-in, a DB trigger auto-creates a `users` record with `role = 'student'`.
- Joel's account (`joelgabatin47@gmail.com`) must have `role = 'admin'` — set directly in Supabase.
- Store `user` + `role` in a React context (`AuthContext`). Expose via `useAuth()` hook.
- `AdminGuard`: if not admin, redirect to `/student/dashboard`.
- `StudentGuard`: if not authenticated, redirect to `/login`.

### Google OAuth Redirect

In Supabase → Auth → URL Configuration:
- Site URL: `http://localhost:5173` (dev) / your Vercel URL (prod)
- Supabase handles the OAuth callback automatically via `supabase.auth.onAuthStateChange`.

### Enrollment Code

- Format: `SUBJ-XXXX` (4 random uppercase alphanumeric chars).
- Generated client-side via `lib/code-generator.ts`, stored in the `subjects` table.
- Admin can regenerate (old code becomes invalid immediately).
- Student enrollment: query `subjects` by `enrollment_code` → insert `subject_enrollments` row.

### Quiz Scoring Logic (`lib/scoring.ts`)

Scoring runs client-side on submit, then written to Supabase. Per question type:

- **Multiple Choice:** Match `selected_option_id` to the option where `is_correct = true`.
- **True or False:** Match `answer_boolean` to `questions.correct_boolean`.
- **Identification:** Trim + compare `answer_text` against all options where `is_correct = true`. If `case_sensitive = false`, lowercase both.
- **Enumeration:** Compare `answer_array` against accepted options. If `order_matters = false`, treat as sets. If `partial_credit = true`, award `(matched / total) * points`.
- **Matching Type:** Check `answer_json[left_id] === correct_right_id` per pair. Award `points / total_pairs` per correct match.

### Quiz Taking Flow

1. Student clicks "Start Quiz" → insert `quiz_attempts` row (`status = 'in_progress'`).
2. Auto-save answers to `attempt_answers` on each "Next" navigation.
3. On final submit or timer expiry: score all answers, update `attempt_answers.points_earned`, sum total, update `quiz_attempts` (`status = 'submitted'`, `score`, `max_score`, `submitted_at`, `time_taken_seconds`).
4. Navigate to `/student/quiz/:quizId/results`.

### Figma-to-Code

- Figma designs are the source of truth. Match spacing, colors, and typography exactly.
- Color tokens are in `src/styles/theme.css` as CSS variables — use those, not hardcoded hex.
- shadcn/ui components are in `src/app/components/ui/` — customize to match Figma designs.
- See `guidelines/FIGMA_DESIGN_PROMPT.md` for the full design spec.

---

## Database

See `guidelines/DATABASE_SCHEMA.md` for all SQL, RLS policies, and the ER diagram.

## Product Requirements

See `guidelines/PRD.md` for full feature specs and acceptance criteria.
