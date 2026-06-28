'use client';
import BranchLayout from '@/components/shared/BranchLayout';
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

  const isBranchAdmin = user?.roles?.some(r => r === 'branch_admin' || r === 'branch_manager');
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
    <BranchLayout title={title}>
      {/* Page header */}
      <div className="flex items-end justify-between mb-8">
        <div>
          <p className="text-[10px] font-semibold text-slate-400 uppercase tracking-[0.12em] mb-1.5">Branch Portal</p>
          <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
            {ja ? 'チーム管理' : bn ? 'টিম ম্যানেজমেন্ট' : 'Team'}
          </h1>
          <p className="text-sm text-slate-500 mt-1.5">
            {members.length} {ja ? '名のメンバー' : bn ? 'জন সদস্য' : `member${members.length !== 1 ? 's' : ''}`}
          </p>
        </div>
        <button onClick={openAdd} className="flex items-center gap-2 px-5 py-2.5 bg-green-600 hover:bg-green-700 text-white text-sm font-semibold rounded-xl transition-colors shadow-sm hover:shadow-md">
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
          {ja ? 'メンバー追加' : bn ? 'সদস্য যোগ করুন' : 'Add Member'}
        </button>
      </div>

      {isLoading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {[1,2,3,4,5,6].map(i => <div key={i} className="h-36 bg-slate-100 rounded-2xl animate-pulse" />)}
        </div>
      ) : members.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-24 text-center">
          <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-green-50 to-slate-50 border border-slate-100 flex items-center justify-center mb-6">
            <svg className="w-10 h-10 text-slate-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
          </div>
          <h3 className="text-lg font-bold text-slate-900 mb-2">{ja ? 'まだメンバーがいません' : bn ? 'এখনো কোনো সদস্য নেই' : 'No team members yet'}</h3>
          <p className="text-sm text-slate-500 mb-8 max-w-xs leading-relaxed">
            {ja ? 'チームメンバーを追加して、ブランチページに表示しましょう。' : bn ? 'টিম সদস্য যোগ করুন এবং শাখার পেজে প্রদর্শন করুন।' : 'Add team members to showcase your branch staff to prospective students.'}
          </p>
          <button onClick={openAdd} className="px-6 py-3 bg-green-600 hover:bg-green-700 text-white text-sm font-semibold rounded-xl transition-colors shadow-sm">
            {ja ? '最初のメンバーを追加' : bn ? 'প্রথম সদস্য যোগ করুন' : 'Add First Member'}
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {members.map(m => (
            <div key={m.id} className={`bg-white rounded-2xl border border-slate-100 overflow-hidden hover:shadow-lg hover:border-slate-200 transition-all duration-200 ${!m.is_active ? 'opacity-60' : ''}`}>
              <div className="p-5">
                <div className="flex gap-4">
                  <div className="w-14 h-14 rounded-xl bg-green-100 text-green-700 flex items-center justify-center text-xl font-bold shrink-0 overflow-hidden">
                    {m.photo_url
                      // eslint-disable-next-line @next/next/no-img-element
                      ? <img src={m.photo_url} alt={m.name} className="w-full h-full object-cover" />
                      : m.name.charAt(0).toUpperCase()}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start gap-2">
                      <div className="min-w-0 flex-1">
                        <p className="font-semibold text-slate-900 text-sm leading-tight truncate">{m.name}</p>
                        <p className="text-xs text-green-600 font-medium mt-0.5">{m.role}</p>
                      </div>
                      {!m.is_active && <span className="text-[10px] bg-slate-200 text-slate-700 font-semibold px-2 py-0.5 rounded-full shrink-0">Hidden</span>}
                    </div>
                    {m.bio && <p className="text-xs text-slate-500 mt-2 leading-relaxed line-clamp-2">{m.bio}</p>}
                  </div>
                </div>
              </div>
              <div className="border-t border-slate-50 bg-slate-50/50 px-5 py-3 flex gap-2">
                <button onClick={() => openEdit(m)} className="flex-1 text-xs font-semibold text-slate-600 hover:text-green-700 py-1.5 rounded-lg hover:bg-green-50 transition-colors">
                  {ja ? '編集' : bn ? 'সম্পাদনা' : 'Edit'}
                </button>
                <div className="w-px bg-slate-200" />
                <button onClick={() => { if (confirm(`Delete ${m.name}?`)) del.mutate(m.id); }}
                  className="flex-1 text-xs font-semibold text-slate-500 hover:text-red-600 py-1.5 rounded-lg hover:bg-red-50 transition-colors">
                  {ja ? '削除' : bn ? 'মুছুন' : 'Delete'}
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {modal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg max-h-[90vh] overflow-hidden flex flex-col">

            {/* Sticky header */}
            <div className="px-6 py-5 border-b border-slate-100 flex items-center justify-between bg-white shrink-0">
              <div>
                <h3 className="text-lg font-bold text-slate-900">
                  {modal === 'add' ? (ja ? 'メンバー追加' : bn ? 'সদস্য যোগ করুন' : 'Add Team Member') : (ja ? 'メンバー編集' : bn ? 'সদস্য সম্পাদনা' : 'Edit Team Member')}
                </h3>
                <p className="text-xs text-slate-400 mt-0.5">{ja ? 'メンバー情報を入力してください' : bn ? 'সদস্যের তথ্য পূরণ করুন' : 'Fill in the member details below'}</p>
              </div>
              <button onClick={closeModal} className="w-9 h-9 flex items-center justify-center rounded-full text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            {/* Scrollable body */}
            <form id="team-form" onSubmit={e => { e.preventDefault(); save.mutate(form); }} className="flex-1 overflow-y-auto px-6 py-6 space-y-4">
              {err && <div className="p-3 bg-red-50 border border-red-200 rounded-xl text-xs text-red-700 font-medium">⚠️ {err}</div>}

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-500 mb-1.5">{ja ? '名前' : bn ? 'নাম' : 'Full Name'} <span className="text-red-400">*</span></label>
                  <input className={inputCls} required value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} placeholder="e.g. Rahim Uddin" />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-500 mb-1.5">{ja ? '役職' : bn ? 'পদবী' : 'Job Title'} <span className="text-red-400">*</span></label>
                  <input className={inputCls} required value={form.role} onChange={e => setForm(f => ({ ...f, role: e.target.value }))} placeholder="e.g. Senior Counselor" />
                </div>
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-500 mb-1.5">{ja ? '自己紹介' : bn ? 'পরিচয়' : 'Bio'} <span className="text-slate-300 font-normal">{ja ? '任意' : bn ? 'ঐচ্ছিক' : 'optional'}</span></label>
                <textarea className={`${inputCls} resize-none`} rows={3} value={form.bio} onChange={e => setForm(f => ({ ...f, bio: e.target.value }))} placeholder={ja ? '短い紹介文...' : bn ? 'সংক্ষিপ্ত পরিচয়...' : 'Short bio about this team member...'} />
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-500 mb-1.5">{ja ? 'メール' : bn ? 'ইমেইল' : 'Email'}</label>
                  <input className={inputCls} type="email" value={form.email} onChange={e => setForm(f => ({ ...f, email: e.target.value }))} placeholder="name@example.com" />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-500 mb-1.5">{ja ? '電話' : bn ? 'ফোন' : 'Phone'}</label>
                  <input className={inputCls} value={form.phone} onChange={e => setForm(f => ({ ...f, phone: e.target.value }))} placeholder="+880 1XXX XXXXXX" />
                </div>
              </div>
              <div className="flex items-end gap-4">
                <div className="flex-1">
                  <label className="block text-xs font-semibold text-slate-500 mb-1.5">{ja ? '表示順' : bn ? 'ক্রম' : 'Sort Order'}</label>
                  <input className={inputCls} type="number" min="0" value={form.sort_order} onChange={e => setForm(f => ({ ...f, sort_order: Number(e.target.value) }))} />
                </div>
                <label className="flex items-center gap-2.5 cursor-pointer pb-2.5">
                  <input type="checkbox" checked={form.is_active} onChange={e => setForm(f => ({ ...f, is_active: e.target.checked }))} className="w-4 h-4 accent-green-600" />
                  <span className="text-sm font-medium text-slate-700">{ja ? '公開する' : bn ? 'সক্রিয়' : 'Active'}</span>
                </label>
              </div>
            </form>

            {/* Sticky footer */}
            <div className="px-6 py-4 border-t border-slate-100 bg-slate-50/50 flex gap-3 shrink-0">
              <button form="team-form" type="submit" disabled={save.isPending}
                className="flex-1 py-2.5 bg-green-600 hover:bg-green-700 text-white rounded-xl text-sm font-bold disabled:opacity-50 transition-colors">
                {save.isPending ? '…' : (ja ? '保存する' : bn ? 'সংরক্ষণ করুন' : modal === 'add' ? 'Add Member' : 'Save Changes')}
              </button>
              <button type="button" onClick={closeModal} className="px-5 py-2.5 bg-white hover:bg-slate-100 text-slate-700 border border-slate-200 rounded-xl text-sm font-semibold transition-colors">
                {ja ? 'キャンセル' : bn ? 'বাতিল' : 'Cancel'}
              </button>
            </div>
          </div>
        </div>
      )}
    </BranchLayout>
  );
}
