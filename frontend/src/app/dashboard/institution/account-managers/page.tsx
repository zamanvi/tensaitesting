'use client';
import DashboardLayout from '@/components/shared/DashboardLayout';
import { useLang } from '@/context/LanguageContext';
import { useAuthStore } from '@/store/authStore';
import api from '@/lib/api';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';

interface Manager {
  id: number;
  name: string;
  role: string;
  email: string;
  phone: string;
  created_at: string;
}

interface ManagerForm {
  name: string;
  role: string;
  email: string;
  phone: string;
}

const blank: ManagerForm = { name: '', role: '', email: '', phone: '' };

const inputCls = 'w-full border border-slate-200 rounded-xl px-3 py-2.5 text-sm text-slate-800 bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500 placeholder:text-slate-400';

const ROLES = ['HR Manager', 'Admission Officer', 'Admission Director', 'Coordinator', 'Principal', 'Other'];

export default function AccountManagersPage() {
  const { lang } = useLang();
  const { user } = useAuthStore();
  const router = useRouter();
  const qc = useQueryClient();
  const ja = lang === 'ja'; const bn = lang === 'bn';

  useEffect(() => {
    if (user && user.gateway_type !== 'institution') router.replace(`/dashboard/${user.gateway_type}`);
  }, [user, router]);

  const [showForm, setShowForm] = useState(false);
  const [editId, setEditId] = useState<number | null>(null);
  const [form, setForm] = useState<ManagerForm>(blank);
  const [formError, setFormError] = useState('');
  const [deletingId, setDeletingId] = useState<number | null>(null);
  const [removeErr, setRemoveErr] = useState('');

  const { data, isLoading } = useQuery({
    queryKey: ['institution-managers'],
    queryFn: () => api.get('/institution/account-managers').then(r => r.data),
    staleTime: 60_000,
  });

  const managers: Manager[] = data?.data ?? [];

  function openAdd() { setEditId(null); setForm(blank); setFormError(''); setShowForm(true); }

  function openEdit(m: Manager) {
    setEditId(m.id);
    setForm({ name: m.name, role: m.role, email: m.email, phone: m.phone });
    setFormError('');
    setShowForm(true);
  }

  function closeForm() { setShowForm(false); setEditId(null); setForm(blank); setFormError(''); }

  const save = useMutation({
    mutationFn: (payload: ManagerForm) =>
      editId
        ? api.put(`/institution/account-managers/${editId}`, payload)
        : api.post('/institution/account-managers', payload),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['institution-managers'] });
      closeForm();
    },
    onError: (e: unknown) => {
      const err = e as { response?: { data?: { message?: string; errors?: Record<string, string[]> } } };
      const errs = err.response?.data?.errors;
      setFormError(errs ? Object.values(errs).flat().join(' ') : err.response?.data?.message ?? 'Failed.');
    },
  });

  const remove = useMutation({
    mutationFn: (id: number) => api.delete(`/institution/account-managers/${id}`),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['institution-managers'] });
      setDeletingId(null);
    },
    onError: () => { setDeletingId(null); setRemoveErr(ja ? '削除に失敗しました。' : bn ? 'মুছতে ব্যর্থ হয়েছে।' : 'Failed to remove.'); },
  });

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!form.name || !form.email) {
      setFormError(ja ? '名前とメールアドレスは必須です。' : bn ? 'নাম ও ইমেইল আবশ্যক।' : 'Name and email are required.');
      return;
    }
    save.mutate(form);
  }

  function set(k: keyof ManagerForm, v: string) { setForm(f => ({ ...f, [k]: v })); }

  const title = ja ? 'アカウントマネージャー' : bn ? 'অ্যাকাউন্ট ম্যানেজার' : 'Account Managers';

  return (
    <DashboardLayout title={title}>

      {/* Info banner */}
      <div className="mb-5 p-4 bg-indigo-50 border border-indigo-100 rounded-2xl flex items-start gap-3">
        <span className="text-xl shrink-0">👥</span>
        <div>
          <p className="text-sm font-bold text-slate-800">
            {ja ? 'HRおよび入学担当者を追加' : bn ? 'HR ও অ্যাডমিশন স্টাফ যোগ করুন' : 'Add HR & Admission Staff'}
          </p>
          <p className="text-xs text-slate-600 mt-0.5">
            {ja ? 'Tensaiがこれらの担当者に直接連絡を取ります。' : bn ? 'Tensai সরাসরি এই ব্যক্তিদের সাথে যোগাযোগ করবে।' : 'These contacts will be reachable by Tensai when processing students for your institution.'}
          </p>
        </div>
      </div>

      {/* Add button */}
      <div className="flex justify-between items-center mb-4">
        <p className="text-xs text-slate-500">
          {managers.length} {ja ? '名の担当者' : bn ? 'জন ম্যানেজার' : `manager${managers.length !== 1 ? 's' : ''}`}
        </p>
        {!showForm && (
          <button onClick={openAdd}
            className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold rounded-xl transition-colors">
            + {ja ? '担当者を追加' : bn ? 'ম্যানেজার যোগ করুন' : 'Add Manager'}
          </button>
        )}
      </div>

      {/* Add / Edit form */}
      {showForm && (
        <div className="bg-white rounded-2xl border border-indigo-100 shadow-sm p-5 mb-5">
          <h3 className="font-bold text-slate-800 text-sm mb-4">
            {editId
              ? (ja ? '担当者を編集' : bn ? 'ম্যানেজার সম্পাদনা' : 'Edit Manager')
              : (ja ? '新しい担当者を追加' : bn ? 'নতুন ম্যানেজার যোগ করুন' : 'Add New Manager')}
          </h3>
          <form onSubmit={handleSubmit} className="space-y-3">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-[11px] font-semibold text-slate-500 uppercase tracking-wide mb-1">
                  {ja ? '氏名 *' : bn ? 'নাম *' : 'Full Name *'}
                </label>
                <input className={inputCls} placeholder={ja ? '例: 鈴木 花子' : bn ? 'যেমন: করিম সাহেব' : 'e.g. Jane Smith'}
                  value={form.name} onChange={e => set('name', e.target.value)} />
              </div>
              <div>
                <label className="block text-[11px] font-semibold text-slate-500 uppercase tracking-wide mb-1">
                  {ja ? '役職' : bn ? 'পদবি' : 'Role / Department'}
                </label>
                <select className={inputCls} value={form.role} onChange={e => set('role', e.target.value)}>
                  <option value="">{ja ? '役職を選択...' : bn ? 'পদবি নির্বাচন করুন...' : 'Select role...'}</option>
                  {ROLES.map(r => <option key={r} value={r}>{r}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-[11px] font-semibold text-slate-500 uppercase tracking-wide mb-1">
                  {ja ? 'メールアドレス *' : bn ? 'ইমেইল *' : 'Email Address *'}
                </label>
                <input type="email" className={inputCls} placeholder="hr@yourschool.com"
                  value={form.email} onChange={e => set('email', e.target.value)} />
              </div>
              <div>
                <label className="block text-[11px] font-semibold text-slate-500 uppercase tracking-wide mb-1">
                  {ja ? '電話番号' : bn ? 'ফোন নম্বর' : 'Phone Number'}
                </label>
                <input type="tel" className={inputCls} placeholder="+81 3-0000-0000"
                  value={form.phone} onChange={e => set('phone', e.target.value)} />
              </div>
            </div>

            {formError && <p className="text-xs text-red-600 font-medium">⚠️ {formError}</p>}

            <div className="flex gap-2 pt-1">
              <button type="submit" disabled={save.isPending}
                className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold rounded-xl transition-colors disabled:opacity-50">
                {save.isPending
                  ? (ja ? '保存中...' : bn ? 'সংরক্ষণ হচ্ছে...' : 'Saving...')
                  : (ja ? '保存' : bn ? 'সংরক্ষণ করুন' : 'Save Manager')}
              </button>
              <button type="button" onClick={closeForm}
                className="px-4 py-2.5 text-xs font-semibold text-slate-500 hover:text-slate-700 border border-slate-200 rounded-xl transition-colors">
                {ja ? 'キャンセル' : bn ? 'বাতিল' : 'Cancel'}
              </button>
            </div>
          </form>
        </div>
      )}

      {removeErr && (
        <div className="mb-3 p-3 bg-red-50 border border-red-100 rounded-xl text-xs text-red-600">⚠️ {removeErr}</div>
      )}

      {/* Managers list */}
      {isLoading ? (
        <div className="text-center py-16 text-slate-400 text-sm">
          {ja ? '読み込み中...' : bn ? 'লোড হচ্ছে...' : 'Loading...'}
        </div>
      ) : managers.length === 0 && !showForm ? (
        <div className="bg-white rounded-2xl border border-slate-100 p-12 text-center text-slate-400">
          <div className="text-4xl mb-3">👤</div>
          <p className="font-medium text-slate-500 mb-1">
            {ja ? '担当者がまだいません' : bn ? 'কোনো ম্যানেজার যোগ করা হয়নি' : 'No managers added yet'}
          </p>
          <p className="text-xs">
            {ja ? '上のボタンから追加してください。' : bn ? 'উপরের বোতাম দিয়ে যোগ করুন।' : 'Use the button above to add your first contact.'}
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {managers.map(m => (
            <div key={m.id} className="bg-white rounded-2xl border border-slate-100 shadow-sm p-4 sm:p-5">
              <div className="flex flex-wrap items-start gap-3">
                <div className="flex-1 min-w-0">
                  <div className="flex flex-wrap items-center gap-2 mb-1">
                    <span className="font-bold text-slate-800 text-sm">{m.name}</span>
                    {m.role && (
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-indigo-100 text-indigo-700">
                        {m.role}
                      </span>
                    )}
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-4 gap-y-0.5 text-xs text-slate-500">
                    <span>✉️ {m.email}</span>
                    {m.phone && <span>📞 {m.phone}</span>}
                  </div>
                  <p className="text-[10px] text-slate-300 mt-1">
                    {ja ? '追加日：' : bn ? 'যোগ: ' : 'Added '}
                    {new Date(m.created_at).toLocaleDateString(undefined, { dateStyle: 'medium' })}
                  </p>
                </div>

                {/* Actions */}
                <div className="flex gap-2 shrink-0">
                  <button onClick={() => openEdit(m)}
                    className="px-3 py-1.5 text-xs font-semibold text-slate-600 hover:text-slate-800 border border-slate-200 rounded-xl transition-colors">
                    {ja ? '編集' : bn ? 'সম্পাদনা' : 'Edit'}
                  </button>
                  {deletingId === m.id ? (
                    <div className="flex gap-1 items-center">
                      <button onClick={() => { remove.mutate(m.id); }}
                        className="px-3 py-1.5 text-xs font-bold text-white bg-red-500 hover:bg-red-600 rounded-xl transition-colors">
                        {ja ? '確認' : bn ? 'নিশ্চিত' : 'Confirm'}
                      </button>
                      <button onClick={() => setDeletingId(null)}
                        className="px-2 py-1.5 text-xs text-slate-400 hover:text-slate-600 border border-slate-200 rounded-xl">
                        ✕
                      </button>
                    </div>
                  ) : (
                    <button onClick={() => setDeletingId(m.id)}
                      className="px-3 py-1.5 text-xs font-semibold text-red-500 hover:text-red-700 border border-red-100 hover:border-red-200 rounded-xl transition-colors">
                      {ja ? '削除' : bn ? 'মুছুন' : 'Remove'}
                    </button>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </DashboardLayout>
  );
}
