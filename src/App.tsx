import { useState } from 'react';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { supabase } from './lib/supabase';
import Auth from './pages/Auth';
import Sidebar from './components/Sidebar';
import Dashboard from './pages/Dashboard';
import Library from './pages/Library';
import Progress from './pages/Progress';
import Profile from './pages/Profile';
import Lesson from './pages/Lesson';
import Completion from './pages/Completion';
import type { Lesson as LessonType } from './lib/types';
import { Leaf } from 'lucide-react';

type Page = 'dashboard' | 'library' | 'progress' | 'profile';
type View = 'app' | 'lesson' | 'completion';

function AppInner() {
  const { user, loading } = useAuth();
  const [currentPage, setCurrentPage] = useState<Page>('dashboard');
  const [currentView, setCurrentView] = useState<View>('app');
  const [currentLesson, setCurrentLesson] = useState<LessonType | null>(null);
  const [sessionDurationMins, setSessionDurationMins] = useState(0);
  const [dataVersion, setDataVersion] = useState(0);

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-emerald-50 to-slate-100 flex flex-col items-center justify-center gap-3">
        <div className="w-12 h-12 rounded-2xl bg-emerald-600 flex items-center justify-center animate-pulse">
          <Leaf className="w-6 h-6 text-white" />
        </div>
        <p className="text-sm text-gray-500">Loading your practice…</p>
      </div>
    );
  }

  if (!user) return <Auth />;

  const startPractice = (lesson?: LessonType | null) => {
    setCurrentLesson(lesson ?? null);
    setCurrentView('lesson');
  };

  const handleLessonComplete = async (durationMins: number, lesson: LessonType | null) => {
    setSessionDurationMins(durationMins);

    if (lesson) {
      await supabase.from('practice_sessions').insert({
        lesson_id: lesson.id,
        session_type: 'repeat' as const,
        duration_mins: durationMins,
        started_at: new Date(Date.now() - durationMins * 60000).toISOString(),
        completed_at: new Date().toISOString(),
      });
      await supabase.from('lesson_completions').upsert(
        { lesson_id: lesson.id },
        { onConflict: 'user_id,lesson_id', ignoreDuplicates: true }
      );
    } else {
      await supabase.from('practice_sessions').insert({
        session_type: 'general' as const,
        duration_mins: durationMins,
        started_at: new Date(Date.now() - durationMins * 60000).toISOString(),
        completed_at: new Date().toISOString(),
      });
    }

    setDataVersion(v => v + 1);
    setCurrentView('completion');
  };

  const goToDashboard = () => {
    setCurrentView('app');
    setCurrentPage('dashboard');
  };

  const navigateToPage = (page: Page) => {
    setCurrentView('app');
    setCurrentPage(page);
  };

  if (currentView === 'lesson') {
    return (
      <div key="lesson" className="animate-fade-in">
        <Lesson
          lesson={currentLesson}
          onClose={() => setCurrentView('app')}
          onComplete={(mins) => handleLessonComplete(mins, currentLesson)}
        />
      </div>
    );
  }

  if (currentView === 'completion') {
    return (
      <div key="completion" className="animate-fade-in">
        <Completion
          sessionDurationMins={sessionDurationMins}
          dataVersion={dataVersion}
          onContinue={goToDashboard}
          lessonId={currentLesson?.id}
        />
      </div>
    );
  }

  return (
    <div className="flex min-h-screen bg-slate-50">
      <Sidebar
        currentPage={currentPage}
        onNavigate={setCurrentPage}
        showStartPractice={currentPage === 'library'}
        onStartPractice={() => startPractice()}
      />
      <main className="flex-1 flex overflow-hidden">
        <div key={currentPage} className="flex-1 flex animate-fade-in-up" style={{ animationDuration: '0.35s' }}>
          {currentPage === 'dashboard' && <Dashboard onStartPractice={startPractice} dataVersion={dataVersion} />}
          {currentPage === 'library' && <Library onStartLesson={startPractice} dataVersion={dataVersion} />}
          {currentPage === 'progress' && <Progress dataVersion={dataVersion} onNavigateTo={navigateToPage} />}
          {currentPage === 'profile' && <Profile />}
        </div>
      </main>
    </div>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <AppInner />
    </AuthProvider>
  );
}
