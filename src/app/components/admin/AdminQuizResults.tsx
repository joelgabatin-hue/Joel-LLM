import { useEffect, useState } from 'react';
import { useParams } from 'react-router';
import { Eye } from 'lucide-react';
import Card from '../ui/Card';
import Badge from '../ui/Badge';
import Button from '../ui/Button';
import Modal from '../ui/Modal';
import { supabase } from '../../../lib/supabase';

type AttemptStatus = 'not_started' | 'in_progress' | 'submitted' | 'blocked';

interface QuizMeta {
  id: string;
  title: string;
  subject: string;
  totalPoints: number;
}

interface StudentResultRow {
  studentId: string;
  studentName: string;
  studentEmail: string;
  avatarUrl: string;
  blocked: boolean;
  status: AttemptStatus;
  attemptId: string | null;
  score: number | null;
  maxScore: number | null;
  percentage: number | null;
  timeTakenSeconds: number | null;
  submittedAt: string | null;
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

function formatTimeTaken(seconds: number | null): string {
  if (seconds == null) return '-';
  const minutes = Math.floor(seconds / 60);
  const remainingSeconds = seconds % 60;
  return minutes > 0 ? `${minutes}m ${remainingSeconds}s` : `${remainingSeconds}s`;
}

function getStatusBadge(status: AttemptStatus): { label: string; variant: 'neutral' | 'warning' | 'success' | 'danger' } {
  switch (status) {
    case 'submitted':
      return { label: 'Finished', variant: 'success' };
    case 'in_progress':
      return { label: "Didn't Finish", variant: 'warning' };
    case 'blocked':
      return { label: 'Blocked', variant: 'danger' };
    default:
      return { label: 'Not Started', variant: 'neutral' };
  }
}

function formatStudentAnswer(answer: any, question: any): string {
  if (!question) return '';

  switch (question.type) {
    case 'multiple_choice': {
      const option = (question.question_options || []).find((item: any) => item.id === answer.selected_option_id);
      return option?.option_text || '';
    }
    case 'true_or_false':
      return answer.answer_boolean === true ? 'True' : answer.answer_boolean === false ? 'False' : '';
    case 'identification':
      return answer.answer_text || '';
    case 'enumeration':
      return (answer.answer_array || []).map((value: string, index: number) => `${index + 1}. ${value}`).join('\n');
    case 'matching': {
      if (!answer.answer_json) return '';
      const leftOptions = (question.question_options || []).filter((item: any) => item.side === 'left');
      const rightOptions = (question.question_options || []).filter((item: any) => item.side === 'right');
      const rightMap = new Map(rightOptions.map((item: any) => [item.id, item.option_text]));
      return leftOptions.map((left: any) => {
        const rightId = answer.answer_json[left.id];
        return `${left.option_text} -> ${rightId ? (rightMap.get(rightId) || '?') : '(not matched)'}`;
      }).join('\n');
    }
    default:
      return '';
  }
}

function formatCorrectAnswer(question: any): string {
  if (!question) return '';

  switch (question.type) {
    case 'multiple_choice': {
      const option = (question.question_options || []).find((item: any) => item.is_correct);
      return option?.option_text || '';
    }
    case 'true_or_false':
      return question.correct_boolean === true ? 'True' : question.correct_boolean === false ? 'False' : '';
    case 'identification':
      return (question.question_options || [])
        .filter((item: any) => item.is_correct)
        .map((item: any) => item.option_text)
        .join(' / ');
    case 'enumeration':
      return (question.question_options || [])
        .filter((item: any) => item.is_correct)
        .sort((a: any, b: any) => a.sort_order - b.sort_order)
        .map((item: any, index: number) => `${index + 1}. ${item.option_text}`)
        .join('\n');
    case 'matching': {
      const leftOptions = (question.question_options || []).filter((item: any) => item.side === 'left');
      const rightOptions = (question.question_options || []).filter((item: any) => item.side === 'right');
      const rightMap = new Map(rightOptions.map((item: any) => [item.id, item.option_text]));
      return leftOptions.map((left: any) => (
        `${left.option_text} -> ${left.match_id ? (rightMap.get(left.match_id) || '?') : '?'}`
      )).join('\n');
    }
    default:
      return '';
  }
}

export default function AdminQuizResults() {
  const { quizId } = useParams<{ quizId: string }>();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [quiz, setQuiz] = useState<QuizMeta | null>(null);
  const [results, setResults] = useState<StudentResultRow[]>([]);
  const [selectedStudent, setSelectedStudent] = useState<StudentResultRow | null>(null);
  const [selectedAnswers, setSelectedAnswers] = useState<AnswerReview[]>([]);
  const [detailLoading, setDetailLoading] = useState(false);

  useEffect(() => {
    if (quizId) fetchData();
  }, [quizId]);

  async function fetchData() {
    if (!quizId) return;

    setLoading(true);
    setError(null);

    const { data: quizData, error: quizError } = await supabase
      .from('quizzes')
      .select('id, title, subject_id, subjects(name), questions(points)')
      .eq('id', quizId)
      .single();

    if (quizError || !quizData) {
      setError('Quiz not found.');
      setLoading(false);
      return;
    }

    setQuiz({
      id: quizData.id,
      title: quizData.title,
      subject: (quizData as any).subjects?.name || 'Unknown Subject',
      totalPoints: ((quizData as any).questions || []).reduce((sum: number, question: any) => sum + (question.points || 0), 0),
    });

    const { data: enrollmentData, error: enrollmentError } = await supabase
      .from('subject_enrollments')
      .select('student_id, blocked, users(id, full_name, email, avatar_url)')
      .eq('subject_id', (quizData as any).subject_id);

    if (enrollmentError) {
      setError(enrollmentError.message);
      setLoading(false);
      return;
    }

    const students = (enrollmentData || []).filter((item: any) => item.users);
    const studentIds = students.map((item: any) => item.student_id);

    const { data: attemptData, error: attemptError } = studentIds.length === 0
      ? { data: [], error: null }
      : await supabase
          .from('quiz_attempts')
          .select('id, student_id, status, score, max_score, submitted_at, time_taken_seconds')
          .eq('quiz_id', quizId)
          .in('student_id', studentIds);

    if (attemptError) {
      setError(attemptError.message);
      setLoading(false);
      return;
    }

    const attemptMap = new Map((attemptData || []).map((attempt: any) => [attempt.student_id, attempt]));

    const rows: StudentResultRow[] = students.map((item: any) => {
      const student = item.users;
      const attempt = attemptMap.get(item.student_id);
      const blocked = !!item.blocked;
      const status: AttemptStatus = blocked
        ? 'blocked'
        : attempt?.status === 'submitted'
        ? 'submitted'
        : attempt?.status === 'in_progress'
        ? 'in_progress'
        : 'not_started';
      const score = attempt?.score != null ? Number(attempt.score) : null;
      const maxScore = attempt?.max_score != null ? Number(attempt.max_score) : null;

      return {
        studentId: item.student_id,
        studentName: student.full_name || 'Unknown',
        studentEmail: student.email || '-',
        avatarUrl: student.avatar_url || `https://ui-avatars.com/api/?name=${encodeURIComponent(student.full_name || 'Student')}&background=4F46E5&color=fff`,
        blocked,
        status,
        attemptId: attempt?.id || null,
        score,
        maxScore,
        percentage: score != null && maxScore && maxScore > 0 ? Math.round((score / maxScore) * 100) : null,
        timeTakenSeconds: attempt?.time_taken_seconds ?? null,
        submittedAt: attempt?.submitted_at || null,
      };
    });

    rows.sort((a, b) => a.studentName.localeCompare(b.studentName));
    setResults(rows);
    setLoading(false);
  }

  async function openStudentDetail(result: StudentResultRow) {
    setSelectedStudent(result);
    setSelectedAnswers([]);

    if (!result.attemptId || result.status !== 'submitted') return;

    setDetailLoading(true);
    const { data, error } = await supabase
      .from('attempt_answers')
      .select('id, selected_option_id, answer_boolean, answer_text, answer_array, answer_json, points_earned, is_correct, questions(type, question_text, points, sort_order, correct_boolean, question_options(id, option_text, is_correct, sort_order, side, match_id))')
      .eq('attempt_id', result.attemptId);

    if (error) {
      setDetailLoading(false);
      return;
    }

    const sorted = (data || []).sort((a: any, b: any) => (a.questions?.sort_order ?? 0) - (b.questions?.sort_order ?? 0));
    setSelectedAnswers(sorted.map((answer: any) => {
      const question = answer.questions;
      return {
        id: answer.id,
        questionText: question?.question_text || '',
        questionType: question?.type || '',
        points: question?.points ?? 0,
        pointsEarned: Number(answer.points_earned ?? 0),
        isCorrect: !!answer.is_correct,
        studentAnswer: formatStudentAnswer(answer, question),
        correctAnswer: formatCorrectAnswer(question),
      };
    }));
    setDetailLoading(false);
  }

  const submittedResults = results.filter((result) => result.status === 'submitted');
  const avgScore = submittedResults.length > 0
    ? Math.round(submittedResults.reduce((sum, result) => sum + (result.percentage || 0), 0) / submittedResults.length)
    : null;
  const highestScore = submittedResults.length > 0
    ? Math.max(...submittedResults.map((result) => result.percentage || 0))
    : null;
  const lowestScore = submittedResults.length > 0
    ? Math.min(...submittedResults.map((result) => result.percentage || 0))
    : null;
  const eligibleStudents = results.filter((result) => !result.blocked).length;
  const completionRate = eligibleStudents > 0
    ? Math.round((submittedResults.length / eligibleStudents) * 100)
    : 0;

  if (loading) {
    return (
      <div className="p-8">
        <div className="h-10 w-64 bg-gray-100 rounded animate-pulse mb-2" />
        <div className="h-5 w-72 bg-gray-100 rounded animate-pulse mb-8" />
        <div className="grid grid-cols-4 gap-6 mb-8">
          {[1, 2, 3, 4].map((item) => <div key={item} className="h-28 bg-gray-100 rounded-xl animate-pulse" />)}
        </div>
        <div className="h-96 bg-gray-100 rounded-xl animate-pulse" />
      </div>
    );
  }

  if (error || !quiz) {
    return <div className="p-8 text-[#DC2626]">{error || 'Quiz not found.'}</div>;
  }

  return (
    <div className="p-8">
      <div className="mb-8">
        <h1 className="text-[30px] font-bold text-[#111827] mb-2">{quiz.title}</h1>
        <p className="text-[#4B5563]">{quiz.subject} • {submittedResults.length} submissions</p>
      </div>

      <div className="grid grid-cols-4 gap-6 mb-8">
        <Card>
          <p className="text-[12px] text-[#4B5563] mb-1">Average Score</p>
          <p className="text-[30px] font-bold text-[#111827]">{avgScore != null ? `${avgScore}%` : '-'}</p>
        </Card>
        <Card>
          <p className="text-[12px] text-[#4B5563] mb-1">Highest Score</p>
          <p className="text-[30px] font-bold text-[#16A34A]">{highestScore != null ? `${highestScore}%` : '-'}</p>
        </Card>
        <Card>
          <p className="text-[12px] text-[#4B5563] mb-1">Lowest Score</p>
          <p className="text-[30px] font-bold text-[#DC2626]">{lowestScore != null ? `${lowestScore}%` : '-'}</p>
        </Card>
        <Card>
          <p className="text-[12px] text-[#4B5563] mb-1">Completion Rate</p>
          <p className="text-[30px] font-bold text-[#111827]">{completionRate}%</p>
        </Card>
      </div>

      <Card>
        <h2 className="text-[24px] font-semibold text-[#111827] mb-6">Student Results</h2>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-[#D1D5DB]">
                <th className="text-left py-3 px-4 text-[12px] font-semibold text-[#4B5563] uppercase">Student</th>
                <th className="text-left py-3 px-4 text-[12px] font-semibold text-[#4B5563] uppercase">Status</th>
                <th className="text-left py-3 px-4 text-[12px] font-semibold text-[#4B5563] uppercase">Score</th>
                <th className="text-left py-3 px-4 text-[12px] font-semibold text-[#4B5563] uppercase">Percentage</th>
                <th className="text-left py-3 px-4 text-[12px] font-semibold text-[#4B5563] uppercase">Time Taken</th>
                <th className="text-left py-3 px-4 text-[12px] font-semibold text-[#4B5563] uppercase">Submitted At</th>
                <th className="text-left py-3 px-4 text-[12px] font-semibold text-[#4B5563] uppercase">Actions</th>
              </tr>
            </thead>
            <tbody>
              {results.map((result) => {
                const statusBadge = getStatusBadge(result.status);
                return (
                  <tr key={result.studentId} className="border-b border-[#D1D5DB] last:border-0 hover:bg-[#F3F4F6]">
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-3">
                        <img src={result.avatarUrl} alt={result.studentName} className="w-8 h-8 rounded-full" />
                        <div>
                          <p className="text-[14px] text-[#111827] font-medium">{result.studentName}</p>
                          <p className="text-[12px] text-[#4B5563]">{result.studentEmail}</p>
                        </div>
                      </div>
                    </td>
                    <td className="py-3 px-4">
                      <Badge variant={statusBadge.variant}>{statusBadge.label}</Badge>
                    </td>
                    <td className="py-3 px-4 text-[14px] text-[#111827] font-semibold">
                      {result.score != null && result.maxScore != null ? `${result.score}/${result.maxScore}` : '-'}
                    </td>
                    <td className="py-3 px-4">
                      {result.percentage != null ? (
                        <Badge variant={result.percentage >= 75 ? 'success' : result.percentage >= 50 ? 'warning' : 'danger'}>
                          {result.percentage}%
                        </Badge>
                      ) : (
                        <span className="text-[14px] text-[#4B5563]">-</span>
                      )}
                    </td>
                    <td className="py-3 px-4 text-[14px] text-[#4B5563]">{formatTimeTaken(result.timeTakenSeconds)}</td>
                    <td className="py-3 px-4 text-[14px] text-[#4B5563]">
                      {result.submittedAt ? new Date(result.submittedAt).toLocaleString() : '-'}
                    </td>
                    <td className="py-3 px-4">
                      <Button variant="secondary" size="sm" onClick={() => openStudentDetail(result)}>
                        <Eye className="w-4 h-4" />
                        View Detail
                      </Button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </Card>

      {selectedStudent && (
        <Modal
          isOpen={!!selectedStudent}
          onClose={() => {
            setSelectedStudent(null);
            setSelectedAnswers([]);
            setDetailLoading(false);
          }}
          title={`${selectedStudent.studentName}'s Quiz Status`}
          size="large"
        >
          <div className="space-y-4">
            <div className="flex items-center justify-between p-4 bg-[#F3F4F6] rounded-lg">
              <div>
                <p className="text-[12px] text-[#4B5563]">Status</p>
                <p className="text-[24px] font-bold text-[#111827]">{getStatusBadge(selectedStudent.status).label}</p>
              </div>
              {selectedStudent.percentage != null ? (
                <Badge variant={selectedStudent.percentage >= 75 ? 'success' : selectedStudent.percentage >= 50 ? 'warning' : 'danger'}>
                  {selectedStudent.percentage}%
                </Badge>
              ) : (
                <Badge variant={getStatusBadge(selectedStudent.status).variant}>
                  {getStatusBadge(selectedStudent.status).label}
                </Badge>
              )}
            </div>

            {selectedStudent.status === 'submitted' && (
              <div className="grid grid-cols-3 gap-4">
                <Card>
                  <p className="text-[12px] text-[#4B5563] mb-1">Score</p>
                  <p className="text-[20px] font-semibold text-[#111827]">
                    {selectedStudent.score ?? 0} / {selectedStudent.maxScore ?? quiz.totalPoints}
                  </p>
                </Card>
                <Card>
                  <p className="text-[12px] text-[#4B5563] mb-1">Time Taken</p>
                  <p className="text-[20px] font-semibold text-[#111827]">{formatTimeTaken(selectedStudent.timeTakenSeconds)}</p>
                </Card>
                <Card>
                  <p className="text-[12px] text-[#4B5563] mb-1">Submitted</p>
                  <p className="text-[14px] font-medium text-[#111827]">
                    {selectedStudent.submittedAt ? new Date(selectedStudent.submittedAt).toLocaleString() : '-'}
                  </p>
                </Card>
              </div>
            )}

            {selectedStudent.status !== 'submitted' && (
              <Card>
                <p className="text-[14px] text-[#4B5563]">
                  {selectedStudent.status === 'in_progress'
                    ? 'This student started the quiz but did not finish it.'
                    : selectedStudent.status === 'blocked'
                    ? 'This student is currently blocked from taking quizzes in this subject.'
                    : 'This student has not started the quiz yet.'}
                </p>
              </Card>
            )}

            {selectedStudent.status === 'submitted' && detailLoading && (
              <div className="text-[14px] text-[#4B5563]">Loading answer details...</div>
            )}

            {selectedStudent.status === 'submitted' && !detailLoading && selectedAnswers.length === 0 && (
              <Card>
                <p className="text-[14px] text-[#4B5563]">No answer detail was found for this attempt.</p>
              </Card>
            )}

            {selectedStudent.status === 'submitted' && !detailLoading && selectedAnswers.length > 0 && (
              <div className="space-y-4">
                {selectedAnswers.map((answer, index) => (
                  <Card
                    key={answer.id}
                    className={`border-l-4 ${answer.isCorrect ? 'border-l-[#16A34A]' : answer.pointsEarned > 0 ? 'border-l-[#D97706]' : 'border-l-[#DC2626]'}`}
                  >
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          <Badge variant="neutral">Question {index + 1}</Badge>
                          <Badge variant="neutral">{TYPE_LABEL[answer.questionType] || answer.questionType}</Badge>
                          <Badge variant={answer.isCorrect ? 'success' : answer.pointsEarned > 0 ? 'warning' : 'danger'}>
                            {answer.pointsEarned} / {answer.points} pts
                          </Badge>
                        </div>
                        <p className="text-[14px] text-[#111827] font-medium mb-3">{answer.questionText}</p>
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div className={`p-3 rounded-lg ${answer.isCorrect ? 'bg-[#DCFCE7]' : 'bg-[#FEE2E2]'}`}>
                        <p className="text-[12px] text-[#4B5563] mb-1">Student Answer</p>
                        <p className="text-[14px] font-medium whitespace-pre-wrap">{answer.studentAnswer || '(no answer)'}</p>
                      </div>
                      <div className="p-3 bg-[#DCFCE7] rounded-lg">
                        <p className="text-[12px] text-[#4B5563] mb-1">Correct Answer</p>
                        <p className="text-[14px] font-medium text-[#16A34A] whitespace-pre-wrap">{answer.correctAnswer}</p>
                      </div>
                    </div>
                  </Card>
                ))}
              </div>
            )}
          </div>
        </Modal>
      )}
    </div>
  );
}
