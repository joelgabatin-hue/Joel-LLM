# Database Schema — Joel LMS (Supabase / PostgreSQL)

## Overview

All tables have Row Level Security (RLS) enabled. The `users` table mirrors
`auth.users` from Supabase Auth and stores the role assignment. Service-role
keys are only used server-side (API routes); the browser client uses the anon key.

---

## Tables

### `users`

Mirrors Supabase auth users. Created via trigger on `auth.users` insert.

```sql
CREATE TABLE users (
  id          UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email       TEXT NOT NULL UNIQUE,
  full_name   TEXT,
  avatar_url  TEXT,
  role        TEXT NOT NULL DEFAULT 'student' CHECK (role IN ('admin', 'student')),
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
```

**Trigger to auto-create on signup:**
```sql
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO users (id, email, full_name, avatar_url)
  VALUES (
    NEW.id,
    NEW.email,
    NEW.raw_user_meta_data->>'full_name',
    NEW.raw_user_meta_data->>'avatar_url'
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION handle_new_user();
```

**Seed admin:**
```sql
UPDATE users SET role = 'admin' WHERE email = 'joelgabatin47@gmail.com';
```

---

### `subjects`

```sql
CREATE TABLE subjects (
  id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name             TEXT NOT NULL,
  description      TEXT,
  enrollment_code  TEXT NOT NULL UNIQUE,
  created_by       UUID NOT NULL REFERENCES users(id),
  created_at       TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at       TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
```

---

### `subject_enrollments`

Junction table for students enrolled in subjects.

```sql
CREATE TABLE subject_enrollments (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  subject_id  UUID NOT NULL REFERENCES subjects(id) ON DELETE CASCADE,
  student_id  UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  enrolled_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (subject_id, student_id)
);
```

---

### `quizzes`

```sql
CREATE TABLE quizzes (
  id                       UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  subject_id               UUID NOT NULL REFERENCES subjects(id) ON DELETE CASCADE,
  title                    TEXT NOT NULL,
  instructions             TEXT,
  time_limit_minutes       INTEGER,           -- NULL = no time limit
  available_from           TIMESTAMPTZ,       -- NULL = always available
  available_until          TIMESTAMPTZ,       -- NULL = always available
  show_answers_after       BOOLEAN NOT NULL DEFAULT FALSE,
  status                   TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'published')),
  created_by               UUID NOT NULL REFERENCES users(id),
  created_at               TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at               TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
```

---

### `questions`

```sql
CREATE TABLE questions (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  quiz_id         UUID NOT NULL REFERENCES quizzes(id) ON DELETE CASCADE,
  type            TEXT NOT NULL CHECK (type IN (
                    'multiple_choice',
                    'true_or_false',
                    'identification',
                    'enumeration',
                    'matching'
                  )),
  question_text   TEXT NOT NULL,
  points          NUMERIC(5,2) NOT NULL DEFAULT 1,
  sort_order      INTEGER NOT NULL DEFAULT 0,
  -- Identification-specific
  case_sensitive  BOOLEAN DEFAULT FALSE,
  -- Enumeration-specific
  order_matters   BOOLEAN DEFAULT FALSE,
  partial_credit  BOOLEAN DEFAULT TRUE,
  -- True/False-specific
  correct_boolean BOOLEAN,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
```

---

### `question_options`

Used by Multiple Choice and Identification (alternate answers) and Enumeration (accepted answers).

```sql
CREATE TABLE question_options (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  question_id  UUID NOT NULL REFERENCES questions(id) ON DELETE CASCADE,
  option_text  TEXT NOT NULL,
  is_correct   BOOLEAN NOT NULL DEFAULT FALSE,
  sort_order   INTEGER NOT NULL DEFAULT 0,
  -- For matching type: which side this item belongs to
  side         TEXT CHECK (side IN ('left', 'right', NULL)),
  -- For matching type: links a left item to its correct right item
  match_id     UUID REFERENCES question_options(id)
);
```

**How each type uses this table:**

| Type | Usage |
|------|-------|
| Multiple Choice | One row per option. `is_correct = true` for the correct one. |
| True or False | Stored directly on `questions.correct_boolean`; no rows here. |
| Identification | One row for primary answer + rows for alternate answers. All `is_correct = true`. |
| Enumeration | One row per accepted answer. All `is_correct = true`. |
| Matching Type | Left column items: `side = 'left'`. Right column items: `side = 'right'`. Left items have `match_id` pointing to their correct right item. |

---

### `quiz_attempts`

One record per student per quiz.

```sql
CREATE TABLE quiz_attempts (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  quiz_id         UUID NOT NULL REFERENCES quizzes(id) ON DELETE CASCADE,
  student_id      UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  status          TEXT NOT NULL DEFAULT 'in_progress' CHECK (status IN ('in_progress', 'submitted')),
  score           NUMERIC(8,2),              -- NULL until submitted
  max_score       NUMERIC(8,2),              -- Filled on submission
  started_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  submitted_at    TIMESTAMPTZ,
  time_taken_seconds INTEGER,
  UNIQUE (quiz_id, student_id)               -- One attempt per student per quiz
);
```

---

### `attempt_answers`

One row per question per attempt.

```sql
CREATE TABLE attempt_answers (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  attempt_id      UUID NOT NULL REFERENCES quiz_attempts(id) ON DELETE CASCADE,
  question_id     UUID NOT NULL REFERENCES questions(id) ON DELETE CASCADE,
  -- For MCQ: the selected option_id
  selected_option_id UUID REFERENCES question_options(id),
  -- For True/False: boolean answer
  answer_boolean  BOOLEAN,
  -- For Identification: typed text
  answer_text     TEXT,
  -- For Enumeration: array of typed answers
  answer_array    TEXT[],
  -- For Matching: JSON object { left_option_id: right_option_id, ... }
  answer_json     JSONB,
  -- Scoring
  points_earned   NUMERIC(5,2),              -- NULL until scored
  is_correct      BOOLEAN,                   -- NULL until scored (or partial)
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (attempt_id, question_id)
);
```

---

## Indexes

```sql
-- Performance indexes
CREATE INDEX idx_subject_enrollments_student ON subject_enrollments(student_id);
CREATE INDEX idx_subject_enrollments_subject ON subject_enrollments(subject_id);
CREATE INDEX idx_quizzes_subject ON quizzes(subject_id);
CREATE INDEX idx_questions_quiz ON questions(quiz_id, sort_order);
CREATE INDEX idx_question_options_question ON question_options(question_id);
CREATE INDEX idx_quiz_attempts_quiz ON quiz_attempts(quiz_id);
CREATE INDEX idx_quiz_attempts_student ON quiz_attempts(student_id);
CREATE INDEX idx_attempt_answers_attempt ON attempt_answers(attempt_id);
CREATE INDEX idx_subjects_code ON subjects(enrollment_code);
```

---

## Row Level Security (RLS) Policies

### `users` table

```sql
ALTER TABLE users ENABLE ROW LEVEL SECURITY;

-- Users can read their own record
CREATE POLICY "users_read_own" ON users
  FOR SELECT USING (auth.uid() = id);

-- Admins can read all users
CREATE POLICY "admin_read_all_users" ON users
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND role = 'admin')
  );

-- Trigger handles insert (SECURITY DEFINER, bypasses RLS)
```

### `subjects` table

```sql
ALTER TABLE subjects ENABLE ROW LEVEL SECURITY;

-- Admins: full access
CREATE POLICY "admin_all_subjects" ON subjects
  FOR ALL USING (
    EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND role = 'admin')
  );

-- Students: read only subjects they are enrolled in
CREATE POLICY "student_read_enrolled_subjects" ON subjects
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM subject_enrollments
      WHERE subject_id = subjects.id AND student_id = auth.uid()
    )
  );
```

### `subject_enrollments` table

```sql
ALTER TABLE subject_enrollments ENABLE ROW LEVEL SECURITY;

-- Admins: full access
CREATE POLICY "admin_all_enrollments" ON subject_enrollments
  FOR ALL USING (
    EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND role = 'admin')
  );

-- Students: read their own enrollments
CREATE POLICY "student_read_own_enrollments" ON subject_enrollments
  FOR SELECT USING (student_id = auth.uid());

-- Students: insert their own enrollment (enrollment handled via API route)
CREATE POLICY "student_insert_own_enrollment" ON subject_enrollments
  FOR INSERT WITH CHECK (student_id = auth.uid());
```

### `quizzes` table

```sql
ALTER TABLE quizzes ENABLE ROW LEVEL SECURITY;

-- Admins: full access
CREATE POLICY "admin_all_quizzes" ON quizzes
  FOR ALL USING (
    EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND role = 'admin')
  );

-- Students: read published quizzes in enrolled subjects, within availability window
CREATE POLICY "student_read_available_quizzes" ON quizzes
  FOR SELECT USING (
    status = 'published'
    AND (available_from IS NULL OR available_from <= NOW())
    AND (available_until IS NULL OR available_until >= NOW())
    AND EXISTS (
      SELECT 1 FROM subject_enrollments
      WHERE subject_id = quizzes.subject_id AND student_id = auth.uid()
    )
  );
```

### `questions` table

```sql
ALTER TABLE questions ENABLE ROW LEVEL SECURITY;

-- Admins: full access
CREATE POLICY "admin_all_questions" ON questions
  FOR ALL USING (
    EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND role = 'admin')
  );

-- Students: read questions of quizzes they can access
CREATE POLICY "student_read_questions" ON questions
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM quizzes q
      JOIN subject_enrollments se ON se.subject_id = q.subject_id
      WHERE q.id = questions.quiz_id
        AND q.status = 'published'
        AND se.student_id = auth.uid()
    )
  );
```

### `question_options` table

```sql
ALTER TABLE question_options ENABLE ROW LEVEL SECURITY;

-- Admins: full access
CREATE POLICY "admin_all_options" ON question_options
  FOR ALL USING (
    EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND role = 'admin')
  );

-- Students: read options for questions they can access
CREATE POLICY "student_read_options" ON question_options
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM questions qn
      JOIN quizzes q ON q.id = qn.quiz_id
      JOIN subject_enrollments se ON se.subject_id = q.subject_id
      WHERE qn.id = question_options.question_id
        AND q.status = 'published'
        AND se.student_id = auth.uid()
    )
  );
```

### `quiz_attempts` table

```sql
ALTER TABLE quiz_attempts ENABLE ROW LEVEL SECURITY;

-- Admins: full access
CREATE POLICY "admin_all_attempts" ON quiz_attempts
  FOR ALL USING (
    EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND role = 'admin')
  );

-- Students: read and insert their own attempts
CREATE POLICY "student_own_attempts" ON quiz_attempts
  FOR ALL USING (student_id = auth.uid())
  WITH CHECK (student_id = auth.uid());
```

### `attempt_answers` table

```sql
ALTER TABLE attempt_answers ENABLE ROW LEVEL SECURITY;

-- Admins: full access
CREATE POLICY "admin_all_answers" ON attempt_answers
  FOR ALL USING (
    EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND role = 'admin')
  );

-- Students: read and insert their own answers
CREATE POLICY "student_own_answers" ON attempt_answers
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM quiz_attempts
      WHERE id = attempt_answers.attempt_id AND student_id = auth.uid()
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM quiz_attempts
      WHERE id = attempt_answers.attempt_id AND student_id = auth.uid()
    )
  );
```

---

## Entity Relationship Diagram (Text)

```
auth.users
    │
    ▼
users (id, email, role)
    │
    ├──► subjects (created_by → users.id)
    │        │
    │        ├──► subject_enrollments (subject_id, student_id → users.id)
    │        │
    │        └──► quizzes (subject_id)
    │                 │
    │                 ├──► questions (quiz_id)
    │                 │        │
    │                 │        └──► question_options (question_id)
    │                 │
    │                 └──► quiz_attempts (quiz_id, student_id → users.id)
    │                          │
    │                          └──► attempt_answers (attempt_id, question_id)
    │
    └──► quiz_attempts (student_id)
```
