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
