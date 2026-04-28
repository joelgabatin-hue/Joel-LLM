import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router';
import { ArrowLeft } from 'lucide-react';
import Card from '../ui/Card';
import Button from '../ui/Button';
import Badge from '../ui/Badge';
import { supabase } from '../../../lib/supabase';
import { useAuth } from '../../../hooks/useAuth';

interface AttemptResult {
  id: string;
  score: number;
  max_score: number;
  submitted_at: string;
  time_taken_seconds: number | null;
  quizTitle: string;
  subjectId: string;
  subjectName: string;
  showAnswers: boolean;
}

interface AnswerReview {
  id: string;
  questionText: string;
  questionType: string;
  points: number;
  pointsEarned: number;
  isCorrect: boolean;
  studentAnswer: string;
  correctAnswer: string;
}

const TYPE_LABEL: Record<string, string> = {
  multiple_choice: 'Multiple Choice',
  true_or_false: 'True or False',
  identification: 'Identification',
  enumeration: 'Enumeration',
  matching: 'Matching',
};

function formatStudentAnswer(a: any, q: any): string {
  if (!q) return '';
  switch (q.type) {
    case 'multiple_choice': {
      const opt = (q.question_options || []).find((o: any) => o.id === a.selected_option_id);
      return opt?.option_text || '';
    }
    case 'true_or_false':
      return a.answer_boolean === true ? 'True' : a.answer_boolean === false ? 'False' : '';
    case 'identification':
      return a.answer_text || '';
    case 'enumeration':
      return (a.answer_array || []).map((v: string, i: number) => `${i + 1}. ${v}`).join('\n');
    case 'matching': {
      if (!a.answer_json) return '';
      const leftOpts = (q.question_options || []).filter((o: any) => o.side === 'left');
      const rightOpts = (q.question_options || []).filter((o: any) => o.side === 'right');
      const rightMap = new Map(rightOpts.map((o: any) => [o.id, o.option_text]));
      return leftOpts.map((left: any) => {
        const rightId = a.answer_json[left.id];
        return `${left.option_text} → ${rightId ? (rightMap.get(rightId) || '?') : '(not matched)'}`;
      }).join('\n');
    }
    default: return '';
  }
}

function formatCorrectAnswer(q: any): string {
  if (!q) return '';
  switch (q.type) {
    case 'multiple_choice': {
      const opt = (q.question_options || []).find((o: any) => o.is_correct);
      return opt?.option_text || '';
    }
    case 'true_or_false':
      return q.correct_boolean === true ? 'True' : q.correct_boolean === false ? 'False' : '';
    case 'identification':
      return (q.question_options || [])
        .filter((o: any) => o.is_correct)
        .map((o: any) => o.option_text)
        .join(' / ');
    case 'enumeration':
      return (q.question_options || [])
        .filter((o: any) => o.is_correct)
        .sort((a: any, b: any) => a.sort_order - b.sort_order)
        .map((o: any, i: number) => `${i + 1}. ${o.option_text}`)
        .join('\n');
    case 'matching': {
      const leftOpts = (q.question_options || []).filter((o: any) => o.side === 'left');
      const rightOpts = (q.question_options || []).filter((o: any) => o.side === 'right');
      const rightMap = new Map(rightOpts.map((o: any) => [o.id, o.option_text]));
      return leftOpts.map((left: any) => {
        return `${left.option_text} → ${left.match_id ? (rightMap.get(left.match_id) || '?') : '?'}`;
      }).join('\n');
    }
    default: return '';
  }
}

export default function StudentQuizResults() {
  const { quizId } = useParams<{ quizId: string }>();
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [result, setResult] = useState<AttemptResult | null>(null);
  const [answerReviews, setAnswerReviews] = useState<AnswerReview[]>([]);

  useEffect(() => {
    if (quizId && user) fetchResults();
  }, [quizId, user]);

  async function fetchResults() {
    if (!quizId || !user) return;
    setLoading(true);

    const { data: attempt } = await supabase
      .from('quiz_attempts')
      .select('id, score, max_score, submitted_at, time_taken_seconds, quizzes(title, show_answers_after, subjects(id, name))')
      .eq('quiz_id', quizId)
      .eq('student_id', user.id)
      .eq('status', 'submitted')
      .maybeSingle();

    if (!attempt) { setLoading(false); return; }

    const quiz = (attempt as any).quizzes;
    const showAnswers = quiz?.show_answers_after ?? false;

    setResult({
      id: attempt.id,
      score: attempt.score ?? 0,
      max_score: attempt.max_score ?? 0,
      submitted_at: attempt.submitted_at,
      time_taken_seconds: attempt.time_taken_seconds,
      quizTitle: quiz?.title || 'Unknown Quiz',
      subjectId: quiz?.subjects?.id || '',
      subjectName: quiz?.subjects?.name || 'Unknown Subject',
      showAnswers,
    });

    if (showAnswers) {
      const { data: answers } = await supabase
        .from('attempt_answers')
        .select('id, question_id, selected_option_id, answer_boolean, answer_text, answer_array, answer_json, points_earned, is_correct, questions(type, question_text, points, sort_order, correct_boolean, question_options(id, option_text, is_correct, sort_order, side, match_id))')
        .eq('attempt_id', attempt.id);

      const sorted = (answers || []).sort((a: any, b: any) =>
        (a.questions?.sort_order ?? 0) - (b.questions?.sort_order ?? 0)
      );

      setAnswerReviews(sorted.map((a: any) => {
        const q = a.questions;
        return {
          id: a.id,
          questionText: q?.question_text || '',
          questionType: q?.type || '',
          points: q?.points ?? 0,
          pointsEarned: a.points_earned ?? 0,
          isCorrect: a.is_correct ?? false,
          studentAnswer: formatStudentAnswer(a, q),
          correctAnswer: formatCorrectAnswer(q),
        };
      }));
    }

    setLoading(false);
  }

  if (loading) {
    return (
      <div className="p-8">
        <div className="h-10 w-64 bg-gray-100 rounded animate-pulse mb-2" />
        <div className="h-5 w-48 bg-gray-100 rounded animate-pulse mb-8" />
        <div className="h-48 max-w-2xl bg-gray-100 rounded-xl animate-pulse" />
      </div>
    );
  }

  if (!result) {
    return <div className="p-8 text-[#4B5563]">Results not found. The quiz may not have been submitted yet.</div>;
  }

  const percentage = result.max_score > 0 ? Math.round((result.score / result.max_score) * 100) : 0;
  const r = 56;
  const circumference = 2 * Math.PI * r;
  const strokeDash = (percentage / 100) * circumference;
  const scoreColor = percentage >= 75 ? '#16A34A' : percentage >= 50 ? '#D97706' : '#DC2626';

  const formatTimeTaken = (s: number | null) => {
    if (s == null) return '—';
    const m = Math.floor(s / 60);
    const sec = s % 60;
    return m > 0 ? `${m}m ${sec}s` : `${sec}s`;
  };

  const correctCount = answerReviews.filter(a => a.isCorrect).length;
  const incorrectCount = answerReviews.filter(a => !a.isCorrect).length;

  return (
    <div className="p-8">
      <div className="mb-8">
        <h1 className="text-[30px] font-bold text-[#111827] mb-1">{result.quizTitle}</h1>
        <p className="text-[#4B5563]">{result.subjectName}</p>
      </div>

      {/* Score Card */}
      <Card className="mb-8 max-w-2xl">
        <div className="flex items-center gap-8">
          <div className="relative w-32 h-32 flex-shrink-0">
            <svg className="w-32 h-32 -rotate-90" viewBox="0 0 128 128">
              <circle cx="64" cy="64" r={r} stroke="#D1D5DB" strokeWidth="8" fill="none" />
              <circle
                cx="64" cy="64" r={r}
                stroke={scoreColor}
                strokeWidth="8"
                fill="none"
                strokeDasharray={`${strokeDash} ${circumference}`}
                strokeLinecap="round"
              />
            </svg>
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="text-center">
                <p className="text-[28px] font-bold leading-none" style={{ color: scoreColor }}>{percentage}%</p>
                <p className="text-[11px] text-[#4B5563] mt-1">{result.score}/{result.max_score}</p>
              </div>
            </div>
          </div>

          <div className="flex-1">
            <div className="flex items-center gap-3 mb-4">
              <Badge variant={percentage >= 75 ? 'success' : percentage >= 50 ? 'warning' : 'danger'}>
                {percentage >= 75 ? 'Passed' : 'Failed'}
              </Badge>
              <span className="text-[14px] text-[#4B5563]">
                {formatTimeTaken(result.time_taken_seconds)}
              </span>
            </div>
            <div className="grid grid-cols-3 gap-4">
              {result.showAnswers && answerReviews.length > 0 ? (
                <>
                  <div>
                    <p className="text-[12px] text-[#4B5563] mb-1">Total</p>
                    <p className="text-[20px] font-semibold text-[#111827]">{answerReviews.length}</p>
                  </div>
                  <div>
                    <p className="text-[12px] text-[#4B5563] mb-1">Correct</p>
                    <p className="text-[20px] font-semibold text-[#16A34A]">{correctCount}</p>
                  </div>
                  <div>
                    <p className="text-[12px] text-[#4B5563] mb-1">Incorrect</p>
                    <p className="text-[20px] font-semibold text-[#DC2626]">{incorrectCount}</p>
                  </div>
                </>
              ) : (
                <>
                  <div>
                    <p className="text-[12px] text-[#4B5563] mb-1">Score</p>
                    <p className="text-[20px] font-semibold text-[#111827]">{result.score}</p>
                  </div>
                  <div>
                    <p className="text-[12px] text-[#4B5563] mb-1">Max Score</p>
                    <p className="text-[20px] font-semibold text-[#111827]">{result.max_score}</p>
                  </div>
                  <div>
                    <p className="text-[12px] text-[#4B5563] mb-1">Submitted</p>
                    <p className="text-[14px] font-medium text-[#111827]">
                      {new Date(result.submitted_at).toLocaleDateString()}
                    </p>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      </Card>

      {/* Answer Review */}
      {result.showAnswers && answerReviews.length > 0 && (
        <div>
          <h2 className="text-[24px] font-semibold text-[#111827] mb-4">Answer Review</h2>
          <div className="space-y-4">
            {answerReviews.map((a, i) => (
              <Card
                key={a.id}
                className={`border-l-4 ${a.isCorrect ? 'border-l-[#16A34A]' : a.pointsEarned > 0 ? 'border-l-[#D97706]' : 'border-l-[#DC2626]'}`}
              >
                <div className="flex items-center gap-2 mb-3">
                  <Badge variant="neutral">Q{i + 1}</Badge>
                  <Badge variant="neutral">{TYPE_LABEL[a.questionType] || a.questionType}</Badge>
                  <Badge variant={a.isCorrect ? 'success' : a.pointsEarned > 0 ? 'warning' : 'danger'}>
                    {a.pointsEarned} / {a.points} pts
                  </Badge>
                </div>
                <p className="text-[14px] text-[#111827] font-medium mb-4">{a.questionText}</p>

                <div className="grid grid-cols-2 gap-4">
                  <div className={`p-3 rounded-lg ${a.isCorrect ? 'bg-[#DCFCE7]' : 'bg-[#FEE2E2]'}`}>
                    <p className="text-[12px] text-[#4B5563] mb-1">Your Answer</p>
                    <p className={`text-[14px] font-medium whitespace-pre-wrap ${a.isCorrect ? 'text-[#16A34A]' : 'text-[#DC2626]'}`}>
                      {a.studentAnswer || '(no answer)'}
                    </p>
                  </div>
                  {!a.isCorrect && (
                    <div className="p-3 bg-[#DCFCE7] rounded-lg">
                      <p className="text-[12px] text-[#4B5563] mb-1">Correct Answer</p>
                      <p className="text-[14px] font-medium text-[#16A34A] whitespace-pre-wrap">
                        {a.correctAnswer}
                      </p>
                    </div>
                  )}
                </div>
              </Card>
            ))}
          </div>
        </div>
      )}

      {!result.showAnswers && (
        <Card>
          <p className="text-center text-[#4B5563] py-4">
            Answer details are not available for this quiz.
          </p>
        </Card>
      )}

      <div className="mt-8">
        <Link to={`/student/subjects/${result.subjectId}`}>
          <Button variant="secondary">
            <ArrowLeft className="w-4 h-4" />
            Back to Subject
          </Button>
        </Link>
      </div>
    </div>
  );
}
