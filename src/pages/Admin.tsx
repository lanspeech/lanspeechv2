import { useEffect, useState } from 'react';
import { BookOpen, Users, PlusCircle, Trash2 } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../lib/supabase';
import Modal from '../components/Modal';
import type { Lesson, Profile, Unit } from '../lib/types';

type LessonLevel = 'beginner' | 'intermediate' | 'advanced';

function slugify(value: string) {
  return value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '');
}

export default function Admin() {
  const { profile, loading: authLoading } = useAuth();
  const [lessons, setLessons] = useState<Lesson[]>([]);
  const [units, setUnits] = useState<Unit[]>([]);
  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showNew, setShowNew] = useState(false);
  const [newTitle, setNewTitle] = useState('');
  const [editing, setEditing] = useState<Lesson | null>(null);
  const [editTitle, setEditTitle] = useState('');
  const [editDesc, setEditDesc] = useState('');
  const [editDuration, setEditDuration] = useState(10);
  const [editLevel, setEditLevel] = useState<LessonLevel>('beginner');
  const [confirmDelete, setConfirmDelete] = useState<string | null>(null);
  const [confirmToggleAdmin, setConfirmToggleAdmin] = useState<{ user_id: string; current: boolean } | null>(null);

  useEffect(() => {
    const load = async () => {
      setIsLoading(true);
      const [{ data: lessonsData }, { data: profilesData }, { data: unitsData }] = await Promise.all([
        supabase.from('lessons').select('*').not('unit_id', 'is', null).order('order_index'),
        supabase.from('profiles').select('*').order('display_name'),
        supabase.from('units').select('*').order('order_index'),
      ]);
      setLessons((lessonsData ?? []) as Lesson[]);
      setProfiles((profilesData ?? []) as Profile[]);
      setUnits((unitsData ?? []) as Unit[]);
      setIsLoading(false);
    };
    load();
  }, []);

  if (authLoading) {
    return null;
  }

  if (!profile?.is_admin) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center p-6">
        <div className="max-w-md w-full rounded-3xl bg-white border border-gray-100 p-8 text-center shadow-sm">
          <p className="text-lg font-semibold text-gray-900">Access denied</p>
          <p className="text-sm text-gray-500 mt-2">You do not have permission to view this page.</p>
        </div>
      </div>
    );
  }

  const handleCreate = async () => {
    if (!newTitle.trim()) return;
    const unit = units[0];
    if (!unit) return;
    const orderIndex = lessons.length + 1;
    const { data, error } = await supabase.from('lessons').insert({
      title: newTitle,
      slug: `${slugify(newTitle)}-${Date.now()}`,
      description: '',
      day_number: orderIndex,
      duration_mins: 10,
      level: 'beginner',
      module: unit.title,
      practice_phrase: null,
      is_bonus: false,
      order_index: orderIndex,
      unit_id: unit.id,
      exercises: [],
    }).select().single();
    if (!error && data) {
      setLessons(s => [...s, data as Lesson]);
      setShowNew(false);
      setNewTitle('');
    }
  };

  const toggleBonus = async (id: string, current: boolean) => {
    const { data, error } = await supabase.from('lessons').update({ is_bonus: !current }).eq('id', id).select().single();
    if (!error && data) setLessons(s => s.map(l => l.id === id ? (data as Lesson) : l));
  };

  const saveEdit = async () => {
    if (!editing) return;
    const { data, error } = await supabase.from('lessons').update({
      title: editTitle,
      description: editDesc,
      duration_mins: editDuration,
      level: editLevel,
    }).eq('id', editing.id).select().single();
    if (!error && data) {
      setLessons(s => s.map(l => l.id === editing.id ? (data as Lesson) : l));
      setEditing(null);
    }
  };

  const toggleAdmin = async (user_id: string, current: boolean) => {
    const { data, error } = await supabase.from('profiles').update({ is_admin: !current }).eq('user_id', user_id).select().single();
    if (!error && data) setProfiles(p => p.map(x => x.user_id === user_id ? (data as Profile) : x));
  };

  const removeLesson = async (id: string) => {
    await supabase.from('lessons').delete().eq('id', id);
    setLessons(s => s.filter(l => l.id !== id));
  };

  return (
    <div className="flex-1 bg-slate-50 min-h-screen p-8 overflow-y-auto">
      <div className="max-w-6xl mx-auto">
        <div className="mb-6 flex items-center justify-between">
          <h1 className="text-2xl font-bold text-gray-900">Admin — Manage Lessons & Users</h1>
          <div className="flex items-center gap-3">
            <div className="bg-white rounded-xl px-4 py-2 border border-gray-100 text-sm flex items-center gap-3">
              <BookOpen />
              <div>
                <div className="text-xs text-gray-500">Lessons</div>
                <div className="font-bold">{lessons.length}</div>
              </div>
            </div>
            <div className="bg-white rounded-xl px-4 py-2 border border-gray-100 text-sm flex items-center gap-3">
              <Users />
              <div>
                <div className="text-xs text-gray-500">Learners</div>
                <div className="font-bold">{profiles.length}</div>
              </div>
            </div>
            <button onClick={() => setShowNew(true)} className="btn-duolingo-primary flex items-center gap-2 py-2 px-3 rounded-xl">
              <PlusCircle /> Create Lesson
            </button>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-6">
          <div className="bg-white rounded-2xl p-4 border border-gray-100">
            <h3 className="font-semibold mb-3">Lessons</h3>
            {isLoading ? <div>Loading…</div> : (
              <div className="space-y-3">
                {lessons.map(l => (
                  <div key={l.id} className="flex items-center justify-between p-3 border rounded-lg">
                    <div>
                      <button onClick={() => { setEditing(l); setEditTitle(l.title); setEditDesc(l.description); setEditDuration(l.duration_mins); setEditLevel(l.level as LessonLevel); }} className="font-medium text-left">
                        Day {l.day_number}: {l.title}
                      </button>
                      <div className="text-xs text-gray-500">{l.level} • {l.duration_mins} mins</div>
                    </div>
                    <div className="flex items-center gap-2">
                      <button onClick={() => toggleBonus(l.id, l.is_bonus)} className="px-3 py-1 rounded-full border text-sm">
                        {l.is_bonus ? 'Unmark Bonus' : 'Mark Bonus'}
                      </button>
                      <button onClick={() => setConfirmDelete(l.id)} className="px-3 py-1 rounded-full border text-sm text-red-600">
                        <Trash2 />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="bg-white rounded-2xl p-4 border border-gray-100">
            <h3 className="font-semibold mb-3">Learners</h3>
            {isLoading ? <div>Loading…</div> : (
              <div className="space-y-3">
                {profiles.map(p => (
                  <div key={p.user_id} className="flex items-center justify-between p-3 border rounded-lg">
                    <div>
                      <div className="font-medium">{p.display_name} {p.is_admin ? <span className="text-xs text-emerald-600 font-medium">(admin)</span> : null}</div>
                      <div className="text-xs text-gray-500">Daily goal: {p.daily_goal_mins}m</div>
                    </div>
                    <div className="flex items-center gap-2">
                      <button onClick={() => setConfirmToggleAdmin({ user_id: p.user_id, current: Boolean(p.is_admin) })} className="px-3 py-1 rounded-full border text-sm">
                        {p.is_admin ? 'Revoke Admin' : 'Promote'}
                      </button>
                      <button className="px-3 py-1 rounded-full border text-sm">View</button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {showNew && (
        <Modal title="Create Lesson" onClose={() => setShowNew(false)}>
          <div className="flex flex-col gap-3">
            <input value={newTitle} onChange={e => setNewTitle(e.target.value)} className="border p-2 rounded" placeholder="Lesson title" />
            <div className="flex gap-2">
              <button onClick={handleCreate} className="btn-duolingo-primary px-4 py-2 rounded">Create</button>
              <button onClick={() => setShowNew(false)} className="px-4 py-2 rounded border">Cancel</button>
            </div>
          </div>
        </Modal>
      )}
      {confirmDelete && (
        <Modal title="Delete Lesson" onClose={() => setConfirmDelete(null)}>
          <div className="flex flex-col gap-4">
            <p>Are you sure you want to permanently delete this lesson? This action cannot be undone.</p>
            <div className="flex gap-2">
              <button
                onClick={async () => {
                  const id = confirmDelete;
                  setConfirmDelete(null);
                  if (id) await removeLesson(id);
                }}
                className="btn-duolingo-primary px-4 py-2 rounded"
              >Delete</button>
              <button onClick={() => setConfirmDelete(null)} className="px-4 py-2 rounded border">Cancel</button>
            </div>
          </div>
        </Modal>
      )}

      {confirmToggleAdmin && (
        <Modal title={confirmToggleAdmin.current ? 'Revoke Admin' : 'Promote to Admin'} onClose={() => setConfirmToggleAdmin(null)}>
          <div className="flex flex-col gap-4">
            <p>{confirmToggleAdmin.current ? 'Revoke admin rights for this user?' : 'Promote this user to admin? They will be able to manage lessons and learners.'}</p>
            <div className="flex gap-2">
              <button
                onClick={async () => {
                  const ctx = confirmToggleAdmin;
                  setConfirmToggleAdmin(null);
                  if (ctx) await toggleAdmin(ctx.user_id, ctx.current);
                }}
                className="btn-duolingo-primary px-4 py-2 rounded"
              >Confirm</button>
              <button onClick={() => setConfirmToggleAdmin(null)} className="px-4 py-2 rounded border">Cancel</button>
            </div>
          </div>
        </Modal>
      )}
      {editing && (
        <Modal title="Edit Lesson" onClose={() => setEditing(null)}>
          <div className="flex flex-col gap-3">
            <input value={editTitle} onChange={e => setEditTitle(e.target.value)} className="border p-2 rounded" placeholder="Title" />
            <textarea value={editDesc} onChange={e => setEditDesc(e.target.value)} className="border p-2 rounded" placeholder="Description" />
            <div className="flex gap-2">
              <input type="number" value={editDuration} onChange={e => setEditDuration(Number(e.target.value))} className="border p-2 rounded w-28" />
              <select value={editLevel} onChange={e => setEditLevel(e.target.value as LessonLevel)} className="border p-2 rounded">
                <option value="beginner">Beginner</option>
                <option value="intermediate">Intermediate</option>
                <option value="advanced">Advanced</option>
              </select>
            </div>
            <div className="flex gap-2">
              <button onClick={saveEdit} className="btn-duolingo-primary px-4 py-2 rounded">Save</button>
              <button onClick={() => setEditing(null)} className="px-4 py-2 rounded border">Cancel</button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
}
