import { useState } from 'react';
import { useParams } from 'react-router';
import { Eye } from 'lucide-react';
import Card from '../ui/Card';
import Badge from '../ui/Badge';
import Button from '../ui/Button';
import Modal from '../ui/Modal';

export default function AdminQuizResults() {
  const { quizId } = useParams();
  const [selectedStudent, setSelectedStudent] = useState<any>(null);

  const quiz = {
    title: 'Algebra Basics',
    subject: 'Mathematics 101',
    totalSubmissions: 42
  };

  const summary = {
    avgScore: 82,
    highestScore: 98,
    lowestScore: 45,
    completionRate: 93
  };

  const results = [
    {
      id: '1',
      student: { name: 'Maria Santos', avatar: 'https://ui-avatars.com/api/?name=Maria+Santos&background=4F46E5&color=fff' },
      score: 85,
      percentage: 85,
      timeTaken: '28 min',
      submittedAt: '2026-04-27 10:30 AM',
      answers: [
        { question: 'What is the value of x in the equation 2x + 5 = 15?', studentAnswer: '5', correctAnswer: '5', points: 5, total: 5, correct: true },
        { question: 'The square root of 144 is 12.', studentAnswer: 'True', correctAnswer: 'True', points: 3, total: 3, correct: true }
      ]
    },
    {
      id: '2',
      student: { name: 'John Doe', avatar: 'https://ui-avatars.com/api/?name=John+Doe&background=4F46E5&color=fff' },
      score: 92,
      percentage: 92,
      timeTaken: '25 min',
      submittedAt: '2026-04-27 09:15 AM',
      answers: []
    },
    {
      id: '3',
      student: { name: 'Sarah Chen', avatar: 'https://ui-avatars.com/api/?name=Sarah+Chen&background=4F46E5&color=fff' },
      score: 78,
      percentage: 78,
      timeTaken: '30 min',
      submittedAt: '2026-04-26 04:45 PM',
      answers: []
    },
  ];

  return (
    <div className="p-8">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-[30px] font-bold text-[#111827] mb-2">{quiz.title}</h1>
        <p className="text-[#4B5563]">{quiz.subject} • {quiz.totalSubmissions} submissions</p>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-4 gap-6 mb-8">
        <Card>
          <p className="text-[12px] text-[#4B5563] mb-1">Average Score</p>
          <p className="text-[30px] font-bold text-[#111827]">{summary.avgScore}%</p>
        </Card>
        <Card>
          <p className="text-[12px] text-[#4B5563] mb-1">Highest Score</p>
          <p className="text-[30px] font-bold text-[#16A34A]">{summary.highestScore}%</p>
        </Card>
        <Card>
          <p className="text-[12px] text-[#4B5563] mb-1">Lowest Score</p>
          <p className="text-[30px] font-bold text-[#DC2626]">{summary.lowestScore}%</p>
        </Card>
        <Card>
          <p className="text-[12px] text-[#4B5563] mb-1">Completion Rate</p>
          <p className="text-[30px] font-bold text-[#111827]">{summary.completionRate}%</p>
        </Card>
      </div>

      {/* Results Table */}
      <Card>
        <h2 className="text-[24px] font-semibold text-[#111827] mb-6">Student Results</h2>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-[#D1D5DB]">
                <th className="text-left py-3 px-4 text-[12px] font-semibold text-[#4B5563] uppercase">Student</th>
                <th className="text-left py-3 px-4 text-[12px] font-semibold text-[#4B5563] uppercase">Score</th>
                <th className="text-left py-3 px-4 text-[12px] font-semibold text-[#4B5563] uppercase">Percentage</th>
                <th className="text-left py-3 px-4 text-[12px] font-semibold text-[#4B5563] uppercase">Time Taken</th>
                <th className="text-left py-3 px-4 text-[12px] font-semibold text-[#4B5563] uppercase">Submitted At</th>
                <th className="text-left py-3 px-4 text-[12px] font-semibold text-[#4B5563] uppercase">Actions</th>
              </tr>
            </thead>
            <tbody>
              {results.map((result) => (
                <tr key={result.id} className="border-b border-[#D1D5DB] last:border-0 hover:bg-[#F3F4F6]">
                  <td className="py-3 px-4">
                    <div className="flex items-center gap-3">
                      <img src={result.student.avatar} alt={result.student.name} className="w-8 h-8 rounded-full" />
                      <span className="text-[14px] text-[#111827] font-medium">{result.student.name}</span>
                    </div>
                  </td>
                  <td className="py-3 px-4 text-[14px] text-[#111827] font-semibold">{result.score}</td>
                  <td className="py-3 px-4">
                    <Badge variant={result.percentage >= 75 ? 'success' : result.percentage >= 50 ? 'warning' : 'danger'}>
                      {result.percentage}%
                    </Badge>
                  </td>
                  <td className="py-3 px-4 text-[14px] text-[#4B5563]">{result.timeTaken}</td>
                  <td className="py-3 px-4 text-[14px] text-[#4B5563]">{result.submittedAt}</td>
                  <td className="py-3 px-4">
                    <Button variant="secondary" size="sm" onClick={() => setSelectedStudent(result)}>
                      <Eye className="w-4 h-4" />
                      View Detail
                    </Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>

      {/* Student Detail Modal */}
      {selectedStudent && (
        <Modal
          isOpen={!!selectedStudent}
          onClose={() => setSelectedStudent(null)}
          title={`${selectedStudent.student.name}'s Results`}
          size="large"
        >
          <div className="space-y-4">
            <div className="flex items-center justify-between p-4 bg-[#F3F4F6] rounded-lg">
              <div>
                <p className="text-[12px] text-[#4B5563]">Total Score</p>
                <p className="text-[24px] font-bold text-[#111827]">{selectedStudent.score} / 100</p>
              </div>
              <Badge variant={selectedStudent.percentage >= 75 ? 'success' : selectedStudent.percentage >= 50 ? 'warning' : 'danger'}>
                {selectedStudent.percentage}%
              </Badge>
            </div>

            {selectedStudent.answers.map((answer: any, index: number) => (
              <Card key={index} className={`border-l-4 ${answer.correct ? 'border-l-[#16A34A]' : 'border-l-[#DC2626]'}`}>
                <div className="flex items-start justify-between mb-3">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <Badge variant="neutral">Question {index + 1}</Badge>
                      <Badge variant={answer.correct ? 'success' : 'danger'}>
                        {answer.points} / {answer.total} pts
                      </Badge>
                    </div>
                    <p className="text-[14px] text-[#111827] font-medium mb-3">{answer.question}</p>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className={`p-3 rounded-lg ${answer.correct ? 'bg-[#DCFCE7]' : 'bg-[#FEE2E2]'}`}>
                    <p className="text-[12px] text-[#4B5563] mb-1">Student's Answer</p>
                    <p className="text-[14px] font-medium">{answer.studentAnswer}</p>
                  </div>
                  <div className="p-3 bg-[#DCFCE7] rounded-lg">
                    <p className="text-[12px] text-[#4B5563] mb-1">Correct Answer</p>
                    <p className="text-[14px] font-medium text-[#16A34A]">{answer.correctAnswer}</p>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        </Modal>
      )}
    </div>
  );
}
