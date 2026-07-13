import { Calendar, RefreshCw, ArrowLeft, Zap, Check } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import Button from '../components/ui/Button';

// Selar subscription payment links with add_to_cart optimization
const SELAR_MONTHLY_LINK = 'https://selar.co';
const SELAR_ANNUAL_LINK = 'https://selar.co';

export default function BillingExpired() {
  const { user } = useAuth();

  return (
    <div className="min-h-screen bg-gradient-to-br from-amber-50 to-slate-100">
      {/* Header */}
      <header className="bg-white border-b border-gray-100 px-4 sm:px-6 py-4">
        <button
          onClick={() => window.location.href = '/auth'}
          className="text-sm text-gray-600 hover:text-gray-900 flex items-center gap-2"
        >
          <ArrowLeft size={16} />
          Back to sign in
        </button>
      </header>

      {/* Main content */}
      <main className="flex-1 flex items-center justify-center px-4 py-12">
        <div className="max-w-4xl w-full">
          {/* Icon and heading */}
          <div className="text-center mb-12">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-amber-100 mb-4">
              <Calendar size={32} className="text-amber-600" />
            </div>
            <h1 className="text-3xl font-bold text-gray-900 mb-2">Subscription Expired</h1>
            <p className="text-gray-600">{user?.email}</p>
          </div>

          {/* Message */}
          <div className="bg-white rounded-2xl border border-amber-200 p-6 mb-12 text-center max-w-2xl mx-auto">
            <p className="text-lg font-semibold text-gray-900">
              Your subscription has expired. Please renew to restore access.
            </p>
            <p className="text-sm text-gray-600 mt-3">
              Choose from our flexible plans and get back to your speech therapy practice immediately.
            </p>
          </div>

          {/* Pricing cards */}
          <div className="grid md:grid-cols-2 gap-6 mb-12">
            {/* Monthly Plan Card */}
            <div className="bg-white rounded-2xl shadow-md border border-gray-200 p-6 hover:shadow-lg transition-shadow">
              <h2 className="text-2xl font-bold text-gray-900 mb-2">Monthly Plan</h2>
              <p className="text-sm text-gray-600 mb-6">Flexible month-to-month subscription</p>

              {/* Features */}
              <div className="space-y-3 mb-8">
                <h3 className="text-xs font-semibold text-gray-900 uppercase tracking-wide">Features included:</h3>
                <ul className="space-y-2">
                  <li className="flex items-start gap-2">
                    <Check size={16} className="text-emerald-600 flex-shrink-0 mt-0.5" />
                    <span className="text-sm text-gray-700">Unlimited practice sessions</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <Check size={16} className="text-emerald-600 flex-shrink-0 mt-0.5" />
                    <span className="text-sm text-gray-700">Full lesson library access</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <Check size={16} className="text-emerald-600 flex-shrink-0 mt-0.5" />
                    <span className="text-sm text-gray-700">Voice recording & playback</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <Check size={16} className="text-emerald-600 flex-shrink-0 mt-0.5" />
                    <span className="text-sm text-gray-700">Progress tracking</span>
                  </li>
                </ul>
              </div>

              {/* CTA Button */}
              <a
                href={SELAR_MONTHLY_LINK}
                target="_blank"
                rel="noopener noreferrer"
                className="block w-full"
              >
                <Button
                  size="lg"
                  className="w-full bg-gray-100 hover:bg-gray-200 text-gray-900 flex items-center justify-center gap-2"
                >
                  <RefreshCw size={18} />
                  Renew Monthly
                </Button>
              </a>
            </div>

            {/* Annual Plan Card (Highlighted) */}
            <div className="relative bg-gradient-to-br from-emerald-50 to-emerald-100 rounded-2xl shadow-lg border-2 border-emerald-600 p-6 md:scale-105">
              {/* Best Value Badge */}
              <div className="absolute -top-3 right-4 bg-emerald-600 text-white px-3 py-1 rounded-full text-xs font-bold flex items-center gap-1">
                <Zap size={12} />
                Best Value
              </div>

              <h2 className="text-2xl font-bold text-gray-900 mb-2">Annual Plan</h2>
              <p className="text-sm text-gray-600 mb-6">Save 33% with yearly billing</p>

              {/* Features */}
              <div className="space-y-3 mb-8">
                <h3 className="text-xs font-semibold text-gray-900 uppercase tracking-wide">Features included:</h3>
                <ul className="space-y-2">
                  <li className="flex items-start gap-2">
                    <Check size={16} className="text-emerald-600 flex-shrink-0 mt-0.5" />
                    <span className="text-sm text-gray-700">Unlimited practice sessions</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <Check size={16} className="text-emerald-600 flex-shrink-0 mt-0.5" />
                    <span className="text-sm text-gray-700">Full lesson library access</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <Check size={16} className="text-emerald-600 flex-shrink-0 mt-0.5" />
                    <span className="text-sm text-gray-700">Voice recording & playback</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <Check size={16} className="text-emerald-600 flex-shrink-0 mt-0.5" />
                    <span className="text-sm text-gray-700">Progress tracking</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <Check size={16} className="text-emerald-600 flex-shrink-0 mt-0.5" />
                    <span className="text-sm text-gray-700">Priority support</span>
                  </li>
                </ul>
              </div>

              {/* CTA Button */}
              <a
                href={SELAR_ANNUAL_LINK}
                target="_blank"
                rel="noopener noreferrer"
                className="block w-full"
              >
                <Button
                  size="lg"
                  className="w-full bg-emerald-600 hover:bg-emerald-700 text-white flex items-center justify-center gap-2"
                >
                  <RefreshCw size={18} />
                  Renew Annually
                </Button>
              </a>
            </div>
          </div>

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
