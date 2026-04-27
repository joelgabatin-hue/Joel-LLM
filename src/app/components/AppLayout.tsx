import { Outlet, Link, useLocation } from 'react-router';
import { GraduationCap, LayoutDashboard, BookOpen, Users, LogOut, Plus } from 'lucide-react';
import type { User } from '../App';

interface AppLayoutProps {
  user: User;
  onLogout: () => void;
}

export default function AppLayout({ user, onLogout }: AppLayoutProps) {
  const location = useLocation();

  const adminNavItems = [
    { path: '/admin/dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { path: '/admin/subjects', label: 'Subjects', icon: BookOpen },
  ];

  const studentNavItems = [
    { path: '/student/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  ];

  const navItems = user.role === 'admin' ? adminNavItems : studentNavItems;

  return (
    <div className="flex h-screen bg-[#F3F4F6]">
      {/* Sidebar */}
      <div className="w-60 bg-white border-r border-[#D1D5DB] flex flex-col">
        {/* Logo */}
        <div className="p-6 border-b border-[#D1D5DB]">
          <Link to="/" className="flex items-center gap-3">
            <div className="w-10 h-10 bg-[#4F46E5] rounded-full flex items-center justify-center">
              <GraduationCap className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-[18px] font-bold text-[#111827]">Joel LMS</h1>
              <p className="text-[12px] text-[#4B5563]">Learning System</p>
            </div>
          </Link>
        </div>

        {/* Navigation */}
        <nav className="flex-1 p-4 space-y-1">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = location.pathname === item.path || location.pathname.startsWith(item.path);

            return (
              <Link
                key={item.path}
                to={item.path}
                className={`flex items-center gap-3 px-4 py-2.5 rounded-lg transition-colors ${
                  isActive
                    ? 'bg-[#EEF2FF] text-[#4F46E5]'
                    : 'text-[#4B5563] hover:bg-[#F3F4F6]'
                }`}
              >
                <Icon className="w-5 h-5" />
                <span className="font-medium text-[14px]">{item.label}</span>
              </Link>
            );
          })}
        </nav>

        {/* User Profile */}
        <div className="p-4 border-t border-[#D1D5DB]">
          <div className="flex items-center gap-3 mb-3">
            <img
              src={user.avatar}
              alt={user.name}
              className="w-10 h-10 rounded-full"
            />
            <div className="flex-1 min-w-0">
              <p className="text-[14px] font-medium text-[#111827] truncate">{user.name}</p>
              <span className="inline-flex px-2 py-0.5 bg-[#EEF2FF] text-[#4F46E5] text-[10px] font-medium rounded-full">
                {user.role === 'admin' ? 'Admin' : 'Student'}
              </span>
            </div>
          </div>
          <button
            onClick={onLogout}
            className="w-full flex items-center justify-center gap-2 px-4 py-2 text-[#DC2626] hover:bg-[#FEE2E2] rounded-lg transition-colors"
          >
            <LogOut className="w-4 h-4" />
            <span className="text-[14px] font-medium">Logout</span>
          </button>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 overflow-auto">
        <Outlet />
      </div>
    </div>
  );
}
