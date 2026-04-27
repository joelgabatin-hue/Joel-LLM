import { useState } from 'react';
import { Link } from 'react-router';
import { Plus } from 'lucide-react';
import Card from '../ui/Card';
import Button from '../ui/Button';
import Badge from '../ui/Badge';
import Modal from '../ui/Modal';
import Input from '../ui/Input';

export default function StudentDashboard() {
  const [showEnrollModal, setShowEnrollModal] = useState(false);
  const [enrollCode, setEnrollCode] = useState('');

  const user = {
    name: 'Joel Santos',
    avatar: 'https://ui-avatars.com/api/?name=Joel+Santos&background=4F46E5&color=fff'
  };

  const subjects = [
    { id: '1', name: 'Mathematics 101', nextQuiz: 'Algebra Basics', completed: 6, total: 8, progress: 75 },
    { id: '2', name: 'Physics 201', nextQuiz: 'Newton\'s Laws', completed: 10, total: 12, progress: 83 },
    { id: '3', name: 'Chemistry 101', nextQuiz: 'No quizzes available', completed: 8, total: 10, progress: 80 },
  ];

  const recentActivity = [
    { id: '1', quiz: 'Trigonometry', subject: 'Mathematics 101', score: 88, date: '2026-04-26' },
    { id: '2', quiz: 'Thermodynamics', subject: 'Physics 201', score: 92, date: '2026-04-25' },
    { id: '3', quiz: 'Atomic Structure', subject: 'Chemistry 101', score: 85, date: '2026-04-24' },
  ];

  return (
    <div className="p-8">
      {/* Welcome Banner */}
      <Card className="mb-8 bg-gradient-to-r from-[#4F46E5] to-[#3730A3] text-white">
        <div className="flex items-center gap-4">
          <img src={user.avatar} alt={user.name} className="w-16 h-16 rounded-full border-4 border-white" />
          <div>
            <h1 className="text-[30px] font-bold mb-1">Welcome back, {user.name}!</h1>
            <p className="text-[#EEF2FF]">Here's what's happening in your courses</p>
          </div>
        </div>
      </Card>

      {/* Actions */}
      <div className="mb-8">
        <Button variant="primary" onClick={() => setShowEnrollModal(true)}>
          <Plus className="w-5 h-5" />
          Join Subject
        </Button>
      </div>

      {/* My Subjects */}
      <div className="mb-8">
        <h2 className="text-[24px] font-semibold text-[#111827] mb-4">My Subjects</h2>
        <div className="grid grid-cols-3 gap-6">
          {subjects.map((subject) => (
            <Card key={subject.id} hover>
              <h3 className="text-[18px] font-semibold text-[#111827] mb-3">{subject.name}</h3>
              <div className="mb-4">
                <p className="text-[12px] text-[#4B5563] mb-1">Next Quiz</p>
                <p className="text-[14px] text-[#111827] font-medium">{subject.nextQuiz}</p>
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
      </div>

      {/* Recent Activity */}
      <div>
        <h2 className="text-[24px] font-semibold text-[#111827] mb-4">Recent Activity</h2>
        <Card>
          <div className="space-y-3">
            {recentActivity.map((activity) => (
              <div key={activity.id} className="flex items-center justify-between p-3 hover:bg-[#F3F4F6] rounded-lg transition-colors">
                <div className="flex-1">
                  <p className="text-[14px] text-[#111827] font-medium">{activity.quiz}</p>
                  <p className="text-[12px] text-[#4B5563]">{activity.subject}</p>
                </div>
                <div className="flex items-center gap-4">
                  <Badge variant={activity.score >= 75 ? 'success' : activity.score >= 50 ? 'warning' : 'danger'}>
                    {activity.score}%
                  </Badge>
                  <p className="text-[12px] text-[#4B5563]">{activity.date}</p>
                </div>
              </div>
            ))}
          </div>
        </Card>
      </div>

      {/* Enroll Modal */}
      <Modal isOpen={showEnrollModal} onClose={() => setShowEnrollModal(false)} title="Join a Subject">
        <div className="space-y-4">
          <Input
            label="Enter Subject Code"
            placeholder="e.g., MATH-4X9K"
            value={enrollCode}
            onChange={(e) => setEnrollCode(e.target.value.toUpperCase())}
            className="font-mono text-[16px]"
          />
          <div className="flex gap-3 pt-4">
            <Button variant="ghost" onClick={() => setShowEnrollModal(false)} className="flex-1">
              Cancel
            </Button>
            <Button variant="primary" disabled={!enrollCode} className="flex-1">
              Join Subject
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
