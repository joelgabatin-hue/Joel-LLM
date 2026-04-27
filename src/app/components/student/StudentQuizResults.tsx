import { useParams, Link } from 'react-router';
import { ArrowLeft } from 'lucide-react';
import Card from '../ui/Card';
import Button from '../ui/Button';
import Badge from '../ui/Badge';

export default function StudentQuizResults() {
  const { quizId } = useParams();

  const result = {
    quiz: 'Algebra Basics',
    subject: 'Mathematics 101',
    subjectId: '1',
    score: 85,
    totalPoints: 100,
    percentage: 85,
    timeTaken: '28 min',
    showAnswers: true
  };

  const answers = [
    {
      id: '1',
      question: 'What is the value of x in the equation 2x + 5 = 15?',
      type: 'Multiple Choice',
      studentAnswer: '5',
      correctAnswer: '5',
      points: 5,
      totalPoints: 5,
      correct: true
    },
    {
      id: '2',
      question: 'The square root of 144 is 12.',
      type: 'True or False',
      studentAnswer: 'True',
      correctAnswer: 'True',
      points: 3,
      totalPoints: 3,
      correct: true
    },
    {
      id: '3',
      question: 'What is the name of the mathematical constant approximately equal to 3.14159?',
      type: 'Identification',
      studentAnswer: 'Pi',
      correctAnswer: 'Pi',
      points: 5,
      totalPoints: 5,
      correct: true
    },
    {
      id: '4',
      question: 'Which of the following is a prime number?',
      type: 'Multiple Choice',
      studentAnswer: '15',
      correctAnswer: '17',
      points: 0,
      totalPoints: 5,
      correct: false
    },
  ];

  const getPercentageColor = (percentage: number) => {
    if (percentage >= 75) return 'text-[#16A34A]';
    if (percentage >= 50) return 'text-[#D97706]';
    return 'text-[#DC2626]';
  };

  const getPercentageBg = (percentage: number) => {
    if (percentage >= 75) return 'bg-[#16A34A]';
    if (percentage >= 50) return 'bg-[#D97706]';
    return 'bg-[#DC2626]';
  };

  return (
    <div className="p-8">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-[30px] font-bold text-[#111827] mb-2">{result.quiz}</h1>
        <p className="text-[#4B5563] mb-4">{result.subject}</p>
      </div>

      {/* Score Card */}
      <Card className="mb-8 max-w-2xl">
        <div className="flex items-center gap-8">
          {/* Score Circle */}
          <div className="relative w-32 h-32">
            <svg className="w-32 h-32 transform -rotate-90">
              <circle
                cx="64"
                cy="64"
                r="56"
                stroke="#D1D5DB"
                strokeWidth="8"
                fill="none"
              />
              <circle
                cx="64"
                cy="64"
                r="56"
                stroke={result.percentage >= 75 ? '#16A34A' : result.percentage >= 50 ? '#D97706' : '#DC2626'}
                strokeWidth="8"
                fill="none"
                strokeDasharray={`${(result.percentage / 100) * 352} 352`}
                strokeLinecap="round"
              />
            </svg>
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="text-center">
                <p className={`text-[30px] font-bold ${getPercentageColor(result.percentage)}`}>
                  {result.score}
                </p>
                <p className="text-[12px] text-[#4B5563]">/ {result.totalPoints}</p>
              </div>
            </div>
          </div>

          {/* Details */}
          <div className="flex-1">
            <div className="flex items-center gap-3 mb-4">
              <Badge
                variant={result.percentage >= 75 ? 'success' : result.percentage >= 50 ? 'warning' : 'danger'}
              >
                {result.percentage}%
              </Badge>
              <span className="text-[14px] text-[#4B5563]">Time taken: {result.timeTaken}</span>
            </div>
            <div className="grid grid-cols-3 gap-4">
              <div>
                <p className="text-[12px] text-[#4B5563] mb-1">Total Questions</p>
                <p className="text-[20px] font-semibold text-[#111827]">{answers.length}</p>
              </div>
              <div>
                <p className="text-[12px] text-[#4B5563] mb-1">Correct</p>
                <p className="text-[20px] font-semibold text-[#16A34A]">
                  {answers.filter(a => a.correct).length}
                </p>
              </div>
              <div>
                <p className="text-[12px] text-[#4B5563] mb-1">Incorrect</p>
                <p className="text-[20px] font-semibold text-[#DC2626]">
                  {answers.filter(a => !a.correct).length}
                </p>
              </div>
            </div>
          </div>
        </div>
      </Card>

      {/* Answer Review */}
      {result.showAnswers ? (
        <div>
          <h2 className="text-[24px] font-semibold text-[#111827] mb-4">Answer Review</h2>
          <div className="space-y-4">
            {answers.map((answer, index) => (
              <Card
                key={answer.id}
                className={`border-l-4 ${answer.correct ? 'border-l-[#16A34A]' : 'border-l-[#DC2626]'}`}
              >
                <div className="flex items-start justify-between mb-3">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <Badge variant="neutral">Question {index + 1}</Badge>
                      <Badge variant="neutral">{answer.type}</Badge>
                      <Badge variant={answer.correct ? 'success' : 'danger'}>
                        {answer.points} / {answer.totalPoints} pts
                      </Badge>
                    </div>
                    <p className="text-[14px] text-[#111827] font-medium">{answer.question}</p>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4 mt-4">
                  <div className={`p-3 rounded-lg ${answer.correct ? 'bg-[#DCFCE7]' : 'bg-[#FEE2E2]'}`}>
                    <p className="text-[12px] text-[#4B5563] mb-1">Your Answer</p>
                    <p className={`text-[14px] font-medium ${answer.correct ? 'text-[#16A34A]' : 'text-[#DC2626]'}`}>
                      {answer.studentAnswer}
                    </p>
                  </div>
                  {!answer.correct && (
                    <div className="p-3 bg-[#DCFCE7] rounded-lg">
                      <p className="text-[12px] text-[#4B5563] mb-1">Correct Answer</p>
                      <p className="text-[14px] font-medium text-[#16A34A]">{answer.correctAnswer}</p>
                    </div>
                  )}
                </div>
              </Card>
            ))}
          </div>
        </div>
      ) : (
        <Card>
          <p className="text-center text-[#4B5563]">
            Answer details are not available for this quiz.
          </p>
        </Card>
      )}

      {/* Back Button */}
      <div className="mt-8">
        <Link to={`/student/subjects/${result.subjectId}`}>
          <Button variant="secondary">
            <ArrowLeft className="w-4 h-4" />
            Back to Subject
          </Button>
        </Link>
      </div>
    </div>
  );
}
