'use client';
import DashboardLayout from '@/components/shared/DashboardLayout';
import { useLang } from '@/context/LanguageContext';
import api from '@/lib/api';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useState } from 'react';

interface Institution {
  id: number;
  entity_type: 'institution';
  name: string;
  contact_email: string | null;
  contact_phone: string | null;
  website: string | null;
  country: string | null;
  city: string | null;
  specialty: string | null;
  capacity: number | null;
  status: 'prospect' | 'active' | 'inactive';
  commission_percent: number;
  total_enrollments: number;
  total_earned: number;
  notes: string | null;
}

const blank: Omit<Institution, 'id' | 'entity_type' | 'total_enrollments' | 'total_earned'> = {
  name: '', contact_email: '', contact_phone: '', website: '',
  country: '', city: '', specialty: '', capacity: null,
  status: 'prospect', commission_percent: 0, notes: '',
};

const STATUS_COLOR: Record<string, string> = {
  prospect: 'bg-amber-100 text-amber-700',
  active:   'bg-emerald-100 text-emerald-700',
  inactive: 'bg-slate-100 text-slate-500',
};

const inputCls = 'w-full border border-slate-200 rounded-xl px-3 py-2.5 text-sm text-slate-800 bg-white focus:outline-none focus:ring-2 focus:ring-amber-500 placeholder:text-slate-400';

export default function InstitutionsPage() {
  const { lang } = useLang();
  const qc = useQueryClient();
  const ja = lang === 'ja'; const bn = lang === 'bn';

  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing]   = useState<Institution | null>(null);
  const [form, setForm]         = useState<typeof blank>({ ...blank });
  const [formError, setFormError] = useState('');
  const [deleting, setDeleting] = useState<number | null>(null);

  const { data, isLoading } = useQuery({
    queryKey: ['affiliate-institutions'],
    queryFn: () => api.get('/affiliate/entities?type=institution').then(r => r.data),
  });

  const institutions: Institution[] = Array.isArray(data?.data) ? data.data : [];

  function openCreate() {
    setEditing(null);
    setForm({ ...blank });
    setFormError('');
    setShowForm(true);
  }

  function openEdit(inst: Institution) {
    setEditing(inst);
    setForm({
      name: inst.name, contact_email: inst.contact_email ?? '',
      contact_phone: inst.contact_phone ?? '', website: inst.website ?? '',
      country: inst.country ?? '', city: inst.city ?? '',
      specialty: inst.specialty ?? '', capacity: inst.capacity,
      status: inst.status, commission_percent: inst.commission_percent, notes: inst.notes ?? '',
    });
    setFormError('');
    setShowForm(true);
  }

  const saveMutation = useMutation({
    mutationFn: (payload: typeof blank) =>
      editing
        ? api.put(`/affiliate/entities/${editing.id}`, payload)
        : api.post('/affiliate/entities', { ...payload, entity_type: 'institution' }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['affiliate-institutions'] });
      qc.invalidateQueries({ queryKey: ['affiliate-dashboard'] });
      setShowForm(false);
    },
    onError: (e: unknown) => {
      const err = e as { response?: { data?: { message?: string } } };
      setFormError(err.response?.data?.message ?? 'Save failed.');
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: number) => api.delete(`/affiliate/entities/${id}`),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['affiliate-institutions'] });
      qc.invalidateQueries({ queryKey: ['affiliate-dashboard'] });
      setDeleting(null);
    },
  });

  function set(k: keyof typeof blank, v: string | number | null) {
    setForm(f => ({ ...f, [k]: v }));
  }

  return (
    <DashboardLayout title={ja ? '機関管理' : bn ? 'প্রতিষ্ঠান ম্যানেজমেন্ট' : 'Manage Institutions'}>

      {/* Header + Add button */}
      <div className="flex items-center justify-between mb-5">
        <p className="text-sm text-slate-500">
          {ja ? '管理している学校・教育機関の一覧' : bn ? 'আপনার ম্যানেজ করা স্কুল ও প্রতিষ্ঠানের তালিকা' : 'Schools and institutions you manage for Tensai'}
        </p>
        <button
          onClick={openCreate}
          className="flex items-center gap-1.5 px-4 py-2 bg-amber-500 hover:bg-amber-600 text-white text-xs font-bold rounded-xl transition-colors"
        >
          <span>+</span>
          {ja ? '機関を追加' : bn ? 'প্রতিষ্ঠান যোগ করুন' : 'Add Institution'}
        </button>
      </div>

      {/* Summary stats */}
      {institutions.length > 0 && (
        <div className="grid grid-cols-3 gap-3 mb-5">
          <div className="bg-amber-50 border border-amber-100 rounded-2xl p-4 text-center">
            <div className="text-xl font-black text-amber-700">{institutions.length}</div>
            <div className="text-xs text-amber-600 font-medium mt-0.5">{ja ? '合計機関' : bn ? 'মোট প্রতিষ্ঠান' : 'Total'}</div>
          </div>
          <div className="bg-emerald-50 border border-emerald-100 rounded-2xl p-4 text-center">
            <div className="text-xl font-black text-emerald-700">{institutions.filter(i => i.status === 'active').length}</div>
            <div className="text-xs text-emerald-600 font-medium mt-0.5">{ja ? 'アクティブ' : bn ? 'সক্রিয়' : 'Active'}</div>
          </div>
          <div className="bg-indigo-50 border border-indigo-100 rounded-2xl p-4 text-center">
            <div className="text-xl font-black text-indigo-700">{institutions.reduce((s, i) => s + i.total_enrollments, 0)}</div>
            <div className="text-xs text-indigo-600 font-medium mt-0.5">{ja ? '総入学数' : bn ? 'মোট ভর্তি' : 'Enrollments'}</div>
          </div>
        </div>
      )}

      {/* List */}
      {isLoading ? (
        <div className="space-y-3">{[1,2,3].map(i => <div key={i} className="h-24 bg-slate-100 rounded-2xl animate-pulse" />)}</div>
      ) : institutions.length === 0 ? (
        <div className="bg-white border-2 border-dashed border-slate-200 rounded-2xl p-12 text-center">
          <div className="text-4xl mb-3">🏫</div>
          <p className="font-semibold text-slate-700 mb-1">
            {ja ? '機関がまだ追加されていません' : bn ? 'এখনো কোনো প্রতিষ্ঠান যোগ করা হয়নি' : 'No institutions added yet'}
          </p>
          <p className="text-xs text-slate-400 mb-4">
            {ja ? 'Tensaiと提携している学校を追加してください。' : bn ? 'Tensai-এর সাথে যুক্ত স্কুলগুলো যোগ করুন।' : 'Add schools that you manage or partner with Tensai.'}
          </p>
          <button onClick={openCreate} className="px-5 py-2 bg-amber-500 hover:bg-amber-600 text-white text-sm font-semibold rounded-xl transition-colors">
            + {ja ? '最初の機関を追加' : bn ? 'প্রথম প্রতিষ্ঠান যোগ করুন' : 'Add First Institution'}
          </button>
        </div>
      ) : (
        <div className="space-y-3">
          {institutions.map(inst => (
            <div key={inst.id} className="bg-white border border-slate-100 rounded-2xl p-4 sm:p-5 hover:border-slate-200 transition-all">
              <div className="flex items-start gap-4">
                <div className="w-11 h-11 rounded-xl bg-amber-100 flex items-center justify-center text-xl shrink-0">🏫</div>
                <div className="flex-1 min-w-0">
                  <div className="flex flex-wrap items-center gap-2 mb-1">
                    <h3 className="font-bold text-slate-900">{inst.name}</h3>
                    <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${STATUS_COLOR[inst.status]}`}>{inst.status}</span>
                    {inst.specialty && (
                      <span className="text-xs bg-slate-100 text-slate-600 px-2 py-0.5 rounded-full">{inst.specialty}</span>
                    )}
                  </div>
                  <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-slate-400">
                    {inst.country && <span>📍 {inst.city ? `${inst.city}, ` : ''}{inst.country}</span>}
                    {inst.contact_email && <span>✉️ {inst.contact_email}</span>}
                    {inst.website && <a href={inst.website} target="_blank" rel="noreferrer" className="text-indigo-500 hover:underline">🌐 Website</a>}
                  </div>
                  <div className="flex flex-wrap gap-3 mt-2 text-xs">
                    <span className="text-slate-500">
                      💰 {inst.commission_percent}% {ja ? 'コミッション' : bn ? 'কমিশন' : 'commission'}
                    </span>
                    <span className="text-slate-500">
                      🎓 {inst.total_enrollments} {ja ? '人入学' : bn ? 'জন ভর্তি' : 'enrolled'}
                    </span>
                    <span className="text-slate-500">
                      ৳{Number(inst.total_earned).toLocaleString()} {ja ? '収益' : bn ? 'আয়' : 'earned'}
                    </span>
                    {inst.capacity && (
                      <span className="text-slate-500">
                        👥 {inst.capacity} {ja ? '名定員' : bn ? 'জন সক্ষমতা' : 'capacity'}
                      </span>
                    )}
                  </div>
                  {inst.notes && <p className="text-xs text-slate-400 mt-1 line-clamp-1">📝 {inst.notes}</p>}
                </div>
                <div className="flex gap-1.5 shrink-0">
                  <button onClick={() => openEdit(inst)} className="px-3 py-1.5 text-xs font-medium bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg transition-colors">
                    {ja ? '編集' : bn ? 'সম্পাদনা' : 'Edit'}
                  </button>
                  <button
                    onClick={() => setDeleting(inst.id)}
                    className="px-3 py-1.5 text-xs font-medium bg-red-50 hover:bg-red-100 text-red-600 rounded-lg transition-colors"
                  >
                    {ja ? '削除' : bn ? 'মুছুন' : 'Delete'}
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Delete confirm */}
      {deleting !== null && (
        <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl p-6 max-w-sm w-full shadow-xl">
            <p className="font-bold text-slate-900 mb-2">
              {ja ? '本当に削除しますか？' : bn ? 'সত্যিই মুছবেন?' : 'Delete this institution?'}
            </p>
            <p className="text-sm text-slate-500 mb-5">
              {ja ? 'この操作は元に戻せません。' : bn ? 'এই কাজ পূর্বাবস্থায় ফেরানো যাবে না।' : 'This action cannot be undone.'}
            </p>
            <div className="flex gap-3">
              <button onClick={() => setDeleting(null)} className="flex-1 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 text-sm font-semibold rounded-xl transition-colors">
                {ja ? 'キャンセル' : bn ? 'বাতিল' : 'Cancel'}
              </button>
              <button
                onClick={() => deleteMutation.mutate(deleting)}
                disabled={deleteMutation.isPending}
                className="flex-1 py-2.5 bg-red-600 hover:bg-red-700 text-white text-sm font-semibold rounded-xl transition-colors"
              >
                {deleteMutation.isPending ? '...' : (ja ? '削除する' : bn ? 'মুছুন' : 'Delete')}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Create/Edit modal */}
      {showForm && (
        <div className="fixed inset-0 bg-black/40 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4">
          <div className="bg-white rounded-t-3xl sm:rounded-2xl w-full sm:max-w-lg max-h-[90vh] overflow-y-auto shadow-xl">
            <div className="sticky top-0 bg-white border-b border-slate-100 px-5 py-4 flex items-center justify-between">
              <h2 className="font-bold text-slate-900">
                {editing
                  ? (ja ? '機関を編集' : bn ? 'প্রতিষ্ঠান সম্পাদনা' : 'Edit Institution')
                  : (ja ? '機関を追加' : bn ? 'নতুন প্রতিষ্ঠান' : 'Add Institution')}
              </h2>
              <button onClick={() => setShowForm(false)} className="text-slate-400 hover:text-slate-700 text-xl">✕</button>
            </div>

            <form
              className="p-5 space-y-4"
              onSubmit={e => { e.preventDefault(); saveMutation.mutate(form); }}
            >
              <div>
                <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wide mb-1">
                  {ja ? '機関名 *' : bn ? 'প্রতিষ্ঠানের নাম *' : 'Institution Name *'}
                </label>
                <input required className={inputCls} placeholder={ja ? '例: Osaka Language School' : bn ? 'যেমন: Osaka Language School' : 'e.g. Osaka Language School'} value={form.name} onChange={e => set('name', e.target.value)} />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wide mb-1">{ja ? '国' : bn ? 'দেশ' : 'Country'}</label>
                  <input className={inputCls} placeholder="Japan" value={form.country ?? ''} onChange={e => set('country', e.target.value)} />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wide mb-1">{ja ? '都市' : bn ? 'শহর' : 'City'}</label>
                  <input className={inputCls} placeholder="Tokyo" value={form.city ?? ''} onChange={e => set('city', e.target.value)} />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wide mb-1">{ja ? '専門分野' : bn ? 'বিশেষত্ব' : 'Specialty'}</label>
                  <select className={inputCls} value={form.specialty ?? ''} onChange={e => set('specialty', e.target.value)}>
                    <option value="">{ja ? '選択...' : bn ? 'বেছে নিন...' : 'Select...'}</option>
                    <option value="Language School">{ja ? '語学学校' : bn ? 'ভাষা স্কুল' : 'Language School'}</option>
                    <option value="University">{ja ? '大学' : bn ? 'বিশ্ববিদ্যালয়' : 'University'}</option>
                    <option value="Vocational">{ja ? '専門学校' : bn ? 'বৃত্তিমূলক' : 'Vocational'}</option>
                    <option value="Graduate School">{ja ? '大学院' : bn ? 'গ্র্যাজুয়েট স্কুল' : 'Graduate School'}</option>
                    <option value="Other">{ja ? 'その他' : bn ? 'অন্যান্য' : 'Other'}</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wide mb-1">{ja ? '定員' : bn ? 'সক্ষমতা' : 'Capacity'}</label>
                  <input type="number" min="1" className={inputCls} placeholder="100" value={form.capacity ?? ''} onChange={e => set('capacity', e.target.value ? parseInt(e.target.value) : null)} />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wide mb-1">{ja ? 'メール' : bn ? 'ইমেইল' : 'Email'}</label>
                  <input type="email" className={inputCls} placeholder="info@school.jp" value={form.contact_email ?? ''} onChange={e => set('contact_email', e.target.value)} />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wide mb-1">{ja ? '電話番号' : bn ? 'ফোন' : 'Phone'}</label>
                  <input className={inputCls} placeholder="+81..." value={form.contact_phone ?? ''} onChange={e => set('contact_phone', e.target.value)} />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wide mb-1">{ja ? 'ウェブサイト' : bn ? 'ওয়েবসাইট' : 'Website'}</label>
                <input type="url" className={inputCls} placeholder="https://..." value={form.website ?? ''} onChange={e => set('website', e.target.value)} />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wide mb-1">{ja ? 'ステータス' : bn ? 'স্ট্যাটাস' : 'Status'}</label>
                  <select className={inputCls} value={form.status} onChange={e => set('status', e.target.value)}>
                    <option value="prospect">{ja ? '見込み' : bn ? 'প্রসপেক্ট' : 'Prospect'}</option>
                    <option value="active">{ja ? 'アクティブ' : bn ? 'সক্রিয়' : 'Active'}</option>
                    <option value="inactive">{ja ? '非アクティブ' : bn ? 'নিষ্ক্রিয়' : 'Inactive'}</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wide mb-1">
                    {ja ? 'コミッション(%)' : bn ? 'কমিশন (%)' : 'Commission %'}
                  </label>
                  <input type="number" min="0" max="100" step="0.5" className={inputCls} placeholder="5" value={form.commission_percent} onChange={e => set('commission_percent', parseFloat(e.target.value) || 0)} />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wide mb-1">{ja ? 'メモ' : bn ? 'নোট' : 'Notes'}</label>
                <textarea rows={2} className={`${inputCls} resize-none`} placeholder={ja ? '内部メモ...' : bn ? 'ভেতরের নোট...' : 'Internal notes...'} value={form.notes ?? ''} onChange={e => set('notes', e.target.value)} />
              </div>

              {formError && <p className="text-xs text-red-600 bg-red-50 border border-red-100 rounded-xl p-3">⚠️ {formError}</p>}

              <div className="flex gap-3 pt-1">
                <button type="button" onClick={() => setShowForm(false)} className="flex-1 py-3 bg-slate-100 hover:bg-slate-200 text-slate-700 text-sm font-semibold rounded-xl">
                  {ja ? 'キャンセル' : bn ? 'বাতিল' : 'Cancel'}
                </button>
                <button type="submit" disabled={saveMutation.isPending} className="flex-1 py-3 bg-amber-500 hover:bg-amber-600 disabled:bg-slate-100 disabled:text-slate-400 text-white text-sm font-bold rounded-xl transition-colors">
                  {saveMutation.isPending ? '...' : (editing ? (ja ? '更新する' : bn ? 'আপডেট করুন' : 'Update') : (ja ? '追加する' : bn ? 'যোগ করুন' : 'Add'))}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </DashboardLayout>
  );
}
