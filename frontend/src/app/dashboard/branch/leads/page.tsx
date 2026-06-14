'use client';
import DashboardLayout from '@/components/shared/DashboardLayout';
import api from '@/lib/api';
import { useAuthStore } from '@/store/authStore';
import { useLang } from '@/context/LanguageContext';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { useCountryData } from '@/hooks/useCountryData';

function fmtDate(val: string | null | undefined): string {
  if (!val) return '—';
  const [y, m, d] = val.slice(0, 10).split('-');
  return `${d}/${m}/${y}`;
}

function fmtStatus(s: string): string {
  return s.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase());
}

interface Applicant {
  id: number;
  lead_code: string;
  status: string;
  submission_status: 'draft' | 'submitted' | 'accepted' | 'rejected' | null;
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

const SUB_COLORS: Record<string, string> = {
  draft:     'bg-slate-100 text-slate-500',
  submitted: 'bg-amber-100 text-amber-700',
  accepted:  'bg-green-100 text-green-700',
  rejected:  'bg-red-100 text-red-600',
};

const EMPTY_FORM = {
  student_name: '', student_email: '', student_phone: '',
  target_country: '', target_course: '', target_intake: '',
};

const inputCls = 'w-full border border-slate-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-green-500';

type SubFilter = '' | 'draft' | 'submitted' | 'accepted' | 'rejected';

export default function BranchApplicantsPage() {
  const { user } = useAuthStore();
  const router = useRouter();
  const qc = useQueryClient();
  const { lang } = useLang();
  const ja = lang === 'ja'; const bn = lang === 'bn';

  const isBranchAdmin = user?.roles?.some(r => r === 'branch_admin' || r === 'branch_manager');
  useEffect(() => {
    if (user && !isBranchAdmin) router.replace(`/dashboard/${user.gateway_type ?? ''}`);
  }, [user, isBranchAdmin, router]);

  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState(EMPTY_FORM);
  const [formErr, setFormErr] = useState('');
  const [subFilter, setSubFilter] = useState<SubFilter>('');
  const [submittingId, setSubmittingId] = useState<number | null>(null);
  const [submitErr, setSubmitErr] = useState('');

  const { data: countryData = {} } = useCountryData();
  const countryList = Object.keys(countryData);

  const { data: applicants = [], isLoading } = useQuery<Applicant[]>({
    queryKey: ['branch-leads', subFilter],
    queryFn: () => api.get('/branch-admin/leads', {
      params: subFilter ? { submission_status: subFilter } : {},
    }).then(r => r.data),
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

  const submit = useMutation({
    mutationFn: (id: number) => api.post(`/branch-admin/leads/${id}/submit`),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['branch-leads'] });
      setSubmittingId(null);
      setSubmitErr('');
    },
    onError: (e: unknown) => {
      const err = e as { response?: { data?: { message?: string } } };
      setSubmitErr(err.response?.data?.message ?? 'Failed to submit.');
      setSubmittingId(null);
    },
    onSettled: () => setSubmittingId(null),
  });

  function handleAdd(e: React.FormEvent) {
    e.preventDefault();
    setFormErr('');
    add.mutate();
  }

  function set(field: keyof typeof EMPTY_FORM) {
    return (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) =>
      setForm(f => ({ ...f, [field]: e.target.value }));
  }

  if (!user || !isBranchAdmin) return null;

  const title = ja ? '申請者一覧' : bn ? 'আবেদনকারী' : 'Applicants';
  const addLabel = ja ? '+ 新規申請者' : bn ? '+ নতুন আবেদনকারী' : '+ New Applicant';

  const TABS: { key: SubFilter; label: string }[] = [
    { key: '',          label: ja ? 'すべて'      : bn ? 'সব'          : 'All'       },
    { key: 'draft',     label: ja ? '下書き'      : bn ? 'ড্রাফট'      : 'Draft'     },
    { key: 'submitted', label: ja ? '提出済み'    : bn ? 'সাবমিট হয়েছে' : 'Submitted' },
    { key: 'accepted',  label: ja ? '承認済み'    : bn ? 'গৃহীত'       : 'Accepted'  },
    { key: 'rejected',  label: ja ? '却下'        : bn ? 'প্রত্যাখ্যাত' : 'Rejected'  },
  ];

  return (
    <DashboardLayout title={title}>

      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <p className="text-xs text-slate-500">
          {isLoading ? '…' : `${applicants.length} ${ja ? '件' : bn ? 'টি' : 'total'}`}
        </p>
        <button
          onClick={() => { setShowForm(s => !s); setFormErr(''); }}
          className="px-4 py-2 bg-green-700 hover:bg-green-800 text-white text-sm font-semibold rounded-xl transition-colors"
        >
          {showForm ? (ja ? '✕ 閉じる' : bn ? '✕ বন্ধ করুন' : '✕ Close') : addLabel}
        </button>
      </div>

      {/* Submit error */}
      {submitErr && (
        <div className="mb-4 p-3 bg-red-50 border border-red-100 rounded-xl text-xs text-red-600 flex items-center justify-between">
          <span>⚠️ {submitErr}</span>
          <button onClick={() => setSubmitErr('')} className="text-red-400 hover:text-red-600 ml-2">✕</button>
        </div>
      )}

      {/* Filter tabs */}
      <div className="flex gap-2 flex-wrap mb-5">
        {TABS.map(t => (
          <button key={t.key} onClick={() => setSubFilter(t.key)}
            className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-colors ${subFilter === t.key ? 'bg-green-700 text-white' : 'bg-white border border-slate-200 text-slate-600 hover:border-green-400'}`}>
            {t.label}
          </button>
        ))}
      </div>

      {/* Add Form */}
      {showForm && (
        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-5 mb-5">
          <h2 className="font-bold text-slate-900 text-sm mb-4">
            {ja ? '新しい申請者を追加' : bn ? 'নতুন আবেদনকারী যোগ করুন' : 'Add New Applicant'}
          </h2>
          {formErr && (
            <div className="mb-4 p-3 bg-red-50 border border-red-100 rounded-xl text-xs text-red-600">⚠️ {formErr}</div>
          )}
          <form onSubmit={handleAdd} className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-500 mb-1">{ja ? '学生名 *' : bn ? 'শিক্ষার্থীর নাম *' : 'Student Name *'}</label>
              <input className={inputCls} placeholder={ja ? '例：山田 太郎' : bn ? 'যেমন: মোঃ রহিম' : 'e.g. Md. Rahim'}
                value={form.student_name} onChange={set('student_name')} required />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-500 mb-1">{ja ? 'メール *' : bn ? 'ইমেইল *' : 'Email *'}</label>
              <input className={inputCls} type="email" placeholder="student@example.com"
                value={form.student_email} onChange={set('student_email')} required />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-500 mb-1">{ja ? '電話番号 *' : bn ? 'ফোন *' : 'Phone *'}</label>
              <input className={inputCls} type="tel" placeholder="+880 1XXX XXXXXX"
                value={form.student_phone} onChange={set('student_phone')} required />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-500 mb-1">{ja ? '渡航先 *' : bn ? 'লক্ষ্য দেশ *' : 'Target Country *'}</label>
              <select className={inputCls} value={form.target_country} onChange={set('target_country')} required>
                <option value="">{ja ? '選択' : bn ? 'বেছে নিন' : 'Select'}</option>
                {countryList.map(c => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-500 mb-1">{ja ? 'コース' : bn ? 'কোর্স' : 'Course'}</label>
              <input className={inputCls} placeholder={ja ? '例：日本語' : bn ? 'যেমন: জাপানি ভাষা' : 'e.g. Japanese Language'}
                value={form.target_course} onChange={set('target_course')} />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-500 mb-1">{ja ? '入学予定日' : bn ? 'ভর্তির তারিখ' : 'Target Intake'}</label>
              <input className={inputCls} type="date"
                min={new Date().toISOString().slice(0, 10)}
                value={form.target_intake} onChange={set('target_intake')} />
            </div>
            <div className="sm:col-span-2 flex gap-2 pt-1">
              <button type="submit" disabled={add.isPending}
                className="flex-1 py-2.5 bg-green-700 hover:bg-green-800 text-white rounded-xl text-sm font-bold disabled:opacity-50 transition-colors">
                {add.isPending ? '…' : (ja ? '申請者を追加' : bn ? 'যোগ করুন' : 'Add Applicant')}
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
        <div className="text-center py-12 text-slate-400 text-sm">{ja ? '読み込み中...' : bn ? 'লোড হচ্ছে...' : 'Loading...'}</div>
      ) : applicants.length === 0 ? (
        <div className="text-center py-16">
          <div className="text-4xl mb-3">📋</div>
          <p className="text-slate-400 text-sm">{ja ? 'まだ申請者がいません。' : bn ? 'কোনো আবেদনকারী নেই।' : 'No applicants yet.'}</p>
          {subFilter === '' && (
            <button onClick={() => setShowForm(true)}
              className="mt-4 px-5 py-2 bg-green-700 text-white text-sm font-semibold rounded-xl hover:bg-green-800">
              {addLabel}
            </button>
          )}
        </div>
      ) : (
        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-100 text-xs font-semibold text-slate-500">
                  <th className="text-left px-5 py-3">{ja ? 'コード' : bn ? 'কোড' : 'Code'}</th>
                  <th className="text-left px-4 py-3">{ja ? '学生' : bn ? 'শিক্ষার্থী' : 'Student'}</th>
                  <th className="text-left px-4 py-3">{ja ? '提出状況' : bn ? 'সাবমিশন' : 'Submission'}</th>
                  <th className="text-left px-4 py-3 hidden sm:table-cell">{ja ? '渡航先' : bn ? 'দেশ' : 'Country'}</th>
                  <th className="text-left px-4 py-3 hidden md:table-cell">{ja ? '入学予定日' : bn ? 'ইনটেক' : 'Intake'}</th>
                  <th className="text-left px-4 py-3 hidden lg:table-cell">{ja ? '登録日' : bn ? 'তারিখ' : 'Added'}</th>
                  <th className="px-4 py-3"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {applicants.map(a => (
                  <tr key={a.id}
                    onClick={() => router.push(`/dashboard/branch/applicants/${a.id}`)}
                    className="hover:bg-slate-50 active:bg-slate-100 transition-colors cursor-pointer">
                    <td className="px-5 py-3">
                      <span className="font-mono text-xs text-slate-600 bg-slate-100 px-2 py-0.5 rounded">{a.lead_code}</span>
                    </td>
                    <td className="px-4 py-3">
                      <p className="font-medium text-slate-800 text-xs">{a.student?.name ?? '—'}</p>
                      <p className="text-[11px] text-slate-400">{a.student?.email ?? ''}</p>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex flex-col gap-1">
                        {a.submission_status && (
                          <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full w-fit ${SUB_COLORS[a.submission_status] ?? 'bg-slate-100 text-slate-500'}`}>
                            {fmtStatus(a.submission_status)}
                          </span>
                        )}
                        {a.submission_status === 'draft' && (
                          <button
                            onClick={e => { e.stopPropagation(); setSubmittingId(a.id); submit.mutate(a.id); }}
                            disabled={submit.isPending && submittingId === a.id}
                            className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-green-700 text-white hover:bg-green-800 disabled:opacity-50 w-fit transition-colors">
                            {submit.isPending && submittingId === a.id ? '…' : (ja ? '提出する' : bn ? 'সাবমিট করুন' : 'Submit')}
                          </button>
                        )}
                      </div>
                    </td>
                    <td className="px-4 py-3 text-xs text-slate-500 hidden sm:table-cell">{a.target_country ?? '—'}</td>
                    <td className="px-4 py-3 text-xs text-slate-400 hidden md:table-cell">{fmtDate(a.target_intake)}</td>
                    <td className="px-4 py-3 text-xs text-slate-400 hidden lg:table-cell">{new Date(a.created_at).toLocaleDateString()}</td>
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
