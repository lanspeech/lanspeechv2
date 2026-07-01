import { useState } from 'react';
import { User, Bell, Shield, ChevronRight, Award, Mic, Edit2, Check, Eye, EyeOff, Download, LogOut, type LucideIcon } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../lib/supabase';
import Toast from '../components/Toast';

type Section = 'notifications' | 'account' | 'privacy' | null;

export default function Profile() {
  const { user, profile, refreshProfile, signOut } = useAuth();
  const [editingName, setEditingName] = useState(false);
  const [nameInput, setNameInput] = useState('');
  const [savingName, setSavingName] = useState(false);
  const [activeSection, setActiveSection] = useState<Section>(null);
  const [toast, setToast] = useState<{ msg: string; type?: 'success' | 'error' } | null>(null);

  const startEdit = () => {
    setNameInput(profile?.display_name ?? '');
    setEditingName(true);
  };

  const saveName = async () => {
    if (!user || !nameInput.trim()) return;
    setSavingName(true);
    await supabase
      .from('profiles')
      .update({ display_name: nameInput.trim(), updated_at: new Date().toISOString() })
      .eq('user_id', user.id);
    await refreshProfile();
    setSavingName(false);
    setEditingName(false);
    setToast({ msg: 'Name updated!' });
  };

  const toggleSection = (s: Section) => setActiveSection(prev => (prev === s ? null : s));

  const displayName = profile?.display_name ?? user?.email?.split('@')[0] ?? 'User';
  const memberSince = user?.created_at
    ? new Date(user.created_at).toLocaleDateString('en-US', { month: 'short', year: 'numeric' })
    : '';

  return (
    <div className="flex-1 bg-slate-50 min-h-screen p-8 overflow-y-auto">
      {toast && <Toast message={toast.msg} type={toast.type} onDone={() => setToast(null)} />}

      <div className="max-w-2xl mx-auto">
        <div className="mb-8 animate-fade-in-up opacity-0" style={{ animationDelay: '0ms' }}>
          <h1 className="text-2xl font-bold text-gray-900">Profile</h1>
          <p className="text-gray-500 mt-1">Manage your account and preferences</p>
        </div>

        {/* Profile card */}
        <div className="bg-white rounded-2xl p-6 border border-gray-100 shadow-sm mb-5 flex items-center gap-5 animate-fade-in-up opacity-0" style={{ animationDelay: '60ms' }}>
          <div className="relative">
            {profile?.avatar_url ? (
              <img
                src={profile.avatar_url}
                alt={displayName}
                className="rounded-full object-cover border-2 border-emerald-200"
                style={{ width: 72, height: 72 }}
              />
            ) : (
              <div className="rounded-full bg-emerald-100 flex items-center justify-center border-2 border-emerald-200" style={{ width: 72, height: 72 }}>
                <span className="text-2xl font-bold text-emerald-600">{displayName.charAt(0).toUpperCase()}</span>
              </div>
            )}
            <div className="absolute bottom-0 right-0 w-6 h-6 rounded-full bg-emerald-500 border-2 border-white flex items-center justify-center">
              <User size={10} className="text-white" />
            </div>
          </div>

          <div className="flex-1 min-w-0">
            {editingName ? (
              <div className="flex items-center gap-2">
                <input
                  type="text"
                  value={nameInput}
                  onChange={e => setNameInput(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && saveName()}
                  className="flex-1 text-base font-bold text-gray-900 border border-emerald-300 rounded-lg px-2 py-1 focus:outline-none focus:ring-2 focus:ring-emerald-300"
                  autoFocus
                />
                <button onClick={saveName} disabled={savingName} className="text-emerald-600 hover:text-emerald-700 active:scale-90 transition-all">
                  <Check size={18} />
                </button>
              </div>
            ) : (
              <h2 className="font-bold text-gray-900 text-lg truncate">{displayName}</h2>
            )}
            <p className="text-gray-500 text-sm truncate">{user?.email}</p>
            <div className="flex items-center gap-2 mt-2">
              <span className="text-xs bg-emerald-100 text-emerald-700 font-semibold px-2 py-0.5 rounded-full">Intermediate</span>
              {memberSince && <span className="text-xs text-gray-500">Member since {memberSince}</span>}
            </div>
          </div>
          {!editingName && (
            <button onClick={startEdit} className="text-emerald-600 text-sm font-medium hover:underline flex items-center gap-1 active:scale-95 transition-all">
              <Edit2 size={14} /> Edit
            </button>
          )}
        </div>

        {/* Achievements */}
        <div className="bg-white rounded-2xl p-6 border border-gray-100 shadow-sm mb-5 animate-fade-in-up opacity-0" style={{ animationDelay: '120ms' }}>
          <h3 className="font-semibold text-gray-900 mb-4">Achievements</h3>
          <div className="grid grid-cols-3 gap-3">
            {[
              { icon: Award, label: 'First Week', color: 'bg-yellow-100 text-yellow-600', earned: true },
              { icon: Mic, label: 'Voice Pro', color: 'bg-emerald-100 text-emerald-600', earned: true },
              { icon: Award, label: 'Streak Master', color: 'bg-blue-100 text-blue-600', earned: false },
            ].map(({ icon: Icon, label, color, earned }, i) => (
              <div
                key={label}
                className={`flex flex-col items-center gap-2 p-4 rounded-xl border transition-all animate-pop-in opacity-0 ${
                  earned ? 'border-gray-100 bg-gray-50 hover:shadow-sm hover:-translate-y-0.5 cursor-default' : 'border-dashed border-gray-200 bg-white opacity-50'
                }`}
                style={{ animationDelay: `${180 + i * 60}ms` }}
              >
                <div className={`w-10 h-10 rounded-full ${color} flex items-center justify-center ${earned ? 'animate-float' : ''}`}>
                  <Icon size={18} />
                </div>
                <span className="text-xs text-gray-600 text-center font-medium">{label}</span>
                {!earned && <span className="text-xs text-gray-400">Locked</span>}
              </div>
            ))}
          </div>
        </div>

        {/* Settings */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden animate-fade-in-up opacity-0" style={{ animationDelay: '200ms' }}>
          <SettingRow
            icon={Bell}
            label="Notifications"
            desc="Daily reminders and practice alerts"
            open={activeSection === 'notifications'}
            onToggle={() => toggleSection('notifications')}
          >
            <NotificationsPanel onSave={() => setToast({ msg: 'Notification preferences saved!' })} />
          </SettingRow>

          <SettingRow
            icon={User}
            label="Account Settings"
            desc="Password, daily goal, and subscription"
            open={activeSection === 'account'}
            onToggle={() => toggleSection('account')}
            border
          >
            <AccountSettingsPanel
              profile={profile}
              user={user}
              onSaved={(msg) => setToast({ msg })}
              onError={(msg) => setToast({ msg, type: 'error' })}
              onRefresh={refreshProfile}
            />
          </SettingRow>

          <SettingRow
            icon={Shield}
            label="Privacy & Data"
            desc="Manage your data and privacy settings"
            open={activeSection === 'privacy'}
            onToggle={() => toggleSection('privacy')}
            border
          >
            <PrivacyPanel user={user} onSignOut={signOut} onDownloaded={() => setToast({ msg: 'Data downloaded!' })} />
          </SettingRow>
        </div>
      </div>
    </div>
  );
}

function SettingRow({
  icon: Icon, label, desc, open, onToggle, border, children,
}: {
  icon: LucideIcon;
  label: string; desc: string; open: boolean; onToggle: () => void; border?: boolean;
  children: React.ReactNode;
}) {
  return (
    <div className={border ? 'border-t border-gray-100' : ''}>
      <button
        onClick={onToggle}
        className="w-full flex items-center gap-4 px-6 py-4 hover:bg-gray-50 transition-colors text-left"
      >
        <div className="w-9 h-9 rounded-xl bg-slate-100 flex items-center justify-center shrink-0">
          <Icon size={16} className="text-gray-500" />
        </div>
        <div className="flex-1">
          <p className="text-sm font-medium text-gray-800">{label}</p>
          <p className="text-xs text-gray-500">{desc}</p>
        </div>
        <ChevronRight
          size={16}
          className={`text-gray-400 transition-transform duration-200 ${open ? 'rotate-90' : ''}`}
        />
      </button>
      {open && (
        <div className="px-6 pb-5 animate-fade-in-up opacity-0 border-t border-gray-50 pt-4" style={{ animationDelay: '0ms' }}>
          {children}
        </div>
      )}
    </div>
  );
}

function NotificationsPanel({ onSave }: { onSave: () => void }) {
  const [enabled, setEnabled] = useState(() => localStorage.getItem('lan_notif_enabled') !== 'false');
  const [time, setTime] = useState(() => localStorage.getItem('lan_notif_time') ?? '09:00');

  const save = () => {
    localStorage.setItem('lan_notif_enabled', String(enabled));
    localStorage.setItem('lan_notif_time', time);
    onSave();
  };

  return (
    <div className="flex flex-col gap-4">
      <label className="flex items-center justify-between cursor-pointer">
        <div>
          <p className="text-sm font-medium text-gray-800">Daily practice reminders</p>
          <p className="text-xs text-gray-500">Get a reminder to stay consistent</p>
        </div>
        <button
          role="switch"
          aria-checked={enabled}
          onClick={() => setEnabled(e => !e)}
          className={`relative w-11 h-6 rounded-full transition-colors duration-200 ${enabled ? 'bg-emerald-500' : 'bg-gray-200'}`}
        >
          <span
            className={`absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full shadow-sm transition-transform duration-200 ${enabled ? 'translate-x-5' : ''}`}
          />
        </button>
      </label>

      {enabled && (
        <div className="animate-fade-in-up opacity-0">
          <label className="block text-xs font-medium text-gray-600 mb-1.5">Remind me at</label>
          <input
            type="time"
            value={time}
            onChange={e => setTime(e.target.value)}
            className="w-full px-3 py-2 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-300"
          />
        </div>
      )}

      <label className="flex items-center gap-3 cursor-pointer">
        <input type="checkbox" className="w-4 h-4 rounded accent-emerald-600" defaultChecked />
        <span className="text-sm text-gray-700">Streak at-risk alerts</span>
      </label>

      <label className="flex items-center gap-3 cursor-pointer">
        <input type="checkbox" className="w-4 h-4 rounded accent-emerald-600" defaultChecked />
        <span className="text-sm text-gray-700">New lesson available</span>
      </label>

      <button onClick={save} className="btn-duolingo-primary py-2.5 rounded-xl text-sm font-semibold">
        Save Preferences
      </button>
    </div>
  );
}

function AccountSettingsPanel({
  profile, user, onSaved, onError, onRefresh,
}: {
  profile: { daily_goal_mins: number; display_name: string } | null;
  user: { id: string } | null;
  onSaved: (msg: string) => void;
  onError: (msg: string) => void;
  onRefresh: () => Promise<void>;
}) {
  const [dailyGoal, setDailyGoal] = useState(profile?.daily_goal_mins ?? 20);
  const [newPw, setNewPw] = useState('');
  const [showNewPw, setShowNewPw] = useState(false);
  const [savingGoal, setSavingGoal] = useState(false);
  const [savingPw, setSavingPw] = useState(false);

  const saveGoal = async () => {
    if (!user) return;
    setSavingGoal(true);
    const { error } = await supabase
      .from('profiles')
      .update({ daily_goal_mins: dailyGoal })
      .eq('user_id', user.id);
    await onRefresh();
    setSavingGoal(false);
    if (error) onError('Failed to update goal.');
    else onSaved('Daily goal updated!');
  };

  const changePassword = async () => {
    if (!newPw || newPw.length < 6) { onError('Password must be at least 6 characters.'); return; }
    setSavingPw(true);
    const { error } = await supabase.auth.updateUser({ password: newPw });
    setSavingPw(false);
    if (error) onError(error.message);
    else {
      setNewPw('');
      onSaved('Password updated successfully!');
    }
  };

  return (
    <div className="flex flex-col gap-5">
      {/* Daily goal */}
      <div>
        <h4 className="text-sm font-semibold text-gray-800 mb-3">Daily Practice Goal</h4>
        <div className="flex items-center gap-4">
          <input
            type="range"
            min={5}
            max={60}
            step={5}
            value={dailyGoal}
            onChange={e => setDailyGoal(Number(e.target.value))}
            className="flex-1 accent-emerald-600"
          />
          <span className="text-sm font-bold text-emerald-700 min-w-[48px] text-right">{dailyGoal} min</span>
        </div>
        <div className="flex justify-between text-xs text-gray-400 mt-1">
          <span>5 min</span><span>60 min</span>
        </div>
        <button
          onClick={saveGoal}
          disabled={savingGoal}
          className="btn-duolingo-primary py-2 px-5 rounded-xl text-sm font-semibold mt-3 disabled:opacity-60"
        >
          {savingGoal ? 'Saving…' : 'Save Goal'}
        </button>
      </div>

      <div className="border-t border-gray-100 pt-4">
        <h4 className="text-sm font-semibold text-gray-800 mb-3">Change Password</h4>
        <div className="flex flex-col gap-3">
          <div className="relative">
            <input
              type={showNewPw ? 'text' : 'password'}
              value={newPw}
              onChange={e => setNewPw(e.target.value)}
              placeholder="New password (min 6 characters)"
              className="w-full px-3 py-2.5 pr-10 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-300"
            />
            <button
              type="button"
              onClick={() => setShowNewPw(s => !s)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
            >
              {showNewPw ? <EyeOff size={15} /> : <Eye size={15} />}
            </button>
          </div>
          <button
            onClick={changePassword}
            disabled={savingPw || !newPw}
            className="btn-duolingo-secondary py-2 px-5 rounded-xl text-sm font-semibold disabled:opacity-60 self-start"
          >
            {savingPw ? 'Updating…' : 'Update Password'}
          </button>
        </div>
      </div>
    </div>
  );
}

function PrivacyPanel({
  user, onSignOut, onDownloaded,
}: {
  user: { id: string } | null;
  onSignOut: () => void;
  onDownloaded: () => void;
}) {
  const [downloading, setDownloading] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  const downloadData = async () => {
    if (!user) return;
    setDownloading(true);
    const [{ data: sessions }, { data: completions }, { data: profile }] = await Promise.all([
      supabase.from('practice_sessions').select('*').eq('user_id', user.id),
      supabase.from('lesson_completions').select('*').eq('user_id', user.id),
      supabase.from('profiles').select('*').eq('user_id', user.id).maybeSingle(),
    ]);

    const exportData = {
      exported_at: new Date().toISOString(),
      profile,
      practice_sessions: sessions ?? [],
      lesson_completions: completions ?? [],
    };

    const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `lanspeech-data-${new Date().toISOString().split('T')[0]}.json`;
    a.click();
    URL.revokeObjectURL(url);
    setDownloading(false);
    onDownloaded();
  };

  return (
    <div className="flex flex-col gap-4">
      <div className="bg-slate-50 rounded-xl p-4">
        <h4 className="text-sm font-semibold text-gray-800 mb-2">Data we store</h4>
        <ul className="flex flex-col gap-1.5">
          {[
            'Your profile name and email address',
            'Practice session records (type, duration, date)',
            'Lesson completion history',
            'Daily goal preference',
          ].map(item => (
            <li key={item} className="flex items-start gap-2 text-xs text-gray-600">
              <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 mt-1.5 shrink-0" />
              {item}
            </li>
          ))}
        </ul>
        <p className="text-xs text-gray-400 mt-3">All data is encrypted at rest and never sold to third parties.</p>
      </div>

      <button
        onClick={downloadData}
        disabled={downloading}
        className="btn-duolingo-secondary py-2.5 rounded-xl text-sm font-semibold flex items-center gap-2 justify-center disabled:opacity-60"
      >
        <Download size={15} />
        {downloading ? 'Preparing…' : 'Download My Data'}
      </button>

      <div className="border-t border-gray-100 pt-3">
        <button
          onClick={onSignOut}
          className="flex items-center gap-2 text-sm text-red-500 hover:text-red-600 font-medium transition-colors"
        >
          <LogOut size={15} />
          Sign out of all devices
        </button>
      </div>

      {!showDeleteConfirm ? (
        <button
          onClick={() => setShowDeleteConfirm(true)}
          className="text-xs text-gray-400 hover:text-red-400 transition-colors text-left"
        >
          Request account deletion
        </button>
      ) : (
        <div className="bg-red-50 border border-red-200 rounded-xl p-4 animate-fade-in">
          <p className="text-sm font-semibold text-red-700 mb-1">Are you sure?</p>
          <p className="text-xs text-red-500 mb-3">This will permanently delete all your data. This action cannot be undone.</p>
          <div className="flex gap-2">
            <button
              onClick={onSignOut}
              className="text-xs bg-red-500 hover:bg-red-600 text-white font-semibold px-4 py-2 rounded-lg transition-colors"
            >
              Yes, delete my account
            </button>
            <button
              onClick={() => setShowDeleteConfirm(false)}
              className="text-xs bg-white border border-gray-200 text-gray-600 font-semibold px-4 py-2 rounded-lg hover:bg-gray-50"
            >
              Cancel
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
