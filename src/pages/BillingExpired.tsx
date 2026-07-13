import { useNavigate } from 'react-router-dom';
import { Calendar, RefreshCw, ArrowLeft } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import Button from '../components/ui/Button';

export default function BillingExpired() {
  const navigate = useNavigate();
  const { user } = useAuth();

  return (
    <div className="min-h-screen bg-gradient-to-br from-amber-50 to-slate-100">
      {/* Header */}
      <header className="bg-white border-b border-gray-100 px-4 sm:px-6 py-4">
        <button
          onClick={() => navigate('/auth', { replace: true })}
          className="text-sm text-gray-600 hover:text-gray-900 flex items-center gap-2"
        >
          <ArrowLeft size={16} />
          Back to sign in
        </button>
      </header>

      {/* Main content */}
      <main className="flex-1 flex items-center justify-center px-4 py-12">
        <div className="max-w-md w-full">
          {/* Icon */}
          <div className="text-center mb-8">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-amber-100 mb-4">
              <Calendar size={32} className="text-amber-600" />
            </div>
          </div>

          {/* Content */}
          <div className="bg-white rounded-3xl shadow-md p-8 text-center mb-6">
            <h1 className="text-3xl font-bold text-gray-900 mb-3">Subscription Expired</h1>
            
            <p className="text-gray-600 mb-2">
              {user?.email}
            </p>

            <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4 my-6 text-left">
              <p className="text-sm text-gray-700 leading-relaxed">
                Your subscription has expired. To continue practicing and accessing all LanSpeech features, please renew your subscription below.
              </p>
            </div>

            <div className="space-y-3">
              <h2 className="text-sm font-semibold text-gray-900 mb-4">What you're missing:</h2>
              <ul className="text-left text-sm text-gray-600 space-y-2">
                <li className="flex items-start gap-2">
                  <span className="text-amber-600 font-bold mt-0.5">✓</span>
                  <span>Unlimited practice sessions</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-amber-600 font-bold mt-0.5">✓</span>
                  <span>Full lesson library access</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-amber-600 font-bold mt-0.5">✓</span>
                  <span>Voice recording and playback</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-amber-600 font-bold mt-0.5">✓</span>
                  <span>Progress tracking and AI feedback</span>
                </li>
              </ul>
            </div>
          </div>

          {/* CTA Button */}
          <Button
            size="lg"
            onClick={() => navigate('/pricing')}
            className="w-full bg-emerald-600 hover:bg-emerald-700 text-white flex items-center justify-center gap-2 mb-4"
          >
            <RefreshCw size={18} />
            Renew Subscription
          </Button>

          {/* Support link */}
          <p className="text-center text-xs text-gray-500">
            Need help?{' '}
            <a
              href="mailto:support@lanspeech.com"
              className="text-emerald-600 hover:text-emerald-700 font-semibold"
            >
              Contact support
            </a>
          </p>
        </div>
      </main>
    </div>
  );
}
