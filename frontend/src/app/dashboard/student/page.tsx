'use client';
import StudentLayout from '@/components/shared/StudentLayout';
import { useLang } from '@/context/LanguageContext';
import { useAuthStore } from '@/store/authStore';
import api from '@/lib/api';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { STATUS_COLORS } from '@/lib/constants';

interface Lead {
  id: number;
  lead_code: string;
  status: string;
  target_country: string;
  target_course: string | null;
  target_intake: string | null;
  created_at: string;
  assigned_agency?: { id: number; name: string } | null;
}

const PIPELINE_STAGES = [
  { key: 'new',          en: 'New',         ja: '新規',       bn: 'নতুন' },
  { key: 'under_review', en: 'Processing',  ja: '審査中',     bn: 'প্রক্রিয়াধীন' },
  { key: 'shortlisted',  en: 'Shortlisted', ja: '選考中',     bn: 'শর্টলিস্টেড' },
  { key: 'applied',      en: 'Applied',     ja: '申請済み',   bn: 'আবেদন হয়েছে' },
  { key: 'interview',    en: 'Interview',   ja: '面接',       bn: 'ইন্টারভিউ' },
  { key: 'enrolled',     en: 'Enrolled',    ja: '入学済み',   bn: 'ভর্তি হয়েছে' },
];
const PROGRESS_KEYS = PIPELINE_STAGES.map(s => s.key);
const PROGRESS_INDEX: Record<string, number> = {
  new: 0,
  under_review: 1, profile_complete: 1,
  shortlisted: 2, applied: 3,
  interview: 4, interview_scheduled: 4, interviewed: 4,
  offer_received: 5, visa_processing: 5, visa_approved: 5, enrolled: 5,
};
const TERMINAL = ['rejected', 'withdrawn', 'closed', 'visa_rejected', 'on_hold'];

const COUNTRIES = ['Japan', 'Canada', 'Australia', 'UK', 'Germany', 'South Korea', 'New Zealand', 'USA'];

const inputCls = 'w-full border border-slate-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-green-500';

export default function StudentApplicationPage() {
  const { t, lang } = useLang();
  const { user } = useAuthStore();
  const qc = useQueryClient();
  const router = useRouter();
  const ja = lang === 'ja'; const bn = lang === 'bn';

  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ target_country: '', target_course: '', target_intake: '', notes: '' });
  const [applyErr, setApplyErr] = useState('');
  const [filter, setFilter] = useState('all');

  const { data, isLoading } = useQuery({
    queryKey: ['student-leads'],
    queryFn: () => api.get('/student/leads').then(r => r.data),
    staleTime: 30_000,
  });

  const allLeads: Lead[] = data?.data ?? [];
  const TERMINAL_set = new Set(TERMINAL);
  const displayed = filter === 'all' ? allLeads
    : filter === 'closed' ? allLeads.filter(l => TERMINAL_set.has(l.status))
    : allLeads.filter(l => l.status === filter);

  const activeCounts: Record<string, number> = {};
  for (const l of allLeads) {
    if (!TERMINAL_set.has(l.status)) activeCounts[l.status] = (activeCounts[l.status] ?? 0) + 1;
  }
  const terminalCount = allLeads.filter(l => TERMINAL_set.has(l.status)).length;

  const filterTabs = [
    { key: 'all', label: ja ? 'すべて' : bn ? 'সব' : 'All', count: allLeads.length },
    ...PIPELINE_STAGES.filter(s => (activeCounts[s.key] ?? 0) > 0)
      .map(s => ({ key: s.key, label: ja ? s.ja : bn ? s.bn : s.en, count: activeCounts[s.key] ?? 0 })),
    ...(terminalCount > 0 ? [{ key: 'closed', label: ja ? '終了' : bn ? 'বন্ধ' : 'Closed', count: terminalCount }] : []),
  ];

  const apply = useMutation({
    mutationFn: () => api.post('/student/leads', form),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['student-leads'] });
      setShowForm(false);
      setForm({ target_country: '', target_course: '', target_intake: '', notes: '' });
      setApplyErr('');
    },
    onError: (e: unknown) => {
      const err = e as { response?: { data?: { message?: string } } };
      setApplyErr(err.response?.data?.message ?? (ja ? '申請に失敗しました。' : bn ? 'আবেদন ব্যর্থ হয়েছে।' : 'Failed to submit application.'));
    },
  });

  const title = ja ? '申請' : bn ? 'আবেদন' : 'Application';

  return (
    <StudentLayout title={title}>

      {/* Header row */}
      <div className="flex items-center justify-between mb-5">
        <div>
          <h1 className="text-base font-bold text-slate-900">{title}</h1>
          <p className="text-xs text-slate-500 mt-0.5">
            {ja ? 'ウェルカム、' : bn ? 'স্বাগতম, ' : 'Welcome, '}
            <span className="font-semibold text-slate-700">{user?.name?.split(' ')[0]}</span>
          </p>
        </div>
        <button
          onClick={() => { setShowForm(v => !v); setApplyErr(''); }}
          className="px-4 py-2 bg-green-700 hover:bg-green-800 text-white text-sm font-semibold rounded-xl transition-colors"
        >
          {showForm
            ? (ja ? 'キャンセル' : bn ? 'বাতিল' : 'Cancel')
            : (ja ? '＋ 新規申請' : bn ? '＋ নতুন আবেদন' : '+ Apply')}
        </button>
      </div>

      {/* Apply form */}
      {showForm && (
        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-5 mb-5">
          <h2 className="font-bold text-slate-900 text-sm mb-4">
            {ja ? '新規申請' : bn ? 'নতুন আবেদন' : 'New Application'}
          </h2>
          {applyErr && (
            <div className="mb-3 p-3 bg-red-50 border border-red-100 rounded-xl text-xs text-red-600">⚠️ {applyErr}</div>
          )}
          <form onSubmit={e => { e.preventDefault(); apply.mutate(); }} className="space-y-3">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold text-slate-500 mb-1">
                  {ja ? '目標国' : bn ? 'গন্তব্য দেশ' : 'Target Country'} *
                </label>
                <select
                  className={inputCls}
                  value={form.target_country}
                  onChange={e => setForm(f => ({ ...f, target_country: e.target.value }))}
                  required
                >
                  <option value="">{ja ? '選択してください' : bn ? 'বেছে নিন' : 'Select country'}</option>
                  {COUNTRIES.map(c => <option key={c} value={c}>{c}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-500 mb-1">
                  {ja ? 'コース' : bn ? 'কোর্স' : 'Course / Program'}
                </label>
                <input
                  className={inputCls}
                  placeholder={ja ? '例: 日本語コース' : bn ? 'যেমন: জাপানি ভাষা কোর্স' : 'e.g. Japanese Language Course'}
                  value={form.target_course}
                  onChange={e => setForm(f => ({ ...f, target_course: e.target.value }))}
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-500 mb-1">
                  {ja ? '入学希望時期' : bn ? 'ভর্তির সময়' : 'Intake / Start Date'}
                </label>
                <input
                  type="date"
                  className={inputCls}
                  value={form.target_intake}
                  onChange={e => setForm(f => ({ ...f, target_intake: e.target.value }))}
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-500 mb-1">
                  {ja ? 'メモ' : bn ? 'বার্তা' : 'Notes (optional)'}
                </label>
                <textarea
                  className={`${inputCls} resize-none`}
                  rows={2}
                  placeholder={ja ? '追加情報があればご記入ください' : bn ? 'কোনো অতিরিক্ত তথ্য থাকলে লিখুন' : 'Any additional info'}
                  value={form.notes}
                  onChange={e => setForm(f => ({ ...f, notes: e.target.value }))}
                />
              </div>
            </div>
            <button
              type="submit"
              disabled={apply.isPending || !form.target_country}
              className="w-full py-2.5 bg-green-700 hover:bg-green-800 text-white rounded-xl text-sm font-bold transition-colors disabled:opacity-50"
            >
              {apply.isPending
                ? (ja ? '送信中…' : bn ? 'পাঠানো হচ্ছে…' : 'Submitting…')
                : (ja ? '申請を送信する' : bn ? 'আবেদন জমা দিন' : 'Submit Application')}
            </button>
          </form>
        </div>
      )}

      {/* Pipeline summary */}
      {!isLoading && allLeads.length > 0 && (
        <div className="bg-white rounded-2xl border border-slate-100 p-4 sm:p-5 mb-4">
          <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-3">
            {ja ? 'パイプライン' : bn ? 'পাইপলাইন' : 'Pipeline'}
          </p>
          <div className="flex items-center gap-1">
            {PROGRESS_KEYS.map((key, i) => {
              const count = allLeads.filter(l => (PROGRESS_INDEX[l.status] ?? -1) === i).length;
              const stage = PIPELINE_STAGES[i];
              return (
                <div key={key} className="flex-1 flex flex-col items-center gap-1 min-w-0">
                  <div className={`w-full h-2 rounded-full ${count > 0 ? 'bg-green-500' : 'bg-slate-100'}`} />
                  <span className="hidden sm:block text-[10px] text-slate-400 truncate w-full text-center">
                    {ja ? stage.ja : bn ? stage.bn : stage.en}
                  </span>
                  {count > 0 && <span className="text-xs font-bold text-slate-700">{count}</span>}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Filter tabs */}
      {!isLoading && allLeads.length > 1 && (
        <div className="flex flex-wrap gap-2 mb-4">
          {filterTabs.map(tab => (
            <button key={tab.key} onClick={() => setFilter(tab.key)}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium transition-all border ${
                filter === tab.key
                  ? 'bg-green-700 text-white border-green-700'
                  : 'bg-white text-slate-600 border-slate-200 hover:border-slate-300'
              }`}>
              {tab.label}
              <span className={`inline-flex items-center justify-center w-4 h-4 rounded-full text-[10px] font-bold ${filter === tab.key ? 'bg-white/20 text-white' : 'bg-slate-100 text-slate-500'}`}>
                {tab.count}
              </span>
            </button>
          ))}
        </div>
      )}

      {/* Leads list */}
      {isLoading ? (
        <div className="text-center py-16 text-slate-400 text-sm">{ja ? '読み込み中...' : bn ? 'লোড হচ্ছে...' : 'Loading...'}</div>
      ) : allLeads.length === 0 ? (
        <div className="bg-white rounded-2xl border border-slate-100 p-10 text-center text-slate-400">
          <div className="text-4xl mb-3">📋</div>
          <div className="font-medium text-slate-600 mb-1">
            {ja ? '申請がありません' : bn ? 'কোনো আবেদন নেই' : 'No applications yet'}
          </div>
          <div className="text-xs">
            {ja ? '「＋ 新規申請」ボタンから最初の申請を送信してください。' : bn ? '"+ নতুন আবেদন" বোতামে ক্লিক করে প্রথম আবেদন করুন।' : 'Click "+ Apply" above to submit your first application.'}
          </div>
        </div>
      ) : displayed.length === 0 ? (
        <div className="text-center py-10 text-slate-400 text-sm">
          {ja ? 'この段階の申請はありません' : bn ? 'এই ফিল্টারে কোনো আবেদন নেই' : 'No applications in this stage'}
        </div>
      ) : (
        <div className="space-y-3">
          {displayed.map(lead => {
            const progIdx = PROGRESS_INDEX[lead.status] ?? -1;
            const isTerminal = TERMINAL_set.has(lead.status);
            const statuses = t.statuses as Record<string, string>;
            const statusLabel = statuses[lead.status] ?? lead.status.replace(/_/g, ' ');
            return (
              <div
                key={lead.id}
                onClick={() => router.push(`/dashboard/student/leads/${lead.id}`)}
                className="bg-white rounded-2xl border border-slate-100 p-4 sm:p-5 cursor-pointer hover:border-green-200 active:bg-slate-50 transition-colors"
              >
                <div className="flex flex-wrap items-center gap-2 mb-2">
                  <span className="font-mono text-xs text-slate-400">{lead.lead_code}</span>
                  <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${STATUS_COLORS[lead.status as keyof typeof STATUS_COLORS] ?? 'bg-slate-100 text-slate-600'}`}>
                    {statusLabel}
                  </span>
                  <span className="ml-auto text-xs text-slate-400">
                    {new Date(lead.created_at).toLocaleDateString(undefined, { dateStyle: 'medium' })}
                  </span>
                </div>
                <div className="font-semibold text-sm text-slate-900 mb-1">
                  {lead.target_country}{lead.target_course ? ` — ${lead.target_course}` : ''}
                </div>
                <div className="flex flex-wrap items-center gap-x-4 gap-y-0.5">
                  {lead.target_intake && (
                    <span className="text-xs text-slate-500">
                      {ja ? '時期:' : bn ? 'ইনটেক:' : 'Intake:'}{' '}
                      {new Date(lead.target_intake).toLocaleDateString(undefined, { dateStyle: 'medium' })}
                    </span>
                  )}
                  {lead.assigned_agency?.name && (
                    <span className="text-xs text-slate-400">
                      {ja ? '経由:' : bn ? 'এজেন্সি:' : 'via'} {lead.assigned_agency.name}
                    </span>
                  )}
                </div>
                {!isTerminal && progIdx >= 0 && (
                  <div className="mt-3 flex items-center gap-0.5">
                    {PROGRESS_KEYS.map((_, i) => (
                      <div key={i} className={`h-1 flex-1 rounded-full ${i <= progIdx ? 'bg-green-500' : 'bg-slate-100'}`} />
                    ))}
                    <span className="ml-2 text-[10px] text-slate-400 shrink-0">{progIdx + 1}/{PROGRESS_KEYS.length}</span>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </StudentLayout>
  );
}
