import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import Button from '../components/ui/Button';
import { XOctagon, Leaf } from 'lucide-react';

export default function NotFound() {
  const { user } = useAuth();
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-100 via-emerald-50 to-slate-200 flex items-center justify-center px-4 py-12">
      <div className="w-full max-w-3xl rounded-[40px] border border-slate-200 bg-white/95 shadow-2xl backdrop-blur-xl p-10 sm:p-14">
        <div className="flex items-center gap-4 mb-8">
          <div className="flex h-16 w-16 items-center justify-center rounded-3xl bg-emerald-600 text-white shadow-lg shadow-emerald-200/50">
            <Leaf className="h-8 w-8" />
          </div>
          <div>
            <p className="text-xs uppercase tracking-[0.3em] text-emerald-700 font-semibold">404 — Page Not Found</p>
            <h1 className="mt-2 text-4xl font-extrabold text-slate-900 sm:text-5xl">Whoops, this page went missing.</h1>
          </div>
        </div>

        <div className="grid gap-10 sm:grid-cols-[1fr_280px] items-center">
          <div>
            <p className="text-slate-600 text-lg leading-8">
              The link you followed may be broken, the page may have moved, or it might not exist yet.
              Let&apos;s get you back to your speech practice.
            </p>
            <ul className="mt-8 space-y-3 text-slate-700">
              <li className="flex items-center gap-3">
                <span className="inline-flex h-9 w-9 items-center justify-center rounded-2xl bg-emerald-50 text-emerald-700">
                  <XOctagon className="h-5 w-5" />
                </span>
                <span>Check the URL and try again</span>
              </li>
              <li className="flex items-center gap-3">
                <span className="inline-flex h-9 w-9 items-center justify-center rounded-2xl bg-emerald-50 text-emerald-700">
                  <span className="text-base font-semibold">✓</span>
                </span>
                <span>Return to the app home and continue practicing</span>
              </li>
            </ul>
          </div>

          <div className="rounded-[32px] bg-emerald-600 p-8 text-white shadow-xl">
            <p className="text-sm uppercase tracking-[0.3em] text-emerald-200 font-semibold">Need a shortcut?</p>
            <div className="mt-6 space-y-6">
              <div className="rounded-3xl bg-white/10 p-5">
                <p className="text-sm text-emerald-100">If you already have an account, your dashboard is a quick way back to your lessons.</p>
              </div>
              <div className="rounded-3xl bg-white/10 p-5">
                <p className="text-sm text-emerald-100">If you&apos;re new here, the sign in page will get you started fast.</p>
              </div>
            </div>
            <Button
              size="lg"
              className="mt-8 w-full bg-white text-emerald-700 hover:bg-slate-100"
              onClick={() => navigate('/')}
            >
              Go to Home
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
