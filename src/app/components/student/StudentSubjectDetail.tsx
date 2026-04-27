import { useParams, Link } from 'react-router';
import { Clock, FileQuestion } from 'lucide-react';
import Card from '../ui/Card';
import Button from '../ui/Button';
import Badge from '../ui/Badge';

export default function StudentSubjectDetail() {
  const { id } = useParams();

  const subject = {
    id: id,
    name: 'Mathematics 101',
    description: 'Introduction to Algebra and basic mathematical concepts for beginners'
  };

  const quizzes = [
    { id: '1', title: 'Algebra Basics', questions: 10, timeLimit: 30, status: 'available', score: null },
    { id: '2', title: 'Linear Equations', questions: 15, timeLimit: 45, status: 'completed', score: 85 },
    { id: '3', title: 'Quadratic Functions', questions: 12, timeLimit: 40, status: 'upcoming', score: null },
    { id: '4', title: 'Trigonometry', questions: 20, timeLimit: 60, status: 'completed', score: 88 },
  ];

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'available':
        return <Badge variant="success">Available</Badge>;
      case 'completed':
        return <Badge variant="neutral">Completed</Badge>;
      case 'upcoming':
        return <Badge variant="warning">Upcoming</Badge>;
      case 'closed':
        return <Badge variant="danger">Closed</Badge>;
      default:
        return null;
    }
  };

  return (
    <div className="p-8">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-[30px] font-bold text-[#111827] mb-2">{subject.name}</h1>
        <p className="text-[#4B5563]">{subject.description}</p>
      </div>

      {/* Quizzes */}
      <div>
        <h2 className="text-[24px] font-semibold text-[#111827] mb-4">Quizzes</h2>
        <div className="grid grid-cols-2 gap-6">
          {quizzes.map((quiz) => (
            <Card key={quiz.id}>
              <div className="flex items-start justify-between mb-3">
                <h3 className="text-[18px] font-semibold text-[#111827] flex-1">{quiz.title}</h3>
                {getStatusBadge(quiz.status)}
              </div>

              <div className="flex gap-4 mb-4">
                <div className="flex items-center gap-2 text-[#4B5563]">
                  <FileQuestion className="w-4 h-4" />
                  <span className="text-[14px]">{quiz.questions} questions</span>
                </div>
                <div className="flex items-center gap-2 text-[#4B5563]">
                  <Clock className="w-4 h-4" />
                  <span className="text-[14px]">{quiz.timeLimit} min</span>
                </div>
              </div>

              {quiz.score !== null && (
                <div className="mb-4">
                  <Badge variant={quiz.score >= 75 ? 'success' : quiz.score >= 50 ? 'warning' : 'danger'}>
                    Score: {quiz.score}%
                  </Badge>
                </div>
              )}

              {quiz.status === 'available' ? (
                <Link to={`/student/quiz/${quiz.id}/take`}>
                  <Button variant="primary" size="sm" className="w-full">
                    Start Quiz
                  </Button>
                </Link>
              ) : quiz.status === 'completed' ? (
                <Link to={`/student/quiz/${quiz.id}/results`}>
                  <Button variant="secondary" size="sm" className="w-full">
                    View Results
                  </Button>
                </Link>
              ) : (
                <Button variant="secondary" size="sm" className="w-full" disabled>
                  {quiz.status === 'upcoming' ? 'Coming Soon' : 'Closed'}
                </Button>
              )}
            </Card>
          ))}
        </div>
      </div>
    </div>
  );
}
