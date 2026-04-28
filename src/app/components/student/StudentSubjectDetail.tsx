import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router';
import { Clock, FileQuestion } from 'lucide-react';
import Card from '../ui/Card';
import Button from '../ui/Button';
import Badge from '../ui/Badge';
import { supabase } from '../../../lib/supabase';
import { useAuth } from '../../../hooks/useAuth';

interface SubjectInfo {
  id: string;
  name: string;
  description: string;
}

interface QuizWithStatus {
  id: string;
  title: string;
  time_limit_minutes: number | null;
  question_count: number;
  status: 'available' | 'in_progress' | 'completed';
  score: number | null;
  max_score: number | null;
}

export default function StudentSubjectDetail() {
  const { id } = useParams<{ id: string }>();
  const { user } = useAuth();
  const [subject, setSubject] = useState<SubjectInfo | null>(null);
  const [quizzes, setQuizzes] = useState<QuizWithStatus[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (id && user) fetchData();
  }, [id, user]);

  async function fetchData() {
    setLoading(true);
    await Promise.allSettled([fetchSubject(), fetchQuizzes()]);
    setLoading(false);
  }

  async function fetchSubject() {
    const { data } = await supabase
      .from('subjects')
      .select('id, name, description')
      .eq('id', id)
      .single();
    if (data) setSubject(data);
  }

  async function fetchQuizzes() {
    if (!user) return;

    const { data: quizData } = await supabase
      .from('quizzes')
      .select('id, title, time_limit_minutes, questions(count)')
      .eq('subject_id', id)
      .eq('status', 'published')
      .order('created_at', { ascending: true });

    if (!quizData?.length) { setQuizzes([]); return; }

    const quizIds = quizData.map((q: any) => q.id);

    const { data: attempts } = await supabase
      .from('quiz_attempts')
      .select('quiz_id, status, score, max_score')
      .eq('student_id', user.id)
      .in('quiz_id', quizIds);

    const attemptMap = new Map((attempts || []).map((a: any) => [a.quiz_id, a]));

    setQuizzes(quizData.map((q: any) => {
      const attempt = attemptMap.get(q.id);
      let status: QuizWithStatus['status'] = 'available';
      if (attempt?.status === 'submitted') status = 'completed';
      else if (attempt?.status === 'in_progress') status = 'in_progress';
      return {
        id: q.id,
        title: q.title,
        time_limit_minutes: q.time_limit_minutes,
        question_count: q.questions?.[0]?.count ?? 0,
        status,
        score: attempt?.score ?? null,
        max_score: attempt?.max_score ?? null,
      };
    }));
  }

  if (loading) {
    return (
      <div className="p-8">
        <div className="h-10 w-64 bg-gray-100 rounded animate-pulse mb-2" />
        <div className="h-5 w-96 bg-gray-100 rounded animate-pulse mb-8" />
        <div className="grid grid-cols-2 gap-6">
          {[1, 2, 3, 4].map(i => <div key={i} className="h-40 bg-gray-100 rounded-xl animate-pulse" />)}
        </div>
      </div>
    );
  }

  if (!subject) {
    return <div className="p-8 text-[#4B5563]">Subject not found.</div>;
  }

  const completedCount = quizzes.filter(q => q.status === 'completed').length;

  return (
    <div className="p-8">
      <div className="mb-8">
        <h1 className="text-[30px] font-bold text-[#111827] mb-2">{subject.name}</h1>
        <p className="text-[#4B5563] mb-3">{subject.description}</p>
        {quizzes.length > 0 && (
          <p className="text-[14px] text-[#4B5563]">{completedCount} of {quizzes.length} quizzes completed</p>
        )}
      </div>

      <h2 className="text-[24px] font-semibold text-[#111827] mb-4">Quizzes</h2>

      {quizzes.length === 0 ? (
        <div className="text-center py-16 text-[#4B5563]">
          <FileQuestion className="w-12 h-12 mx-auto mb-3 text-gray-300" />
          <p className="font-medium">No quizzes available yet.</p>
        </div>
      ) : (
        <div className="grid grid-cols-2 gap-6">
          {quizzes.map((quiz) => (
            <Card key={quiz.id}>
              <div className="flex items-start justify-between mb-3">
                <h3 className="text-[18px] font-semibold text-[#111827] flex-1 pr-2">{quiz.title}</h3>
                {quiz.status === 'completed' && <Badge variant="success">Completed</Badge>}
                {quiz.status === 'in_progress' && <Badge variant="warning">In Progress</Badge>}
                {quiz.status === 'available' && <Badge variant="neutral">Available</Badge>}
              </div>

              <div className="flex gap-4 mb-4">
                <div className="flex items-center gap-2 text-[#4B5563]">
                  <FileQuestion className="w-4 h-4" />
                  <span className="text-[14px]">{quiz.question_count} questions</span>
                </div>
                {quiz.time_limit_minutes && (
                  <div className="flex items-center gap-2 text-[#4B5563]">
                    <Clock className="w-4 h-4" />
                    <span className="text-[14px]">{quiz.time_limit_minutes} min</span>
                  </div>
                )}
              </div>

              {quiz.status === 'completed' && quiz.score != null && quiz.max_score != null && (
                <div className="mb-4">
                  <Badge variant={
                    quiz.max_score > 0 && (quiz.score / quiz.max_score) >= 0.75 ? 'success' :
                    quiz.max_score > 0 && (quiz.score / quiz.max_score) >= 0.5 ? 'warning' : 'danger'
                  }>
                    Score: {quiz.score}/{quiz.max_score} ({quiz.max_score > 0 ? Math.round((quiz.score / quiz.max_score) * 100) : 0}%)
                  </Badge>
                </div>
              )}

              {quiz.status === 'available' && (
                <Link to={`/student/quiz/${quiz.id}/take`}>
                  <Button variant="primary" size="sm" className="w-full">Start Quiz</Button>
                </Link>
              )}
              {quiz.status === 'in_progress' && (
                <Link to={`/student/quiz/${quiz.id}/take`}>
                  <Button variant="primary" size="sm" className="w-full">Continue Quiz</Button>
                </Link>
              )}
              {quiz.status === 'completed' && (
                <Link to={`/student/quiz/${quiz.id}/results`}>
                  <Button variant="secondary" size="sm" className="w-full">View Results</Button>
                </Link>
              )}
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
