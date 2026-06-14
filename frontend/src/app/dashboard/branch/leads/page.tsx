'use client';
import DashboardLayout from '@/components/shared/DashboardLayout';
import api from '@/lib/api';
import { useAuthStore } from '@/store/authStore';
import { useLang } from '@/context/LanguageContext';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useCountryData } from '@/hooks/useCountryData';

// Safe date display — avoids UTC-shift for date-only strings from API
function fmtDate(val: string | null | undefined): string {
  if (!val) return '—';
  const [y, m, d] = val.slice(0, 10).split('-');
  return `${d}/${m}/${y}`;
}

// Title-case status for display
function fmtStatus(s: string): string {
  return s.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase());
}

interface Lead {
  id: number;
  lead_code: string;
  status: string;
  target_country: string | null;
  target_course: string | null;
  target_intake: string | null;
  created_at: string;
  student: { id: number; name: string; email: string } | null;
}

const STATUS_COLORS: Record<string, string> = {
  new:                  'bg-blue-100 text-blue-700',
  profile_complete:     'bg-sky-100 text-sky-700',
  under_review:         'bg-amber-100 text-amber-700',
  shortlisted:          'bg-orange-100 text-orange-700',
  interview_scheduled:  'bg-purple-100 text-purple-700',
  interviewed:          'bg-indigo-100 text-indigo-700',
  offer_received:       'bg-teal-100 text-teal-700',
  accepted:             'bg-emerald-100 text-emerald-700',
  visa_processing:      'bg-cyan-100 text-cyan-700',
  visa_approved:        'bg-green-100 text-green-700',
  visa_rejected:        'bg-red-100 text-red-700',
  enrolled:             'bg-green-200 text-green-800',
  closed:               'bg-slate-100 text-slate-500',
  on_hold:              'bg-yellow-100 text-yellow-700',
};

const EMPTY_FORM = {
  student_name: '', student_email: '', student_phone: '',
  target_country: '', target_course: '', target_intake: '',
};

const inputCls = 'w-full border border-slate-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-green-500';

export default function BranchApplicantsPage() {
  const { user } = useAuthStore();
  const router = useRouter();
  const qc = useQueryClient();
  const { lang } = useLang();
  const ja = lang === 'ja'; const bn = lang === 'bn';

  const isBranchAdmin = user?.roles?.includes('branch_admin');
  useEffect(() => {
    if (user && !isBranchAdmin) router.replace(`/dashboard/${user.gateway_type ?? ''}`);
  }, [user, isBranchAdmin, router]);

  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState(EMPTY_FORM);
  const [formErr, setFormErr] = useState('');

  const { data: countryData = {} } = useCountryData();
  const countryList = Object.keys(countryData);

  const { data: leads = [], isLoading } = useQuery<Lead[]>({
    queryKey: ['branch-leads'],
    queryFn: () => api.get('/branch-admin/leads').then(r => r.data),
    enabled: !!isBranchAdmin,
  });

  const add = useMutation({
    mutationFn: () => api.post('/branch-admin/leads', form),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['branch-leads'] });
      setForm(EMPTY_FORM);
      setShowForm(false);
      setFormErr('');
    },
    onError: (e: unknown) => {
      const err = e as { response?: { data?: { message?: string; errors?: Record<string, string[]> } } };
      const errs = err.response?.data?.errors;
      setFormErr(errs ? Object.values(errs).flat().join(' ') : err.response?.data?.message ?? 'Failed.');
    },
  });

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setFormErr('');
    add.mutate();
  }

  function set(field: keyof typeof EMPTY_FORM) {
    return (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => setForm(f => ({ ...f, [field]: e.target.value }));
  }

  if (!user || !isBranchAdmin) return null;

  const title = ja ? '申請者一覧' : bn ? 'আবেদনকারী' : 'Applicants';
  const addLabel = ja ? '+ 申請者追加' : bn ? '+ আবেদনকারী যোগ করুন' : '+ Add Applicant';

  return (
    <DashboardLayout title={title}>

      {/* Header */}
      <div className="flex items-center justify-between mb-5">
        <p className="text-xs text-slate-500">
          {ja ? `${leads.length} 件の申請者` : bn ? `${leads.length} জন আবেদনকারী` : `${leads.length} applicant${leads.length !== 1 ? 's' : ''}`}
        </p>
        <button
          onClick={() => { setShowForm(s => !s); setFormErr(''); }}
          className="px-4 py-2 bg-green-700 hover:bg-green-800 text-white text-sm font-semibold rounded-xl transition-colors"
        >
          {showForm ? (ja ? '✕ 閉じる' : bn ? '✕ বন্ধ করুন' : '✕ Close') : addLabel}
        </button>
      </div>

      {/* Add Applicant Form */}
      {showForm && (
        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-5 mb-5">
          <h2 className="font-bold text-slate-900 text-sm mb-4">
            {ja ? '新しい申請者を追加' : bn ? 'নতুন আবেদনকারী যোগ করুন' : 'Add New Applicant'}
          </h2>

          {formErr && (
            <div className="mb-4 p-3 bg-red-50 border border-red-100 rounded-xl text-xs text-red-600">⚠️ {formErr}</div>
          )}

          <form onSubmit={handleSubmit} className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-500 mb-1">
                {ja ? '学生名 *' : bn ? 'শিক্ষার্থীর নাম *' : 'Student Name *'}
              </label>
              <input className={inputCls} placeholder={ja ? '例：山田 太郎' : bn ? 'যেমন: মোঃ রহিম উদ্দিন' : 'e.g. Md. Rahim Uddin'}
                value={form.student_name} onChange={set('student_name')} required />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-500 mb-1">
                {ja ? 'メールアドレス *' : bn ? 'ইমেইল *' : 'Email *'}
              </label>
              <input className={inputCls} type="email" placeholder="student@example.com"
                value={form.student_email} onChange={set('student_email')} required />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-500 mb-1">
                {ja ? '電話番号 *' : bn ? 'ফোন নম্বর *' : 'Phone *'}
              </label>
              <input className={inputCls} type="tel" placeholder="+880 1XXX XXXXXX"
                value={form.student_phone} onChange={set('student_phone')} required />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-500 mb-1">
                {ja ? '渡航先 *' : bn ? 'লক্ষ্য দেশ *' : 'Target Country *'}
              </label>
              <select className={inputCls} value={form.target_country} onChange={set('target_country')} required>
                <option value="">{ja ? '選択してください' : bn ? 'বেছে নিন' : 'Select country'}</option>
                {countryList.map(c => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-500 mb-1">
                {ja ? 'コース' : bn ? 'কোর্স' : 'Course'} <span className="font-normal text-slate-400">({ja ? '任意' : bn ? 'ঐচ্ছিক' : 'optional'})</span>
              </label>
              <input className={inputCls} placeholder={ja ? '例：日本語' : bn ? 'যেমন: জাপানি ভাষা' : 'e.g. Japanese Language'}
                value={form.target_course} onChange={set('target_course')} />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-500 mb-1">
                {ja ? '入学予定日' : bn ? 'ভর্তির তারিখ' : 'Target Intake'} <span className="font-normal text-slate-400">({ja ? '任意' : bn ? 'ঐচ্ছিক' : 'optional'})</span>
              </label>
              <input className={inputCls} type="date"
                min={new Date().toISOString().slice(0, 10)}
                value={form.target_intake} onChange={set('target_intake')} />
            </div>
            <div className="sm:col-span-2 flex gap-2 pt-1">
              <button type="submit" disabled={add.isPending}
                className="flex-1 py-2.5 bg-green-700 hover:bg-green-800 text-white rounded-xl text-sm font-bold disabled:opacity-50 transition-colors">
                {add.isPending ? '…' : (ja ? '申請者を追加する' : bn ? 'আবেদনকারী যোগ করুন' : 'Add Applicant')}
              </button>
              <button type="button" onClick={() => { setShowForm(false); setForm(EMPTY_FORM); setFormErr(''); }}
                className="px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-sm font-semibold transition-colors">
                {ja ? 'キャンセル' : bn ? 'বাতিল' : 'Cancel'}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Table */}
      {isLoading ? (
        <div className="text-center py-12 text-slate-400 text-sm">
          {ja ? '読み込み中...' : bn ? 'লোড হচ্ছে...' : 'Loading...'}
        </div>
      ) : leads.length === 0 ? (
        <div className="text-center py-16">
          <div className="text-4xl mb-3">📋</div>
          <p className="text-slate-400 text-sm">
            {ja ? 'まだ申請者がいません。' : bn ? 'এখনো কোনো আবেদনকারী নেই।' : 'No applicants from this branch yet.'}
          </p>
          <button onClick={() => setShowForm(true)}
            className="mt-4 px-5 py-2 bg-green-700 text-white text-sm font-semibold rounded-xl hover:bg-green-800">
            {addLabel}
          </button>
        </div>
      ) : (
        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-100 text-xs font-semibold text-slate-500">
                  <th className="text-left px-5 py-3">{ja ? 'コード' : bn ? 'কোড' : 'Code'}</th>
                  <th className="text-left px-4 py-3">{ja ? '学生' : bn ? 'শিক্ষার্থী' : 'Student'}</th>
                  <th className="text-left px-4 py-3">{ja ? 'ステータス' : bn ? 'স্ট্যাটাস' : 'Status'}</th>
                  <th className="text-left px-4 py-3 hidden sm:table-cell">{ja ? '渡航先' : bn ? 'গন্তব্য' : 'Country'}</th>
                  <th className="text-left px-4 py-3 hidden md:table-cell">{ja ? 'コース' : bn ? 'কোর্স' : 'Course'}</th>
                  <th className="text-left px-4 py-3 hidden lg:table-cell">{ja ? '入学予定日' : bn ? 'ভর্তির তারিখ' : 'Intake'}</th>
                  <th className="text-left px-4 py-3 hidden md:table-cell">{ja ? '登録日' : bn ? 'তারিখ' : 'Added'}</th>
                  <th className="px-4 py-3"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {leads.map(lead => (
                  // Fix: whole row is clickable — much better tap target on mobile
                  <tr
                    key={lead.id}
                    onClick={() => router.push(`/dashboard/branch/applicants/${lead.id}`)}
                    className="hover:bg-slate-50 active:bg-slate-100 transition-colors cursor-pointer"
                  >
                    <td className="px-5 py-3">
                      <span className="font-mono text-xs text-slate-600 bg-slate-100 px-2 py-0.5 rounded">{lead.lead_code}</span>
                    </td>
                    <td className="px-4 py-3">
                      <p className="font-medium text-slate-800 text-xs">{lead.student?.name ?? '—'}</p>
                      <p className="text-[11px] text-slate-400">{lead.student?.email ?? ''}</p>
                    </td>
                    <td className="px-4 py-3">
                      {/* Fix: title-cased status text */}
                      <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${STATUS_COLORS[lead.status] ?? 'bg-slate-100 text-slate-500'}`}>
                        {fmtStatus(lead.status)}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-xs text-slate-500 hidden sm:table-cell">{lead.target_country ?? '—'}</td>
                    <td className="px-4 py-3 text-xs text-slate-500 hidden md:table-cell">{lead.target_course ?? '—'}</td>
                    <td className="px-4 py-3 text-xs text-slate-400 hidden lg:table-cell">
                      {/* Fix: safe date display — no UTC shift */}
                      {fmtDate(lead.target_intake)}
                    </td>
                    <td className="px-4 py-3 text-xs text-slate-400 hidden md:table-cell">
                      {new Date(lead.created_at).toLocaleDateString()}
                    </td>
                    <td className="px-4 py-3">
                      <span className="text-xs font-semibold text-green-700 whitespace-nowrap">
                        {ja ? '詳細 →' : bn ? 'বিস্তারিত →' : 'View →'}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

    </DashboardLayout>
  );
}
