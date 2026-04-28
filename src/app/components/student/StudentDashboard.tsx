import { useState, useEffect } from 'react';
import { Link } from 'react-router';
import { Plus, BookOpen } from 'lucide-react';
import Card from '../ui/Card';
import Button from '../ui/Button';
import Badge from '../ui/Badge';
import Modal from '../ui/Modal';
import Input from '../ui/Input';
import { supabase } from '../../../lib/supabase';
import { useAuth } from '../../../hooks/useAuth';

interface SubjectProgress {
  id: string;
  name: string;
  nextQuiz: string;
  completed: number;
  total: number;
  progress: number;
}

interface RecentAttempt {
  id: string;
  quizTitle: string;
  subjectName: string;
  percentage: number;
  submittedAt: string;
}

export default function StudentDashboard() {
  const { user } = useAuth();
  const [subjects, setSubjects] = useState<SubjectProgress[]>([]);
  const [recentActivity, setRecentActivity] = useState<RecentAttempt[]>([]);
  const [loading, setLoading] = useState(true);
  const [showEnrollModal, setShowEnrollModal] = useState(false);
  const [enrollCode, setEnrollCode] = useState('');
  const [enrolling, setEnrolling] = useState(false);
  const [enrollError, setEnrollError] = useState<string | null>(null);

  useEffect(() => {
    if (user) fetchData();
  }, [user]);

  async function fetchData() {
    if (!user) return;
    setLoading(true);
    await Promise.allSettled([fetchSubjects(), fetchRecentActivity()]);
    setLoading(false);
  }

  async function fetchSubjects() {
    if (!user) return;
    const { data: enrollments } = await supabase
      .from('subject_enrollments')
      .select('subject_id, subjects(id, name)')
      .eq('student_id', user.id);

    if (!enrollments?.length) { setSubjects([]); return; }

    const subjectIds = enrollments.map((e: any) => e.subject_id);

    const [{ data: quizzes }, { data: attempts }] = await Promise.all([
      supabase.from('quizzes').select('id, subject_id, title').in('subject_id', subjectIds).eq('status', 'published'),
      supabase.from('quiz_attempts').select('quiz_id').eq('student_id', user.id).eq('status', 'submitted'),
    ]);

    const completedIds = new Set((attempts || []).map((a: any) => a.quiz_id));

    setSubjects(enrollments.map((e: any) => {
      const sub = e.subjects;
      const subQuizzes = (quizzes || []).filter((q: any) => q.subject_id === e.subject_id);
      const completed = subQuizzes.filter((q: any) => completedIds.has(q.id)).length;
      const total = subQuizzes.length;
      const next = subQuizzes.find((q: any) => !completedIds.has(q.id));
      return {
        id: e.subject_id,
        name: sub?.name || 'Unknown',
        nextQuiz: next?.title ?? (total > 0 ? 'All quizzes completed!' : 'No quizzes yet'),
        completed,
        total,
        progress: total > 0 ? Math.round((completed / total) * 100) : 0,
      };
    }));
  }

  async function fetchRecentActivity() {
    if (!user) return;
    const { data } = await supabase
      .from('quiz_attempts')
      .select('id, score, max_score, submitted_at, quizzes(title, subjects(name))')
      .eq('student_id', user.id)
      .eq('status', 'submitted')
      .order('submitted_at', { ascending: false })
      .limit(5);

    setRecentActivity((data || []).map((a: any) => ({
      id: a.id,
      quizTitle: a.quizzes?.title || 'Unknown Quiz',
      subjectName: a.quizzes?.subjects?.name || 'Unknown Subject',
      percentage: a.max_score > 0 ? Math.round((a.score / a.max_score) * 100) : 0,
      submittedAt: a.submitted_at,
    })));
  }

  async function handleEnroll() {
    if (!user || !enrollCode.trim()) return;
    setEnrolling(true);
    setEnrollError(null);

    const { data: subject } = await supabase
      .from('subjects')
      .select('id, name')
      .eq('enrollment_code', enrollCode.trim().toUpperCase())
      .single();

    if (!subject) {
      setEnrollError('Subject not found. Please check the code and try again.');
      setEnrolling(false);
      return;
    }

    const { error } = await supabase.from('subject_enrollments').insert({
      subject_id: subject.id,
      student_id: user.id,
    });

    if (error) {
      if (error.code === '23505') {
        setEnrollError('You are already enrolled in this subject.');
      } else {
        setEnrollError(error.message);
      }
    } else {
      setShowEnrollModal(false);
      setEnrollCode('');
      await fetchSubjects();
    }
    setEnrolling(false);
  }

  return (
    <div className="p-8">
      {/* Welcome Banner */}
      <Card className="mb-8 bg-gradient-to-r from-[#4F46E5] to-[#3730A3] text-white">
        <div className="flex items-center gap-4">
          <img
            src={user?.avatar_url || `https://ui-avatars.com/api/?name=${encodeURIComponent(user?.full_name || 'Student')}&background=fff&color=4F46E5`}
            alt={user?.full_name || 'Student'}
            className="w-16 h-16 rounded-full border-4 border-white"
          />
          <div>
            <h1 className="text-[30px] font-bold mb-1">Welcome back, {user?.full_name?.split(' ')[0] || 'Student'}!</h1>
            <p className="text-[#EEF2FF]">Here's what's happening in your courses</p>
          </div>
        </div>
      </Card>

      {/* Actions */}
      <div className="mb-8">
        <Button variant="primary" onClick={() => { setShowEnrollModal(true); setEnrollError(null); setEnrollCode(''); }}>
          <Plus className="w-5 h-5" />
          Join Subject
        </Button>
      </div>

      {/* My Subjects */}
      <div className="mb-8">
        <h2 className="text-[24px] font-semibold text-[#111827] mb-4">My Subjects</h2>
        {loading ? (
          <div className="grid grid-cols-3 gap-6">
            {[1, 2, 3].map(i => <div key={i} className="h-48 bg-gray-100 rounded-xl animate-pulse" />)}
          </div>
        ) : subjects.length === 0 ? (
          <div className="text-center py-16 text-[#4B5563]">
            <BookOpen className="w-12 h-12 mx-auto mb-3 text-gray-300" />
            <p className="font-medium">No subjects yet.</p>
            <p className="text-sm mt-1">Click "Join Subject" and enter an enrollment code.</p>
          </div>
        ) : (
          <div className="grid grid-cols-3 gap-6">
            {subjects.map((subject) => (
              <Card key={subject.id} hover>
                <h3 className="text-[18px] font-semibold text-[#111827] mb-3">{subject.name}</h3>
                <div className="mb-4">
                  <p className="text-[12px] text-[#4B5563] mb-1">Next Quiz</p>
                  <p className="text-[14px] text-[#111827] font-medium truncate">{subject.nextQuiz}</p>
                </div>
                <div className="mb-4">
                  <div className="flex items-center justify-between mb-1">
                    <p className="text-[12px] text-[#4B5563]">Progress</p>
                    <p className="text-[12px] text-[#4B5563]">{subject.completed}/{subject.total} quizzes</p>
                  </div>
                  <div className="w-full bg-[#D1D5DB] rounded-full h-2">
                    <div
                      className="bg-[#4F46E5] h-2 rounded-full transition-all"
                      style={{ width: `${subject.progress}%` }}
                    />
                  </div>
                </div>
                <Link to={`/student/subjects/${subject.id}`}>
                  <Button variant="primary" size="sm" className="w-full">
                    Go to Subject
                  </Button>
                </Link>
              </Card>
            ))}
          </div>
        )}
      </div>

      {/* Recent Activity */}
      {recentActivity.length > 0 && (
        <div>
          <h2 className="text-[24px] font-semibold text-[#111827] mb-4">Recent Activity</h2>
          <Card>
            <div className="space-y-3">
              {recentActivity.map((activity) => (
                <div key={activity.id} className="flex items-center justify-between p-3 hover:bg-[#F3F4F6] rounded-lg transition-colors">
                  <div className="flex-1">
                    <p className="text-[14px] text-[#111827] font-medium">{activity.quizTitle}</p>
                    <p className="text-[12px] text-[#4B5563]">{activity.subjectName}</p>
                  </div>
                  <div className="flex items-center gap-4">
                    <Badge variant={activity.percentage >= 75 ? 'success' : activity.percentage >= 50 ? 'warning' : 'danger'}>
                      {activity.percentage}%
                    </Badge>
                    <p className="text-[12px] text-[#4B5563]">
                      {new Date(activity.submittedAt).toLocaleDateString()}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </Card>
        </div>
      )}

      {/* Enroll Modal */}
      <Modal isOpen={showEnrollModal} onClose={() => setShowEnrollModal(false)} title="Join a Subject">
        <div className="space-y-4">
          <Input
            label="Enter Subject Code"
            placeholder="e.g., MAT-4X9K"
            value={enrollCode}
            onChange={(e) => setEnrollCode(e.target.value.toUpperCase())}
            className="font-mono text-[16px]"
          />
          {enrollError && <p className="text-sm text-red-600">{enrollError}</p>}
          <div className="flex gap-3 pt-2">
            <Button variant="ghost" onClick={() => setShowEnrollModal(false)} className="flex-1">
              Cancel
            </Button>
            <Button
              variant="primary"
              onClick={handleEnroll}
              disabled={!enrollCode.trim() || enrolling}
              className="flex-1"
            >
              {enrolling ? 'Joining...' : 'Join Subject'}
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
