import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Sparkles, HeartHandshake, CheckCircle2 } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { useSubscription } from '../hooks/useSubscription';
import { supabase } from '../lib/supabase';
import Button from '../components/ui/Button';

const goals = [
  'Speaking confidently',
  'Job interviews',
  'School presentations',
  'Daily conversations',
  'Phone calls',
  'Public speaking',
];

const commitments = [
  '5 minutes',
  '10 minutes',
  '15 minutes',
  '20 minutes',
];

export default function Onboarding() {
  const { user, profile, loading, refreshProfile } = useAuth();
  const { isActive } = useSubscription();
  const navigate = useNavigate();
  const [step, setStep] = useState(1);
  const [allowed, setAllowed] = useState(false);
  const [checkedItems, setCheckedItems] = useState<string[]>([]);
  const [selectedGoal, setSelectedGoal] = useState<string>('Speaking confidently');
  const [selectedCommitment, setSelectedCommitment] = useState('10 minutes');
  const [progress, setProgress] = useState(25);
  const [exerciseState, setExerciseState] = useState<'ready' | 'recorded' | 'played'>('ready');

  useEffect(() => {
    if (!user) {
      navigate('/auth', { replace: true });
      return;
    }

    if (loading || !profile) {
      return;
    }

    const needsOnboarding = profile.onboarding_required === true;
    if (!needsOnboarding) {
      if (isActive) {
        navigate('/dashboard', { replace: true });
      } else {
        navigate('/pricing', { replace: true });
      }
      return;
    }

    setAllowed(true);
  }, [user, profile, loading, isActive, navigate]);

  useEffect(() => {
    if (step !== 6) return;
    setProgress(25);
    const values = [42, 61, 89, 100];
    const timers: NodeJS.Timeout[] = [];

    values.forEach((value, index) => {
      timers.push(setTimeout(() => setProgress(value), 700 * (index + 1)));
    });

    return () => timers.forEach(clearTimeout);
  }, [step]);

  const title = useMemo(() => {
    switch (step) {
      case 1:
        return 'Welcome to LanSpeech 👋';
      case 2:
        return 'Do you ever...';
      case 3:
        return "You're not alone.";
      case 4:
        return 'What would you like to improve first?';
      case 5:
        return 'How much time can you practice each day?';
      case 6:
        return "We're creating your personal practice plan...";
      case 7:
        return 'Your Plan Is Ready 🎉';
      case 8:
        return 'First Mini Exercise';
      case 9:
        return 'Amazing!';
      case 10:
        return "Today's progress";
      case 11:
        return 'Continue Your Journey';
      default:
        return '';
    }
  }, [step]);

  const goNext = () => setStep((current) => Math.min(11, current + 1));
  const goBack = () => setStep((current) => Math.max(1, current - 1));
  const finishOnboarding = async (path: string) => {
    if (!user) return;
    await supabase
      .from('profiles')
      .update({ onboarding_required: false })
      .eq('user_id', user.id);
    await refreshProfile();
    navigate(path, { replace: true });
  };

  if (!allowed) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-emerald-50 via-slate-100 to-slate-200 py-10 px-4">
      <div className="mx-auto max-w-4xl">
        <div className="mb-8 flex items-center justify-between gap-4">
          <div>
            <p className="text-xs uppercase tracking-[0.25em] text-emerald-700 font-semibold">LanSpeech Onboarding</p>
            <h1 className="text-3xl sm:text-4xl font-bold text-slate-900 mt-2">{title}</h1>
          </div>
          <div className="text-right text-sm text-slate-500">Step {step} of 11</div>
        </div>

        <div className="rounded-[32px] border border-slate-200 bg-white shadow-xl p-8">
          {step === 1 && (
            <div className="space-y-8">
              <div className="max-w-xl">
                <p className="text-lg text-slate-700">The easiest way to practice your speech every day.</p>
                <p className="mt-4 text-slate-900 text-xl sm:text-2xl font-semibold">Improve your confidence with just <span className="text-emerald-700">10 minutes a day.</span></p>
              </div>
              <div className="flex justify-end">
                <Button size="lg" onClick={goNext}>Let&apos;s Begin</Button>
              </div>
            </div>
          )}

          {step === 2 && (
            <div className="space-y-8">
              <div className="space-y-3">
                <p className="text-slate-700 leading-7">This app is built for people who want to feel more comfortable speaking in real life.</p>
                <div className="grid gap-3 sm:grid-cols-2">
                  {['Avoid speaking in class','Fear introducing yourself','Avoid phone calls','Feel nervous talking to strangers','Worry people will judge your speech','None of these'].map((item) => (
                    <button
                      key={item}
                      type="button"
                      onClick={() => {
                        setCheckedItems((current) =>
                          current.includes(item)
                            ? current.filter((value) => value !== item)
                            : [...current.filter((value) => value !== 'None of these'), item === 'None of these' ? ['None of these'] : [...current.filter((value) => value !== 'None of these'), item]].flat()
                        );
                      }}
                      className={`w-full rounded-3xl border px-4 py-4 text-left transition ${checkedItems.includes(item) ? 'border-emerald-600 bg-emerald-50 shadow-sm' : 'border-slate-200 bg-white hover:border-slate-300'}`}
                    >
                      <div className="flex items-center gap-3">
                        <div className={`h-5 w-5 rounded-full border ${checkedItems.includes(item) ? 'border-emerald-600 bg-emerald-600' : 'border-slate-300 bg-white'}`} />
                        <span className="text-sm text-slate-800">{item}</span>
                      </div>
                    </button>
                  ))}
                </div>
              </div>
              <div className="flex justify-between">
                <Button variant="secondary" onClick={goBack}>Back</Button>
                <Button size="lg" onClick={goNext}>Continue</Button>
              </div>
            </div>
          )}

          {step === 3 && (
            <div className="space-y-10 text-center">
              <div className="mx-auto max-w-xl">
                <div className="mx-auto mb-6 flex h-40 w-40 items-center justify-center rounded-full bg-emerald-100 text-emerald-700 shadow-inner">
                  <HeartHandshake className="h-16 w-16" />
                </div>
                <p className="text-lg text-slate-700">Millions of people stammer. Many have improved through consistent daily practice.</p>
                <p className="mt-4 text-slate-900 text-xl font-semibold">You can too.</p>
              </div>
              <div className="flex justify-between">
                <Button variant="secondary" onClick={goBack}>Back</Button>
                <Button size="lg" onClick={goNext}>Continue</Button>
              </div>
            </div>
          )}

          {step === 4 && (
            <div className="space-y-8">
              <div className="grid gap-3">
                {goals.map((goal) => (
                  <button
                    key={goal}
                    type="button"
                    onClick={() => setSelectedGoal(goal)}
                    className={`w-full rounded-3xl border px-4 py-4 text-left text-sm transition ${selectedGoal === goal ? 'border-emerald-600 bg-emerald-50 shadow-sm' : 'border-slate-200 bg-white hover:border-slate-300'}`}
                  >
                    <div className="flex items-center gap-3">
                      <div className={`h-5 w-5 rounded-full border ${selectedGoal === goal ? 'border-emerald-600 bg-emerald-600' : 'border-slate-300 bg-white'}`} />
                      <span className="text-slate-800">{goal}</span>
                    </div>
                  </button>
                ))}
              </div>
              <div className="flex justify-between">
                <Button variant="secondary" onClick={goBack}>Back</Button>
                <Button size="lg" onClick={goNext}>Continue</Button>
              </div>
            </div>
          )}

          {step === 5 && (
            <div className="space-y-8">
              <div className="grid gap-3 sm:grid-cols-2">
                {commitments.map((option) => (
                  <button
                    key={option}
                    type="button"
                    onClick={() => setSelectedCommitment(option)}
                    className={`rounded-3xl border px-5 py-4 text-left transition ${selectedCommitment === option ? 'border-emerald-600 bg-emerald-50 shadow-sm' : 'border-slate-200 bg-white hover:border-slate-300'}`}
                  >
                    <div className="flex items-center gap-3">
                      <div className={`h-5 w-5 rounded-full border ${selectedCommitment === option ? 'border-emerald-600 bg-emerald-600' : 'border-slate-300 bg-white'}`} />
                      <span className="text-slate-800 text-base font-medium">{option}</span>
                    </div>
                  </button>
                ))}
              </div>
              <div className="flex justify-between">
                <Button variant="secondary" onClick={goBack}>Back</Button>
                <Button size="lg" onClick={goNext}>Continue</Button>
              </div>
            </div>
          )}

          {step === 6 && (
            <div className="space-y-10">
              <div className="rounded-3xl border border-slate-200 bg-slate-50 p-6">
                <div className="mb-3 flex items-center justify-between">
                  <div>
                    <p className="text-sm text-slate-500">We&apos;re creating your personal practice plan...</p>
                    <p className="text-xl font-semibold text-slate-900">Just a moment.</p>
                  </div>
                  <Sparkles className="h-8 w-8 text-emerald-500" />
                </div>
                <div className="h-4 overflow-hidden rounded-full bg-white shadow-inner">
                  <div className="h-full bg-emerald-600 transition-all duration-700" style={{ width: `${progress}%` }} />
                </div>
                <div className="mt-3 text-right text-sm text-slate-600">{progress}%</div>
              </div>
              <div className="flex justify-between">
                <Button variant="secondary" onClick={goBack}>Back</Button>
                <Button size="lg" onClick={goNext} disabled={progress < 100}>Continue</Button>
              </div>
            </div>
          )}

          {step === 7 && (
            <div className="space-y-8">
              <div className="rounded-3xl border border-slate-200 bg-emerald-50 p-6 shadow-sm">
                <p className="text-sm text-emerald-700">John&apos;s Fluency Plan</p>
                <div className="mt-4 space-y-3 text-slate-800">
                  <p>✔ Daily lessons</p>
                  <p>✔ Confidence exercises</p>
                  <p>✔ Speaking practice</p>
                  <p>✔ Reading practice</p>
                  <p>✔ Progress tracking</p>
                </div>
                <p className="mt-6 text-sm text-slate-600">Starts today.</p>
              </div>
              <div className="flex justify-between">
                <Button variant="secondary" onClick={goBack}>Back</Button>
                <Button size="lg" onClick={goNext}>Start Exercise</Button>
              </div>
            </div>
          )}

          {step === 8 && (
            <div className="space-y-8">
              <div className="rounded-3xl border border-slate-200 bg-slate-50 p-6">
                <p className="text-sm uppercase tracking-[0.2em] text-slate-500 mb-4">Coach says</p>
                <p className="text-lg text-slate-900 font-semibold">Let&apos;s try something together.</p>
                <div className="mt-5 space-y-4">
                  <p>Take a deep breath.</p>
                  <p className="font-semibold">Now repeat after me:</p>
                  <div className="rounded-3xl bg-white border border-slate-200 p-5 text-center text-lg text-slate-800">“My name is John.”</div>
                </div>
              </div>
              <div className="grid gap-3 sm:grid-cols-3">
                <Button size="md" variant={exerciseState === 'ready' ? 'primary' : 'secondary'} onClick={() => setExerciseState('recorded')}>Record Myself</Button>
                <Button size="md" variant={exerciseState === 'recorded' ? 'primary' : 'secondary'} onClick={() => setExerciseState('played')} disabled={exerciseState === 'ready'}>Listen Back</Button>
                <Button size="md" variant="secondary" onClick={goNext} disabled={exerciseState !== 'played'}>Done</Button>
              </div>
              <p className="text-sm text-slate-500">You&apos;ve already used the app — great first step.</p>
            </div>
          )}

          {step === 9 && (
            <div className="space-y-8 text-center">
              <div className="mx-auto flex h-24 w-24 items-center justify-center rounded-full bg-emerald-100 text-emerald-700">
                <CheckCircle2 className="h-12 w-12" />
              </div>
              <div>
                <p className="text-2xl font-semibold text-slate-900">Amazing!</p>
                <p className="mt-3 text-slate-700">You&apos;ve completed your first exercise. You&apos;re already building a healthier speaking habit.</p>
              </div>
              <div className="flex justify-between">
                <Button variant="secondary" onClick={goBack}>Back</Button>
                <Button size="lg" onClick={goNext}>See Progress</Button>
              </div>
            </div>
          )}

          {step === 10 && (
            <div className="space-y-8">
              <div className="grid gap-4 sm:grid-cols-3">
                <div className="rounded-3xl border border-slate-200 bg-white p-6 text-center">
                  <p className="text-sm text-slate-500">Today&apos;s progress</p>
                  <p className="mt-4 text-3xl font-semibold text-slate-900">25%</p>
                </div>
                <div className="rounded-3xl border border-slate-200 bg-white p-6 text-center">
                  <p className="text-sm text-slate-500">Lessons completed</p>
                  <p className="mt-4 text-3xl font-semibold text-slate-900">1</p>
                </div>
                <div className="rounded-3xl border border-slate-200 bg-white p-6 text-center">
                  <p className="text-sm text-slate-500">Current streak</p>
                  <p className="mt-4 text-3xl font-semibold text-slate-900">🔥 1 Day</p>
                </div>
              </div>
              <div className="text-slate-700">Now you&apos;re emotionally invested — your first day is done.</div>
              <div className="flex justify-between">
                <Button variant="secondary" onClick={goBack}>Back</Button>
                <Button size="lg" onClick={goNext}>Continue Your Journey</Button>
              </div>
            </div>
          )}

          {step === 11 && (
            <div className="space-y-8">
              <div className="rounded-3xl border border-slate-200 bg-emerald-50 p-6">
                <p className="text-sm text-slate-600">You only get one voice. Give it the daily practice it deserves.</p>
                <h2 className="mt-4 text-2xl font-semibold text-slate-900">With LanSpeech Premium you&apos;ll get:</h2>
                <ul className="mt-5 space-y-3 text-slate-800">
                  <li>✔ Complete 30 Day Fluency Program</li>
                  <li>✔ Daily Guided Lessons</li>
                  <li>✔ Unlimited Voice Recordings</li>
                  <li>✔ Progress Tracking</li>
                  <li>✔ New Lessons Every Week</li>
                  <li>✔ Lifetime Access to Your Practice History</li>
                </ul>
              </div>

              <div className="grid gap-4 lg:grid-cols-2">
                <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
                  <p className="text-sm text-slate-500">Self Learning</p>
                  <p className="mt-3 text-3xl font-semibold text-slate-900">$29/month</p>
                  <p className="mt-2 text-sm text-slate-600">or $300/year — Save 14%</p>
                </div>
                <div className="rounded-3xl border border-emerald-600 bg-emerald-50 p-6 shadow-lg">
                  <div className="flex items-center gap-2 text-emerald-700 font-semibold mb-3">
                    <Sparkles size={18} /> Guided Plan
                  </div>
                  <p className="text-3xl font-semibold text-slate-900">$99/month</p>
                  <p className="mt-2 text-sm text-slate-600">or $1000/year — includes therapist guidance</p>
                </div>
              </div>

              <div className="space-y-3">
                <Button size="lg" onClick={() => finishOnboarding('/pricing')}>
                  Continue to Billing
                </Button>
                <p className="text-center text-sm text-slate-500">Onboarding is complete. Subscribe now to unlock access and keep your progress.</p>
              </div>

              <div className="flex justify-between">
                <Button variant="secondary" onClick={goBack}>Back</Button>
                <Button variant="ghost" onClick={() => finishOnboarding('/pricing')}>
                  Go to Billing Page
                </Button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
