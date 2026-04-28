# PRD — Joel LMS (Product Requirements Document)

## 1. Purpose

A personal Learning Management System for Joel to manage academic subjects, create quizzes,
and track student performance. Students enroll via subject codes and take quizzes online.

---

## 2. Users & Roles

| Role | Description |
|------|-------------|
| Admin | Joel. Full access. Manages subjects, quizzes, students, and views all results. |
| Student | Any Google-authenticated user who enrolls in at least one subject. |

---

## 3. Authentication

### Requirements
- Login via Google OAuth only (no email/password).
- On first login, a user record is created in the `users` table with role `student`.
- Joel's Google account (`joelgabatin47@gmail.com`) must be assigned `admin` role (set via Supabase directly or seed script).
- Unauthenticated users are redirected to `/login`.
- Admin routes (`/admin/*`) redirect non-admins to the student dashboard.

### Acceptance Criteria
- [ ] Clicking "Sign in with Google" opens the Google OAuth consent screen.
- [ ] After successful login, user is redirected based on role: admin → `/admin/dashboard`, student → `/student/dashboard`.
- [ ] Logging out clears the session and redirects to `/login`.

---

## 4. Subject Management (Admin)

### 4.1 Create Subject
**Fields:** Name (required), Description (optional), Enrollment Code (auto-generated)

**Acceptance Criteria:**
- [ ] Admin can create a subject with a name and optional description.
- [ ] Enrollment code is auto-generated as `SUBJ-XXXX` on creation.
- [ ] Admin can regenerate the enrollment code at any time.
- [ ] Subject appears in the subjects list immediately after creation.

### 4.2 Edit Subject
- [ ] Admin can edit the subject name and description.
- [ ] Admin can regenerate the enrollment code (old code immediately becomes invalid).

### 4.3 Delete Subject
- [ ] Admin can delete a subject (with confirmation dialog).
- [ ] Deleting a subject cascades: deletes quizzes, attempts, and enrollment records.

### 4.4 View Subjects
- [ ] Subjects list shows: name, description, enrollment code, student count, quiz count.
- [ ] Admin can copy the enrollment code with one click.
- [ ] Search bar filters subjects by name.

---

## 5. Quiz Management (Admin)

### 5.1 Create Quiz
**Fields:**
- Title (required)
- Instructions / Description
- Time Limit (minutes, optional toggle)
- Start Date / End Date (optional availability window)
- Show Correct Answers After Submission (toggle)
- Status: Draft | Published

**Acceptance Criteria:**
- [ ] Admin can create a quiz under a specific subject.
- [ ] Quiz is saved as Draft by default; must be explicitly Published to be visible to students.
- [ ] All fields except Title are optional.
- [ ] If no availability window is set, the quiz is always available once published.

### 5.2 Add Questions
Admin can add questions of 5 types. Each question has a Points value (default: 1).

#### Multiple Choice
- [ ] Question text input.
- [ ] 2–6 answer options (at least 2, default 4).
- [ ] Exactly one option marked as correct.
- [ ] Admin can add/remove options up to 6.

#### True or False
- [ ] Question text input.
- [ ] Mark either True or False as correct.

#### Identification
- [ ] Question text / prompt input.
- [ ] One primary correct answer.
- [ ] Optional alternate accepted answers (add/remove rows).
- [ ] Toggle: Case-sensitive comparison (default: off).

#### Enumeration
- [ ] Question text / prompt input.
- [ ] List of accepted answers (2+ rows, add/remove).
- [ ] Toggle: Order matters (default: off).
- [ ] Scoring: full points only if all items correct, OR partial points per item (toggle per question).

#### Matching Type
- [ ] Question instruction text input.
- [ ] 2+ pairs of terms (left) and definitions (right).
- [ ] Add/remove pairs.
- [ ] Points split equally across correct pairs.

### 5.3 Reorder Questions
- [ ] Questions can be reordered via drag-and-drop.
- [ ] Order is saved immediately.

### 5.4 Edit / Delete Questions
- [ ] Admin can edit any question inline.
- [ ] Admin can delete a question (with confirmation).

### 5.5 Publish / Unpublish Quiz
- [ ] Admin can toggle quiz status between Draft and Published.
- [ ] Unpublishing a quiz hides it from students immediately.

---

## 6. Results & Analytics (Admin)

### 6.1 Quiz Results Page
- [ ] Shows all submissions for a quiz.
- [ ] Per submission: student name, score, percentage, time taken, submitted at.
- [ ] Summary cards: average score, highest score, lowest score, completion rate.

### 6.2 Per-Student Detail
- [ ] Admin can click a submission to see the full question-by-question breakdown.
- [ ] Each question shows: question text, student's answer, correct answer, points earned.
- [ ] Color coding: green (correct), red (wrong), yellow (partial credit).

### 6.3 Export
- [ ] Admin can export quiz results as CSV.

---

## 7. Student Management (Admin)

### 7.1 View Enrolled Students
- [ ] Under each subject, admin can view all enrolled students.
- [ ] Table shows: name, email, enrollment date, quizzes attempted.

### 7.2 Remove Student
- [ ] Admin can remove a student from a subject (with confirmation).
- [ ] Removal does NOT delete the student's past attempt records.

---

## 8. Enrollment (Student)

### 8.1 Join a Subject
- [ ] Student can enter a subject enrollment code in a modal or dedicated page.
- [ ] If the code is valid, the student is enrolled and the subject appears in their dashboard.
- [ ] If the code is invalid, show an error message.
- [ ] A student cannot enroll in the same subject twice.

---

## 9. Quiz Taking (Student)

### 9.1 Availability Check
- [ ] Student only sees quizzes that are Published AND within the availability window (if set).
- [ ] Student cannot start a quiz they have already completed (no re-attempts unless admin resets).
- [ ] If a quiz has a time limit, a countdown timer is displayed.

### 9.2 Quiz Flow
- [ ] Student answers questions one at a time (or all on one page — TBD in design).
- [ ] Answers are auto-saved when navigating between questions.
- [ ] Student can go back to previous questions before submitting.
- [ ] On submit (or timer expiry), the attempt is locked.

### 9.3 Submission
- [ ] If there are unanswered questions, show a confirmation dialog before submitting.
- [ ] Timer expiry auto-submits with whatever answers have been provided.
- [ ] After submission, score is calculated server-side and stored.

### 9.4 Results View
- [ ] Student sees their score (points and percentage) after submission.
- [ ] If admin enabled "Show Correct Answers", student sees the full breakdown.
- [ ] If not, student only sees their total score.

---

## 10. Student Dashboard

- [ ] Shows all enrolled subjects as cards.
- [ ] Each subject card shows: next available quiz (or "No quizzes available"), completion progress.
- [ ] Recent activity section shows last 5 quiz attempts with scores.

---

## 11. Non-Functional Requirements

| Requirement | Detail |
|-------------|--------|
| Performance | Pages load in < 2s on a standard connection |
| Security | All data access enforced by Supabase RLS; scores calculated server-side only |
| Availability | 99.9% uptime via Vercel + Supabase |
| Mobile | Responsive down to 768px (tablet); quiz-taking usable on tablet |
| Accessibility | WCAG AA contrast ratios; keyboard-navigable quiz interface |
| Data integrity | Cascade deletes; no orphaned records |

---

## 12. Out of Scope (v1)

- Multiple quiz attempts / retakes (admin can manually delete an attempt to allow retry)
- Discussion boards or messaging
- File uploads in questions (images, PDFs)
- Graded essays or open-ended long-answer questions
- Email notifications
- Mobile app
- Multiple admins
