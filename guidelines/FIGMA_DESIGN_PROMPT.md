# Figma Design Prompt — Joel LMS (Learning Management System)

## Project Overview

Design a clean, modern, and professional Learning Management System (LMS) web application.
The app has two user roles: **Admin** and **Student**. It is used for managing academic subjects,
creating quizzes with 5 question types, and tracking student results. The app is desktop-first
but should be responsive down to tablet (768px).

---

## Brand & Visual Identity

### Color Palette

| Token | Hex | Usage |
|-------|-----|-------|
| Primary | `#4F46E5` (Indigo 600) | Buttons, active states, links |
| Primary Dark | `#3730A3` (Indigo 800) | Hover states |
| Primary Light | `#EEF2FF` (Indigo 50) | Backgrounds, chips, badges |
| Success | `#16A34A` (Green 600) | Correct answers, passing scores |
| Danger | `#DC2626` (Red 600) | Wrong answers, delete actions |
| Warning | `#D97706` (Amber 600) | Pending, draft states |
| Neutral 900 | `#111827` | Headings |
| Neutral 600 | `#4B5563` | Body text |
| Neutral 300 | `#D1D5DB` | Borders, dividers |
| Neutral 100 | `#F3F4F6` | Page backgrounds |
| White | `#FFFFFF` | Cards, panels |

### Typography

- **Font Family:** Inter (Google Fonts)
- **Headings:** Inter SemiBold (600) / Bold (700)
- **Body:** Inter Regular (400) / Medium (500)
- **Code/IDs:** JetBrains Mono (for subject codes, quiz IDs)

| Scale | Size | Weight | Usage |
|-------|------|--------|-------|
| H1 | 30px | 700 | Page titles |
| H2 | 24px | 600 | Section headers |
| H3 | 18px | 600 | Card titles |
| Body | 14px | 400 | General text |
| Small | 12px | 400 | Labels, captions |
| Code | 14px | 500 | Subject codes |

### Spacing System

Use an 8px base grid. Common spacings: 4, 8, 12, 16, 24, 32, 48, 64px.

### Border Radius

- Cards: `12px`
- Buttons: `8px`
- Inputs: `8px`
- Badges/Chips: `9999px` (pill)
- Avatars: `9999px` (circle)

### Shadows

- Card: `0 1px 3px rgba(0,0,0,0.08), 0 1px 2px rgba(0,0,0,0.06)`
- Modal: `0 20px 60px rgba(0,0,0,0.15)`
- Dropdown: `0 4px 16px rgba(0,0,0,0.10)`

---

## Layout System

### Global Shell (Authenticated)

```
┌─────────────────────────────────────────────────────┐
│  SIDEBAR (240px)  │        MAIN CONTENT AREA         │
│                   │                                  │
│  Logo + App Name  │  Top Bar (breadcrumb + avatar)   │
│  ─────────────    │  ─────────────────────────────   │
│  Nav Items        │  Page Content                    │
│                   │                                  │
│  [bottom]         │                                  │
│  User avatar +    │                                  │
│  name + role      │                                  │
└─────────────────────────────────────────────────────┘
```

**Sidebar:**
- Fixed left, full height, white background
- App logo/name at top (e.g., a graduation cap icon + "Joel LMS")
- Navigation items with icon + label, active state uses Primary Light background + Primary text
- Bottom section: user avatar (Google photo), display name, role badge

**Top Bar:**
- Breadcrumb navigation (e.g., Subjects > Math 101 > Quiz)
- Right side: notification bell (optional), user avatar

---

## Screens to Design

---

### SCREEN 1 — Login / Landing Page

**Purpose:** The only public page. Users sign in with Google.

**Layout:** Centered card on a full-page background.

**Elements:**
- Background: soft gradient (`#EEF2FF` to `#E0E7FF`) or abstract geometric pattern
- Centered white card (480px wide, auto height)
  - App logo + name at top center
  - Tagline: "Your personal learning space"
  - Divider
  - "Sign in with Google" button (full width, white background, Google logo on left, border style)
  - Small footer text: "Students: use the enrollment code provided by your instructor"

---

### SCREEN 2 — Admin Dashboard

**Purpose:** Admin's home overview.

**Top Stats Row (4 cards):**
- Total Subjects
- Total Quizzes
- Total Students
- Recent Submissions

**Recent Activity Section:**
- Table or card list of latest quiz submissions (student name, subject, quiz, score, date)

**Quick Actions:**
- "Create Subject" button
- "Create Quiz" button

---

### SCREEN 3 — Admin: Subjects List

**Layout:** Full-width page with a header row and a card grid (3 columns).

**Header Row:**
- Page title "Subjects"
- "+ New Subject" primary button (right)
- Search input

**Subject Card:**
- Subject name (H3)
- Short description (2 lines, truncated)
- Enrollment code displayed in a monospace chip (e.g., `MATH-4X9K`) with a copy icon
- Student count badge (e.g., "12 students")
- Quiz count badge (e.g., "4 quizzes")
- "View" and "Edit" action buttons (bottom of card)
- Subtle colored top border (use Primary color)

---

### SCREEN 4 — Admin: Create / Edit Subject (Modal or Slide-over)

**Form Fields:**
- Subject Name (text input)
- Description (textarea)
- Enrollment Code — auto-generated, shown as read-only with a "Regenerate" icon button

**Actions:**
- Cancel button (ghost)
- Save button (primary)

---

### SCREEN 5 — Admin: Subject Detail Page

**Tabs:** `Overview` | `Quizzes` | `Students`

**Overview Tab:**
- Subject info card (name, description, code)
- Stats: enrolled students, total quizzes, avg score

**Quizzes Tab:**
- "+ New Quiz" button
- Table: Quiz Title | Type/Questions | Time Limit | Status (Draft/Open/Closed) | Avg Score | Actions (Edit, View Results, Delete)

**Students Tab:**
- Table: Avatar + Name | Email | Enrolled Date | Quizzes Taken | Actions (Remove)

---

### SCREEN 6 — Admin: Create / Edit Quiz

**Step 1 — Quiz Settings (top form):**
- Quiz Title
- Instructions / Description (textarea)
- Time Limit (number input + "minutes" label, with toggle to enable/disable)
- Availability: Start Date + End Date (date pickers)
- Show correct answers after submission (toggle)
- Status: Draft / Published (toggle or select)

**Step 2 — Questions Builder (below settings):**
- "+ Add Question" button
- List of question cards (reorderable via drag handle)

**Question Card (collapsed):**
- Drag handle (left)
- Question number + type badge + first 60 chars of question text
- Points badge
- Edit / Delete icons (right)

**Question Card (expanded — per type):**

**Multiple Choice:**
- Question text (textarea)
- 4 option inputs, each with a radio button to mark correct answer
- "+ Add Option" link (up to 6 options)
- Points input

**True or False:**
- Question text (textarea)
- Two large toggle buttons: "True" / "False" (mark which is correct)
- Points input

**Identification:**
- Question text (textarea)
- "Correct Answer" input
- "Accept alternate answers" — add more acceptable answers
- Case-sensitive toggle
- Points input

**Enumeration:**
- Question text / prompt (textarea)
- List of accepted answers (add/remove rows)
- "Order matters" toggle
- Points input

**Matching Type:**
- Question / instruction text (textarea)
- Two-column builder: Left items (terms) | Right items (definitions)
- "+ Add Pair" button
- Points input

---

### SCREEN 7 — Admin: Quiz Results Page

**Header:** Quiz title, subject name, total submissions

**Summary Cards:**
- Average Score
- Highest Score
- Lowest Score
- Completion Rate

**Results Table:**
- Student Name + Avatar | Score | Percentage | Time Taken | Submitted At | Actions (View Detail)

**Per-Student Detail (Modal or sub-page):**
- Header: student name, total score
- Each question listed with: question text, student's answer, correct answer, points earned/total
- Color coding: green = correct, red = wrong, yellow = partial

---

### SCREEN 8 — Student Dashboard

**Layout:** Same sidebar shell, different nav items.

**Welcome banner:**
- "Welcome back, [Name]!" with Google avatar
- Subtitle: "Here's what's happening in your courses"

**My Subjects (card grid, 2-3 columns):**
- Subject name
- Next available quiz (or "No quizzes available")
- Progress bar (quizzes completed / total)
- "Go to Subject" button

**Recent Activity:**
- List of recent quiz attempts with score badges

---

### SCREEN 9 — Student: Enroll in Subject

**Trigger:** "Join Subject" button in sidebar or dashboard

**Modal:**
- Input field: "Enter subject code" (large, monospace style)
- Submit button
- Error state: "Invalid or expired code"
- Success state: brief confirmation before closing

---

### SCREEN 10 — Student: Subject Detail Page

**Header:** Subject name + description

**Quizzes List (cards):**
- Quiz title
- Question count + time limit
- Status badge: Available / Upcoming / Closed / Completed
- If completed: score badge (e.g., "85%")
- "Start Quiz" button (disabled if not available or already completed)

---

### SCREEN 11 — Student: Quiz Taking Page

**Layout:** Full-screen, distraction-free. Sidebar hidden.

**Top Bar:**
- Quiz title (left)
- Timer countdown (center, turns red when < 1 min)
- Progress: "Question 3 of 10" (right)

**Question Area (centered card, max 800px wide):**
- Question number + type badge
- Question text (H2 size)
- Answer input (varies by type — see below)

**Answer Inputs per Type:**

*Multiple Choice:* Large radio button cards (full-width options, hover state)

*True or False:* Two large full-width button cards side by side ("True" / "False")

*Identification:* Single text input, full width, large font

*Enumeration:* Multiple text input rows with "+ Add Answer" button

*Matching Type:* Two columns; left column items are fixed, right column has dropdowns or drag-drop to match

**Bottom Bar:**
- "Previous" button (left, ghost)
- Question dots/progress bar (center)
- "Next" / "Submit" button (right, primary)

**Submit Confirmation Modal:**
- "You have X unanswered questions. Submit anyway?"
- Cancel / Confirm buttons

---

### SCREEN 12 — Student: Quiz Results Page

**Header:**
- Quiz title + subject
- Score display: large number "85 / 100" with a circular progress ring
- Percentage badge: color-coded (green ≥ 75%, yellow 50–74%, red < 50%)
- Time taken

**If admin allowed answer reveal:**
- Full question-by-question breakdown (same as admin detail view)

**If not:**
- Just the score, no answer details

**"Back to Subject" button**

---

## Component Library to Design

Design all of these as reusable Figma components with variants:

| Component | Variants |
|-----------|----------|
| Button | Primary, Secondary, Ghost, Danger — Size: SM, MD, LG — State: Default, Hover, Disabled, Loading |
| Input | Default, Focus, Error, Disabled — with/without label, with/without helper text |
| Textarea | Same states as Input |
| Select/Dropdown | Default, Open, Error, Disabled |
| Date Picker | Single date, range |
| Card | Default, Hover, Selected |
| Badge/Chip | Colors: Primary, Success, Danger, Warning, Neutral |
| Avatar | Size: SM, MD, LG — with/without status dot |
| Modal | Default size, large size |
| Sidebar Nav Item | Default, Active, Hover |
| Toggle/Switch | On, Off, Disabled |
| Table | Header row, body row, empty state |
| Toast Notification | Success, Error, Warning, Info |
| Loading Spinner | SM, MD, LG |
| Progress Bar | Default, with label |
| Score Ring | Various fill levels |
| Question Card | Per type: MCQ, T/F, Identification, Enumeration, Matching |
| Subject Card | Default, hover |

---

## User Flows to Diagram in Figma

1. **Admin creates a subject** → sets enrollment code → shares with students
2. **Admin creates a quiz** → adds questions (all 5 types) → publishes it
3. **Student logs in** → enters subject code → enrolls → takes quiz → sees results
4. **Admin views results** → drills into per-student detail

---

## Design Notes

- Use **skeleton loaders** (not spinners) for page-level data loading
- Every table should have an **empty state** illustration or message
- Every destructive action (delete subject, remove student) must show a **confirmation modal**
- The quiz-taking screen should feel **focused and calm** — no distractions
- Use **subtle animations** for transitions (slide-in modals, fade-in toasts)
- Ensure **accessible contrast ratios** (WCAG AA minimum)
- Design for **desktop first** (1280px canvas), then create tablet variants (768px)
