import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import Card from '../ui/Card';
import Button from '../ui/Button';
import Badge from '../ui/Badge';
import Modal from '../ui/Modal';

interface Question {
  id: string;
  type: string;
  text: string;
  options?: string[];
  answer?: string;
}

export default function StudentQuizTaking() {
  const { quizId } = useParams();
  const navigate = useNavigate();
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [timeRemaining, setTimeRemaining] = useState(1800);
  const [showSubmitModal, setShowSubmitModal] = useState(false);
  const [answers, setAnswers] = useState<Record<number, string>>({});

  const quiz = {
    title: 'Algebra Basics',
    totalQuestions: 10,
    timeLimit: 30
  };

  const questions: Question[] = [
    {
      id: '1',
      type: 'multiple-choice',
      text: 'What is the value of x in the equation 2x + 5 = 15?',
      options: ['5', '10', '7.5', '2.5']
    },
    {
      id: '2',
      type: 'true-false',
      text: 'The square root of 144 is 12.',
      options: ['True', 'False']
    },
    {
      id: '3',
      type: 'identification',
      text: 'What is the name of the mathematical constant approximately equal to 3.14159?'
    },
    {
      id: '4',
      type: 'multiple-choice',
      text: 'Which of the following is a prime number?',
      options: ['15', '17', '18', '20']
    },
    {
      id: '5',
      type: 'true-false',
      text: 'In algebra, the commutative property states that a + b = b + a.',
      options: ['True', 'False']
    }
  ];

  useEffect(() => {
    const timer = setInterval(() => {
      setTimeRemaining((prev) => {
        if (prev <= 1) {
          handleSubmit();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const handleAnswer = (answer: string) => {
    setAnswers({ ...answers, [currentQuestion]: answer });
  };

  const handleSubmit = () => {
    navigate(`/student/quiz/${quizId}/results`);
  };

  const unansweredCount = questions.filter((_, i) => !answers[i]).length;
  const question = questions[currentQuestion];

  return (
    <div className="min-h-screen bg-[#F3F4F6]">
      {/* Top Bar */}
      <div className="bg-white border-b border-[#D1D5DB] px-8 py-4">
        <div className="max-w-5xl mx-auto flex items-center justify-between">
          <h1 className="text-[18px] font-semibold text-[#111827]">{quiz.title}</h1>
          <div className={`text-[18px] font-mono font-semibold ${timeRemaining < 60 ? 'text-[#DC2626]' : 'text-[#111827]'}`}>
            {formatTime(timeRemaining)}
          </div>
          <p className="text-[14px] text-[#4B5563]">
            Question {currentQuestion + 1} of {quiz.totalQuestions}
          </p>
        </div>
      </div>

      {/* Question Area */}
      <div className="p-8">
        <Card className="max-w-3xl mx-auto">
          <div className="mb-6">
            <div className="flex items-center gap-2 mb-4">
              <Badge variant="neutral">Question {currentQuestion + 1}</Badge>
              <Badge variant="primary">{question.type === 'multiple-choice' ? 'Multiple Choice' : question.type === 'true-false' ? 'True or False' : 'Identification'}</Badge>
            </div>
            <h2 className="text-[24px] font-semibold text-[#111827]">{question.text}</h2>
          </div>

          {/* Answer Input */}
          <div className="space-y-3">
            {question.type === 'multiple-choice' && question.options?.map((option, index) => (
              <button
                key={index}
                onClick={() => handleAnswer(option)}
                className={`w-full p-4 text-left rounded-lg border-2 transition-colors ${
                  answers[currentQuestion] === option
                    ? 'border-[#4F46E5] bg-[#EEF2FF]'
                    : 'border-[#D1D5DB] hover:border-[#4B5563] bg-white'
                }`}
              >
                <div className="flex items-center gap-3">
                  <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${
                    answers[currentQuestion] === option ? 'border-[#4F46E5]' : 'border-[#D1D5DB]'
                  }`}>
                    {answers[currentQuestion] === option && (
                      <div className="w-3 h-3 rounded-full bg-[#4F46E5]" />
                    )}
                  </div>
                  <span className="text-[14px] text-[#111827]">{option}</span>
                </div>
              </button>
            ))}

            {question.type === 'true-false' && (
              <div className="grid grid-cols-2 gap-4">
                {question.options?.map((option) => (
                  <button
                    key={option}
                    onClick={() => handleAnswer(option)}
                    className={`p-6 rounded-lg border-2 font-medium transition-colors ${
                      answers[currentQuestion] === option
                        ? 'border-[#4F46E5] bg-[#EEF2FF] text-[#4F46E5]'
                        : 'border-[#D1D5DB] hover:border-[#4B5563] bg-white text-[#4B5563]'
                    }`}
                  >
                    {option}
                  </button>
                ))}
              </div>
            )}

            {question.type === 'identification' && (
              <input
                type="text"
                value={answers[currentQuestion] || ''}
                onChange={(e) => handleAnswer(e.target.value)}
                placeholder="Type your answer here..."
                className="w-full px-4 py-3 text-[16px] border-2 border-[#D1D5DB] rounded-lg focus:border-[#4F46E5] focus:ring-2 focus:ring-[#4F46E5] focus:ring-opacity-20 outline-none"
              />
            )}
          </div>
        </Card>

        {/* Progress Dots */}
        <div className="max-w-3xl mx-auto mt-6 flex justify-center gap-2">
          {questions.map((_, index) => (
            <button
              key={index}
              onClick={() => setCurrentQuestion(index)}
              className={`w-3 h-3 rounded-full transition-colors ${
                answers[index]
                  ? 'bg-[#4F46E5]'
                  : index === currentQuestion
                  ? 'bg-[#D1D5DB] ring-2 ring-[#4F46E5]'
                  : 'bg-[#D1D5DB]'
              }`}
              title={`Question ${index + 1}`}
            />
          ))}
        </div>

        {/* Navigation */}
        <div className="max-w-3xl mx-auto mt-8 flex items-center justify-between">
          <Button
            variant="ghost"
            onClick={() => setCurrentQuestion(Math.max(0, currentQuestion - 1))}
            disabled={currentQuestion === 0}
          >
            <ChevronLeft className="w-5 h-5" />
            Previous
          </Button>

          {currentQuestion === questions.length - 1 ? (
            <Button variant="primary" onClick={() => setShowSubmitModal(true)}>
              Submit Quiz
            </Button>
          ) : (
            <Button variant="primary" onClick={() => setCurrentQuestion(currentQuestion + 1)}>
              Next
              <ChevronRight className="w-5 h-5" />
            </Button>
          )}
        </div>
      </div>

      {/* Submit Confirmation Modal */}
      <Modal
        isOpen={showSubmitModal}
        onClose={() => setShowSubmitModal(false)}
        title="Submit Quiz"
      >
        <div className="space-y-4">
          <p className="text-[14px] text-[#4B5563]">
            {unansweredCount > 0 ? (
              <>You have <strong className="text-[#DC2626]">{unansweredCount} unanswered question(s)</strong>. Are you sure you want to submit?</>
            ) : (
              <>You've answered all questions. Ready to submit your quiz?</>
            )}
          </p>
          <div className="flex gap-3 pt-4">
            <Button variant="ghost" onClick={() => setShowSubmitModal(false)} className="flex-1">
              Cancel
            </Button>
            <Button variant="primary" onClick={handleSubmit} className="flex-1">
              Confirm Submit
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
