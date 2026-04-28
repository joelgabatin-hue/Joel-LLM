import { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router';
import { Plus, GripVertical, Trash2, ChevronDown, ChevronUp, Sparkles, Upload, X, FileText, Loader2 } from 'lucide-react';
import Card from '../ui/Card';
import Button from '../ui/Button';
import Input from '../ui/Input';
import Textarea from '../ui/Textarea';
import Badge from '../ui/Badge';
import { supabase } from '../../../lib/supabase';
import { useAuth } from '../../../hooks/useAuth';

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

const DB_TYPE: Record<QuestionType, string> = {
  'multiple-choice': 'multiple_choice',
  'true-false': 'true_or_false',
  'identification': 'identification',
  'enumeration': 'enumeration',
  'matching': 'matching',
};

const FORM_TYPE: Record<string, QuestionType> = {
  multiple_choice: 'multiple-choice',
  true_or_false: 'true-false',
  identification: 'identification',
  enumeration: 'enumeration',
  matching: 'matching',
};

const TYPE_LABELS: Record<QuestionType, string> = {
  'multiple-choice': 'Multiple Choice',
  'true-false': 'True or False',
  'identification': 'Identification',
  'enumeration': 'Enumeration',
  'matching': 'Matching Type',
};

const TYPE_BADGE: Record<QuestionType, 'primary' | 'success' | 'warning' | 'danger' | 'neutral'> = {
  'multiple-choice': 'primary',
  'true-false': 'success',
  'identification': 'warning',
  'enumeration': 'danger',
  'matching': 'neutral',
};

const ALL_TYPES: QuestionType[] = ['multiple-choice', 'true-false', 'identification', 'enumeration', 'matching'];

let localId = 0;
function nextId() { return String(++localId); }

function makeQuestion(type: QuestionType): Question {
  const base = { id: nextId(), type, text: '', points: 5, expanded: true };
  switch (type) {
    case 'multiple-choice': return { ...base, options: ['', '', '', ''], correctAnswer: 0 };
    case 'true-false':      return { ...base, correctAnswer: 'true' };
    case 'identification':  return { ...base, correctAnswer: '' };
    case 'enumeration':     return { ...base, correctAnswer: [] };
    case 'matching':        return { ...base, pairs: [{ left: '', right: '' }] };
  }
}

async function extractTextFromFile(file: File): Promise<string> {
  if (file.type === 'application/pdf') {
    const pdfjsLib = await import('pdfjs-dist');
    pdfjsLib.GlobalWorkerOptions.workerSrc = new URL(
      'pdfjs-dist/build/pdf.worker.mjs',
      import.meta.url,
    ).href;
    const arrayBuffer = await file.arrayBuffer();
    const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
    const textParts: string[] = [];
    for (let i = 1; i <= pdf.numPages; i++) {
      const page = await pdf.getPage(i);
      const content = await page.getTextContent();
      const pageText = content.items.map((item: any) => item.str).join(' ');
      textParts.push(pageText);
    }
    return textParts.join('\n');
  }
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => resolve(e.target?.result as string ?? '');
    reader.onerror = reject;
    reader.readAsText(file);
  });
}

export default function AdminQuizBuilder() {
  const { id, quizId } = useParams<{ id: string; quizId: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();

  const [quizTitle, setQuizTitle] = useState('');
  const [instructions, setInstructions] = useState('');
  const [timeLimit, setTimeLimit] = useState(30);
  const [timeLimitEnabled, setTimeLimitEnabled] = useState(false);
  const [showCorrectAnswers, setShowCorrectAnswers] = useState(true);
  const [status, setStatus] = useState<'draft' | 'published'>('draft');
  const [questions, setQuestions] = useState<Question[]>([]);
  const [loading, setLoading] = useState(!!quizId);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [addType, setAddType] = useState('');

  // AI generation state
  const [showAiPanel, setShowAiPanel] = useState(false);
  const [aiFile, setAiFile] = useState<File | null>(null);
  const [aiFileContent, setAiFileContent] = useState('');
  const [aiExtracting, setAiExtracting] = useState(false);
  const [aiCounts, setAiCounts] = useState<Record<QuestionType, number>>({
    'multiple-choice': 0,
    'true-false': 0,
    'identification': 0,
    'enumeration': 0,
    'matching': 0,
  });
  const [aiPointsPerQ, setAiPointsPerQ] = useState(5);
  const [aiGenerating, setAiGenerating] = useState(false);
  const [aiError, setAiError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (quizId) loadQuiz();
  }, [quizId]);

  async function loadQuiz() {
    setLoading(true);
    const { data, error } = await supabase
      .from('quizzes')
      .select('*, questions(*, question_options(*))')
      .eq('id', quizId)
      .single();

    if (error || !data) { setError('Failed to load quiz.'); setLoading(false); return; }

    setQuizTitle(data.title);
    setInstructions(data.instructions || '');
    setTimeLimit(data.time_limit_minutes || 30);
    setTimeLimitEnabled(!!data.time_limit_minutes);
    setShowCorrectAnswers(data.show_answers_after);
    setStatus(data.status);

    const sorted = [...(data.questions || [])].sort((a: any, b: any) => a.sort_order - b.sort_order);
    setQuestions(sorted.map((q: any) => mapDbQuestion(q)));
    setLoading(false);
  }

  function mapDbQuestion(q: any): Question {
    const type = FORM_TYPE[q.type] || 'multiple-choice';
    const base = { id: nextId(), type, text: q.question_text, points: Number(q.points), expanded: false };
    const opts = [...(q.question_options || [])];

    switch (type) {
      case 'multiple-choice': {
        const sorted = opts.sort((a: any, b: any) => a.sort_order - b.sort_order);
        return { ...base, options: sorted.map((o: any) => o.option_text), correctAnswer: sorted.findIndex((o: any) => o.is_correct) };
      }
      case 'true-false':
        return { ...base, correctAnswer: q.correct_boolean ? 'true' : 'false' };
      case 'identification': {
        const correct = opts.find((o: any) => o.is_correct);
        return { ...base, correctAnswer: correct?.option_text || '' };
      }
      case 'enumeration': {
        const sorted = opts.sort((a: any, b: any) => a.sort_order - b.sort_order);
        return { ...base, correctAnswer: sorted.map((o: any) => o.option_text) };
      }
      case 'matching': {
        const lefts = opts.filter((o: any) => o.side === 'left');
        const rights = opts.filter((o: any) => o.side === 'right');
        const pairs = lefts.map((l: any) => {
          const r = rights.find((r: any) => r.id === l.match_id);
          return { left: l.option_text, right: r?.option_text || '' };
        });
        return { ...base, pairs };
      }
    }
  }

  function updateQuestion(id: string, patch: Partial<Question>) {
    setQuestions(prev => prev.map(q => q.id === id ? { ...q, ...patch } : q));
  }

  async function handleAiFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setAiFile(file);
    setAiError(null);
    setAiExtracting(true);
    try {
      const text = await extractTextFromFile(file);
      setAiFileContent(text);
    } catch {
      setAiError('Failed to read file. Try a different format.');
      setAiFile(null);
    } finally {
      setAiExtracting(false);
    }
  }

  function clearAiFile() {
    setAiFile(null);
    setAiFileContent('');
    if (fileInputRef.current) fileInputRef.current.value = '';
  }

  async function handleGenerateWithAI() {
    if (!aiFileContent.trim()) {
      setAiError('Please upload a file first.');
      return;
    }
    const totalQuestions = Object.values(aiCounts).reduce((a, b) => a + b, 0);
    if (totalQuestions === 0) {
      setAiError('Set at least one question type count above zero.');
      return;
    }

    setAiGenerating(true);
    setAiError(null);

    try {
      const { data, error } = await supabase.functions.invoke('generate-quiz', {
        body: {
          content: aiFileContent,
          counts: aiCounts,
          pointsPerQ: aiPointsPerQ,
        },
      });

      if (error) throw new Error(error.message || 'Edge function error.');
      if (data?.error) throw new Error(data.error);

      const parsed = data as { questions: any[] };
      if (!Array.isArray(parsed.questions) || parsed.questions.length === 0) {
        throw new Error('No questions returned. Try again.');
      }

      const newQuestions: Question[] = parsed.questions.map((q: any) => {
        const base = makeQuestion(q.type as QuestionType);
        base.text = q.text ?? '';
        base.points = aiPointsPerQ;

        if (q.type === 'multiple-choice') {
          base.options = Array.isArray(q.options) ? q.options : ['', '', '', ''];
          base.correctAnswer = typeof q.correctAnswer === 'number' ? q.correctAnswer : 0;
        } else if (q.type === 'true-false') {
          base.correctAnswer = q.correctAnswer === 'false' ? 'false' : 'true';
        } else if (q.type === 'identification') {
          base.correctAnswer = q.correctAnswer ?? '';
        } else if (q.type === 'enumeration') {
          base.correctAnswer = Array.isArray(q.correctAnswer) ? q.correctAnswer : [];
        } else if (q.type === 'matching') {
          base.pairs = Array.isArray(q.pairs) ? q.pairs : [{ left: '', right: '' }];
        }

        return base;
      });

      setQuestions(prev => [...prev, ...newQuestions]);
      setShowAiPanel(false);
      setAiFile(null);
      setAiFileContent('');
      setAiCounts({ 'multiple-choice': 0, 'true-false': 0, 'identification': 0, 'enumeration': 0, 'matching': 0 });
      if (fileInputRef.current) fileInputRef.current.value = '';
    } catch (err: any) {
      setAiError(err.message || 'Failed to generate questions. Please try again.');
    } finally {
      setAiGenerating(false);
    }
  }

  async function handleSave() {
    if (!quizTitle.trim()) { setError('Quiz title is required.'); return; }
    if (!user) return;
    setSaving(true);
    setError(null);

    try {
      const quizRecord = {
        subject_id: id,
        title: quizTitle.trim(),
        instructions: instructions.trim() || null,
        time_limit_minutes: timeLimitEnabled ? timeLimit : null,
        show_answers_after: showCorrectAnswers,
        status,
        created_by: user.id,
      };

      let savedQuizId = quizId;

      if (quizId) {
        const { error } = await supabase.from('quizzes').update(quizRecord).eq('id', quizId);
        if (error) throw error;
        const { error: delError } = await supabase.from('questions').delete().eq('quiz_id', quizId);
        if (delError) throw delError;
      } else {
        const { data, error } = await supabase.from('quizzes').insert(quizRecord).select('id').single();
        if (error) throw error;
        savedQuizId = data.id;
      }

      for (let i = 0; i < questions.length; i++) {
        const q = questions[i];
        const qRecord: any = {
          quiz_id: savedQuizId,
          type: DB_TYPE[q.type],
          question_text: q.text,
          points: q.points,
          sort_order: i,
          correct_boolean: q.type === 'true-false' ? q.correctAnswer === 'true' : null,
          case_sensitive: false,
          order_matters: false,
          partial_credit: true,
        };

        const { data: savedQ, error: qErr } = await supabase
          .from('questions')
          .insert(qRecord)
          .select('id')
          .single();
        if (qErr) throw qErr;

        await insertOptions(savedQ.id, q);
      }

      navigate(`/admin/subjects/${id}`);
    } catch (err: any) {
      setError(err.message || 'Failed to save quiz.');
    } finally {
      setSaving(false);
    }
  }

  async function insertOptions(qId: string, q: Question) {
    if (q.type === 'multiple-choice' && q.options) {
      const rows = q.options.map((text, idx) => ({
        question_id: qId,
        option_text: text,
        is_correct: idx === q.correctAnswer,
        sort_order: idx,
      }));
      const { error } = await supabase.from('question_options').insert(rows);
      if (error) throw error;
    }

    if (q.type === 'identification' && q.correctAnswer) {
      const { error } = await supabase.from('question_options').insert({
        question_id: qId,
        option_text: q.correctAnswer as string,
        is_correct: true,
        sort_order: 0,
      });
      if (error) throw error;
    }

    if (q.type === 'enumeration' && Array.isArray(q.correctAnswer) && q.correctAnswer.length > 0) {
      const rows = (q.correctAnswer as string[]).map((text, idx) => ({
        question_id: qId,
        option_text: text,
        is_correct: true,
        sort_order: idx,
      }));
      const { error } = await supabase.from('question_options').insert(rows);
      if (error) throw error;
    }

    if (q.type === 'matching' && q.pairs) {
      for (const pair of q.pairs) {
        if (!pair.left || !pair.right) continue;
        const { data: right, error: rErr } = await supabase
          .from('question_options')
          .insert({ question_id: qId, option_text: pair.right, is_correct: true, sort_order: 0, side: 'right' })
          .select('id')
          .single();
        if (rErr) throw rErr;
        const { error: lErr } = await supabase.from('question_options').insert({
          question_id: qId,
          option_text: pair.left,
          is_correct: true,
          sort_order: 0,
          side: 'left',
          match_id: right.id,
        });
        if (lErr) throw lErr;
      }
    }
  }

  if (loading) {
    return (
      <div className="p-8 max-w-5xl mx-auto">
        <div className="h-8 w-48 bg-gray-100 rounded animate-pulse mb-6" />
        <div className="h-64 bg-gray-100 rounded-xl animate-pulse" />
      </div>
    );
  }

  const aiTotalQuestions = Object.values(aiCounts).reduce((a, b) => a + b, 0);

  return (
    <div className="p-8 max-w-5xl mx-auto">
      <div className="mb-8">
        <h1 className="text-[30px] font-bold text-[#111827] mb-2">
          {quizId ? 'Edit Quiz' : 'Create New Quiz'}
        </h1>
        <p className="text-[#4B5563]">Build your quiz with multiple question types</p>
      </div>

      {error && (
        <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-red-600 text-sm">{error}</div>
      )}

      {/* Quiz Settings */}
      <Card className="mb-6">
        <h2 className="text-[20px] font-semibold text-[#111827] mb-6">Quiz Settings</h2>
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
                  min={1}
                  onChange={(e) => setTimeLimit(Number(e.target.value))}
                  placeholder="Minutes"
                />
              )}
            </div>
            <div className="flex items-start pt-1">
              <label className="flex items-center gap-2">
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
            <div className="flex gap-4">
              {(['draft', 'published'] as const).map(s => (
                <label key={s} className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="radio"
                    name="status"
                    value={s}
                    checked={status === s}
                    onChange={() => setStatus(s)}
                    className="w-4 h-4 text-[#4F46E5] border-[#D1D5DB] focus:ring-2 focus:ring-[#4F46E5]"
                  />
                  <span className="text-[14px] text-[#4B5563] capitalize">{s}</span>
                </label>
              ))}
            </div>
          </div>
        </div>
      </Card>

      {/* AI Quiz Generator */}
      <Card className="mb-6 border border-[#E0E7FF] bg-gradient-to-br from-[#F5F3FF] to-white">
        <button
          onClick={() => setShowAiPanel(v => !v)}
          className="w-full flex items-center justify-between"
        >
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg bg-[#4F46E5] flex items-center justify-center shrink-0">
              <Sparkles className="w-5 h-5 text-white" />
            </div>
            <div className="text-left">
              <p className="text-[15px] font-semibold text-[#111827]">Generate Questions with AI</p>
              <p className="text-[13px] text-[#6B7280]">Upload a file and let ChatGPT create your quiz questions</p>
            </div>
          </div>
          {showAiPanel ? <ChevronUp className="w-5 h-5 text-[#6B7280]" /> : <ChevronDown className="w-5 h-5 text-[#6B7280]" />}
        </button>

        {showAiPanel && (
          <div className="mt-6 space-y-6">
            {/* File Upload */}
            <div>
              <label className="block text-[14px] font-medium text-[#111827] mb-2">
                Upload Source File
                <span className="ml-2 text-[12px] font-normal text-[#6B7280]">PDF, TXT, MD, CSV</span>
              </label>

              {!aiFile ? (
                <label className="flex flex-col items-center justify-center w-full h-32 border-2 border-dashed border-[#C4B5FD] rounded-xl bg-white cursor-pointer hover:bg-[#F5F3FF] transition-colors">
                  <Upload className="w-7 h-7 text-[#7C3AED] mb-2" />
                  <span className="text-[14px] text-[#4B5563]">Click to upload or drag and drop</span>
                  <span className="text-[12px] text-[#9CA3AF] mt-1">PDF, TXT, MD, CSV supported</span>
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept=".pdf,.txt,.md,.csv,.html,.htm"
                    className="hidden"
                    onChange={handleAiFileChange}
                  />
                </label>
              ) : (
                <div className="flex items-center gap-3 p-3 bg-white border border-[#C4B5FD] rounded-xl">
                  {aiExtracting ? (
                    <Loader2 className="w-5 h-5 text-[#7C3AED] animate-spin shrink-0" />
                  ) : (
                    <FileText className="w-5 h-5 text-[#7C3AED] shrink-0" />
                  )}
                  <div className="flex-1 min-w-0">
                    <p className="text-[14px] font-medium text-[#111827] truncate">{aiFile.name}</p>
                    <p className="text-[12px] text-[#6B7280]">
                      {aiExtracting
                        ? 'Extracting text...'
                        : `${aiFileContent.length.toLocaleString()} characters extracted`}
                    </p>
                  </div>
                  <button
                    onClick={clearAiFile}
                    className="p-1.5 hover:bg-[#FEE2E2] rounded-lg transition-colors"
                  >
                    <X className="w-4 h-4 text-[#DC2626]" />
                  </button>
                </div>
              )}
            </div>

            {/* Question Type Counts */}
            <div>
              <label className="block text-[14px] font-medium text-[#111827] mb-3">
                Question Breakdown
                <span className="ml-2 text-[12px] font-normal text-[#6B7280]">Set how many of each type to generate</span>
              </label>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                {ALL_TYPES.map(type => (
                  <div key={type} className="flex items-center gap-3 p-3 bg-white border border-[#E5E7EB] rounded-xl">
                    <Badge variant={TYPE_BADGE[type]} className="shrink-0 text-[11px]">
                      {TYPE_LABELS[type]}
                    </Badge>
                    <input
                      type="number"
                      min={0}
                      max={50}
                      value={aiCounts[type]}
                      onChange={(e) => setAiCounts(prev => ({ ...prev, [type]: Math.max(0, Number(e.target.value)) }))}
                      className="w-16 text-center border border-[#D1D5DB] rounded-lg px-2 py-1.5 text-[14px] font-semibold text-[#111827] focus:outline-none focus:ring-2 focus:ring-[#4F46E5] ml-auto"
                    />
                  </div>
                ))}
              </div>
              {aiTotalQuestions > 0 && (
                <p className="mt-2 text-[13px] text-[#4F46E5] font-medium">
                  {aiTotalQuestions} question{aiTotalQuestions !== 1 ? 's' : ''} will be generated
                </p>
              )}
            </div>

            {/* Points per question */}
            <div className="flex items-center gap-4">
              <label className="text-[14px] font-medium text-[#111827] shrink-0">Points per question</label>
              <input
                type="number"
                min={1}
                max={100}
                value={aiPointsPerQ}
                onChange={(e) => setAiPointsPerQ(Math.max(1, Number(e.target.value)))}
                className="w-20 text-center border border-[#D1D5DB] rounded-lg px-2 py-1.5 text-[14px] font-semibold text-[#111827] focus:outline-none focus:ring-2 focus:ring-[#4F46E5]"
              />
            </div>

            {aiError && (
              <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-red-600 text-sm">{aiError}</div>
            )}

            <div className="flex gap-3 pt-2 border-t border-[#E5E7EB]">
              <Button
                variant="primary"
                onClick={handleGenerateWithAI}
                disabled={aiGenerating || aiExtracting || !aiFileContent || aiTotalQuestions === 0}
              >
                {aiGenerating ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Generating...
                  </>
                ) : (
                  <>
                    <Sparkles className="w-4 h-4" />
                    Generate {aiTotalQuestions > 0 ? `${aiTotalQuestions} ` : ''}Questions
                  </>
                )}
              </Button>
              <Button variant="ghost" onClick={() => setShowAiPanel(false)} disabled={aiGenerating}>
                Cancel
              </Button>
            </div>
          </div>
        )}
      </Card>

      {/* Questions */}
      <div className="mb-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-[20px] font-semibold text-[#111827]">
            Questions <span className="text-[#4B5563] font-normal text-[16px]">({questions.length})</span>
          </h2>
          <select
            value={addType}
            onChange={(e) => {
              const type = e.target.value;
              if (type) {
                setQuestions(prev => [...prev, makeQuestion(type as QuestionType)]);
                setAddType('');
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

        {questions.length === 0 && (
          <div className="text-center py-12 border-2 border-dashed border-[#D1D5DB] rounded-xl text-[#4B5563]">
            <p className="font-medium">No questions yet.</p>
            <p className="text-sm mt-1">Use the AI generator above or add questions manually.</p>
          </div>
        )}

        <div className="space-y-4">
          {questions.map((question, index) => (
            <Card key={question.id} className="border-l-4 border-l-[#4F46E5]">
              {/* Question Header */}
              <div className="flex items-center gap-3 mb-3">
                <button className="cursor-grab p-1 hover:bg-[#F3F4F6] rounded">
                  <GripVertical className="w-5 h-5 text-[#9CA3AF]" />
                </button>
                <div className="flex-1">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-semibold text-[#111827]">Question {index + 1}</span>
                    <Badge variant={TYPE_BADGE[question.type]}>{TYPE_LABELS[question.type]}</Badge>
                    <Badge variant="neutral">{question.points} pts</Badge>
                  </div>
                  {!question.expanded && question.text && (
                    <p className="text-[14px] text-[#4B5563] mt-1 truncate">{question.text}</p>
                  )}
                </div>
                <button
                  onClick={() => updateQuestion(question.id, { expanded: !question.expanded })}
                  className="p-1.5 hover:bg-[#F3F4F6] rounded"
                >
                  {question.expanded ? <ChevronUp className="w-5 h-5" /> : <ChevronDown className="w-5 h-5" />}
                </button>
                <button
                  onClick={() => setQuestions(prev => prev.filter(q => q.id !== question.id))}
                  className="p-1.5 hover:bg-[#FEE2E2] rounded"
                >
                  <Trash2 className="w-5 h-5 text-[#DC2626]" />
                </button>
              </div>

              {/* Question Body */}
              {question.expanded && (
                <div className="space-y-4 pl-8">
                  <Textarea
                    label="Question Text"
                    value={question.text}
                    onChange={(e) => updateQuestion(question.id, { text: e.target.value })}
                    rows={2}
                    placeholder="Enter your question..."
                  />

                  {/* Multiple Choice */}
                  {question.type === 'multiple-choice' && (
                    <div>
                      <label className="block text-[14px] font-medium text-[#111827] mb-2">
                        Options <span className="text-[#4B5563] font-normal">(select the correct answer)</span>
                      </label>
                      <div className="space-y-2">
                        {(question.options || []).map((option, optIdx) => (
                          <div key={optIdx} className="flex items-center gap-2">
                            <input
                              type="radio"
                              name={`correct-${question.id}`}
                              checked={question.correctAnswer === optIdx}
                              onChange={() => updateQuestion(question.id, { correctAnswer: optIdx })}
                              className="w-4 h-4 text-[#16A34A] border-[#D1D5DB]"
                            />
                            <Input
                              placeholder={`Option ${optIdx + 1}`}
                              value={option}
                              onChange={(e) => {
                                const opts = [...(question.options || [])];
                                opts[optIdx] = e.target.value;
                                updateQuestion(question.id, { options: opts });
                              }}
                            />
                            {(question.options || []).length > 2 && (
                              <button
                                onClick={() => {
                                  const opts = (question.options || []).filter((_, i) => i !== optIdx);
                                  const correct = question.correctAnswer === optIdx ? 0
                                    : (question.correctAnswer as number) > optIdx
                                      ? (question.correctAnswer as number) - 1
                                      : question.correctAnswer;
                                  updateQuestion(question.id, { options: opts, correctAnswer: correct });
                                }}
                                className="p-1 hover:bg-[#FEE2E2] rounded"
                              >
                                <Trash2 className="w-4 h-4 text-[#DC2626]" />
                              </button>
                            )}
                          </div>
                        ))}
                        <Button
                          variant="secondary"
                          size="sm"
                          onClick={() => updateQuestion(question.id, { options: [...(question.options || []), ''] })}
                        >
                          <Plus className="w-4 h-4" /> Add Option
                        </Button>
                      </div>
                    </div>
                  )}

                  {/* True / False */}
                  {question.type === 'true-false' && (
                    <div>
                      <label className="block text-[14px] font-medium text-[#111827] mb-2">Correct Answer</label>
                      <div className="grid grid-cols-2 gap-3">
                        {['true', 'false'].map(val => (
                          <button
                            key={val}
                            onClick={() => updateQuestion(question.id, { correctAnswer: val })}
                            className={`px-6 py-4 rounded-lg border-2 font-medium capitalize transition-colors ${
                              question.correctAnswer === val
                                ? val === 'true'
                                  ? 'border-[#16A34A] bg-[#DCFCE7] text-[#16A34A]'
                                  : 'border-[#DC2626] bg-[#FEE2E2] text-[#DC2626]'
                                : 'border-[#D1D5DB] bg-white text-[#4B5563] hover:border-[#4B5563]'
                            }`}
                          >
                            {val}
                          </button>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Identification */}
                  {question.type === 'identification' && (
                    <Input
                      label="Correct Answer"
                      value={question.correctAnswer as string || ''}
                      onChange={(e) => updateQuestion(question.id, { correctAnswer: e.target.value })}
                      placeholder="Enter the correct answer"
                    />
                  )}

                  {/* Enumeration */}
                  {question.type === 'enumeration' && (
                    <div>
                      <label className="block text-[14px] font-medium text-[#111827] mb-2">
                        Accepted Answers <span className="text-[#4B5563] font-normal">(one per line)</span>
                      </label>
                      <div className="space-y-2">
                        {((question.correctAnswer as string[]) || []).map((ans, idx) => (
                          <div key={idx} className="flex gap-2 items-center">
                            <span className="text-[13px] text-[#4B5563] w-6 shrink-0">{idx + 1}.</span>
                            <Input
                              placeholder={`Answer ${idx + 1}`}
                              value={ans}
                              onChange={(e) => {
                                const arr = [...((question.correctAnswer as string[]) || [])];
                                arr[idx] = e.target.value;
                                updateQuestion(question.id, { correctAnswer: arr });
                              }}
                            />
                            <button
                              onClick={() => {
                                const arr = ((question.correctAnswer as string[]) || []).filter((_, i) => i !== idx);
                                updateQuestion(question.id, { correctAnswer: arr });
                              }}
                              className="p-1 hover:bg-[#FEE2E2] rounded"
                            >
                              <Trash2 className="w-4 h-4 text-[#DC2626]" />
                            </button>
                          </div>
                        ))}
                        <Button
                          variant="secondary"
                          size="sm"
                          onClick={() => updateQuestion(question.id, {
                            correctAnswer: [...((question.correctAnswer as string[]) || []), ''],
                          })}
                        >
                          <Plus className="w-4 h-4" /> Add Answer
                        </Button>
                      </div>
                    </div>
                  )}

                  {/* Matching */}
                  {question.type === 'matching' && (
                    <div>
                      <label className="block text-[14px] font-medium text-[#111827] mb-2">Matching Pairs</label>
                      <div className="grid grid-cols-2 gap-2 mb-2 px-1">
                        <span className="text-[12px] font-semibold text-[#4B5563] uppercase">Left Column</span>
                        <span className="text-[12px] font-semibold text-[#4B5563] uppercase">Right Column (Match)</span>
                      </div>
                      <div className="space-y-2">
                        {(question.pairs || []).map((pair, idx) => (
                          <div key={idx} className="grid grid-cols-2 gap-2 items-center">
                            <Input
                              placeholder="Left item"
                              value={pair.left}
                              onChange={(e) => {
                                const pairs = [...(question.pairs || [])];
                                pairs[idx] = { ...pairs[idx], left: e.target.value };
                                updateQuestion(question.id, { pairs });
                              }}
                            />
                            <div className="flex gap-2">
                              <Input
                                placeholder="Right item (answer)"
                                value={pair.right}
                                onChange={(e) => {
                                  const pairs = [...(question.pairs || [])];
                                  pairs[idx] = { ...pairs[idx], right: e.target.value };
                                  updateQuestion(question.id, { pairs });
                                }}
                              />
                              {(question.pairs || []).length > 1 && (
                                <button
                                  onClick={() => {
                                    const pairs = (question.pairs || []).filter((_, i) => i !== idx);
                                    updateQuestion(question.id, { pairs });
                                  }}
                                  className="p-1 hover:bg-[#FEE2E2] rounded shrink-0"
                                >
                                  <Trash2 className="w-4 h-4 text-[#DC2626]" />
                                </button>
                              )}
                            </div>
                          </div>
                        ))}
                        <Button
                          variant="secondary"
                          size="sm"
                          onClick={() => updateQuestion(question.id, {
                            pairs: [...(question.pairs || []), { left: '', right: '' }],
                          })}
                        >
                          <Plus className="w-4 h-4" /> Add Pair
                        </Button>
                      </div>
                    </div>
                  )}

                  <div className="pt-2 border-t border-[#F3F4F6]">
                    <Input
                      label="Points"
                      type="number"
                      min={1}
                      value={question.points}
                      onChange={(e) => updateQuestion(question.id, { points: Number(e.target.value) })}
                      className="max-w-[120px]"
                    />
                  </div>
                </div>
              )}
            </Card>
          ))}
        </div>
      </div>

      {/* Footer Actions */}
      <div className="flex gap-3 pt-4 border-t border-[#E5E7EB]">
        <Button variant="ghost" onClick={() => navigate(`/admin/subjects/${id}`)}>
          Cancel
        </Button>
        <Button variant="primary" onClick={handleSave} disabled={saving}>
          {saving ? 'Saving...' : quizId ? 'Save Changes' : 'Create Quiz'}
        </Button>
      </div>
    </div>
  );
}
