import { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router';
import { ChevronLeft, ChevronRight, Clock } from 'lucide-react';
import Card from '../ui/Card';
import Button from '../ui/Button';
import Badge from '../ui/Badge';
import Modal from '../ui/Modal';
import { supabase } from '../../../lib/supabase';
import { useAuth } from '../../../hooks/useAuth';

type QuestionType = 'multiple_choice' | 'true_or_false' | 'identification' | 'enumeration' | 'matching';

interface DBOption {
  id: string;
  option_text: string;
  is_correct: boolean;
  sort_order: number;
  side: 'left' | 'right' | null;
  match_id: string | null;
}

interface DBQuestion {
  id: string;
  type: QuestionType;
  question_text: string;
  points: number;
  sort_order: number;
  case_sensitive: boolean | null;
  order_matters: boolean | null;
  partial_credit: boolean | null;
  correct_boolean: boolean | null;
  question_options: DBOption[];
}

interface QuizInfo {
  id: string;
  title: string;
  time_limit_minutes: number | null;
  shuffle_questions: boolean;
}

interface AnswerState {
  selectedOptionId?: string;
  answerBoolean?: boolean;
  answerText?: string;
  answerArray?: string[];
  answerJson?: Record<string, string>;
}

const TYPE_LABEL: Record<QuestionType, string> = {
  multiple_choice: 'Multiple Choice',
  true_or_false: 'True or False',
  identification: 'Identification',
  enumeration: 'Enumeration',
  matching: 'Matching',
};

function scoreQuestion(q: DBQuestion, ans: AnswerState): { pointsEarned: number; isCorrect: boolean } {
  switch (q.type) {
    case 'multiple_choice': {
      const correct = q.question_options.find(o => o.is_correct);
      const isCorrect = !!correct && ans.selectedOptionId === correct.id;
      return { pointsEarned: isCorrect ? q.points : 0, isCorrect };
    }
    case 'true_or_false': {
      const isCorrect = ans.answerBoolean !== undefined && ans.answerBoolean === q.correct_boolean;
      return { pointsEarned: isCorrect ? q.points : 0, isCorrect };
    }
    case 'identification': {
      const correctAnswers = q.question_options
        .filter(o => o.is_correct)
        .map(o => q.case_sensitive ? o.option_text.trim() : o.option_text.trim().toLowerCase());
      const student = q.case_sensitive
        ? (ans.answerText || '').trim()
        : (ans.answerText || '').trim().toLowerCase();
      const isCorrect = student.length > 0 && correctAnswers.includes(student);
      return { pointsEarned: isCorrect ? q.points : 0, isCorrect };
    }
    case 'enumeration': {
      const accepted = q.question_options.filter(o => o.is_correct);
      const total = accepted.length;
      if (total === 0) return { pointsEarned: 0, isCorrect: false };
      const studentArr = (ans.answerArray || []).map(a => a.trim().toLowerCase());
      let matched = 0;
      if (q.order_matters) {
        accepted.forEach((a, i) => {
          if ((studentArr[i] || '') === a.option_text.trim().toLowerCase()) matched++;
        });
      } else {
        const acceptedSet = new Set(accepted.map(a => a.option_text.trim().toLowerCase()));
        studentArr.forEach(s => { if (s && acceptedSet.has(s)) matched++; });
      }
      const isCorrect = matched === total;
      const pointsEarned = q.partial_credit !== false
        ? (matched / total) * q.points
        : isCorrect ? q.points : 0;
      return { pointsEarned, isCorrect };
    }
    case 'matching': {
      const leftOptions = q.question_options.filter(o => o.side === 'left');
      const total = leftOptions.length;
      if (total === 0) return { pointsEarned: 0, isCorrect: false };
      let matched = 0;
      leftOptions.forEach(left => {
        if ((ans.answerJson?.[left.id] || '') === left.match_id) matched++;
      });
      const isCorrect = matched === total;
      return { pointsEarned: (matched / total) * q.points, isCorrect };
    }
    default:
      return { pointsEarned: 0, isCorrect: false };
  }
}

function isAnswered(q: DBQuestion, a: AnswerState): boolean {
  switch (q.type) {
    case 'multiple_choice': return !!a.selectedOptionId;
    case 'true_or_false': return a.answerBoolean !== undefined;
    case 'identification': return !!(a.answerText?.trim());
    case 'enumeration': return !!(a.answerArray?.some(v => v.trim()));
    case 'matching': return !!(a.answerJson && Object.values(a.answerJson).some(v => v));
    default: return false;
  }
}

export default function StudentQuizTaking() {
  const { quizId } = useParams<{ quizId: string }>();
  const { user } = useAuth();
  const navigate = useNavigate();

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [quiz, setQuiz] = useState<QuizInfo | null>(null);
  const [questions, setQuestions] = useState<DBQuestion[]>([]);
  const [attemptId, setAttemptId] = useState<string | null>(null);
  const [answers, setAnswers] = useState<Record<string, AnswerState>>({});
  const [currentIdx, setCurrentIdx] = useState(0);
  const [timeRemaining, setTimeRemaining] = useState(0);
  const [showSubmitModal, setShowSubmitModal] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const startTimeRef = useRef<number>(Date.now());
  const attemptIdRef = useRef<string | null>(null);

  useEffect(() => {
    if (quizId && user) init();
  }, [quizId, user]);

  async function init() {
    if (!quizId || !user) return;
    setLoading(true);

    const { data: quizData, error: quizErr } = await supabase
      .from('quizzes')
      .select('id, title, time_limit_minutes, shuffle_questions')
      .eq('id', quizId)
      .single();

    if (quizErr || !quizData) {
      setError('Quiz not found.');
      setLoading(false);
      return;
    }
    setQuiz(quizData);
    if (quizData.time_limit_minutes) {
      setTimeRemaining(quizData.time_limit_minutes * 60);
    }

    const { data: qData } = await supabase
      .from('questions')
      .select('id, type, question_text, points, sort_order, case_sensitive, order_matters, partial_credit, correct_boolean, question_options(id, option_text, is_correct, sort_order, side, match_id)')
      .eq('quiz_id', quizId)
      .order('sort_order', { ascending: true });

    let loadedQuestions: DBQuestion[] = (qData || []).map((q: any) => ({
      ...q,
      question_options: (q.question_options || []).sort((a: any, b: any) => a.sort_order - b.sort_order),
    }));

    if (quizData.shuffle_questions) {
      for (let i = loadedQuestions.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [loadedQuestions[i], loadedQuestions[j]] = [loadedQuestions[j], loadedQuestions[i]];
      }
    }

    setQuestions(loadedQuestions);

    // Init empty answer state (enumeration needs pre-sized arrays)
    const initAnswers: Record<string, AnswerState> = {};
    loadedQuestions.forEach(q => {
      if (q.type === 'enumeration') {
        const count = q.question_options.filter(o => o.is_correct).length;
        initAnswers[q.id] = { answerArray: Array(Math.max(count, 1)).fill('') };
      }
    });

    // Create or resume attempt
    const { data: existing } = await supabase
      .from('quiz_attempts')
      .select('id, status')
      .eq('quiz_id', quizId)
      .eq('student_id', user.id)
      .maybeSingle();

    if (existing?.status === 'submitted') {
      navigate(`/student/quiz/${quizId}/results`, { replace: true });
      return;
    }

    if (existing) {
      setAttemptId(existing.id);
      attemptIdRef.current = existing.id;
    } else {
      const { data: newAttempt, error: insertErr } = await supabase
        .from('quiz_attempts')
        .insert({ quiz_id: quizId, student_id: user.id, status: 'in_progress' })
        .select('id')
        .single();

      if (insertErr || !newAttempt) {
        setError('Failed to start quiz. Please try again.');
        setLoading(false);
        return;
      }
      setAttemptId(newAttempt.id);
      attemptIdRef.current = newAttempt.id;
    }

    setAnswers(initAnswers);
    startTimeRef.current = Date.now();
    setLoading(false);
  }

  async function handleSubmit() {
    const aid = attemptIdRef.current;
    if (!aid || !quiz || submitting) return;
    setSubmitting(true);
    setShowSubmitModal(false);

    const timeTaken = Math.floor((Date.now() - startTimeRef.current) / 1000);
    const maxScore = questions.reduce((s, q) => s + q.points, 0);

    const scored = questions.map(q => ({
      q,
      ans: answers[q.id] || {},
      result: scoreQuestion(q, answers[q.id] || {}),
    }));

    const totalScore = scored.reduce((s, { result }) => s + result.pointsEarned, 0);

    const answersToUpsert = scored.map(({ q, ans, result }) => ({
      attempt_id: aid,
      question_id: q.id,
      selected_option_id: ans.selectedOptionId || null,
      answer_boolean: ans.answerBoolean ?? null,
      answer_text: ans.answerText || null,
      answer_array: ans.answerArray?.some(a => a.trim()) ? ans.answerArray : null,
      answer_json: ans.answerJson && Object.keys(ans.answerJson).length ? ans.answerJson : null,
      points_earned: result.pointsEarned,
      is_correct: result.isCorrect,
    }));

    await supabase.from('attempt_answers').upsert(answersToUpsert, {
      onConflict: 'attempt_id,question_id',
    });

    await supabase.from('quiz_attempts').update({
      status: 'submitted',
      score: totalScore,
      max_score: maxScore,
      submitted_at: new Date().toISOString(),
      time_taken_seconds: timeTaken,
    }).eq('id', aid);

    navigate(`/student/quiz/${quizId}/results`, { replace: true });
  }

  // Keep a ref so the timer can call the latest version without stale closure
  const handleSubmitRef = useRef(handleSubmit);
  handleSubmitRef.current = handleSubmit;

  useEffect(() => {
    if (!quiz?.time_limit_minutes || loading) return;
    const timer = setInterval(() => {
      setTimeRemaining(prev => {
        if (prev <= 1) {
          clearInterval(timer);
          handleSubmitRef.current();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(timer);
  }, [quiz?.time_limit_minutes, loading]);

  function updateAnswer(qId: string, patch: Partial<AnswerState>) {
    setAnswers(prev => ({ ...prev, [qId]: { ...prev[qId], ...patch } }));
  }

  const formatTime = (s: number) => `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`;

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#F3F4F6]">
        <div className="flex flex-col items-center gap-3">
          <div className="w-10 h-10 border-4 border-[#4F46E5] border-t-transparent rounded-full animate-spin" />
          <p className="text-[#4B5563] text-sm">Loading quiz...</p>
        </div>
      </div>
    );
  }

  if (error || !quiz || questions.length === 0) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#F3F4F6]">
        <p className="text-[#DC2626]">{error || 'No questions found for this quiz.'}</p>
      </div>
    );
  }

  const question = questions[currentIdx];
  const ans = answers[question.id] || {};
  const unansweredCount = questions.filter(q => !isAnswered(q, answers[q.id] || {})).length;

  return (
    <div className="min-h-screen bg-[#F3F4F6]">
      {/* Top Bar */}
      <div className="bg-white border-b border-[#D1D5DB] px-8 py-4 sticky top-0 z-10">
        <div className="max-w-3xl mx-auto flex items-center justify-between">
          <h1 className="text-[18px] font-semibold text-[#111827] truncate max-w-xs">{quiz.title}</h1>
          <div className="flex items-center gap-6">
            {quiz.time_limit_minutes && (
              <div className={`flex items-center gap-1.5 font-mono font-semibold text-[18px] ${timeRemaining < 60 ? 'text-[#DC2626]' : 'text-[#111827]'}`}>
                <Clock className="w-5 h-5" />
                {formatTime(timeRemaining)}
              </div>
            )}
            <p className="text-[14px] text-[#4B5563]">{currentIdx + 1} / {questions.length}</p>
          </div>
        </div>
      </div>

      <div className="p-8 max-w-3xl mx-auto">
        {/* Question Card */}
        <Card className="mb-6">
          <div className="flex items-center gap-2 mb-4">
            <Badge variant="neutral">Q{currentIdx + 1}</Badge>
            <Badge variant="primary">{TYPE_LABEL[question.type]}</Badge>
            <span className="ml-auto text-[12px] text-[#4B5563]">
              {question.points} pt{question.points !== 1 ? 's' : ''}
            </span>
          </div>
          <h2 className="text-[20px] font-semibold text-[#111827] mb-6">{question.question_text}</h2>

          {/* Multiple Choice */}
          {question.type === 'multiple_choice' && (
            <div className="space-y-3">
              {question.question_options.map(opt => (
                <button
                  key={opt.id}
                  onClick={() => updateAnswer(question.id, { selectedOptionId: opt.id })}
                  className={`w-full p-4 text-left rounded-lg border-2 transition-colors ${
                    ans.selectedOptionId === opt.id
                      ? 'border-[#4F46E5] bg-[#EEF2FF]'
                      : 'border-[#D1D5DB] hover:border-[#9CA3AF] bg-white'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <div className={`w-5 h-5 rounded-full border-2 flex-shrink-0 flex items-center justify-center ${
                      ans.selectedOptionId === opt.id ? 'border-[#4F46E5]' : 'border-[#D1D5DB]'
                    }`}>
                      {ans.selectedOptionId === opt.id && (
                        <div className="w-3 h-3 rounded-full bg-[#4F46E5]" />
                      )}
                    </div>
                    <span className="text-[14px] text-[#111827]">{opt.option_text}</span>
                  </div>
                </button>
              ))}
            </div>
          )}

          {/* True or False */}
          {question.type === 'true_or_false' && (
            <div className="grid grid-cols-2 gap-4">
              {([{ label: 'True', value: true }, { label: 'False', value: false }] as const).map(({ label, value }) => (
                <button
                  key={label}
                  onClick={() => updateAnswer(question.id, { answerBoolean: value })}
                  className={`p-6 rounded-lg border-2 font-semibold text-[16px] transition-colors ${
                    ans.answerBoolean === value
                      ? 'border-[#4F46E5] bg-[#EEF2FF] text-[#4F46E5]'
                      : 'border-[#D1D5DB] hover:border-[#9CA3AF] bg-white text-[#4B5563]'
                  }`}
                >
                  {label}
                </button>
              ))}
            </div>
          )}

          {/* Identification */}
          {question.type === 'identification' && (
            <input
              type="text"
              value={ans.answerText || ''}
              onChange={e => updateAnswer(question.id, { answerText: e.target.value })}
              placeholder="Type your answer here..."
              className="w-full px-4 py-3 text-[16px] border-2 border-[#D1D5DB] rounded-lg focus:border-[#4F46E5] focus:ring-2 focus:ring-[#4F46E5]/20 outline-none"
            />
          )}

          {/* Enumeration */}
          {question.type === 'enumeration' && (
            <div className="space-y-3">
              {(ans.answerArray || []).map((val, i) => (
                <div key={i} className="flex items-center gap-3">
                  <span className="text-[14px] text-[#4B5563] w-6 text-right flex-shrink-0">{i + 1}.</span>
                  <input
                    type="text"
                    value={val}
                    onChange={e => {
                      const newArr = [...(ans.answerArray || [])];
                      newArr[i] = e.target.value;
                      updateAnswer(question.id, { answerArray: newArr });
                    }}
                    placeholder={`Answer ${i + 1}`}
                    className="flex-1 px-4 py-2.5 text-[14px] border-2 border-[#D1D5DB] rounded-lg focus:border-[#4F46E5] focus:ring-2 focus:ring-[#4F46E5]/20 outline-none"
                  />
                </div>
              ))}
            </div>
          )}

          {/* Matching */}
          {question.type === 'matching' && (() => {
            const leftOpts = question.question_options.filter(o => o.side === 'left');
            const rightOpts = question.question_options.filter(o => o.side === 'right');
            return (
              <div className="space-y-3">
                {leftOpts.map(left => (
                  <div key={left.id} className="flex items-center gap-4">
                    <div className="flex-1 p-3 bg-[#F3F4F6] rounded-lg text-[14px] text-[#111827] font-medium">
                      {left.option_text}
                    </div>
                    <span className="text-[#9CA3AF] flex-shrink-0">→</span>
                    <select
                      value={ans.answerJson?.[left.id] || ''}
                      onChange={e => updateAnswer(question.id, {
                        answerJson: { ...(ans.answerJson || {}), [left.id]: e.target.value },
                      })}
                      className="flex-1 px-3 py-2.5 text-[14px] border-2 border-[#D1D5DB] rounded-lg focus:border-[#4F46E5] outline-none bg-white"
                    >
                      <option value="">Select match...</option>
                      {rightOpts.map(right => (
                        <option key={right.id} value={right.id}>{right.option_text}</option>
                      ))}
                    </select>
                  </div>
                ))}
              </div>
            );
          })()}
        </Card>

        {/* Progress Dots */}
        <div className="flex justify-center gap-2 mb-6 flex-wrap">
          {questions.map((q, i) => (
            <button
              key={q.id}
              onClick={() => setCurrentIdx(i)}
              className={`w-3 h-3 rounded-full transition-colors ${
                isAnswered(q, answers[q.id] || {})
                  ? 'bg-[#4F46E5]'
                  : i === currentIdx
                  ? 'bg-[#D1D5DB] ring-2 ring-[#4F46E5]'
                  : 'bg-[#D1D5DB]'
              }`}
              title={`Question ${i + 1}`}
            />
          ))}
        </div>

        {/* Navigation */}
        <div className="flex items-center justify-between">
          <Button
            variant="ghost"
            onClick={() => setCurrentIdx(prev => Math.max(0, prev - 1))}
            disabled={currentIdx === 0}
          >
            <ChevronLeft className="w-5 h-5" />
            Previous
          </Button>

          {currentIdx === questions.length - 1 ? (
            <Button variant="primary" onClick={() => setShowSubmitModal(true)} disabled={submitting}>
              Submit Quiz
            </Button>
          ) : (
            <Button variant="primary" onClick={() => setCurrentIdx(prev => Math.min(questions.length - 1, prev + 1))}>
              Next
              <ChevronRight className="w-5 h-5" />
            </Button>
          )}
        </div>
      </div>

      {/* Submit Confirmation Modal */}
      <Modal isOpen={showSubmitModal} onClose={() => setShowSubmitModal(false)} title="Submit Quiz">
        <div className="space-y-4">
          <p className="text-[14px] text-[#4B5563]">
            {unansweredCount > 0 ? (
              <>You have <strong className="text-[#DC2626]">{unansweredCount} unanswered question{unansweredCount !== 1 ? 's' : ''}</strong>. Are you sure you want to submit?</>
            ) : (
              <>You've answered all {questions.length} questions. Ready to submit?</>
            )}
          </p>
          <div className="flex gap-3 pt-2">
            <Button variant="ghost" onClick={() => setShowSubmitModal(false)} className="flex-1" disabled={submitting}>
              Cancel
            </Button>
            <Button variant="primary" onClick={handleSubmit} className="flex-1" disabled={submitting}>
              {submitting ? 'Submitting...' : 'Confirm Submit'}
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
