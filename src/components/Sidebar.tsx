import { useState } from 'react';
import { LayoutDashboard, BookOpen, TrendingUp, User, HelpCircle, LogOut, Leaf, Mail, Send } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import Modal from './Modal';
import Toast from './Toast';
import Button from './ui/Button';

export type Page = 'dashboard' | 'library' | 'progress' | 'profile' | 'admin' | 'debug';

interface SidebarProps {
  currentPage: Page;
  onNavigate: (page: Page) => void;
  onStartPractice?: () => void;
  showStartPractice?: boolean;
}

const navItems = [
  { id: 'dashboard' as Page, label: 'Dashboard', icon: LayoutDashboard },
  { id: 'library' as Page, label: 'Library', icon: BookOpen },
  { id: 'progress' as Page, label: 'Progress', icon: TrendingUp },
  { id: 'profile' as Page, label: 'Profile', icon: User },
  { id: 'admin' as Page, label: 'Admin', icon: LayoutDashboard },
];

function SupportModal({ onClose }: { onClose: () => void }) {
  const [topic, setTopic] = useState('general');
  const [message, setMessage] = useState('');
  const [sending, setSending] = useState(false);
  const [sent, setSent] = useState(false);
  const [toast, setToast] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!message.trim()) return;
    setSending(true);
    await new Promise(r => setTimeout(r, 800));
    setSending(false);
    setSent(true);
    setToast('Message sent! We\'ll get back to you within 24 hours.');
  };

  if (sent) {
    return (
      <Modal title="Support" onClose={onClose} maxWidth="max-w-md">
        {toast && <Toast message={toast} onDone={() => setToast(null)} />}
        <div className="text-center py-8">
          <div className="w-14 h-14 rounded-full bg-emerald-100 flex items-center justify-center mx-auto mb-4 animate-bounce-in">
            <Send size={24} className="text-emerald-600" />
          </div>
          <h3 className="text-lg font-bold text-gray-900 mb-2">Message Sent!</h3>
          <p className="text-gray-500 text-sm mb-6">We typically respond within 24 hours. Check your email for updates.</p>
          <Button onClick={onClose} size="md">Done</Button>
        </div>
      </Modal>
    );
  }

  return (
    <Modal title="Support" onClose={onClose} maxWidth="max-w-md">
      {toast && <Toast message={toast} onDone={() => setToast(null)} />}
      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1.5">What can we help with?</label>
          <select
            value={topic}
            onChange={e => setTopic(e.target.value)}
            className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
          >
            <option value="general">General Question</option>
            <option value="technical">Technical Issue</option>
            <option value="content">Content Request</option>
            <option value="feedback">Feedback</option>
            <option value="account">Account Help</option>
          </select>
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1.5">Your message</label>
          <textarea
            value={message}
            onChange={e => setMessage(e.target.value)}
            placeholder="Describe how we can improve practice for stammerers..."
            rows={4}
            className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent resize-none"
          />
        </div>
        <div className="flex items-center gap-3 pt-2">
          <a
            href="mailto:support@lanspeech.app"
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm text-gray-600 hover:bg-gray-50 transition-colors"
          >
            <Mail size={16} />
            Email us
          </a>
          <Button type="submit" size="md" className="flex-1" disabled={!message.trim() || sending}>
            {sending ? 'Sending...' : 'Send Message'}
          </Button>
        </div>
      </form>
    </Modal>
  );
}

export default function Sidebar({ currentPage, onNavigate, onStartPractice, showStartPractice }: SidebarProps) {
  const { profile, signOut } = useAuth();
  const [showSupport, setShowSupport] = useState(false);

  const renderContent = () => (
    <div className="flex flex-col h-full">
      {showSupport && <SupportModal onClose={() => setShowSupport(false)} />}
      {/* Logo */}
      <div className="mb-10 animate-slide-in-left opacity-0" style={{ animationDelay: '0ms' }}>
        <div className="flex items-center gap-2 mb-1">
          <div className="w-9 h-9 rounded-full bg-emerald-500 flex items-center justify-center hover:bg-emerald-600 transition-colors hover:scale-110 cursor-pointer" style={{ transition: 'transform 0.2s, background-color 0.2s' }}>
            <Leaf className="w-5 h-5 text-white animate-float" />
          </div>
          <span className="text-xl font-bold text-gray-900">LanSpeech</span>
        </div>
        <p className="text-xs text-gray-500 pl-11">Nurturing Progress</p>
      </div>

      {/* Nav */}
      <nav className="flex flex-col gap-1 flex-1">
        {navItems.map(({ id, label, icon: Icon }, i) => {
          if (id === 'admin' && !profile?.is_admin) return null;
          const active = currentPage === id;
          return (
            <button
              key={id}
              onClick={() => onNavigate(id)}
              className={`group flex items-center gap-3 px-4 py-2.5 rounded-xl text-sm font-medium transition-all duration-200 w-full text-left animate-slide-in-left opacity-0 ${
                active
                  ? 'bg-emerald-100 text-emerald-700 scale-[1.02]'
                  : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900 hover:translate-x-0.5'
              }`}
              style={{ animationDelay: `${i * 50 + 80}ms` }}
            >
              <Icon
                size={18}
                className={`transition-all duration-200 ${
                  active
                    ? 'text-emerald-600 scale-110'
                    : 'text-gray-400 group-hover:text-gray-600 group-hover:scale-105'
                }`}
              />
              {label}
              {active && (
                <span className="ml-auto w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pop-in" />
              )}
            </button>
          );
        })}
      </nav>

      {import.meta.env.DEV && (
        <div className="mt-3 px-4">
          <button
            onClick={() => onNavigate('debug' as Page)}
            className="w-full flex items-center gap-3 px-4 py-2.5 rounded-xl text-sm text-gray-600 hover:bg-gray-50"
          >
            Debug
          </button>
        </div>
      )}

      {/* Start Practice button */}
      {showStartPractice && onStartPractice && (
          <Button size="lg" onClick={() => onStartPractice()} className="w-full mb-3 shadow-lg shadow-emerald-200/50">
            Start Practice
          </Button>
      )}

      {/* User info */}
      {profile && (
        <div className="px-4 py-3 mb-2 border-t border-gray-100 pt-4">
          <p className="text-xs font-semibold text-gray-800 truncate">{profile.display_name}</p>
          <p className="text-xs text-gray-400">Daily goal: {profile.daily_goal_mins} min</p>
        </div>
      )}

      <div className="flex flex-col gap-1">
        <button
          onClick={() => setShowSupport(true)}
          className="flex items-center gap-3 px-4 py-2.5 rounded-xl text-sm text-gray-500 hover:bg-gray-50 hover:text-gray-700 hover:translate-x-0.5 transition-all duration-150 w-full"
        >
          <HelpCircle size={18} className="text-gray-400" />
          Support
        </button>
        <button
          onClick={signOut}
          className="flex items-center gap-3 px-4 py-2.5 rounded-xl text-sm text-gray-500 hover:bg-red-50 hover:text-red-500 hover:translate-x-0.5 active:scale-95 transition-all duration-150 w-full"
        >
          <LogOut size={18} className="text-gray-400" />
          Sign Out
        </button>
      </div>
    </div>
  );

  const mobileItems = navItems.filter(item => item.id !== 'admin' || profile?.is_admin);

  return (
    <>
      {/* Desktop sidebar */}
      <aside className="hidden md:flex md:w-56 min-h-screen bg-white flex-col py-8 px-4 border-r border-gray-100 shrink-0">
        {renderContent()}
      </aside>

      {/* Mobile bottom tabs */}
      <div className="md:hidden fixed inset-x-0 bottom-0 z-50 border-t border-gray-200 bg-white px-3 py-3 shadow-[0_-12px_40px_rgba(15,23,42,0.08)]">
        {showStartPractice && onStartPractice && (
          <button
            onClick={() => onStartPractice()}
            className="w-full mb-3 rounded-3xl bg-emerald-700 px-4 py-3.5 text-base font-semibold text-white shadow-lg shadow-emerald-200/50 min-h-[56px]"
          >
            Start Practice
          </button>
        )}
        <div className={`grid gap-2 ${mobileItems.length === 5 ? 'grid-cols-5' : 'grid-cols-4'}`}>
          {mobileItems.map(({ id, label, icon: Icon }) => {
            const active = currentPage === id;
            return (
              <button
                key={id}
                onClick={() => onNavigate(id)}
                className={`flex flex-col items-center justify-center gap-1 rounded-3xl px-2 py-2 text-[11px] font-semibold transition w-full min-h-[64px] ${active ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-50 text-gray-600 hover:bg-slate-100'}`}
              >
                <Icon size={20} className={active ? 'text-emerald-700' : 'text-gray-400'} />
                <span className="truncate w-full text-[11px] leading-tight">{label}</span>
              </button>
            );
          })}
        </div>
      </div>
    </>
  );
}
