import { BookOpen, FileQuestion, Users, CheckCircle } from 'lucide-react';
import Card from '../ui/Card';
import Badge from '../ui/Badge';
import Button from '../ui/Button';
import { Link } from 'react-router';

export default function AdminDashboard() {
  const stats = [
    { label: 'Total Subjects', value: '12', icon: BookOpen, color: 'text-[#4F46E5]', bg: 'bg-[#EEF2FF]' },
    { label: 'Total Quizzes', value: '48', icon: FileQuestion, color: 'text-[#16A34A]', bg: 'bg-[#DCFCE7]' },
    { label: 'Total Students', value: '156', icon: Users, color: 'text-[#D97706]', bg: 'bg-[#FEF3C7]' },
    { label: 'Recent Submissions', value: '89', icon: CheckCircle, color: 'text-[#DC2626]', bg: 'bg-[#FEE2E2]' },
  ];

  const recentSubmissions = [
    { id: 1, student: 'Maria Santos', subject: 'Mathematics 101', quiz: 'Algebra Basics', score: 85, date: '2026-04-27 10:30 AM' },
    { id: 2, student: 'John Doe', subject: 'Physics 201', quiz: 'Newton\'s Laws', score: 92, date: '2026-04-27 09:15 AM' },
    { id: 3, student: 'Sarah Chen', subject: 'Chemistry 101', quiz: 'Chemical Bonds', score: 78, date: '2026-04-26 04:45 PM' },
    { id: 4, student: 'Mike Johnson', subject: 'Biology 101', quiz: 'Cell Structure', score: 95, date: '2026-04-26 02:20 PM' },
    { id: 5, student: 'Emily Brown', subject: 'Mathematics 101', quiz: 'Trigonometry', score: 88, date: '2026-04-26 11:00 AM' },
  ];

  return (
    <div className="p-8">
      <div className="mb-8">
        <h1 className="text-[30px] font-bold text-[#111827] mb-2">Dashboard</h1>
        <p className="text-[#4B5563]">Overview of your learning management system</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-4 gap-6 mb-8">
        {stats.map((stat) => {
          const Icon = stat.icon;
          return (
            <Card key={stat.label}>
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-[12px] text-[#4B5563] mb-1">{stat.label}</p>
                  <p className="text-[30px] font-bold text-[#111827]">{stat.value}</p>
                </div>
                <div className={`w-12 h-12 ${stat.bg} rounded-lg flex items-center justify-center`}>
                  <Icon className={`w-6 h-6 ${stat.color}`} />
                </div>
              </div>
            </Card>
          );
        })}
      </div>

      {/* Quick Actions */}
      <div className="mb-8">
        <h2 className="text-[24px] font-semibold text-[#111827] mb-4">Quick Actions</h2>
        <div className="flex gap-4">
          <Link to="/admin/subjects">
            <Button variant="primary" size="lg">
              <BookOpen className="w-5 h-5" />
              Create Subject
            </Button>
          </Link>
          <Link to="/admin/subjects">
            <Button variant="secondary" size="lg">
              <FileQuestion className="w-5 h-5" />
              Create Quiz
            </Button>
          </Link>
        </div>
      </div>

      {/* Recent Activity */}
      <div>
        <h2 className="text-[24px] font-semibold text-[#111827] mb-4">Recent Submissions</h2>
        <Card>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-[#D1D5DB]">
                  <th className="text-left py-3 px-4 text-[12px] font-semibold text-[#4B5563] uppercase">Student</th>
                  <th className="text-left py-3 px-4 text-[12px] font-semibold text-[#4B5563] uppercase">Subject</th>
                  <th className="text-left py-3 px-4 text-[12px] font-semibold text-[#4B5563] uppercase">Quiz</th>
                  <th className="text-left py-3 px-4 text-[12px] font-semibold text-[#4B5563] uppercase">Score</th>
                  <th className="text-left py-3 px-4 text-[12px] font-semibold text-[#4B5563] uppercase">Date</th>
                </tr>
              </thead>
              <tbody>
                {recentSubmissions.map((submission) => (
                  <tr key={submission.id} className="border-b border-[#D1D5DB] last:border-0 hover:bg-[#F3F4F6]">
                    <td className="py-3 px-4 text-[14px] text-[#111827] font-medium">{submission.student}</td>
                    <td className="py-3 px-4 text-[14px] text-[#4B5563]">{submission.subject}</td>
                    <td className="py-3 px-4 text-[14px] text-[#4B5563]">{submission.quiz}</td>
                    <td className="py-3 px-4">
                      <Badge variant={submission.score >= 75 ? 'success' : submission.score >= 50 ? 'warning' : 'danger'}>
                        {submission.score}%
                      </Badge>
                    </td>
                    <td className="py-3 px-4 text-[14px] text-[#4B5563]">{submission.date}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      </div>
    </div>
  );
}
