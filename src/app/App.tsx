import { BrowserRouter, Routes, Route, Navigate } from 'react-router';
import { useState } from 'react';
import Login from './components/Login';
import AdminDashboard from './components/admin/AdminDashboard';
import AdminSubjects from './components/admin/AdminSubjects';
import AdminSubjectDetail from './components/admin/AdminSubjectDetail';
import AdminQuizBuilder from './components/admin/AdminQuizBuilder';
import AdminQuizResults from './components/admin/AdminQuizResults';
import StudentDashboard from './components/student/StudentDashboard';
import StudentSubjectDetail from './components/student/StudentSubjectDetail';
import StudentQuizTaking from './components/student/StudentQuizTaking';
import StudentQuizResults from './components/student/StudentQuizResults';
import AppLayout from './components/AppLayout';

export type UserRole = 'admin' | 'student' | null;

export interface User {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  avatar?: string;
}

function App() {
  const [user, setUser] = useState<User | null>(null);

  const handleLogin = (role: UserRole, email?: string) => {
    // Extract name from email (before @)
    const emailName = email?.split('@')[0] || 'User';
    const displayName = emailName.charAt(0).toUpperCase() + emailName.slice(1).replace(/[._]/g, ' ');

    setUser({
      id: '1',
      name: displayName,
      email: email || 'user@example.com',
      role: role,
      avatar: `https://ui-avatars.com/api/?name=${displayName.replace(/\s/g, '+')}&background=4F46E5&color=fff`
    });
  };

  const handleLogout = () => {
    setUser(null);
  };

  if (!user) {
    return <Login onLogin={handleLogin} />;
  }

  return (
    <BrowserRouter>
      <Routes>
        <Route element={<AppLayout user={user} onLogout={handleLogout} />}>
          {/* Redirect based on role */}
          <Route path="/" element={<Navigate to={user.role === 'admin' ? '/admin/dashboard' : '/student/dashboard'} replace />} />

          {/* Admin Routes */}
          <Route path="/admin/dashboard" element={<AdminDashboard />} />
          <Route path="/admin/subjects" element={<AdminSubjects />} />
          <Route path="/admin/subjects/:id" element={<AdminSubjectDetail />} />
          <Route path="/admin/subjects/:id/quiz/new" element={<AdminQuizBuilder />} />
          <Route path="/admin/subjects/:subjectId/quiz/:quizId/edit" element={<AdminQuizBuilder />} />
          <Route path="/admin/subjects/:subjectId/quiz/:quizId/results" element={<AdminQuizResults />} />

          {/* Student Routes */}
          <Route path="/student/dashboard" element={<StudentDashboard />} />
          <Route path="/student/subjects/:id" element={<StudentSubjectDetail />} />
          <Route path="/student/quiz/:quizId/take" element={<StudentQuizTaking />} />
          <Route path="/student/quiz/:quizId/results" element={<StudentQuizResults />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}

export default App;
