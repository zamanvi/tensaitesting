'use client';
import DashboardLayout from '@/components/shared/DashboardLayout';
import { useLang } from '@/context/LanguageContext';
import api from '@/lib/api';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';

interface Employee {
  id: number;
  entity_type: 'employee';
  name: string;
  designation: string | null;
  contact_email: string | null;
  contact_phone: string | null;
  country: string | null;
  city: string | null;
  status: 'prospect' | 'active' | 'inactive';
  notes: string | null;
}

const blank: {
  name: string; designation: string; contact_email: string; contact_phone: string;
  country: string; city: string; status: 'prospect' | 'active' | 'inactive'; notes: string;
} = {
  name: '', designation: '', contact_email: '', contact_phone: '',
  country: '', city: '', status: 'prospect', notes: '',
};

const STATUS_COLOR: Record<string, string> = {
  prospect: 'bg-amber-100 text-amber-700',
  active:   'bg-emerald-100 text-emerald-700',
  inactive: 'bg-slate-100 text-slate-500',
};

const inputCls = 'w-full border border-slate-200 rounded-xl px-3 py-2.5 text-sm text-slate-800 bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500 placeholder:text-slate-400';

export default function EmployeesPage() {
  const { lang } = useLang();
  const router = useRouter();
  const qc = useQueryClient();
  const affiliateType = (qc.getQueryData<{ affiliate_type?: string }>(['affiliate-dashboard']))?.affiliate_type;
  const isGlobal = affiliateType === 'global';

  useEffect(() => {
    if (affiliateType && affiliateType !== 'global') router.replace('/dashboard/affiliate');
  }, [affiliateType, router]);

  const ja = lang === 'ja'; const bn = lang === 'bn';

  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing]   = useState<Employee | null>(null);
  const [form, setForm]         = useState({ ...blank });
  const [formError, setFormError] = useState('');
  const [deleting, setDeleting] = useState<number | null>(null);

  const { data, isLoading } = useQuery({
    queryKey: ['affiliate-employees'],
    queryFn: () => api.get('/affiliate/entities?type=employee').then(r => r.data),
    enabled: isGlobal,
  });

  const employees: Employee[] = Array.isArray(data?.data) ? data.data : [];

  function openCreate() {
    setEditing(null); setForm({ ...blank }); setFormError(''); setShowForm(true);
  }
  function openEdit(emp: Employee) {
    setEditing(emp);
    setForm({
      name: emp.name, designation: emp.designation ?? '',
      contact_email: emp.contact_email ?? '', contact_phone: emp.contact_phone ?? '',
      country: emp.country ?? '', city: emp.city ?? '',
      status: emp.status, notes: emp.notes ?? '',
    });
    setFormError(''); setShowForm(true);
  }

  const saveMutation = useMutation({
    mutationFn: (payload: typeof blank) =>
      editing
        ? api.put(`/affiliate/entities/${editing.id}`, payload)
        : api.post('/affiliate/entities', { ...payload, entity_type: 'employee' }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['affiliate-employees'] });
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
      qc.invalidateQueries({ queryKey: ['affiliate-employees'] });
      qc.invalidateQueries({ queryKey: ['affiliate-dashboard'] });
      setDeleting(null);
    },
  });

  function set(k: keyof typeof blank, v: string) { setForm(f => ({ ...f, [k]: v })); }

  return (
    <DashboardLayout title={ja ? '従業員管理' : bn ? 'কর্মী ম্যানেজমেন্ট' : 'Manage Employees'}>

      {/* Header */}
      <div className="flex items-center justify-between mb-5">
        <p className="text-sm text-slate-500">
          {ja ? '管理している従業員・フィールドエージェント' : bn ? 'আপনার ম্যানেজ করা কর্মী ও ফিল্ড এজেন্ট' : 'Employees and field agents you manage for Tensai'}
        </p>
        <button
          onClick={openCreate}
          className="flex items-center gap-1.5 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold rounded-xl transition-colors"
        >
          <span>+</span>
          {ja ? '従業員を追加' : bn ? 'কর্মী যোগ করুন' : 'Add Employee'}
        </button>
      </div>

      {/* Stats */}
      {employees.length > 0 && (
        <div className="grid grid-cols-3 gap-3 mb-5">
          {[
            { label: ja ? '合計' : bn ? 'মোট' : 'Total', value: employees.length, color: 'bg-indigo-50 text-indigo-700' },
            { label: ja ? 'アクティブ' : bn ? 'সক্রিয়' : 'Active', value: employees.filter(e => e.status === 'active').length, color: 'bg-emerald-50 text-emerald-700' },
            { label: ja ? '見込み' : bn ? 'প্রসপেক্ট' : 'Prospects', value: employees.filter(e => e.status === 'prospect').length, color: 'bg-amber-50 text-amber-700' },
          ].map(s => (
            <div key={s.label} className={`rounded-2xl p-4 text-center border border-transparent ${s.color}`}>
              <div className="text-xl font-black">{s.value}</div>
              <div className="text-xs font-medium mt-0.5">{s.label}</div>
            </div>
          ))}
        </div>
      )}

      {/* List */}
      {isLoading ? (
        <div className="space-y-3">{[1,2,3].map(i => <div key={i} className="h-20 bg-slate-100 rounded-2xl animate-pulse" />)}</div>
      ) : employees.length === 0 ? (
        <div className="bg-white border-2 border-dashed border-slate-200 rounded-2xl p-12 text-center">
          <div className="text-4xl mb-3">👤</div>
          <p className="font-semibold text-slate-700 mb-1">
            {ja ? '従業員がまだいません' : bn ? 'এখনো কোনো কর্মী যোগ করা হয়নি' : 'No employees added yet'}
          </p>
          <p className="text-xs text-slate-400 mb-4">
            {ja ? 'Tensaiのために管理するフィールドエージェントや従業員を追加してください。' : bn ? 'Tensai-এর জন্য ম্যানেজ করা কর্মী বা ফিল্ড এজেন্ট যোগ করুন।' : 'Add field agents or employees you manage on behalf of Tensai.'}
          </p>
          <button onClick={openCreate} className="px-5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-semibold rounded-xl transition-colors">
            + {ja ? '従業員を追加' : bn ? 'প্রথম কর্মী যোগ করুন' : 'Add First Employee'}
          </button>
        </div>
      ) : (
        <div className="space-y-3">
          {employees.map(emp => (
            <div key={emp.id} className="bg-white border border-slate-100 rounded-2xl p-4 sm:p-5 hover:border-slate-200 transition-all">
              <div className="flex items-center gap-4">
                <div className="w-11 h-11 rounded-full bg-indigo-100 text-indigo-700 flex items-center justify-center text-lg font-black shrink-0">
                  {emp.name.charAt(0).toUpperCase()}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex flex-wrap items-center gap-2 mb-0.5">
                    <h3 className="font-bold text-slate-900">{emp.name}</h3>
                    <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${STATUS_COLOR[emp.status]}`}>{emp.status}</span>
                  </div>
                  <div className="flex flex-wrap gap-x-4 gap-y-0.5 text-xs text-slate-400">
                    {emp.designation && <span>💼 {emp.designation}</span>}
                    {emp.country && <span>📍 {emp.city ? `${emp.city}, ` : ''}{emp.country}</span>}
                    {emp.contact_email && <span>✉️ {emp.contact_email}</span>}
                    {emp.contact_phone && <span>📞 {emp.contact_phone}</span>}
                  </div>
                  {emp.notes && <p className="text-xs text-slate-400 mt-1 line-clamp-1">📝 {emp.notes}</p>}
                </div>
                <div className="flex gap-1.5 shrink-0">
                  <button onClick={() => openEdit(emp)} className="px-3 py-1.5 text-xs font-medium bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg transition-colors">
                    {ja ? '編集' : bn ? 'সম্পাদনা' : 'Edit'}
                  </button>
                  <button onClick={() => setDeleting(emp.id)} className="px-3 py-1.5 text-xs font-medium bg-red-50 hover:bg-red-100 text-red-600 rounded-lg transition-colors">
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
            <p className="font-bold text-slate-900 mb-2">{ja ? '本当に削除しますか？' : bn ? 'সত্যিই মুছবেন?' : 'Delete this employee?'}</p>
            <p className="text-sm text-slate-500 mb-5">{ja ? 'この操作は元に戻せません。' : bn ? 'এই কাজ পূর্বাবস্থায় ফেরানো যাবে না।' : 'This cannot be undone.'}</p>
            <div className="flex gap-3">
              <button onClick={() => setDeleting(null)} className="flex-1 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 text-sm font-semibold rounded-xl">
                {ja ? 'キャンセル' : bn ? 'বাতিল' : 'Cancel'}
              </button>
              <button onClick={() => deleteMutation.mutate(deleting)} disabled={deleteMutation.isPending}
                className="flex-1 py-2.5 bg-red-600 hover:bg-red-700 text-white text-sm font-semibold rounded-xl">
                {deleteMutation.isPending ? '...' : (ja ? '削除する' : bn ? 'মুছুন' : 'Delete')}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Create/Edit modal */}
      {showForm && (
        <div className="fixed inset-0 bg-black/40 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4">
          <div className="bg-white rounded-t-3xl sm:rounded-2xl w-full sm:max-w-md max-h-[90vh] overflow-y-auto shadow-xl">
            <div className="sticky top-0 bg-white border-b border-slate-100 px-5 py-4 flex items-center justify-between">
              <h2 className="font-bold text-slate-900">
                {editing ? (ja ? '従業員を編集' : bn ? 'কর্মী সম্পাদনা' : 'Edit Employee') : (ja ? '従業員を追加' : bn ? 'নতুন কর্মী' : 'Add Employee')}
              </h2>
              <button onClick={() => setShowForm(false)} className="text-slate-400 hover:text-slate-700 text-xl">✕</button>
            </div>
            <form className="p-5 space-y-4" onSubmit={e => { e.preventDefault(); saveMutation.mutate(form); }}>
              <div>
                <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wide mb-1">{ja ? '氏名 *' : bn ? 'নাম *' : 'Full Name *'}</label>
                <input required className={inputCls} placeholder={ja ? '例: Tanaka Kenji' : bn ? 'যেমন: Rahim Ahmed' : 'e.g. John Smith'} value={form.name} onChange={e => set('name', e.target.value)} />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wide mb-1">{ja ? '役職・担当' : bn ? 'পদবি' : 'Designation'}</label>
                <input className={inputCls} placeholder={ja ? '例: 地域代表' : bn ? 'যেমন: রিজিওনাল রিপ্রেজেন্টেটিভ' : 'e.g. Regional Representative'} value={form.designation} onChange={e => set('designation', e.target.value)} />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wide mb-1">{ja ? '国' : bn ? 'দেশ' : 'Country'}</label>
                  <input className={inputCls} placeholder="Bangladesh" value={form.country} onChange={e => set('country', e.target.value)} />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wide mb-1">{ja ? '都市' : bn ? 'শহর' : 'City'}</label>
                  <input className={inputCls} placeholder="Dhaka" value={form.city} onChange={e => set('city', e.target.value)} />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wide mb-1">{ja ? 'メール' : bn ? 'ইমেইল' : 'Email'}</label>
                  <input type="email" className={inputCls} placeholder="agent@email.com" value={form.contact_email} onChange={e => set('contact_email', e.target.value)} />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wide mb-1">{ja ? '電話' : bn ? 'ফোন' : 'Phone'}</label>
                  <input className={inputCls} placeholder="+880..." value={form.contact_phone} onChange={e => set('contact_phone', e.target.value)} />
                </div>
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wide mb-1">{ja ? 'ステータス' : bn ? 'স্ট্যাটাস' : 'Status'}</label>
                <select className={inputCls} value={form.status} onChange={e => set('status', e.target.value)}>
                  <option value="prospect">{ja ? '見込み' : bn ? 'প্রসপেক্ট' : 'Prospect'}</option>
                  <option value="active">{ja ? 'アクティブ' : bn ? 'সক্রিয়' : 'Active'}</option>
                  <option value="inactive">{ja ? '非アクティブ' : bn ? 'নিষ্ক্রিয়' : 'Inactive'}</option>
                </select>
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wide mb-1">{ja ? 'メモ' : bn ? 'নোট' : 'Notes'}</label>
                <textarea rows={2} className={`${inputCls} resize-none`} placeholder={ja ? '内部メモ...' : bn ? 'নোট...' : 'Notes...'} value={form.notes} onChange={e => set('notes', e.target.value)} />
              </div>
              {formError && <p className="text-xs text-red-600 bg-red-50 border border-red-100 rounded-xl p-3">⚠️ {formError}</p>}
              <div className="flex gap-3 pt-1">
                <button type="button" onClick={() => setShowForm(false)} className="flex-1 py-3 bg-slate-100 hover:bg-slate-200 text-slate-700 text-sm font-semibold rounded-xl">
                  {ja ? 'キャンセル' : bn ? 'বাতিল' : 'Cancel'}
                </button>
                <button type="submit" disabled={saveMutation.isPending} className="flex-1 py-3 bg-indigo-600 hover:bg-indigo-700 disabled:bg-slate-100 disabled:text-slate-400 text-white text-sm font-bold rounded-xl transition-colors">
                  {saveMutation.isPending ? '...' : (editing ? (ja ? '更新' : bn ? 'আপডেট' : 'Update') : (ja ? '追加' : bn ? 'যোগ করুন' : 'Add'))}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </DashboardLayout>
  );
}
