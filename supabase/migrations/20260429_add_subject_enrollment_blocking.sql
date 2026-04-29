ALTER TABLE subject_enrollments
  ADD COLUMN IF NOT EXISTS blocked BOOLEAN NOT NULL DEFAULT FALSE;

DROP POLICY IF EXISTS "student_read_available_quizzes" ON quizzes;
CREATE POLICY "student_read_available_quizzes" ON quizzes
  FOR SELECT USING (
    status = 'published'
    AND (available_from IS NULL OR available_from <= NOW())
    AND (available_until IS NULL OR available_until >= NOW())
    AND EXISTS (
      SELECT 1
      FROM subject_enrollments
      WHERE subject_id = quizzes.subject_id
        AND student_id = auth.uid()
        AND blocked = FALSE
    )
  );

DROP POLICY IF EXISTS "student_read_questions" ON questions;
CREATE POLICY "student_read_questions" ON questions
  FOR SELECT USING (
    EXISTS (
      SELECT 1
      FROM quizzes q
      JOIN subject_enrollments se ON se.subject_id = q.subject_id
      WHERE q.id = questions.quiz_id
        AND q.status = 'published'
        AND se.student_id = auth.uid()
        AND se.blocked = FALSE
    )
  );

DROP POLICY IF EXISTS "student_read_options" ON question_options;
CREATE POLICY "student_read_options" ON question_options
  FOR SELECT USING (
    EXISTS (
      SELECT 1
      FROM questions qn
      JOIN quizzes q ON q.id = qn.quiz_id
      JOIN subject_enrollments se ON se.subject_id = q.subject_id
      WHERE qn.id = question_options.question_id
        AND q.status = 'published'
        AND se.student_id = auth.uid()
        AND se.blocked = FALSE
    )
  );

DROP POLICY IF EXISTS "student_own_attempts" ON quiz_attempts;

CREATE POLICY "student_read_own_attempts" ON quiz_attempts
  FOR SELECT USING (student_id = auth.uid());

CREATE POLICY "student_insert_own_attempts" ON quiz_attempts
  FOR INSERT WITH CHECK (
    student_id = auth.uid()
    AND EXISTS (
      SELECT 1
      FROM quizzes q
      JOIN subject_enrollments se ON se.subject_id = q.subject_id
      WHERE q.id = quiz_attempts.quiz_id
        AND se.student_id = auth.uid()
        AND se.blocked = FALSE
    )
  );

CREATE POLICY "student_update_own_attempts_when_allowed" ON quiz_attempts
  FOR UPDATE USING (
    student_id = auth.uid()
    AND EXISTS (
      SELECT 1
      FROM quizzes q
      JOIN subject_enrollments se ON se.subject_id = q.subject_id
      WHERE q.id = quiz_attempts.quiz_id
        AND se.student_id = auth.uid()
        AND se.blocked = FALSE
    )
  )
  WITH CHECK (
    student_id = auth.uid()
    AND EXISTS (
      SELECT 1
      FROM quizzes q
      JOIN subject_enrollments se ON se.subject_id = q.subject_id
      WHERE q.id = quiz_attempts.quiz_id
        AND se.student_id = auth.uid()
        AND se.blocked = FALSE
    )
  );

DROP POLICY IF EXISTS "student_own_answers" ON attempt_answers;

CREATE POLICY "student_read_own_answers" ON attempt_answers
  FOR SELECT USING (
    EXISTS (
      SELECT 1
      FROM quiz_attempts qa
      WHERE qa.id = attempt_answers.attempt_id
        AND qa.student_id = auth.uid()
    )
  );

CREATE POLICY "student_write_own_answers_when_allowed" ON attempt_answers
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1
      FROM quiz_attempts qa
      JOIN quizzes q ON q.id = qa.quiz_id
      JOIN subject_enrollments se ON se.subject_id = q.subject_id
      WHERE qa.id = attempt_answers.attempt_id
        AND qa.student_id = auth.uid()
        AND se.student_id = auth.uid()
        AND se.blocked = FALSE
    )
  );

CREATE POLICY "student_update_own_answers_when_allowed" ON attempt_answers
  FOR UPDATE USING (
    EXISTS (
      SELECT 1
      FROM quiz_attempts qa
      JOIN quizzes q ON q.id = qa.quiz_id
      JOIN subject_enrollments se ON se.subject_id = q.subject_id
      WHERE qa.id = attempt_answers.attempt_id
        AND qa.student_id = auth.uid()
        AND se.student_id = auth.uid()
        AND se.blocked = FALSE
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1
      FROM quiz_attempts qa
      JOIN quizzes q ON q.id = qa.quiz_id
      JOIN subject_enrollments se ON se.subject_id = q.subject_id
      WHERE qa.id = attempt_answers.attempt_id
        AND qa.student_id = auth.uid()
        AND se.student_id = auth.uid()
        AND se.blocked = FALSE
    )
  );
