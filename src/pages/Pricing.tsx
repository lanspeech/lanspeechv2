import { useNavigate } from 'react-router-dom';
import { Check, ArrowLeft, Zap } from 'lucide-react';
import { PRICING_PLANS, formatExpirationDate } from '../lib/billing';
import { useAuth } from '../contexts/AuthContext';
import Button from '../components/ui/Button';
import { useState } from 'react';

export default function Pricing() {
  const navigate = useNavigate();
  const { user, profile } = useAuth();
  const [loadingPlan, setLoadingPlan] = useState<string | null>(null);

  const handleSelectPlan = async (planId: string) => {
    setLoadingPlan(planId);
    
    // In a real app, this would:
    // 1. Call a backend API to create a payment link via Selar
    // 2. Redirect to Selar checkout
    // For now, we'll show a message
    console.log(`Selected plan: ${planId}`);
    
    // Simulate API call
    setTimeout(() => {
      // In production: window.location.href = selarPaymentLink;
      alert(`Plan selected: ${planId}\n\nRedirect to Selar payment would happen here.\n\nUser: ${user?.email}`);
      setLoadingPlan(null);
    }, 1000);
  };

  const isSubscribed = profile?.subscription_expires_at !== null;

  return (
    <div className="min-h-screen bg-gradient-to-br from-emerald-50 to-slate-100">
      {/* Header */}
      <header className="bg-white border-b border-gray-100 px-4 sm:px-6 py-4">
        <button
          onClick={() => navigate(user ? '/dashboard' : '/auth', { replace: true })}
          className="text-sm text-gray-600 hover:text-gray-900 flex items-center gap-2"
        >
          <ArrowLeft size={16} />
          {user ? 'Back to dashboard' : 'Back to sign in'}
        </button>
      </header>

      {/* Main content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 py-16">
        {/* Hero section */}
        <div className="text-center mb-16">
          <h1 className="text-4xl sm:text-5xl font-bold text-gray-900 mb-4">
            Simple, Transparent Pricing
          </h1>
          <p className="text-xl text-gray-600 mb-2">
            Start your speech therapy journey with LanSpeech
          </p>
          {isSubscribed && (
            <div className="inline-block mt-4 px-4 py-2 bg-emerald-50 border border-emerald-200 rounded-full">
              <p className="text-sm text-emerald-700 font-semibold">
                ✓ Active subscription until {formatExpirationDate(profile?.subscription_expires_at ?? null)}
              </p>
            </div>
          )}
        </div>

        {/* Pricing cards */}
        <div className="grid md:grid-cols-2 gap-8 max-w-4xl mx-auto">
          {PRICING_PLANS.map((plan) => (
            <div
              key={plan.id}
              className={`relative rounded-3xl overflow-hidden transition-all duration-300 ${
                plan.popular
                  ? 'md:scale-105 md:shadow-2xl bg-gradient-to-br from-emerald-50 to-emerald-100 border-2 border-emerald-600'
                  : 'bg-white border border-gray-200 shadow-md hover:shadow-lg'
              }`}
            >
              {/* Popular badge */}
              {plan.popular && (
                <div className="absolute top-0 right-0 bg-emerald-600 text-white px-4 py-1 text-sm font-bold rounded-bl-2xl flex items-center gap-1">
                  <Zap size={14} />
                  Most Popular
                </div>
              )}

              <div className="p-8">
                {/* Plan name */}
                <h2 className="text-2xl font-bold text-gray-900 mb-2">{plan.name}</h2>
                <p className="text-sm text-gray-600 mb-6">{plan.description}</p>

                {/* Price */}
                <div className="mb-6">
                  <div className="flex items-baseline gap-1">
                    <span className="text-5xl font-bold text-gray-900">
                      ${plan.price.toFixed(2)}
                    </span>
                    <span className="text-gray-600">/{plan.billingCycle.toLowerCase()}</span>
                  </div>
                  <p className="text-sm text-gray-500 mt-2">{plan.duration}</p>
                </div>

                {/* CTA Button */}
                <Button
                  size="lg"
                  onClick={() => handleSelectPlan(plan.id)}
                  disabled={loadingPlan === plan.id}
                  className={`w-full mb-8 ${
                    plan.popular
                      ? 'bg-emerald-600 hover:bg-emerald-700 text-white'
                      : 'bg-gray-100 hover:bg-gray-200 text-gray-900'
                  } ${loadingPlan === plan.id ? 'opacity-60 cursor-not-allowed' : ''}`}
                >
                  {loadingPlan === plan.id ? (
                    <div className="flex items-center justify-center gap-2">
                      <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
                      Processing...
                    </div>
                  ) : (
                    'Get Started'
                  )}
                </Button>

                {/* Features list */}
                <div className="space-y-4">
                  <p className="text-sm font-semibold text-gray-900">What's included:</p>
                  <ul className="space-y-3">
                    {plan.features.map((feature) => (
                      <li key={feature} className="flex items-start gap-3">
                        <div className="flex-shrink-0 w-5 h-5 rounded-full bg-emerald-100 flex items-center justify-center mt-0.5">
                          <Check size={14} className="text-emerald-600" />
                        </div>
                        <span className="text-sm text-gray-700">{feature}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* FAQ Section */}
        <div className="mt-20 max-w-3xl mx-auto">
          <h2 className="text-2xl font-bold text-gray-900 mb-8 text-center">Frequently Asked Questions</h2>
          
          <div className="space-y-6">
            <div className="bg-white rounded-2xl p-6 border border-gray-200">
              <h3 className="font-semibold text-gray-900 mb-2">Can I cancel anytime?</h3>
              <p className="text-gray-600 text-sm">
                Yes! You can cancel your subscription at any time. You'll have access until the end of your billing period.
              </p>
            </div>

            <div className="bg-white rounded-2xl p-6 border border-gray-200">
              <h3 className="font-semibold text-gray-900 mb-2">Is there a free trial?</h3>
              <p className="text-gray-600 text-sm">
                Contact our support team to discuss trial options for your needs.
              </p>
            </div>

            <div className="bg-white rounded-2xl p-6 border border-gray-200">
              <h3 className="font-semibold text-gray-900 mb-2">What payment methods do you accept?</h3>
              <p className="text-gray-600 text-sm">
                We accept all major credit cards, debit cards, and mobile money through our payment processor Selar.
              </p>
            </div>

            <div className="bg-white rounded-2xl p-6 border border-gray-200">
              <h3 className="font-semibold text-gray-900 mb-2">Can I upgrade or downgrade?</h3>
              <p className="text-gray-600 text-sm">
                Yes! You can change your plan at any time. Changes take effect on your next billing cycle.
              </p>
            </div>
          </div>
        </div>

        {/* Support */}
        <div className="mt-16 text-center">
          <p className="text-gray-600 mb-4">
            Have questions? We're here to help!
          </p>
          <a
            href="mailto:support@lanspeech.com"
            className="text-emerald-600 hover:text-emerald-700 font-semibold"
          >
            Contact our support team
          </a>
        </div>
      </main>
    </div>
  );
}
