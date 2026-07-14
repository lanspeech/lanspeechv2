import { useEffect, useState } from 'react';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { supabase } from './lib/supabase';
import { Routes, Route, Navigate, useNavigate, useParams } from 'react-router-dom';
import Auth from './pages/Auth';
import AppLayout from './components/AppLayout';
import Dashboard from './pages/Dashboard';
import Library from './pages/Library';
import Progress from './pages/Progress';
import Profile from './pages/Profile';
import Admin from './pages/Admin';
import Lesson from './pages/Lesson';
import Completion from './pages/Completion';
import DebugRecord from './pages/DebugRecord';
import BillingExpired from './pages/BillingExpired';
import Pricing from './pages/Pricing';
import Onboarding from './pages/Onboarding';
import NotFound from './pages/NotFound';
import { ProtectedRoute } from './components/ProtectedRoute';
import { fetchLessonById, fetchNextLesson } from './lib/lessons';
import type { Lesson as LessonType } from './lib/types';
import { Leaf } from 'lucide-react';

function AppInner() {
  const { user, loading, profile } = useAuth();
  const [currentLesson, setCurrentLesson] = useState<LessonType | null>(null);
  const [sessionDurationMins, setSessionDurationMins] = useState(0);
  const [dataVersion, setDataVersion] = useState(0);
  const navigate = useNavigate();

  useEffect(() => {
    if (profile?.is_admin === false && window.location.pathname === '/admin') {
      navigate('/dashboard', { replace: true });
    }
    if (!import.meta.env.DEV && window.location.pathname === '/debug') {
      navigate('/dashboard', { replace: true });
    }
  }, [navigate, profile?.is_admin]);

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-emerald-50 to-slate-100 flex flex-col items-center justify-center gap-3">
        <div className="w-12 h-12 rounded-2xl bg-emerald-600 flex items-center justify-center animate-pulse">
          <Leaf className="w-6 h-6 text-white" />
        </div>
        <p className="text-sm text-gray-500">Loading your practice...</p>
      </div>
    );
  }

  if (!user) return <Auth />;

  const startPractice = (lesson?: LessonType | null) => {
    setCurrentLesson(lesson ?? null);
    navigate(lesson?.id ? `/lesson/${lesson.id}` : '/lesson');
  };

  const handleLessonComplete = async (durationMins: number, lesson: LessonType | null) => {
    setSessionDurationMins(durationMins);

    if (lesson) {
      await supabase.from('practice_sessions').insert({
        user_id: user.id,
        lesson_id: lesson.id,
        session_type: 'repeat' as const,
        duration_mins: durationMins,
        started_at: new Date(Date.now() - durationMins * 60000).toISOString(),
        completed_at: new Date().toISOString(),
      });
      await supabase.from('lesson_completions').upsert(
        {
          user_id: user.id,
          lesson_id: lesson.id,
          completed_at: new Date().toISOString(),
        },
        { onConflict: 'user_id,lesson_id', ignoreDuplicates: true }
      );
    } else {
      await supabase.from('practice_sessions').insert({
        user_id: user.id,
        session_type: 'general' as const,
        duration_mins: durationMins,
        started_at: new Date(Date.now() - durationMins * 60000).toISOString(),
        completed_at: new Date().toISOString(),
      });
    }

    setDataVersion(v => v + 1);
    navigate(lesson?.id ? `/completion/${lesson.id}` : '/completion');
  };

  const handleLessonAdvance = async (durationMins: number, lesson: LessonType | null) => {
    if (!lesson) return;

    setSessionDurationMins(durationMins);

    await supabase.from('practice_sessions').insert({
      user_id: user.id,
      lesson_id: lesson.id,
      session_type: 'repeat' as const,
      duration_mins: durationMins,
      started_at: new Date(Date.now() - durationMins * 60000).toISOString(),
      completed_at: new Date().toISOString(),
    });
    await supabase.from('lesson_completions').upsert(
      {
        user_id: user.id,
        lesson_id: lesson.id,
        completed_at: new Date().toISOString(),
      },
      { onConflict: 'user_id,lesson_id', ignoreDuplicates: true }
    );

    setDataVersion(v => v + 1);

    const nextLesson = await fetchNextLesson(lesson);
    if (nextLesson) {
      setCurrentLesson(nextLesson);
      return;
    }

    navigate('/completion');
  };

  const handleContinue = () => {
    navigate('/dashboard');
  };

  function LessonRoute() {
    const { lessonId } = useParams<{ lessonId?: string }>();
    const [lesson, setLesson] = useState<LessonType | null>(currentLesson);
    const [loadingLesson, setLoadingLesson] = useState(false);

    useEffect(() => {
      let active = true;
      if (!lessonId) {
        setLesson(null);
        return;
      }

      if (currentLesson?.id === lessonId) {
        setLesson(currentLesson);
        return;
      }

      setLoadingLesson(true);
      fetchLessonById(lessonId)
        .then(found => {
          if (!active) return;
          setLesson(found);
          setCurrentLesson(found);
        })
        .finally(() => {
          if (active) setLoadingLesson(false);
        });

      return () => {
        active = false;
      };
    }, [lessonId]);

    if (loadingLesson) {
      return (
        <div className="min-h-screen bg-gradient-to-br from-emerald-50 to-slate-100 flex flex-col items-center justify-center gap-3">
          <div className="w-12 h-12 rounded-2xl bg-emerald-600 flex items-center justify-center animate-pulse">
            <Leaf className="w-6 h-6 text-white" />
          </div>
          <p className="text-sm text-gray-500">Loading lesson…</p>
        </div>
      );
    }

    return (
      <Lesson
        lesson={lesson}
        onClose={() => navigate('/dashboard')}
        onComplete={(mins) => handleLessonComplete(mins, lesson)}
        onAdvance={(mins) => handleLessonAdvance(mins, lesson)}
      />
    );
  }

  function CompletionRoute() {
    const { lessonId } = useParams<{ lessonId?: string }>();
    return (
      <Completion
        sessionDurationMins={sessionDurationMins}
        dataVersion={dataVersion}
        onContinue={handleContinue}
        lessonId={lessonId}
      />
    );
  }

  return (
    <Routes>
      <Route
        path="/"
        element={<Navigate to="/dashboard" replace />}
      />
      <Route path="/billing-expired" element={<BillingExpired />} />
      <Route path="/pricing" element={<Pricing />} />
      <Route path="/onboarding" element={<Onboarding />} />
      <Route
        path="/"
        element={
          <ProtectedRoute>
            <AppLayout onStartPractice={startPractice} isAdmin={Boolean(profile?.is_admin)} />
          </ProtectedRoute>
        }
      >
        <Route path="dashboard" element={<Dashboard onStartPractice={startPractice} dataVersion={dataVersion} />} />
        <Route path="library" element={<Library onStartLesson={startPractice} dataVersion={dataVersion} />} />
        <Route path="progress" element={<Progress dataVersion={dataVersion} onNavigateTo={(page) => {
          const path = page === 'dashboard' ? '/dashboard' : page === 'library' ? '/library' : page === 'progress' ? '/progress' : '/profile';
          navigate(path);
        }} />} />
        <Route path="profile" element={<Profile />} />
        <Route path="admin" element={<Admin />} />
        <Route path="debug" element={<DebugRecord />} />
      </Route>
      <Route path="lesson/:lessonId?" element={
        <ProtectedRoute>
          <LessonRoute />
        </ProtectedRoute>
      } />
      <Route path="completion/:lessonId?" element={
        <ProtectedRoute>
          <CompletionRoute />
        </ProtectedRoute>
      } />
      <Route path="*" element={<NotFound />} />
    </Routes>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <AppInner />
    </AuthProvider>
  );
}
