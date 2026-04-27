import { useState } from 'react';
import { useParams, Link } from 'react-router';
import { Plus, Edit, Trash2, Eye, BarChart3, Users as UsersIcon, FileQuestion } from 'lucide-react';
import Card from '../ui/Card';
import Button from '../ui/Button';
import Badge from '../ui/Badge';

export default function AdminSubjectDetail() {
  const { id } = useParams();
  const [activeTab, setActiveTab] = useState<'overview' | 'quizzes' | 'students'>('overview');

  const subject = {
    id: id,
    name: 'Mathematics 101',
    description: 'Introduction to Algebra and basic mathematical concepts for beginners',
    enrollmentCode: 'MATH-4X9K',
    studentCount: 45,
    quizCount: 8,
    avgScore: 82
  };

  const quizzes = [
    { id: '1', title: 'Algebra Basics', questions: 10, timeLimit: 30, status: 'Open', avgScore: 85, type: 'Mixed' },
    { id: '2', title: 'Linear Equations', questions: 15, timeLimit: 45, status: 'Open', avgScore: 78, type: 'Mixed' },
    { id: '3', title: 'Quadratic Functions', questions: 12, timeLimit: 40, status: 'Draft', avgScore: 0, type: 'Mixed' },
    { id: '4', title: 'Trigonometry Intro', questions: 20, timeLimit: 60, status: 'Closed', avgScore: 88, type: 'Mixed' },
  ];

  const students = [
    { id: '1', name: 'Maria Santos', email: 'maria@example.com', avatar: 'https://ui-avatars.com/api/?name=Maria+Santos&background=4F46E5&color=fff', enrolledDate: '2026-01-15', quizzesTaken: 8 },
    { id: '2', name: 'John Doe', email: 'john@example.com', avatar: 'https://ui-avatars.com/api/?name=John+Doe&background=4F46E5&color=fff', enrolledDate: '2026-01-16', quizzesTaken: 7 },
    { id: '3', name: 'Sarah Chen', email: 'sarah@example.com', avatar: 'https://ui-avatars.com/api/?name=Sarah+Chen&background=4F46E5&color=fff', enrolledDate: '2026-01-18', quizzesTaken: 8 },
  ];

  return (
    <div className="p-8">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-start justify-between mb-4">
          <div>
            <h1 className="text-[30px] font-bold text-[#111827] mb-2">{subject.name}</h1>
            <p className="text-[#4B5563] mb-4">{subject.description}</p>
            <code className="px-3 py-1.5 bg-[#F3F4F6] text-[#111827] text-[14px] font-mono font-medium rounded border border-[#D1D5DB]">
              {subject.enrollmentCode}
            </code>
          </div>
          <Button variant="secondary">
            <Edit className="w-4 h-4" />
            Edit Subject
          </Button>
        </div>
      </div>

      {/* Tabs */}
      <div className="border-b border-[#D1D5DB] mb-6">
        <div className="flex gap-8">
          {[
            { key: 'overview', label: 'Overview' },
            { key: 'quizzes', label: 'Quizzes' },
            { key: 'students', label: 'Students' }
          ].map((tab) => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key as any)}
              className={`pb-3 text-[14px] font-medium transition-colors border-b-2 ${
                activeTab === tab.key
                  ? 'border-[#4F46E5] text-[#4F46E5]'
                  : 'border-transparent text-[#4B5563] hover:text-[#111827]'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* Tab Content */}
      {activeTab === 'overview' && (
        <div className="grid grid-cols-3 gap-6">
          <Card>
            <div className="flex items-center justify-between mb-2">
              <p className="text-[12px] text-[#4B5563]">Enrolled Students</p>
              <UsersIcon className="w-5 h-5 text-[#4F46E5]" />
            </div>
            <p className="text-[30px] font-bold text-[#111827]">{subject.studentCount}</p>
          </Card>
          <Card>
            <div className="flex items-center justify-between mb-2">
              <p className="text-[12px] text-[#4B5563]">Total Quizzes</p>
              <FileQuestion className="w-5 h-5 text-[#16A34A]" />
            </div>
            <p className="text-[30px] font-bold text-[#111827]">{subject.quizCount}</p>
          </Card>
          <Card>
            <div className="flex items-center justify-between mb-2">
              <p className="text-[12px] text-[#4B5563]">Average Score</p>
              <BarChart3 className="w-5 h-5 text-[#D97706]" />
            </div>
            <p className="text-[30px] font-bold text-[#111827]">{subject.avgScore}%</p>
          </Card>
        </div>
      )}

      {activeTab === 'quizzes' && (
        <div>
          <div className="flex justify-between items-center mb-6">
            <p className="text-[#4B5563]">{quizzes.length} quizzes</p>
            <Link to={`/admin/subjects/${id}/quiz/new`}>
              <Button variant="primary">
                <Plus className="w-4 h-4" />
                New Quiz
              </Button>
            </Link>
          </div>
          <Card>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-[#D1D5DB]">
                    <th className="text-left py-3 px-4 text-[12px] font-semibold text-[#4B5563] uppercase">Quiz Title</th>
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
                      <td className="py-3 px-4 text-[14px] text-[#4B5563]">{quiz.questions}</td>
                      <td className="py-3 px-4 text-[14px] text-[#4B5563]">{quiz.timeLimit} min</td>
                      <td className="py-3 px-4">
                        <Badge variant={quiz.status === 'Open' ? 'success' : quiz.status === 'Draft' ? 'warning' : 'neutral'}>
                          {quiz.status}
                        </Badge>
                      </td>
                      <td className="py-3 px-4 text-[14px] text-[#4B5563]">{quiz.avgScore > 0 ? `${quiz.avgScore}%` : '-'}</td>
                      <td className="py-3 px-4">
                        <div className="flex gap-2">
                          <Link to={`/admin/subjects/${id}/quiz/${quiz.id}/edit`}>
                            <button className="p-1.5 hover:bg-[#EEF2FF] rounded transition-colors" title="Edit">
                              <Edit className="w-4 h-4 text-[#4B5563]" />
                            </button>
                          </Link>
                          <Link to={`/admin/subjects/${id}/quiz/${quiz.id}/results`}>
                            <button className="p-1.5 hover:bg-[#EEF2FF] rounded transition-colors" title="View Results">
                              <BarChart3 className="w-4 h-4 text-[#4B5563]" />
                            </button>
                          </Link>
                          <button className="p-1.5 hover:bg-[#FEE2E2] rounded transition-colors" title="Delete">
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
        </div>
      )}

      {activeTab === 'students' && (
        <div>
          <div className="flex justify-between items-center mb-6">
            <p className="text-[#4B5563]">{students.length} students enrolled</p>
          </div>
          <Card>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-[#D1D5DB]">
                    <th className="text-left py-3 px-4 text-[12px] font-semibold text-[#4B5563] uppercase">Student</th>
                    <th className="text-left py-3 px-4 text-[12px] font-semibold text-[#4B5563] uppercase">Email</th>
                    <th className="text-left py-3 px-4 text-[12px] font-semibold text-[#4B5563] uppercase">Enrolled Date</th>
                    <th className="text-left py-3 px-4 text-[12px] font-semibold text-[#4B5563] uppercase">Quizzes Taken</th>
                    <th className="text-left py-3 px-4 text-[12px] font-semibold text-[#4B5563] uppercase">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {students.map((student) => (
                    <tr key={student.id} className="border-b border-[#D1D5DB] last:border-0 hover:bg-[#F3F4F6]">
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-3">
                          <img src={student.avatar} alt={student.name} className="w-8 h-8 rounded-full" />
                          <span className="text-[14px] text-[#111827] font-medium">{student.name}</span>
                        </div>
                      </td>
                      <td className="py-3 px-4 text-[14px] text-[#4B5563]">{student.email}</td>
                      <td className="py-3 px-4 text-[14px] text-[#4B5563]">{student.enrolledDate}</td>
                      <td className="py-3 px-4 text-[14px] text-[#4B5563]">{student.quizzesTaken}</td>
                      <td className="py-3 px-4">
                        <Button variant="danger" size="sm">
                          Remove
                        </Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Card>
        </div>
      )}
    </div>
  );
}
