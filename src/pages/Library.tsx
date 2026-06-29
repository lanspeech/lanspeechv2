import { useEffect, useState, useMemo } from 'react';
import { Search, CheckCircle, Play, Lock, Clock, Sparkles, HelpCircle, Brain, X, Star, Award, MessageCircle } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../lib/supabase';
import type { Lesson } from '../lib/types';
import Modal from '../components/Modal';

interface Props {
  onStartLesson: (lesson: Lesson) => void;
  dataVersion: number;
}

type Filter = 'All Levels' | 'Beginner' | 'Intermediate' | 'Advanced';
type Status = 'completed' | 'current' | 'locked';

interface LessonWithStatus extends Lesson { status: Status; }

const filters: Filter[] = ['All Levels', 'Beginner', 'Intermediate', 'Advanced'];

const EXPERT_TIPS = [
  {
    title: 'The 4-7-8 Breathing Technique',
    body: 'Inhale for 4 seconds, hold for 7, exhale slowly for 8. This activates the parasympathetic nervous system and dramatically reduces speaking anxiety before any presentation.',
    author: 'Dr. Mark Chen, Speech-Language Pathologist',
  },
  {
    title: 'Slow Down, You Move Too Fast',
    body: 'Most stutterers and anxious speakers talk too fast. Aim for 130–150 words per minute — about 20% slower than you naturally speak. Use pauses deliberately; they signal confidence, not weakness.',
    author: 'Sarah B., Fluency Specialist',
  },
  {
    title: 'The Soft Onset Technique',
    body: 'Begin words gently, as if the first sound is a soft whisper that gradually grows. This reduces the hard glottal attacks that trigger blocks. Think of starting words like releasing a feather, not striking a drum.',
    author: 'Dr. Lisa Park, Cognitive Speech Therapist',
  },
  {
    title: 'Visualization Before Speaking',
    body: 'Close your eyes for 30 seconds before a challenging conversation. Picture yourself speaking fluently, calmly, and confidently. Your brain cannot distinguish vividly imagined experience from real experience.',
    author: 'Dr. James Okafor, Behavioral Speech Therapist',
  },
  {
    title: 'The Power of Phrasing',
    body: 'Group your words into natural phrases separated by brief pauses. "I wanted / to let you know / that the meeting / is tomorrow." Chunking reduces cognitive load and makes speech feel more manageable.',
    author: 'Sarah B., Fluency Specialist',
  },
  {
    title: 'Your Voice is Your Signature',
    body: 'Everyone has a unique vocal fingerprint. Rather than trying to sound like someone else, focus on bringing out the best of your own voice — your natural resonance, tone, and rhythm.',
    author: 'Dr. Mark Chen, Speech-Language Pathologist',
  },
];

function TipsModal({ onClose }: { onClose: () => void }) {
  return (
    <Modal title="Tips from Experts" onClose={onClose} maxWidth="max-w-2xl">
      <p className="text-sm text-gray-500 mb-5">Daily nuggets of wisdom from our certified speech-language pathologists and fluency coaches.</p>
      <div className="flex flex-col gap-4">
        {EXPERT_TIPS.map((tip, i) => (
          <div key={i} className="bg-slate-50 rounded-2xl p-5 border border-slate-100 animate-fade-in-up opacity-0" style={{ animationDelay: `${i * 60}ms` }}>
            <div className="flex items-start gap-3">
              <div className="w-8 h-8 rounded-full bg-emerald-100 flex items-center justify-center shrink-0 mt-0.5">
                <Brain size={14} className="text-emerald-600" />
              </div>
              <div>
                <h4 className="font-semibold text-gray-900 text-sm mb-1">{tip.title}</h4>
                <p className="text-sm text-gray-600 leading-relaxed mb-2">{tip.body}</p>
                <p className="text-xs text-emerald-600 font-medium">— {tip.author}</p>
              </div>
            </div>
          </div>
        ))}
      </div>
    </Modal>
  );
}

function CoachModal({ onClose }: { onClose: () => void }) {
  return (
    <Modal title="Coach Profile" onClose={onClose}>
      <div className="flex items-center gap-4 mb-6">
        <img
          src="https://images.pexels.com/photos/5699516/pexels-photo-5699516.jpeg?auto=compress&cs=tinysrgb&w=150&h=150&fit=crop"
          alt="Sarah B."
          className="w-20 h-20 rounded-2xl object-cover shadow-md"
        />
        <div>
          <h3 className="font-bold text-gray-900 text-lg">Sarah B.</h3>
          <p className="text-emerald-600 text-sm font-medium">Pediatric Fluency Specialist</p>
          <div className="flex items-center gap-1 mt-1">
            {[1, 2, 3, 4, 5].map(i => (
              <Star key={i} size={12} className="text-amber-400 fill-amber-400" />
            ))}
            <span className="text-xs text-gray-500 ml-1">4.9 (127 reviews)</span>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-3 gap-3 mb-5">
        {[
          { label: 'Years Exp.', value: '12+' },
          { label: 'Clients', value: '340+' },
          { label: 'Languages', value: '3' },
        ].map(({ label, value }) => (
          <div key={label} className="bg-emerald-50 rounded-xl p-3 text-center">
            <p className="font-bold text-emerald-700 text-lg">{value}</p>
            <p className="text-xs text-gray-500">{label}</p>
          </div>
        ))}
      </div>

      <div className="mb-5">
        <h4 className="font-semibold text-gray-900 mb-2 text-sm">About</h4>
        <p className="text-sm text-gray-600 leading-relaxed">
          Sarah specializes in pediatric fluency disorders and confidence building. Her gentle, evidence-based approach has helped hundreds of children and adults find their voice. She holds a Master's in Speech-Language Pathology from UCLA and is certified in the Lidcombe Program for early stuttering intervention.
        </p>
      </div>

      <div className="mb-5">
        <h4 className="font-semibold text-gray-900 mb-2 text-sm">Specializations</h4>
        <div className="flex flex-wrap gap-2">
          {['Childhood Stuttering', 'Social Anxiety', 'Fluency Shaping', 'Cognitive Behavioral Therapy', 'Voice Confidence', 'Public Speaking'].map(tag => (
            <span key={tag} className="text-xs bg-slate-100 text-gray-600 px-3 py-1 rounded-full font-medium">{tag}</span>
          ))}
        </div>
      </div>

      <div className="mb-5">
        <h4 className="font-semibold text-gray-900 mb-3 text-sm">Recent Reviews</h4>
        <div className="flex flex-col gap-3">
          {[
            { name: 'Alex M.', text: "Sarah's patient approach changed everything for me. I went from dreading phone calls to leading team meetings.", stars: 5 },
            { name: 'Jamie K.', text: "The techniques she teaches are practical and immediately useful. Highly recommend for anyone with speech anxiety.", stars: 5 },
          ].map(({ name, text, stars }) => (
            <div key={name} className="bg-slate-50 rounded-xl p-4">
              <div className="flex items-center justify-between mb-1">
                <p className="text-sm font-semibold text-gray-800">{name}</p>
                <div className="flex gap-0.5">
                  {Array.from({ length: stars }).map((_, i) => (
                    <Star key={i} size={11} className="text-amber-400 fill-amber-400" />
                  ))}
                </div>
              </div>
              <p className="text-xs text-gray-500 leading-relaxed">{text}</p>
            </div>
          ))}
        </div>
      </div>

      <button className="btn-duolingo-primary w-full py-3 rounded-2xl text-sm font-semibold flex items-center justify-center gap-2">
        <MessageCircle size={16} />
        Request a Consultation
      </button>
    </Modal>
  );
}

function BonusHelpModal({ onClose }: { onClose: () => void }) {
  return (
    <Modal title="Free Speech Mode" onClose={onClose}>
      <div className="flex flex-col gap-4">
        <div className="w-14 h-14 rounded-2xl bg-emerald-100 flex items-center justify-center mx-auto">
          <Sparkles size={26} className="text-emerald-600" />
        </div>
        <p className="text-gray-600 text-sm leading-relaxed text-center">
          Free Speech Mode is your personal, unguided practice space. Unlike the structured daily lessons, there's no script, no prompts — just you and your voice.
        </p>
        <div className="flex flex-col gap-3">
          {[
            { title: 'Record yourself', desc: 'Speak freely on any topic for as long as you like.' },
            { title: 'Listen back', desc: 'Review your recordings to notice patterns and improvements.' },
            { title: 'Track naturally', desc: 'Sessions are still counted toward your daily goal.' },
            { title: 'Unlimited time', desc: 'No timer pressure — practice at your own pace.' },
          ].map(({ title, desc }) => (
            <div key={title} className="flex items-start gap-3 bg-slate-50 rounded-xl p-3">
              <div className="w-2 h-2 rounded-full bg-emerald-500 mt-1.5 shrink-0" />
              <div>
                <p className="text-sm font-semibold text-gray-800">{title}</p>
                <p className="text-xs text-gray-500">{desc}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </Modal>
  );
}

function LessonCard({ lesson, onStart, index, onHelpClick }: {
  lesson: LessonWithStatus;
  onStart: () => void;
  index: number;
  onHelpClick: () => void;
}) {
  const { day_number, title, description, duration_mins, status, is_bonus } = lesson;
  const delay = index * 55;

  if (is_bonus) {
    return (
      <div
        className="rounded-2xl p-5 bg-gradient-to-br from-emerald-400 to-emerald-500 flex flex-col gap-3 relative overflow-hidden animate-pop-in opacity-0 card-hover cursor-pointer"
        style={{ animationDelay: `${delay}ms` }}
      >
        <div
          className="absolute inset-0 pointer-events-none"
          style={{
            background: 'linear-gradient(105deg, transparent 40%, rgba(255,255,255,0.18) 50%, transparent 60%)',
            backgroundSize: '200% 100%',
            animation: 'shimmer 2.5s linear infinite',
          }}
        />
        <div className="flex items-center justify-between relative">
          <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-emerald-700 text-white">BONUS</span>
          <Sparkles size={18} className="text-white" />
        </div>
        <div className="flex-1 relative">
          <h3 className="font-semibold text-sm mb-1 text-white">{title}</h3>
          <p className="text-xs leading-relaxed text-emerald-50">{description}</p>
        </div>
        <div className="flex items-center justify-between pt-1 relative">
          <span className="text-xs text-white font-medium">Unlimited</span>
          <button
            onClick={onStart}
            className="btn-duolingo bg-emerald-800 text-white text-xs font-semibold px-4 py-1.5 rounded-full"
            style={{ boxShadow: '0 3px 0 0 #052e16' }}
          >
            Enter
          </button>
        </div>
        <button
          onClick={e => { e.stopPropagation(); onHelpClick(); }}
          className="absolute bottom-12 right-4 w-8 h-8 rounded-full bg-white/20 hover:bg-white/30 flex items-center justify-center transition-colors active:scale-90"
        >
          <HelpCircle size={14} className="text-white" />
        </button>
      </div>
    );
  }

  return (
    <div
      className={`rounded-2xl p-5 flex flex-col gap-3 border transition-all duration-200 animate-pop-in opacity-0 ${
        status === 'current'
          ? 'border-emerald-700 bg-white shadow-md hover:shadow-lg hover:-translate-y-0.5'
          : status === 'completed'
          ? 'border-gray-200 bg-white card-hover'
          : 'border-gray-200 bg-white opacity-60'
      }`}
      style={{ animationDelay: `${delay}ms` }}
    >
      <div className="flex items-center justify-between">
        <span
          className={`text-xs font-semibold px-2.5 py-1 rounded-full transition-colors ${
            status === 'current'
              ? 'bg-emerald-700 text-white'
              : status === 'completed'
              ? 'bg-emerald-100 text-emerald-700'
              : 'bg-gray-100 text-gray-500'
          }`}
        >
          DAY {day_number}
        </span>
        {status === 'completed' && <CheckCircle size={18} className="text-emerald-500 animate-pop-in" style={{ animationDelay: `${delay + 200}ms` }} />}
        {status === 'current' && <Play size={18} className="text-emerald-600 animate-heart-beat" />}
        {status === 'locked' && <Lock size={16} className="text-gray-400" />}
      </div>

      <div className="flex-1">
        <h3 className={`font-semibold text-sm mb-1 ${status === 'locked' ? 'text-gray-400' : 'text-gray-800'}`}>
          {title}
        </h3>
        <p className={`text-xs leading-relaxed ${status === 'locked' ? 'text-gray-400' : 'text-gray-500'}`}>
          {description}
        </p>
      </div>

      <div className="flex items-center justify-between pt-1">
        <div className={`flex items-center gap-1 text-xs ${status === 'locked' ? 'text-gray-400' : 'text-gray-500'}`}>
          <Clock size={12} />
          <span>{duration_mins} mins</span>
        </div>
        {status === 'completed' && (
          <button onClick={onStart} className="text-xs font-semibold text-emerald-600 hover:text-emerald-700 transition-colors hover:underline">
            Review
          </button>
        )}
        {status === 'current' && (
          <button
            onClick={onStart}
            className="btn-duolingo bg-emerald-700 text-white text-xs font-semibold px-4 py-1.5 rounded-full"
            style={{ boxShadow: '0 3px 0 0 #14532d' }}
          >
            Start
          </button>
        )}
        {status === 'locked' && <span className="text-xs text-gray-400">Locked</span>}
      </div>
    </div>
  );
}

export default function Library({ onStartLesson, dataVersion }: Props) {
  const { user } = useAuth();
  const [lessons, setLessons] = useState<Lesson[]>([]);
  const [completedIds, setCompletedIds] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [activeFilter, setActiveFilter] = useState<Filter>('All Levels');
  const [barKey, setBarKey] = useState(0);
  const [showTips, setShowTips] = useState(false);
  const [showCoach, setShowCoach] = useState(false);
  const [showBonusHelp, setShowBonusHelp] = useState(false);

  useEffect(() => {
    if (!user) return;
    const load = async () => {
      setLoading(true);
      const [{ data: lessonsData }, { data: completionsData }] = await Promise.all([
        supabase.from('lessons').select('*').order('order_index'),
        supabase.from('lesson_completions').select('lesson_id').eq('user_id', user.id),
      ]);
      setLessons((lessonsData ?? []) as Lesson[]);
      setCompletedIds(new Set((completionsData ?? []).map(c => c.lesson_id)));
      setLoading(false);
      setBarKey(k => k + 1);
    };
    load();
  }, [user, dataVersion]);

  const lessonsWithStatus = useMemo((): LessonWithStatus[] => {
    const regularLessons = lessons.filter(l => !l.is_bonus).sort((a, b) => a.order_index - b.order_index);
    let foundCurrent = false;

    return lessons.map(lesson => {
      if (lesson.is_bonus) return { ...lesson, status: 'current' as Status };

      const idx = regularLessons.findIndex(l => l.id === lesson.id);
      const isCompleted = completedIds.has(lesson.id);
      const prevCompleted = idx === 0 || completedIds.has(regularLessons[idx - 1]?.id ?? '');

      let status: Status;
      if (isCompleted) {
        status = 'completed';
      } else if (!foundCurrent && prevCompleted) {
        status = 'current';
        foundCurrent = true;
      } else {
        status = 'locked';
      }
      return { ...lesson, status };
    });
  }, [lessons, completedIds]);

  const filtered = useMemo(() => {
    return lessonsWithStatus.filter(l => {
      const matchesSearch = !search ||
        l.title.toLowerCase().includes(search.toLowerCase()) ||
        l.description.toLowerCase().includes(search.toLowerCase());
      const matchesFilter = activeFilter === 'All Levels' || l.level === activeFilter.toLowerCase();
      return matchesSearch && matchesFilter;
    });
  }, [lessonsWithStatus, search, activeFilter]);

  const totalLessons = lessons.filter(l => !l.is_bonus).length;
  const completedCount = lessons.filter(l => !l.is_bonus && completedIds.has(l.id)).length;
  const progressPct = totalLessons > 0 ? Math.round((completedCount / totalLessons) * 100) : 0;
  const currentStep = completedCount + 1;

  return (
    <div className="flex-1 bg-slate-50 min-h-screen overflow-y-auto">
      {showTips && <TipsModal onClose={() => setShowTips(false)} />}
      {showCoach && <CoachModal onClose={() => setShowCoach(false)} />}
      {showBonusHelp && <BonusHelpModal onClose={() => setShowBonusHelp(false)} />}

      {/* Journey header */}
      <div className="bg-gradient-to-r from-emerald-50 to-teal-50 border-b border-emerald-100 px-8 py-6 animate-fade-in">
        <h1 className="text-2xl font-bold text-gray-900 mb-1">Continue your journey</h1>
        <p className="text-gray-500 text-sm mb-4">
          Small steps lead to great strides. Today's practice focuses on gentle articulation and breath control.
        </p>
        <div className="flex items-center gap-3">
          <div className="flex-1 bg-emerald-100 rounded-full h-2.5 overflow-hidden">
            <div
              key={barKey}
              className="bg-emerald-700 h-2.5 rounded-full animated-bar"
              style={{ width: `${progressPct}%` }}
            />
          </div>
          <span className="text-sm text-emerald-700 font-medium whitespace-nowrap animate-pop-in opacity-0" style={{ animationDelay: '600ms' }}>
            Step {currentStep} of {totalLessons}
          </span>
        </div>
      </div>

      <div className="px-8 py-6 max-w-5xl mx-auto">
        {/* Search + filters */}
        <div className="flex items-center gap-3 mb-6 flex-wrap animate-fade-in-up opacity-0" style={{ animationDelay: '100ms' }}>
          <div className="relative flex-1 min-w-48">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              placeholder="Search lessons..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="w-full pl-9 pr-4 py-2.5 rounded-full border border-gray-200 bg-white text-sm focus:outline-none focus:ring-2 focus:ring-emerald-300 transition-all"
            />
          </div>
          <div className="flex gap-2 flex-wrap">
            {filters.map(f => (
              <button
                key={f}
                onClick={() => setActiveFilter(f)}
                className={`px-4 py-2 rounded-full text-sm font-medium transition-all duration-200 active:scale-95 ${
                  activeFilter === f
                    ? 'bg-emerald-700 text-white shadow-md scale-105'
                    : 'bg-white border border-gray-200 text-gray-600 hover:bg-gray-50 hover:border-gray-300'
                }`}
              >
                {f}
              </button>
            ))}
          </div>
        </div>

        {/* Lesson grid */}
        {loading ? (
          <div className="grid grid-cols-4 gap-4">
            {[1, 2, 3, 4, 5, 6, 7, 8].map(i => (
              <div key={i} className="h-48 bg-white rounded-2xl animate-pulse border border-gray-100" />
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-4 gap-4 mb-8">
            {filtered.map((lesson, i) => (
              <LessonCard
                key={lesson.id}
                lesson={lesson}
                index={i}
                onStart={() => onStartLesson(lesson)}
                onHelpClick={() => setShowBonusHelp(true)}
              />
            ))}
            {filtered.length === 0 && (
              <div className="col-span-4 text-center py-16 text-gray-400 animate-fade-in">
                <p className="font-medium">No lessons match your search.</p>
              </div>
            )}
          </div>
        )}

        {/* Bottom tips + coach cards */}
        <div className="grid grid-cols-2 gap-4 animate-fade-in-up opacity-0" style={{ animationDelay: '400ms' }}>
          <button
            onClick={() => setShowTips(true)}
            className="bg-white rounded-2xl p-5 flex items-center gap-4 border border-gray-100 card-hover text-left w-full"
          >
            <div className="w-12 h-12 rounded-full bg-gray-100 flex items-center justify-center shrink-0">
              <Brain size={22} className="text-gray-500" />
            </div>
            <div>
              <p className="font-medium text-gray-800 text-sm">Tips from Experts</p>
              <p className="text-xs text-gray-500 mt-0.5">Daily nuggets of wisdom to help you manage speech anxiety.</p>
              <p className="text-xs text-emerald-700 font-semibold mt-1">Read More →</p>
            </div>
          </button>
          <button
            onClick={() => setShowCoach(true)}
            className="bg-white rounded-2xl p-5 flex items-center gap-4 border border-gray-100 card-hover text-left w-full"
          >
            <img
              src="https://images.pexels.com/photos/5699516/pexels-photo-5699516.jpeg?auto=compress&cs=tinysrgb&w=80&h=80&fit=crop"
              alt="Coach Sarah B"
              className="w-12 h-12 rounded-full object-cover shrink-0"
            />
            <div>
              <p className="font-medium text-gray-800 text-sm">New Coach: Sarah B.</p>
              <p className="text-xs text-gray-500 mt-0.5">Specializing in pediatric fluency and confidence building.</p>
              <p className="text-xs text-emerald-700 font-semibold mt-1">View Profile →</p>
            </div>
          </button>
        </div>
      </div>
    </div>
  );
}
