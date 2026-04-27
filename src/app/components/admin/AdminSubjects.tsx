import { useState } from 'react';
import { Link } from 'react-router';
import { Plus, Search, Copy, Users, FileQuestion, Edit, Eye } from 'lucide-react';
import Card from '../ui/Card';
import Button from '../ui/Button';
import Badge from '../ui/Badge';
import Input from '../ui/Input';
import Modal from '../ui/Modal';
import Textarea from '../ui/Textarea';
import { copyToClipboard } from '../../utils/clipboard';

interface Subject {
  id: string;
  name: string;
  description: string;
  enrollmentCode: string;
  studentCount: number;
  quizCount: number;
}

export default function AdminSubjects() {
  const [searchQuery, setSearchQuery] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [formData, setFormData] = useState({ name: '', description: '', enrollmentCode: '' });
  const [copiedCode, setCopiedCode] = useState<string | null>(null);

  const [subjects, setSubjects] = useState<Subject[]>([
    {
      id: '1',
      name: 'Mathematics 101',
      description: 'Introduction to Algebra and basic mathematical concepts for beginners',
      enrollmentCode: 'MATH-4X9K',
      studentCount: 45,
      quizCount: 8
    },
    {
      id: '2',
      name: 'Physics 201',
      description: 'Advanced mechanics, thermodynamics, and electromagnetic theory',
      enrollmentCode: 'PHYS-7B2M',
      studentCount: 32,
      quizCount: 12
    },
    {
      id: '3',
      name: 'Chemistry 101',
      description: 'Basic chemistry principles including atomic structure and chemical reactions',
      enrollmentCode: 'CHEM-9P5L',
      studentCount: 38,
      quizCount: 10
    },
    {
      id: '4',
      name: 'Biology 101',
      description: 'Fundamentals of life sciences, cell biology, and genetics',
      enrollmentCode: 'BIO-3K8N',
      studentCount: 41,
      quizCount: 9
    },
  ]);

  const generateCode = () => {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    const prefix = formData.name.substring(0, 3).toUpperCase().replace(/[^A-Z]/g, 'X');
    const random = Array.from({ length: 4 }, () => chars[Math.floor(Math.random() * chars.length)]).join('');
    return `${prefix}-${random}`;
  };

  const handleCreateSubject = () => {
    const newSubject: Subject = {
      id: String(subjects.length + 1),
      name: formData.name,
      description: formData.description,
      enrollmentCode: formData.enrollmentCode || generateCode(),
      studentCount: 0,
      quizCount: 0
    };
    setSubjects([...subjects, newSubject]);
    setShowModal(false);
    setFormData({ name: '', description: '', enrollmentCode: '' });
  };

  const handleCopyCode = async (code: string) => {
    const success = await copyToClipboard(code);
    if (success) {
      setCopiedCode(code);
      setTimeout(() => setCopiedCode(null), 2000);
    }
  };

  const filteredSubjects = subjects.filter(subject =>
    subject.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    subject.description.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="p-8">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-[30px] font-bold text-[#111827] mb-2">Subjects</h1>
          <p className="text-[#4B5563]">Manage your courses and subjects</p>
        </div>
        <Button variant="primary" onClick={() => {
          setFormData({ name: '', description: '', enrollmentCode: generateCode() });
          setShowModal(true);
        }}>
          <Plus className="w-5 h-5" />
          New Subject
        </Button>
      </div>

      {/* Search */}
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

      {/* Subject Grid */}
      <div className="grid grid-cols-3 gap-6">
        {filteredSubjects.map((subject) => (
          <Card key={subject.id} className="border-t-4 border-t-[#4F46E5] relative">
            <h3 className="text-[18px] font-semibold text-[#111827] mb-2">{subject.name}</h3>
            <p className="text-[14px] text-[#4B5563] mb-4 line-clamp-2 min-h-[42px]">{subject.description}</p>

            <div className="flex items-center gap-2 mb-4">
              <code className="px-3 py-1.5 bg-[#F3F4F6] text-[#111827] text-[14px] font-mono font-medium rounded border border-[#D1D5DB]">
                {subject.enrollmentCode}
              </code>
              <button
                onClick={() => handleCopyCode(subject.enrollmentCode)}
                className={`p-1.5 hover:bg-[#F3F4F6] rounded transition-colors ${
                  copiedCode === subject.enrollmentCode ? 'bg-[#DCFCE7]' : ''
                }`}
                title={copiedCode === subject.enrollmentCode ? 'Copied!' : 'Copy code'}
              >
                <Copy className={`w-4 h-4 ${copiedCode === subject.enrollmentCode ? 'text-[#16A34A]' : 'text-[#4B5563]'}`} />
              </button>
            </div>

            <div className="flex gap-3 mb-4">
              <Badge variant="neutral">
                <Users className="w-3 h-3 mr-1" />
                {subject.studentCount} students
              </Badge>
              <Badge variant="neutral">
                <FileQuestion className="w-3 h-3 mr-1" />
                {subject.quizCount} quizzes
              </Badge>
            </div>

            <div className="flex gap-2">
              <Link to={`/admin/subjects/${subject.id}`} className="flex-1">
                <Button variant="primary" size="sm" className="w-full">
                  <Eye className="w-4 h-4" />
                  View
                </Button>
              </Link>
              <Button variant="secondary" size="sm">
                <Edit className="w-4 h-4" />
                Edit
              </Button>
            </div>
          </Card>
        ))}
      </div>

      {/* Create Subject Modal */}
      <Modal
        isOpen={showModal}
        onClose={() => setShowModal(false)}
        title="Create New Subject"
      >
        <div className="space-y-4">
          <Input
            label="Subject Name"
            placeholder="e.g., Mathematics 101"
            value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
          />
          <Textarea
            label="Description"
            placeholder="Brief description of the subject..."
            rows={3}
            value={formData.description}
            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
          />
          <div>
            <label className="block text-[14px] font-medium text-[#111827] mb-1.5">
              Enrollment Code
            </label>
            <div className="flex gap-2">
              <code className="flex-1 px-3 py-2 bg-[#F3F4F6] text-[#111827] text-[14px] font-mono font-medium rounded border border-[#D1D5DB]">
                {formData.enrollmentCode}
              </code>
              <Button
                variant="secondary"
                onClick={() => setFormData({ ...formData, enrollmentCode: generateCode() })}
              >
                Regenerate
              </Button>
            </div>
          </div>
          <div className="flex gap-3 pt-4">
            <Button variant="ghost" onClick={() => setShowModal(false)} className="flex-1">
              Cancel
            </Button>
            <Button
              variant="primary"
              onClick={handleCreateSubject}
              disabled={!formData.name || !formData.description}
              className="flex-1"
            >
              Create Subject
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
