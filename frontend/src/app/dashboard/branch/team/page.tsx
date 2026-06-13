'use client';
import DashboardLayout from '@/components/shared/DashboardLayout';
import api from '@/lib/api';
import { useAuthStore } from '@/store/authStore';
import { useLang } from '@/context/LanguageContext';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';

interface TeamMember {
  id: number;
  name: string;
  role: string;
  bio: string | null;
  email: string | null;
  phone: string | null;
  photo_url: string | null;
  is_active: boolean;
  sort_order: number;
}

const EMPTY = { name: '', role: '', bio: '', email: '', phone: '', sort_order: 0, is_active: true };
const inputCls = 'w-full border border-slate-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-green-500';

export default function BranchTeamPage() {
  const { user } = useAuthStore();
  const router = useRouter();
  const qc = useQueryClient();
  const { lang } = useLang();
  const ja = lang === 'ja'; const bn = lang === 'bn';

  const isBranchAdmin = user?.roles?.includes('branch_admin');
  useEffect(() => {
    if (user && !isBranchAdmin) router.replace(`/dashboard/${user.gateway_type ?? ''}`);
  }, [user, isBranchAdmin, router]);

  const [modal, setModal] = useState<'add' | 'edit' | null>(null);
  const [editing, setEditing] = useState<TeamMember | null>(null);
  const [form, setForm] = useState(EMPTY);
  const [err, setErr] = useState('');

  const { data: members = [], isLoading } = useQuery<TeamMember[]>({
    queryKey: ['branch-team'],
    queryFn: () => api.get('/branch-admin/team').then(r => r.data),
    enabled: !!isBranchAdmin,
  });

  const save = useMutation({
    mutationFn: (data: typeof EMPTY) => editing
      ? api.patch(`/branch-admin/team/${editing.id}`, data).then(r => r.data)
      : api.post('/branch-admin/team', data).then(r => r.data),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['branch-team'] }); closeModal(); },
    onError: (e: unknown) => {
      const err = e as { response?: { data?: { message?: string; errors?: Record<string, string[]> } } };
      const errs = err.response?.data?.errors;
      setErr(errs ? Object.values(errs).flat().join(' ') : err.response?.data?.message ?? 'Failed.');
    },
  });

  const del = useMutation({
    mutationFn: (id: number) => api.delete(`/branch-admin/team/${id}`),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['branch-team'] }),
  });

  function openAdd() { setEditing(null); setForm(EMPTY); setErr(''); setModal('add'); }
  function openEdit(m: TeamMember) {
    setEditing(m);
    setForm({ name: m.name, role: m.role, bio: m.bio ?? '', email: m.email ?? '', phone: m.phone ?? '', sort_order: m.sort_order, is_active: m.is_active });
    setErr(''); setModal('edit');
  }
  function closeModal() { setModal(null); setEditing(null); setErr(''); }

  if (!user || !isBranchAdmin) return null;

  const title = ja ? 'チーム管理' : bn ? 'টিম ম্যানেজমেন্ট' : 'Team';

  return (
    <DashboardLayout title={title}>
      <div className="flex items-center justify-between mb-5">
        <p className="text-xs text-slate-500">{members.length} {ja ? '名' : bn ? 'জন সদস্য' : `member${members.length !== 1 ? 's' : ''}`}</p>
        <button onClick={openAdd} className="px-4 py-2 bg-green-700 hover:bg-green-800 text-white text-sm font-semibold rounded-xl transition-colors">
          {ja ? '+ メンバー追加' : bn ? '+ সদস্য যোগ করুন' : '+ Add Member'}
        </button>
      </div>

      {isLoading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {[1,2,3].map(i => <div key={i} className="h-28 bg-slate-100 rounded-2xl animate-pulse" />)}
        </div>
      ) : members.length === 0 ? (
        <div className="text-center py-16">
          <div className="text-4xl mb-3">👥</div>
          <p className="text-slate-400 text-sm">{ja ? 'チームメンバーはまだいません。' : bn ? 'এখনো কোনো সদস্য নেই।' : 'No team members yet.'}</p>
          <button onClick={openAdd} className="mt-4 px-5 py-2 bg-green-700 text-white text-sm font-semibold rounded-xl hover:bg-green-800">
            {ja ? '最初のメンバーを追加' : bn ? 'প্রথম সদস্য যোগ করুন' : 'Add First Member'}
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {members.map(m => (
            <div key={m.id} className={`bg-white rounded-2xl border shadow-sm p-4 flex gap-4 ${!m.is_active ? 'opacity-60' : 'border-slate-100'}`}>
              <div className="w-12 h-12 rounded-full bg-green-100 text-green-700 flex items-center justify-center text-lg font-bold shrink-0">
                {m.photo_url
                  // eslint-disable-next-line @next/next/no-img-element
                  ? <img src={m.photo_url} alt={m.name} className="w-full h-full object-cover rounded-full" />
                  : m.name.charAt(0).toUpperCase()}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <p className="font-semibold text-slate-800 text-sm">{m.name}</p>
                    <p className="text-xs text-green-700 font-medium">{m.role}</p>
                  </div>
                  {!m.is_active && <span className="text-[10px] bg-slate-100 text-slate-500 px-2 py-0.5 rounded-full shrink-0">Hidden</span>}
                </div>
                {m.bio && <p className="text-xs text-slate-500 mt-1 line-clamp-2">{m.bio}</p>}
                <div className="flex gap-3 mt-2">
                  <button onClick={() => openEdit(m)} className="text-xs font-semibold text-slate-600 hover:text-green-700 transition-colors">
                    {ja ? '編集' : bn ? 'সম্পাদনা' : 'Edit'}
                  </button>
                  <button onClick={() => { if (confirm(`Delete ${m.name}?`)) del.mutate(m.id); }}
                    className="text-xs font-semibold text-red-400 hover:text-red-600 transition-colors">
                    {ja ? '削除' : bn ? 'মুছুন' : 'Delete'}
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {modal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-md max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex items-center justify-between mb-5">
                <h3 className="font-bold text-slate-900">
                  {modal === 'add' ? (ja ? 'メンバー追加' : bn ? 'সদস্য যোগ করুন' : 'Add Member') : (ja ? 'メンバー編集' : bn ? 'সদস্য সম্পাদনা' : 'Edit Member')}
                </h3>
                <button onClick={closeModal} className="text-slate-400 hover:text-slate-600 text-xl leading-none">×</button>
              </div>

              {err && <div className="mb-4 p-3 bg-red-50 border border-red-100 rounded-xl text-xs text-red-600">⚠️ {err}</div>}

              <form onSubmit={e => { e.preventDefault(); save.mutate(form); }} className="space-y-3">
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-semibold text-slate-500 mb-1">{ja ? '名前' : bn ? 'নাম' : 'Name'} <span className="text-red-400">*</span></label>
                    <input className={inputCls} required value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} placeholder="e.g. Rahim Uddin" />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-500 mb-1">{ja ? '役職' : bn ? 'পদবী' : 'Role'} <span className="text-red-400">*</span></label>
                    <input className={inputCls} required value={form.role} onChange={e => setForm(f => ({ ...f, role: e.target.value }))} placeholder="e.g. Counselor" />
                  </div>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-500 mb-1">{ja ? '自己紹介' : bn ? 'পরিচয়' : 'Bio'}</label>
                  <textarea className={`${inputCls} resize-none`} rows={2} value={form.bio} onChange={e => setForm(f => ({ ...f, bio: e.target.value }))} placeholder={ja ? '短い紹介文...' : bn ? 'সংক্ষিপ্ত পরিচয়...' : 'Short bio...'} />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-semibold text-slate-500 mb-1">{ja ? 'メール' : bn ? 'ইমেইল' : 'Email'}</label>
                    <input className={inputCls} type="email" value={form.email} onChange={e => setForm(f => ({ ...f, email: e.target.value }))} />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-500 mb-1">{ja ? '電話' : bn ? 'ফোন' : 'Phone'}</label>
                    <input className={inputCls} value={form.phone} onChange={e => setForm(f => ({ ...f, phone: e.target.value }))} />
                  </div>
                </div>
                <div className="flex items-center gap-4">
                  <div className="flex-1">
                    <label className="block text-xs font-semibold text-slate-500 mb-1">{ja ? '表示順' : bn ? 'ক্রম' : 'Sort Order'}</label>
                    <input className={inputCls} type="number" min="0" value={form.sort_order} onChange={e => setForm(f => ({ ...f, sort_order: Number(e.target.value) }))} />
                  </div>
                  <label className="flex items-center gap-2 cursor-pointer mt-4">
                    <input type="checkbox" checked={form.is_active} onChange={e => setForm(f => ({ ...f, is_active: e.target.checked }))} className="w-4 h-4 accent-green-600" />
                    <span className="text-sm text-slate-700">{ja ? '表示する' : bn ? 'সক্রিয়' : 'Active'}</span>
                  </label>
                </div>
                <div className="flex gap-2 pt-1">
                  <button type="submit" disabled={save.isPending} className="flex-1 py-2.5 bg-green-700 hover:bg-green-800 text-white rounded-xl text-sm font-bold disabled:opacity-50 transition-colors">
                    {save.isPending ? '…' : (ja ? '保存する' : bn ? 'সংরক্ষণ করুন' : 'Save')}
                  </button>
                  <button type="button" onClick={closeModal} className="px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-sm font-semibold transition-colors">
                    {ja ? 'キャンセル' : bn ? 'বাতিল' : 'Cancel'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </DashboardLayout>
  );
}
