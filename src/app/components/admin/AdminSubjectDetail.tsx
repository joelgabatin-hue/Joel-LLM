import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router';
import { Plus, Edit, Trash2, BarChart3, Users as UsersIcon, FileQuestion } from 'lucide-react';
import Card from '../ui/Card';
import Button from '../ui/Button';
import Badge from '../ui/Badge';
import { supabase } from '../../../lib/supabase';

interface SubjectData {
  id: string;
  name: string;
  description: string;
  enrollment_code: string;
}

interface QuizRow {
  id: string;
  title: string;
  status: 'draft' | 'published';
  time_limit_minutes: number | null;
  question_count: number;
  avg_score: number | null;
}

interface StudentRow {
  id: string;
  full_name: string;
  email: string;
  avatar_url: string | null;
  enrolled_at: string;
}

export default function AdminSubjectDetail() {
  const { id } = useParams<{ id: string }>();
  const [activeTab, setActiveTab] = useState<'overview' | 'quizzes' | 'students'>('overview');
  const [subject, setSubject] = useState<SubjectData | null>(null);
  const [quizzes, setQuizzes] = useState<QuizRow[]>([]);
  const [students, setStudents] = useState<StudentRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (id) fetchAll();
  }, [id]);

  async function fetchAll() {
    setLoading(true);
    await Promise.allSettled([fetchSubject(), fetchQuizzes(), fetchStudents()]);
    setLoading(false);
  }

  async function fetchSubject() {
    const { data, error } = await supabase
      .from('subjects')
      .select('id, name, description, enrollment_code')
      .eq('id', id)
      .single();
    if (error) setError(error.message);
    else setSubject(data);
  }

  async function fetchQuizzes() {
    const { data, error } = await supabase
      .from('quizzes')
      .select('id, title, status, time_limit_minutes, questions(count)')
      .eq('subject_id', id)
      .order('created_at', { ascending: false });

    if (error) { setError(error.message); return; }

    setQuizzes((data || []).map((q: any) => ({
      id: q.id,
      title: q.title,
      status: q.status,
      time_limit_minutes: q.time_limit_minutes,
      question_count: q.questions?.[0]?.count ?? 0,
      avg_score: null,
    })));
  }

  async function fetchStudents() {
    const { data, error } = await supabase
      .from('subject_enrollments')
      .select('enrolled_at, users(id, full_name, email, avatar_url)')
      .eq('subject_id', id);

    if (error) { setError(error.message); return; }

    setStudents((data || []).filter((e: any) => e.users).map((e: any) => ({
      id: e.users.id,
      full_name: e.users.full_name || 'Unknown',
      email: e.users.email,
      avatar_url: e.users.avatar_url,
      enrolled_at: e.enrolled_at,
    })));
  }

  async function handleDeleteQuiz(quizId: string) {
    if (!confirm('Delete this quiz? This cannot be undone.')) return;
    const { error } = await supabase.from('quizzes').delete().eq('id', quizId);
    if (error) setError(error.message);
    else setQuizzes(prev => prev.filter(q => q.id !== quizId));
  }

  async function handleRemoveStudent(studentId: string) {
    if (!confirm('Remove this student from the subject?')) return;
    const { error } = await supabase
      .from('subject_enrollments')
      .delete()
      .eq('subject_id', id)
      .eq('student_id', studentId);
    if (error) setError(error.message);
    else setStudents(prev => prev.filter(s => s.id !== studentId));
  }

  if (loading) {
    return (
      <div className="p-8">
        <div className="h-10 w-64 bg-gray-100 rounded animate-pulse mb-4" />
        <div className="grid grid-cols-3 gap-6">
          {[1, 2, 3].map(i => <div key={i} className="h-28 bg-gray-100 rounded-xl animate-pulse" />)}
        </div>
      </div>
    );
  }

  if (!subject) {
    return <div className="p-8 text-[#4B5563]">Subject not found.</div>;
  }

  const avgScore = (() => {
    const scored = quizzes.filter(q => q.avg_score != null);
    if (!scored.length) return null;
    return Math.round(scored.reduce((s, q) => s + (q.avg_score || 0), 0) / scored.length);
  })();

  return (
    <div className="p-8">
      <div className="mb-8">
        <div className="flex items-start justify-between mb-4">
          <div>
            <h1 className="text-[30px] font-bold text-[#111827] mb-2">{subject.name}</h1>
            <p className="text-[#4B5563] mb-4">{subject.description}</p>
            <code className="px-3 py-1.5 bg-[#F3F4F6] text-[#111827] text-[14px] font-mono font-medium rounded border border-[#D1D5DB]">
              {subject.enrollment_code}
            </code>
          </div>
        </div>
      </div>

      {error && (
        <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-red-600 text-sm">{error}</div>
      )}

      {/* Tabs */}
      <div className="border-b border-[#D1D5DB] mb-6">
        <div className="flex gap-8">
          {(['overview', 'quizzes', 'students'] as const).map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`pb-3 text-[14px] font-medium transition-colors border-b-2 capitalize ${
                activeTab === tab
                  ? 'border-[#4F46E5] text-[#4F46E5]'
                  : 'border-transparent text-[#4B5563] hover:text-[#111827]'
              }`}
            >
              {tab}
            </button>
          ))}
        </div>
      </div>

      {activeTab === 'overview' && (
        <div className="grid grid-cols-3 gap-6">
          <Card>
            <div className="flex items-center justify-between mb-2">
              <p className="text-[12px] text-[#4B5563]">Enrolled Students</p>
              <UsersIcon className="w-5 h-5 text-[#4F46E5]" />
            </div>
            <p className="text-[30px] font-bold text-[#111827]">{students.length}</p>
          </Card>
          <Card>
            <div className="flex items-center justify-between mb-2">
              <p className="text-[12px] text-[#4B5563]">Total Quizzes</p>
              <FileQuestion className="w-5 h-5 text-[#16A34A]" />
            </div>
            <p className="text-[30px] font-bold text-[#111827]">{quizzes.length}</p>
          </Card>
          <Card>
            <div className="flex items-center justify-between mb-2">
              <p className="text-[12px] text-[#4B5563]">Average Score</p>
              <BarChart3 className="w-5 h-5 text-[#D97706]" />
            </div>
            <p className="text-[30px] font-bold text-[#111827]">{avgScore != null ? `${avgScore}%` : '—'}</p>
          </Card>
        </div>
      )}

      {activeTab === 'quizzes' && (
        <div>
          <div className="flex justify-between items-center mb-6">
            <p className="text-[#4B5563]">{quizzes.length} quiz{quizzes.length !== 1 ? 'zes' : ''}</p>
            <Link to={`/admin/subjects/${id}/quiz/new`}>
              <Button variant="primary">
                <Plus className="w-4 h-4" />
                New Quiz
              </Button>
            </Link>
          </div>
          {quizzes.length === 0 ? (
            <div className="text-center py-20 text-[#4B5563]">
              <FileQuestion className="w-12 h-12 mx-auto mb-3 text-gray-300" />
              <p className="font-medium">No quizzes yet.</p>
              <p className="text-sm mt-1">Create the first quiz for this subject.</p>
            </div>
          ) : (
            <Card>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-[#D1D5DB]">
                      <th className="text-left py-3 px-4 text-[12px] font-semibold text-[#4B5563] uppercase">Title</th>
                      <th className="text-left py-3 px-4 text-[12px] font-semibold text-[#4B5563] uppercase">Questions</th>
                      <th className="text-left py-3 px-4 text-[12px] font-semibold text-[#4B5563] uppercase">Time Limit</th>
                      <th className="text-left py-3 px-4 text-[12px] font-semibold text-[#4B5563] uppercase">Status</th>
                      <th className="text-left py-3 px-4 text-[12px] font-semibold text-[#4B5563] uppercase">Avg Score</th>
                      <th className="text-left py-3 px-4 text-[12px] font-semibold text-[#4B5563] uppercase">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {quizzes.map((quiz) => (
                      <tr key={quiz.id} className="border-b border-[#D1D5DB] last:border-0 hover:bg-[#F3F4F6]">
                        <td className="py-3 px-4 text-[14px] text-[#111827] font-medium">{quiz.title}</td>
                        <td className="py-3 px-4 text-[14px] text-[#4B5563]">{quiz.question_count}</td>
                        <td className="py-3 px-4 text-[14px] text-[#4B5563]">
                          {quiz.time_limit_minutes ? `${quiz.time_limit_minutes} min` : 'None'}
                        </td>
                        <td className="py-3 px-4">
                          <Badge variant={quiz.status === 'published' ? 'success' : 'warning'}>
                            {quiz.status === 'published' ? 'Published' : 'Draft'}
                          </Badge>
                        </td>
                        <td className="py-3 px-4 text-[14px] text-[#4B5563]">
                          {quiz.avg_score != null ? `${quiz.avg_score}%` : '—'}
                        </td>
                        <td className="py-3 px-4">
                          <div className="flex gap-2">
                            <Link to={`/admin/subjects/${id}/quiz/${quiz.id}/edit`}>
                              <button className="p-1.5 hover:bg-[#EEF2FF] rounded transition-colors" title="Edit">
                                <Edit className="w-4 h-4 text-[#4B5563]" />
                              </button>
                            </Link>
                            <Link to={`/admin/subjects/${id}/quiz/${quiz.id}/results`}>
                              <button className="p-1.5 hover:bg-[#EEF2FF] rounded transition-colors" title="Results">
                                <BarChart3 className="w-4 h-4 text-[#4B5563]" />
                              </button>
                            </Link>
                            <button
                              onClick={() => handleDeleteQuiz(quiz.id)}
                              className="p-1.5 hover:bg-[#FEE2E2] rounded transition-colors"
                              title="Delete"
                            >
                              <Trash2 className="w-4 h-4 text-[#DC2626]" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </Card>
          )}
        </div>
      )}

      {activeTab === 'students' && (
        <div>
          <div className="flex justify-between items-center mb-6">
            <p className="text-[#4B5563]">{students.length} student{students.length !== 1 ? 's' : ''} enrolled</p>
          </div>
          {students.length === 0 ? (
            <div className="text-center py-20 text-[#4B5563]">
              <UsersIcon className="w-12 h-12 mx-auto mb-3 text-gray-300" />
              <p className="font-medium">No students enrolled yet.</p>
              <p className="text-sm mt-1">Share the enrollment code: <code className="font-mono font-bold">{subject.enrollment_code}</code></p>
            </div>
          ) : (
            <Card>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-[#D1D5DB]">
                      <th className="text-left py-3 px-4 text-[12px] font-semibold text-[#4B5563] uppercase">Student</th>
                      <th className="text-left py-3 px-4 text-[12px] font-semibold text-[#4B5563] uppercase">Email</th>
                      <th className="text-left py-3 px-4 text-[12px] font-semibold text-[#4B5563] uppercase">Enrolled</th>
                      <th className="text-left py-3 px-4 text-[12px] font-semibold text-[#4B5563] uppercase">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {students.map((student) => (
                      <tr key={student.id} className="border-b border-[#D1D5DB] last:border-0 hover:bg-[#F3F4F6]">
                        <td className="py-3 px-4">
                          <div className="flex items-center gap-3">
                            <img
                              src={student.avatar_url || `https://ui-avatars.com/api/?name=${encodeURIComponent(student.full_name)}&background=4F46E5&color=fff`}
                              alt={student.full_name}
                              className="w-8 h-8 rounded-full"
                            />
                            <span className="text-[14px] text-[#111827] font-medium">{student.full_name}</span>
                          </div>
                        </td>
                        <td className="py-3 px-4 text-[14px] text-[#4B5563]">{student.email}</td>
                        <td className="py-3 px-4 text-[14px] text-[#4B5563]">
                          {new Date(student.enrolled_at).toLocaleDateString()}
                        </td>
                        <td className="py-3 px-4">
                          <Button variant="danger" size="sm" onClick={() => handleRemoveStudent(student.id)}>
                            Remove
                          </Button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </Card>
          )}
        </div>
      )}
    </div>
  );
}
