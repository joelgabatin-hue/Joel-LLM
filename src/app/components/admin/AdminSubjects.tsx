import { useState, useEffect } from 'react';
import { Link } from 'react-router';
import { Plus, Search, Copy, Users, FileQuestion, Eye } from 'lucide-react';
import Card from '../ui/Card';
import Button from '../ui/Button';
import Badge from '../ui/Badge';
import Input from '../ui/Input';
import Modal from '../ui/Modal';
import Textarea from '../ui/Textarea';
import { supabase } from '../../../lib/supabase';
import { useAuth } from '../../../hooks/useAuth';

interface SubjectRow {
  id: string;
  name: string;
  description: string;
  enrollment_code: string;
  created_by: string;
  created_at: string;
  student_count: number;
  quiz_count: number;
}

function generateCode(name: string) {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  const prefix = (name.substring(0, 3).toUpperCase().replace(/[^A-Z]/g, 'X') || 'SUB').padEnd(3, 'X');
  const random = Array.from({ length: 4 }, () => chars[Math.floor(Math.random() * chars.length)]).join('');
  return `${prefix}-${random}`;
}

export default function AdminSubjects() {
  const { user } = useAuth();
  const [subjects, setSubjects] = useState<SubjectRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [formData, setFormData] = useState({ name: '', description: '', enrollmentCode: '' });
  const [copiedCode, setCopiedCode] = useState<string | null>(null);

  useEffect(() => { fetchSubjects(); }, []);

  async function fetchSubjects() {
    setLoading(true);
    const { data, error } = await supabase
      .from('subjects')
      .select('*, subject_enrollments(count), quizzes(count)')
      .order('created_at', { ascending: false });

    if (error) {
      setError(error.message);
    } else {
      setSubjects((data || []).map((s: any) => ({
        ...s,
        student_count: s.subject_enrollments?.[0]?.count ?? 0,
        quiz_count: s.quizzes?.[0]?.count ?? 0,
      })));
    }
    setLoading(false);
  }

  async function handleCreateSubject() {
    if (!user) return;
    setSaving(true);
    setError(null);
    const { error } = await supabase.from('subjects').insert({
      name: formData.name,
      description: formData.description,
      enrollment_code: formData.enrollmentCode,
      created_by: user.id,
    });
    if (error) {
      setError(error.message);
    } else {
      setShowModal(false);
      setFormData({ name: '', description: '', enrollmentCode: '' });
      await fetchSubjects();
    }
    setSaving(false);
  }

  async function handleCopyCode(code: string) {
    try {
      await navigator.clipboard.writeText(code);
      setCopiedCode(code);
      setTimeout(() => setCopiedCode(null), 2000);
    } catch {}
  }

  const filteredSubjects = subjects.filter(s =>
    s.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    (s.description || '').toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="p-8">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-[30px] font-bold text-[#111827] mb-2">Subjects</h1>
          <p className="text-[#4B5563]">Manage your courses and subjects</p>
        </div>
        <Button variant="primary" onClick={() => {
          setFormData({ name: '', description: '', enrollmentCode: generateCode('') });
          setShowModal(true);
        }}>
          <Plus className="w-5 h-5" />
          New Subject
        </Button>
      </div>

      <div className="mb-6 max-w-md">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-[#4B5563]" />
          <Input
            placeholder="Search subjects..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>
      </div>

      {error && (
        <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-red-600 text-sm">{error}</div>
      )}

      {loading ? (
        <div className="grid grid-cols-3 gap-6">
          {[1, 2, 3].map(i => (
            <div key={i} className="h-52 bg-gray-100 rounded-xl animate-pulse" />
          ))}
        </div>
      ) : filteredSubjects.length === 0 ? (
        <div className="text-center py-20 text-[#4B5563]">
          <FileQuestion className="w-12 h-12 mx-auto mb-3 text-gray-300" />
          <p className="font-medium">No subjects yet.</p>
          <p className="text-sm mt-1">Create your first subject to get started.</p>
        </div>
      ) : (
        <div className="grid grid-cols-3 gap-6">
          {filteredSubjects.map((subject) => (
            <Card key={subject.id} className="border-t-4 border-t-[#4F46E5]">
              <h3 className="text-[18px] font-semibold text-[#111827] mb-2">{subject.name}</h3>
              <p className="text-[14px] text-[#4B5563] mb-4 line-clamp-2 min-h-[42px]">{subject.description}</p>

              <div className="flex items-center gap-2 mb-4">
                <code className="px-3 py-1.5 bg-[#F3F4F6] text-[#111827] text-[14px] font-mono font-medium rounded border border-[#D1D5DB]">
                  {subject.enrollment_code}
                </code>
                <button
                  onClick={() => handleCopyCode(subject.enrollment_code)}
                  className={`p-1.5 hover:bg-[#F3F4F6] rounded transition-colors ${copiedCode === subject.enrollment_code ? 'bg-[#DCFCE7]' : ''}`}
                  title={copiedCode === subject.enrollment_code ? 'Copied!' : 'Copy code'}
                >
                  <Copy className={`w-4 h-4 ${copiedCode === subject.enrollment_code ? 'text-[#16A34A]' : 'text-[#4B5563]'}`} />
                </button>
              </div>

              <div className="flex gap-3 mb-4">
                <Badge variant="neutral">
                  <Users className="w-3 h-3 mr-1" />
                  {subject.student_count} students
                </Badge>
                <Badge variant="neutral">
                  <FileQuestion className="w-3 h-3 mr-1" />
                  {subject.quiz_count} quizzes
                </Badge>
              </div>

              <Link to={`/admin/subjects/${subject.id}`}>
                <Button variant="primary" size="sm" className="w-full">
                  <Eye className="w-4 h-4" />
                  View
                </Button>
              </Link>
            </Card>
          ))}
        </div>
      )}

      <Modal isOpen={showModal} onClose={() => setShowModal(false)} title="Create New Subject">
        <div className="space-y-4">
          <Input
            label="Subject Name"
            placeholder="e.g., Mathematics 101"
            value={formData.name}
            onChange={(e) => {
              const name = e.target.value;
              setFormData(f => ({ ...f, name, enrollmentCode: generateCode(name) }));
            }}
          />
          <Textarea
            label="Description"
            placeholder="Brief description of the subject..."
            rows={3}
            value={formData.description}
            onChange={(e) => setFormData(f => ({ ...f, description: e.target.value }))}
          />
          <div>
            <label className="block text-[14px] font-medium text-[#111827] mb-1.5">Enrollment Code</label>
            <div className="flex gap-2">
              <code className="flex-1 px-3 py-2 bg-[#F3F4F6] text-[#111827] text-[14px] font-mono font-medium rounded border border-[#D1D5DB]">
                {formData.enrollmentCode}
              </code>
              <Button
                variant="secondary"
                onClick={() => setFormData(f => ({ ...f, enrollmentCode: generateCode(f.name) }))}
              >
                Regenerate
              </Button>
            </div>
          </div>
          {error && <p className="text-sm text-red-600">{error}</p>}
          <div className="flex gap-3 pt-2">
            <Button variant="ghost" onClick={() => setShowModal(false)} className="flex-1">
              Cancel
            </Button>
            <Button
              variant="primary"
              onClick={handleCreateSubject}
              disabled={!formData.name || !formData.description || saving}
              className="flex-1"
            >
              {saving ? 'Creating...' : 'Create Subject'}
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
