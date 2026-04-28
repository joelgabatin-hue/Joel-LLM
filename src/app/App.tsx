import { BrowserRouter, Routes, Route, Navigate } from 'react-router';
import { AuthProvider, useAuth } from '../hooks/useAuth';
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

function RootRedirect() {
  const { user, loading } = useAuth();
  if (loading) return <LoadingScreen />;
  if (!user) return <Navigate to="/login" replace />;
  return <Navigate to={user.role === 'admin' ? '/admin/dashboard' : '/student/dashboard'} replace />;
}

function AdminGuard({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth();
  if (loading) return <LoadingScreen />;
  if (!user) return <Navigate to="/login" replace />;
  if (user.role !== 'admin') return <Navigate to="/student/dashboard" replace />;
  return <>{children}</>;
}

function StudentGuard({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth();
  if (loading) return <LoadingScreen />;
  if (!user) return <Navigate to="/login" replace />;
  return <>{children}</>;
}

function LoginRoute() {
  const { user, loading } = useAuth();
  if (loading) return <LoadingScreen />;
  if (user) return <Navigate to={user.role === 'admin' ? '/admin/dashboard' : '/student/dashboard'} replace />;
  return <Login />;
}

function LoadingScreen() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-[#F3F4F6]">
      <div className="flex flex-col items-center gap-3">
        <div className="w-10 h-10 border-4 border-[#4F46E5] border-t-transparent rounded-full animate-spin" />
        <p className="text-[#4B5563] text-sm">Loading...</p>
      </div>
    </div>
  );
}

function AppRoutes() {
  const { user } = useAuth();

  return (
    <Routes>
      <Route path="/login" element={<LoginRoute />} />

      <Route path="/admin" element={
        <AdminGuard>
          <AppLayout user={user!} onLogout={async () => {}} />
        </AdminGuard>
      }>
        <Route index element={<Navigate to="dashboard" replace />} />
        <Route path="dashboard" element={<AdminDashboard />} />
        <Route path="subjects" element={<AdminSubjects />} />
        <Route path="subjects/:id" element={<AdminSubjectDetail />} />
        <Route path="subjects/:id/quiz/new" element={<AdminQuizBuilder />} />
        <Route path="subjects/:id/quiz/:quizId/edit" element={<AdminQuizBuilder />} />
        <Route path="subjects/:subjectId/quiz/:quizId/results" element={<AdminQuizResults />} />
      </Route>

      <Route path="/student" element={
        <StudentGuard>
          <AppLayout user={user!} onLogout={async () => {}} />
        </StudentGuard>
      }>
        <Route index element={<Navigate to="dashboard" replace />} />
        <Route path="dashboard" element={<StudentDashboard />} />
        <Route path="subjects/:id" element={<StudentSubjectDetail />} />
        <Route path="quiz/:quizId/take" element={<StudentQuizTaking />} />
        <Route path="quiz/:quizId/results" element={<StudentQuizResults />} />
      </Route>

      <Route path="/" element={<RootRedirect />} />
    </Routes>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <AppRoutes />
      </BrowserRouter>
    </AuthProvider>
  );
}
