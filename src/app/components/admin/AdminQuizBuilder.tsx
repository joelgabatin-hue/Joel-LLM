import { useState } from 'react';
import { useParams, useNavigate } from 'react-router';
import { Plus, GripVertical, Trash2, ChevronDown, ChevronUp } from 'lucide-react';
import Card from '../ui/Card';
import Button from '../ui/Button';
import Input from '../ui/Input';
import Textarea from '../ui/Textarea';
import Badge from '../ui/Badge';

type QuestionType = 'multiple-choice' | 'true-false' | 'identification' | 'enumeration' | 'matching';

interface Question {
  id: string;
  type: QuestionType;
  text: string;
  points: number;
  expanded: boolean;
  options?: string[];
  correctAnswer?: number | string | string[];
  pairs?: { left: string; right: string }[];
}

export default function AdminQuizBuilder() {
  const { id, quizId } = useParams();
  const navigate = useNavigate();
  const [quizTitle, setQuizTitle] = useState('Algebra Basics');
  const [instructions, setInstructions] = useState('Answer all questions to the best of your ability.');
  const [timeLimit, setTimeLimit] = useState(30);
  const [timeLimitEnabled, setTimeLimitEnabled] = useState(true);
  const [showCorrectAnswers, setShowCorrectAnswers] = useState(true);
  const [status, setStatus] = useState<'draft' | 'published'>('draft');

  const [questions, setQuestions] = useState<Question[]>([
    {
      id: '1',
      type: 'multiple-choice',
      text: 'What is the value of x in the equation 2x + 5 = 15?',
      points: 5,
      expanded: true,
      options: ['5', '10', '7.5', '2.5'],
      correctAnswer: 0
    },
    {
      id: '2',
      type: 'true-false',
      text: 'The square root of 144 is 12.',
      points: 3,
      expanded: false,
      correctAnswer: 'true'
    }
  ]);

  const addQuestion = (type: QuestionType) => {
    const newQuestion: Question = {
      id: String(questions.length + 1),
      type,
      text: '',
      points: 5,
      expanded: true,
      ...(type === 'multiple-choice' && { options: ['', '', '', ''], correctAnswer: 0 }),
      ...(type === 'true-false' && { correctAnswer: 'true' }),
      ...(type === 'identification' && { correctAnswer: '' }),
      ...(type === 'enumeration' && { correctAnswer: [] }),
      ...(type === 'matching' && { pairs: [{ left: '', right: '' }] })
    };
    setQuestions([...questions, newQuestion]);
  };

  const toggleQuestion = (id: string) => {
    setQuestions(questions.map(q => q.id === id ? { ...q, expanded: !q.expanded } : q));
  };

  const deleteQuestion = (id: string) => {
    setQuestions(questions.filter(q => q.id !== id));
  };

  const getQuestionTypeLabel = (type: QuestionType) => {
    const labels = {
      'multiple-choice': 'Multiple Choice',
      'true-false': 'True or False',
      'identification': 'Identification',
      'enumeration': 'Enumeration',
      'matching': 'Matching Type'
    };
    return labels[type];
  };

  const getQuestionTypeBadge = (type: QuestionType) => {
    const variants: Record<QuestionType, 'primary' | 'success' | 'warning' | 'danger' | 'neutral'> = {
      'multiple-choice': 'primary',
      'true-false': 'success',
      'identification': 'warning',
      'enumeration': 'danger',
      'matching': 'neutral'
    };
    return variants[type];
  };

  return (
    <div className="p-8 max-w-5xl mx-auto">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-[30px] font-bold text-[#111827] mb-2">
          {quizId ? 'Edit Quiz' : 'Create New Quiz'}
        </h1>
        <p className="text-[#4B5563]">Build your quiz with multiple question types</p>
      </div>

      {/* Quiz Settings */}
      <Card className="mb-6">
        <h2 className="text-[24px] font-semibold text-[#111827] mb-6">Quiz Settings</h2>
        <div className="space-y-4">
          <Input
            label="Quiz Title"
            value={quizTitle}
            onChange={(e) => setQuizTitle(e.target.value)}
            placeholder="Enter quiz title"
          />
          <Textarea
            label="Instructions / Description"
            value={instructions}
            onChange={(e) => setInstructions(e.target.value)}
            rows={3}
            placeholder="Provide instructions for students..."
          />
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="flex items-center gap-2 mb-2">
                <input
                  type="checkbox"
                  checked={timeLimitEnabled}
                  onChange={(e) => setTimeLimitEnabled(e.target.checked)}
                  className="w-4 h-4 text-[#4F46E5] rounded border-[#D1D5DB] focus:ring-2 focus:ring-[#4F46E5]"
                />
                <span className="text-[14px] font-medium text-[#111827]">Enable Time Limit</span>
              </label>
              {timeLimitEnabled && (
                <Input
                  type="number"
                  value={timeLimit}
                  onChange={(e) => setTimeLimit(Number(e.target.value))}
                  placeholder="Minutes"
                />
              )}
            </div>
            <div>
              <label className="flex items-center gap-2 mb-2">
                <input
                  type="checkbox"
                  checked={showCorrectAnswers}
                  onChange={(e) => setShowCorrectAnswers(e.target.checked)}
                  className="w-4 h-4 text-[#4F46E5] rounded border-[#D1D5DB] focus:ring-2 focus:ring-[#4F46E5]"
                />
                <span className="text-[14px] font-medium text-[#111827]">Show correct answers after submission</span>
              </label>
            </div>
          </div>
          <div>
            <label className="block text-[14px] font-medium text-[#111827] mb-2">Status</label>
            <div className="flex gap-3">
              <label className="flex items-center gap-2">
                <input
                  type="radio"
                  name="status"
                  value="draft"
                  checked={status === 'draft'}
                  onChange={(e) => setStatus('draft')}
                  className="w-4 h-4 text-[#4F46E5] border-[#D1D5DB] focus:ring-2 focus:ring-[#4F46E5]"
                />
                <span className="text-[14px] text-[#4B5563]">Draft</span>
              </label>
              <label className="flex items-center gap-2">
                <input
                  type="radio"
                  name="status"
                  value="published"
                  checked={status === 'published'}
                  onChange={(e) => setStatus('published')}
                  className="w-4 h-4 text-[#4F46E5] border-[#D1D5DB] focus:ring-2 focus:ring-[#4F46E5]"
                />
                <span className="text-[14px] text-[#4B5563]">Published</span>
              </label>
            </div>
          </div>
        </div>
      </Card>

      {/* Questions */}
      <div className="mb-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-[24px] font-semibold text-[#111827]">Questions</h2>
          <div className="flex gap-2">
            <select
              onChange={(e) => {
                if (e.target.value) {
                  addQuestion(e.target.value as QuestionType);
                  e.target.value = '';
                }
              }}
              className="px-4 py-2 bg-[#4F46E5] text-white rounded-lg text-[14px] font-medium cursor-pointer hover:bg-[#3730A3] transition-colors"
            >
              <option value="">+ Add Question</option>
              <option value="multiple-choice">Multiple Choice</option>
              <option value="true-false">True or False</option>
              <option value="identification">Identification</option>
              <option value="enumeration">Enumeration</option>
              <option value="matching">Matching Type</option>
            </select>
          </div>
        </div>

        <div className="space-y-4">
          {questions.map((question, index) => (
            <Card key={question.id} className="border-l-4 border-l-[#4F46E5]">
              {/* Question Header */}
              <div className="flex items-center gap-3 mb-3">
                <button className="cursor-grab p-1 hover:bg-[#F3F4F6] rounded">
                  <GripVertical className="w-5 h-5 text-[#4B5563]" />
                </button>
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <span className="font-semibold text-[#111827]">Question {index + 1}</span>
                    <Badge variant={getQuestionTypeBadge(question.type)}>
                      {getQuestionTypeLabel(question.type)}
                    </Badge>
                    <Badge variant="neutral">{question.points} pts</Badge>
                  </div>
                  {!question.expanded && question.text && (
                    <p className="text-[14px] text-[#4B5563] mt-1 truncate">{question.text}</p>
                  )}
                </div>
                <button
                  onClick={() => toggleQuestion(question.id)}
                  className="p-1.5 hover:bg-[#F3F4F6] rounded"
                >
                  {question.expanded ? <ChevronUp className="w-5 h-5" /> : <ChevronDown className="w-5 h-5" />}
                </button>
                <button
                  onClick={() => deleteQuestion(question.id)}
                  className="p-1.5 hover:bg-[#FEE2E2] rounded"
                >
                  <Trash2 className="w-5 h-5 text-[#DC2626]" />
                </button>
              </div>

              {/* Question Content */}
              {question.expanded && (
                <div className="space-y-4 pl-8">
                  <Textarea
                    label="Question Text"
                    value={question.text}
                    onChange={(e) => setQuestions(questions.map(q => q.id === question.id ? { ...q, text: e.target.value } : q))}
                    rows={2}
                    placeholder="Enter your question..."
                  />

                  {question.type === 'multiple-choice' && (
                    <div>
                      <label className="block text-[14px] font-medium text-[#111827] mb-2">Options</label>
                      <div className="space-y-2">
                        {question.options?.map((option, optIndex) => (
                          <div key={optIndex} className="flex items-center gap-2">
                            <input
                              type="radio"
                              name={`correct-${question.id}`}
                              checked={question.correctAnswer === optIndex}
                              onChange={() => setQuestions(questions.map(q => q.id === question.id ? { ...q, correctAnswer: optIndex } : q))}
                              className="w-4 h-4 text-[#16A34A] border-[#D1D5DB]"
                            />
                            <Input
                              placeholder={`Option ${optIndex + 1}`}
                              value={option}
                              onChange={(e) => {
                                const newOptions = [...(question.options || [])];
                                newOptions[optIndex] = e.target.value;
                                setQuestions(questions.map(q => q.id === question.id ? { ...q, options: newOptions } : q));
                              }}
                            />
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {question.type === 'true-false' && (
                    <div>
                      <label className="block text-[14px] font-medium text-[#111827] mb-2">Correct Answer</label>
                      <div className="grid grid-cols-2 gap-3">
                        <button
                          onClick={() => setQuestions(questions.map(q => q.id === question.id ? { ...q, correctAnswer: 'true' } : q))}
                          className={`px-6 py-4 rounded-lg border-2 font-medium transition-colors ${
                            question.correctAnswer === 'true'
                              ? 'border-[#16A34A] bg-[#DCFCE7] text-[#16A34A]'
                              : 'border-[#D1D5DB] bg-white text-[#4B5563] hover:border-[#4B5563]'
                          }`}
                        >
                          True
                        </button>
                        <button
                          onClick={() => setQuestions(questions.map(q => q.id === question.id ? { ...q, correctAnswer: 'false' } : q))}
                          className={`px-6 py-4 rounded-lg border-2 font-medium transition-colors ${
                            question.correctAnswer === 'false'
                              ? 'border-[#DC2626] bg-[#FEE2E2] text-[#DC2626]'
                              : 'border-[#D1D5DB] bg-white text-[#4B5563] hover:border-[#4B5563]'
                          }`}
                        >
                          False
                        </button>
                      </div>
                    </div>
                  )}

                  {question.type === 'identification' && (
                    <Input
                      label="Correct Answer"
                      value={question.correctAnswer as string || ''}
                      onChange={(e) => setQuestions(questions.map(q => q.id === question.id ? { ...q, correctAnswer: e.target.value } : q))}
                      placeholder="Enter the correct answer"
                    />
                  )}

                  <Input
                    label="Points"
                    type="number"
                    value={question.points}
                    onChange={(e) => setQuestions(questions.map(q => q.id === question.id ? { ...q, points: Number(e.target.value) } : q))}
                    className="max-w-[120px]"
                  />
                </div>
              )}
            </Card>
          ))}
        </div>
      </div>

      {/* Actions */}
      <div className="flex gap-3">
        <Button variant="ghost" onClick={() => navigate(`/admin/subjects/${id}`)}>
          Cancel
        </Button>
        <Button variant="primary" onClick={() => navigate(`/admin/subjects/${id}`)}>
          Save Quiz
        </Button>
      </div>
    </div>
  );
}
