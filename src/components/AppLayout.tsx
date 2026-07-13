import { useEffect } from 'react';
import { Outlet, useLocation, useNavigate } from 'react-router-dom';
import Sidebar, { Page } from './Sidebar';

interface AppLayoutProps {
  onStartPractice: (lesson?: any) => void;  // eslint-disable-line @typescript-eslint/no-explicit-any
  isAdmin: boolean;
}

const pageToPath: Record<Page, string> = {
  dashboard: '/dashboard',
  library: '/library',
  progress: '/progress',
  profile: '/profile',
  admin: '/admin',
  debug: '/debug',
};

function getPageFromPath(pathname: string): Page {
  const normalized = pathname.replace(/\/$/, '');
  if (normalized === '/dashboard' || normalized === '/') return 'dashboard';
  if (normalized === '/library') return 'library';
  if (normalized === '/progress') return 'progress';
  if (normalized === '/profile') return 'profile';
  if (normalized === '/admin') return 'admin';
  if (normalized === '/debug') return 'debug';
  return 'dashboard';
}

export default function AppLayout({ onStartPractice, isAdmin }: AppLayoutProps) {
  const location = useLocation();
  const navigate = useNavigate();
  const currentPage = getPageFromPath(location.pathname);
  const showStartPractice = location.pathname === '/library';

  useEffect(() => {
    if (location.pathname === '/admin' && !isAdmin) {
      navigate('/dashboard', { replace: true });
    }
  }, [location.pathname, isAdmin, navigate]);

  useEffect(() => {
    if (location.pathname === '/debug' && !import.meta.env.DEV) {
      navigate('/dashboard', { replace: true });
    }
  }, [location.pathname, navigate]);

  const handleNavigate = (page: Page) => {
    navigate(pageToPath[page]);
  };

  return (
    <div className="flex min-h-screen bg-slate-50">
      <Sidebar
        currentPage={currentPage}
        onNavigate={handleNavigate}
        showStartPractice={showStartPractice}
        onStartPractice={onStartPractice}
      />
      <main className="flex-1 flex flex-col overflow-hidden pb-24 md:pb-0">
        <div className="flex-1 flex animate-fade-in-up" style={{ animationDuration: '0.35s' }}>
          <Outlet />
        </div>
      </main>
    </div>
  );
}
