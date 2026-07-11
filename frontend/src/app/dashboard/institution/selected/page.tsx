'use client';
import DashboardLayout from '@/components/shared/DashboardLayout';
import { useLang } from '@/context/LanguageContext';
import { useAuthStore } from '@/store/authStore';
import api from '@/lib/api';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';

type SelectionStatus = 'selected' | 'cancelled' | 'accepted' | 'rejected' | 'processing' | 'complete' | 'incomplete';

interface SelectedApplication {
  id: number;
  lead_code: string;
  student_name: string | null;
  target_country: string;
  target_city: string | null;
  city_type: 'fixed' | 'preferred' | null;
  target_course: string | null;
  target_intake: string | null;
  last_education: string | null;
  gpa: string | null;
  jlpt_level: string | null;
  age: number | null;
  selected_at: string;
  updated_at: string | null;
  status: SelectionStatus;
  connect_name: string | null;
  connect_email: string | null;
  connect_whatsapp: string | null;
  connect_phone: string | null;
}

const STATUS_CONFIG: Record<SelectionStatus, {
  label: { en: string; ja: string; bn: string };
  badge: string;
  border: string;
  headerBg: string;
  dot: string;
  note: { en: string; ja: string; bn: string };
}> = {
  selected: {
    label:    { en: 'Pending Review', ja: '審査待ち', bn: 'পর্যালোচনা বাকি' },
    badge:    'bg-indigo-100 text-indigo-700 ring-1 ring-indigo-200',
    border:   'border-l-indigo-400',
    headerBg: 'from-indigo-50/60 to-white',
    dot:      'bg-indigo-400',
    note:     { en: 'Accept this application to begin coordination with Tensai.', ja: '承認するとTensaiが手続きを開始します。', bn: 'গ্রহণ করুন — Tensai সমন্বয় শুরু করবে।' },
  },
  accepted: {
    label:    { en: 'Accepted', ja: '承認済み', bn: 'গৃহীত' },
    badge:    'bg-amber-100 text-amber-700 ring-1 ring-amber-200',
    border:   'border-l-amber-400',
    headerBg: 'from-amber-50/60 to-white',
    dot:      'bg-amber-400',
    note:     { en: 'A Tensai manager will contact your representative within 24 hours.', ja: '24時間以内にTensaiマネージャーがご連絡します。', bn: '২৪ ঘণ্টার মধ্যে Tensai ম্যানেজার যোগাযোগ করবেন।' },
  },
  processing: {
    label:    { en: 'In Progress', ja: '手続き中', bn: 'প্রক্রিয়াধীন' },
    badge:    'bg-blue-100 text-blue-700 ring-1 ring-blue-200',
    border:   'border-l-blue-500',
    headerBg: 'from-blue-50/60 to-white',
    dot:      'bg-blue-500',
    note:     { en: 'Tensai is actively coordinating the enrollment process.', ja: '手続きが進行中です。Tensaiが連携して進めています。', bn: 'ভর্তি প্রক্রিয়া সক্রিয়ভাবে চলছে।' },
  },
  complete: {
    label:    { en: 'Enrolled', ja: '入学確定', bn: 'ভর্তি সম্পন্ন' },
    badge:    'bg-emerald-100 text-emerald-700 ring-1 ring-emerald-200',
    border:   'border-l-emerald-500',
    headerBg: 'from-emerald-50/60 to-white',
    dot:      'bg-emerald-500',
    note:     { en: 'Enrollment complete. The student has been successfully placed.', ja: '入学手続きが完了しました。', bn: 'ভর্তি সম্পন্ন। শিক্ষার্থী সফলভাবে নিযুক্ত হয়েছে।' },
  },
  rejected: {
    label:    { en: 'Withdrawn', ja: '取り下げ', bn: 'প্রত্যাহার' },
    badge:    'bg-red-50 text-red-500 ring-1 ring-red-200',
    border:   'border-l-red-300',
    headerBg: 'from-red-50/40 to-white',
    dot:      'bg-red-400',
    note:     { en: 'You withdrew this application. Revive within 30 days to reconsider.', ja: '取り下げました。30日以内であれば再開可能です。', bn: 'প্রত্যাহার করা হয়েছে। ৩০ দিনের মধ্যে পুনরুদ্ধার করুন।' },
  },
  cancelled: {
    label:    { en: 'Cancelled', ja: 'キャンセル', bn: 'বাতিল' },
    badge:    'bg-slate-100 text-slate-500 ring-1 ring-slate-200',
    border:   'border-l-slate-300',
    headerBg: 'from-slate-50/60 to-white',
    dot:      'bg-slate-400',
    note:     { en: 'This selection was cancelled. Revive within 30 days if needed.', ja: 'キャンセル済みです。30日以内であれば再開可能です。', bn: 'বাতিল করা হয়েছে। ৩০ দিনের মধ্যে পুনরুদ্ধার করা যাবে।' },
  },
  incomplete: {
    label:    { en: 'Incomplete', ja: '未完了', bn: 'অসম্পূর্ণ' },
    badge:    'bg-orange-100 text-orange-700 ring-1 ring-orange-200',
    border:   'border-l-orange-400',
    headerBg: 'from-orange-50/40 to-white',
    dot:      'bg-orange-400',
    note:     { en: 'Process was not completed. Revive within 30 days to try again.', ja: '手続きが完了しませんでした。30日以内に再開できます。', bn: 'প্রক্রিয়া অসম্পূর্ণ। ৩০ দিনের মধ্যে পুনরুদ্ধার করুন।' },
  },
};

function isRevivable(app: SelectedApplication): boolean {
  if (!['cancelled', 'rejected', 'incomplete'].includes(app.status)) return false;
  const ts = app.rejected_at ?? app.selected_at;
  if (!ts) return false;
  return (Date.now() - new Date(ts).getTime()) / 86400000 <= 30;
}

function initials(name: string | null): string {
  if (!name) return '?';
  return name.trim().split(/\s+/).map(w => w[0]).slice(0, 2).join('').toUpperCase();
}

function cap(s: string) { return s ? s.charAt(0).toUpperCase() + s.slice(1) : s; }
function fmt(d: string) { return new Date(d).toLocaleDateString(undefined, { dateStyle: 'medium' }); }

const AVATAR_COLORS = [
  'bg-violet-100 text-violet-700',
  'bg-sky-100 text-sky-700',
  'bg-teal-100 text-teal-700',
  'bg-rose-100 text-rose-700',
  'bg-amber-100 text-amber-700',
];

export default function InstitutionSelectedPage() {
  const { lang } = useLang();
  const { user } = useAuthStore();
  const router = useRouter();
  const qc = useQueryClient();
  const L = lang === 'ja' ? 'ja' : lang === 'bn' ? 'bn' : 'en';
  const t = (en: string, ja: string, bn: string) => L === 'ja' ? ja : L === 'bn' ? bn : en;

  useEffect(() => {
    if (user && user.gateway_type !== 'institution') router.replace(`/dashboard/${user.gateway_type}`);
  }, [user, router]);

  const [confirmingId, setConfirmingId] = useState<number | null>(null);
  const [confirmType, setConfirmType]   = useState<'cancel' | 'reject' | null>(null);
  const [successMsg, setSuccessMsg]     = useState('');
  const [actionErr, setActionErr]       = useState('');

  const showSuccess = (msg: string) => { setSuccessMsg(msg); setTimeout(() => setSuccessMsg(''), 4000); };
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const onError = (err: any) => {
    const msg = err?.response?.data?.message ?? err?.message ?? 'Action failed. Please try again.';
    setActionErr(msg);
  };

  const { data, isLoading } = useQuery({
    queryKey: ['institution-selected'],
    queryFn: () => api.get('/institution/selected-applications').then(r => r.data),
    staleTime: 30_000,
  });

  const selected: SelectedApplication[] = data?.data ?? [];

  // stats
  const activeCount    = selected.filter(a => ['selected','accepted','processing'].includes(a.status)).length;
  const enrolledCount  = selected.filter(a => a.status === 'complete').length;
  const pendingCount   = selected.filter(a => a.status === 'selected').length;

  const accept = useMutation({
    mutationFn: (id: number) => api.post(`/institution/accept-application/${id}`),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['institution-selected'] });
      setActionErr('');
      showSuccess(t('Accepted. A Tensai manager will contact you within 24 hours.', '承認しました。24時間以内にご連絡します。', 'গৃহীত হয়েছে। ২৪ ঘণ্টার মধ্যে যোগাযোগ করা হবে।'));
    },
    onError,
  });
  const reject = useMutation({
    mutationFn: (id: number) => api.post(`/institution/reject-application/${id}`),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['institution-selected'] }); setConfirmingId(null); setConfirmType(null); setActionErr(''); },
    onError,
  });
  const cancel = useMutation({
    mutationFn: (id: number) => api.post(`/institution/unselect-application/${id}`),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['institution-selected'] }); setConfirmingId(null); setConfirmType(null); setActionErr(''); },
    onError,
  });
  const revive = useMutation({
    mutationFn: (id: number) => api.post(`/institution/revive-application/${id}`),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['institution-selected'] });
      setActionErr('');
      showSuccess(t('Application revived.', '申請を再開しました。', 'আবেদন পুনরুদ্ধার হয়েছে।'));
    },
    onError,
  });

  if (!user || user.gateway_type !== 'institution') return null;

  return (
    <DashboardLayout title={t('Selected Applications', '選択済み申請', 'নির্বাচিত আবেদন')}>

      {/* ── Toast messages ── */}
      {successMsg && (
        <div className="mb-5 flex items-center gap-3 p-4 bg-emerald-50 border border-emerald-200 rounded-xl text-sm text-emerald-700 font-medium shadow-sm">
          <div className="w-6 h-6 rounded-full bg-emerald-500 flex items-center justify-center shrink-0">
            <svg className="w-3.5 h-3.5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
            </svg>
          </div>
          {successMsg}
        </div>
      )}
      {actionErr && (
        <div className="mb-5 p-4 bg-red-50 border border-red-200 rounded-xl text-sm text-red-600 shadow-sm">⚠ {actionErr}</div>
      )}

      {isLoading ? (
        <div className="flex flex-col items-center justify-center py-32 gap-4">
          <div className="w-10 h-10 border-2 border-slate-200 border-t-indigo-500 rounded-full animate-spin" />
          <p className="text-sm text-slate-400">{t('Loading applications…', '申請を読み込んでいます…', 'আবেদন লোড হচ্ছে…')}</p>
        </div>
      ) : selected.length === 0 ? (
        <div className="bg-white rounded-2xl border border-dashed border-slate-200 p-20 text-center">
          <div className="w-16 h-16 rounded-2xl bg-slate-50 border border-slate-100 flex items-center justify-center mx-auto mb-4">
            <svg className="w-8 h-8 text-slate-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
          </div>
          <p className="font-bold text-slate-600 mb-1">{t('No selected applications', '選択済み申請はありません', 'কোনো নির্বাচিত আবেদন নেই')}</p>
          <p className="text-xs text-slate-400">{t('Go to Application Pool to select candidates.', '申請一覧から候補者を選択してください。', 'Application Pool থেকে প্রার্থী নির্বাচন করুন।')}</p>
        </div>
      ) : (
        <>
          {/* ── Summary bar ── */}
          <div className="grid grid-cols-3 gap-3 mb-6">
            {[
              { label: t('Total Selected', '合計選択', 'মোট নির্বাচিত'), value: selected.length, color: 'text-slate-700', bg: 'bg-white' },
              { label: t('Active', 'アクティブ', 'সক্রিয়'),             value: activeCount,    color: 'text-indigo-700', bg: 'bg-indigo-50' },
              { label: t('Enrolled', '入学確定', 'ভর্তি সম্পন্ন'),      value: enrolledCount,  color: 'text-emerald-700', bg: 'bg-emerald-50' },
            ].map(s => (
              <div key={s.label} className={`${s.bg} rounded-xl p-4 border border-slate-100 shadow-sm text-center`}>
                <p className={`text-2xl font-black ${s.color}`}>{s.value}</p>
                <p className="text-[11px] text-slate-500 mt-0.5 font-medium">{s.label}</p>
              </div>
            ))}
          </div>

          {/* ── Cards ── */}
          <div className="space-y-4">
            {selected.map((app, idx) => {
              const cfg = STATUS_CONFIG[app.status];
              const revivable = isRevivable(app);
              const revivableEligible = ['cancelled', 'rejected', 'incomplete'].includes(app.status);
              const dimmed = ['cancelled', 'rejected'].includes(app.status);
              const avatarColor = AVATAR_COLORS[idx % AVATAR_COLORS.length];
              const isPending = app.status === 'selected';

              return (
                <div key={app.id}
                  className={`bg-white rounded-2xl border border-slate-200 border-l-4 ${cfg.border} shadow-sm overflow-hidden transition-opacity ${dimmed ? 'opacity-60' : ''}`}>

                  {/* ── Card header ── */}
                  <div className={`bg-gradient-to-r ${cfg.headerBg} px-5 pt-5 pb-4 border-b border-slate-100`}>
                    <div className="flex items-start gap-3">

                      {/* Avatar */}
                      <div className={`w-11 h-11 rounded-xl ${avatarColor} flex items-center justify-center shrink-0 font-black text-sm`}>
                        {initials(app.student_name)}
                      </div>

                      {/* Name + code */}
                      <div className="flex-1 min-w-0">
                        <h3 className="text-sm font-bold text-slate-900 leading-tight">
                          {app.student_name ?? t('Unnamed Applicant', '申請者', 'আবেদনকারী')}
                        </h3>
                        <div className="flex flex-wrap items-center gap-x-2 gap-y-0.5 mt-0.5">
                          <span className="font-mono text-[10px] text-slate-400 bg-slate-100 px-1.5 py-0.5 rounded">{app.lead_code}</span>
                          <span className="text-[11px] text-slate-400">{t('Selected', '選択', 'নির্বাচন')} {fmt(app.selected_at)}</span>
                        </div>
                      </div>

                      {/* Status badge */}
                      <span className={`shrink-0 px-2.5 py-1 rounded-full text-[11px] font-bold ${cfg.badge}`}>
                        <span className={`inline-block w-1.5 h-1.5 rounded-full ${cfg.dot} mr-1.5 ${['selected','accepted','processing'].includes(app.status) ? 'animate-pulse' : ''}`} />
                        {cfg.label[L]}
                      </span>
                    </div>
                  </div>

                  <div className="px-5 py-4 space-y-4">

                    {/* ── Quality panel ── */}
                    <div className="grid grid-cols-4 gap-0 rounded-xl border border-slate-100 overflow-hidden text-xs">
                      {[
                        { label: t('Education', '学歴', 'শিক্ষা'), value: app.last_education },
                        { label: 'GPA',                              value: app.gpa },
                        { label: 'JLPT',                             value: app.jlpt_level },
                        { label: t('Age', '年齢', 'বয়স'),          value: app.age ? `${app.age} ${t('yrs', '歳', 'বছর')}` : null },
                      ].map((f, i) => (
                        <div key={f.label} className={`px-3 py-2.5 ${i < 3 ? 'border-r border-slate-100' : ''} bg-slate-50/80`}>
                          <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest mb-1">{f.label}</p>
                          <p className={`font-bold ${f.value ? 'text-slate-800' : 'text-slate-300'}`}>
                            {f.value ?? '—'}
                          </p>
                        </div>
                      ))}
                    </div>

                    {/* ── Targets grid ── */}
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
                      {[
                        { label: t('Country', '国', 'দেশ'),       value: app.target_country ? cap(app.target_country) : null, icon: '🌏' },
                        { label: t('Course', 'コース', 'কোর্স'),  value: app.target_course, icon: '🎓' },
                        { label: t('Intake', '入学', 'ইনটেক'),    value: app.target_intake ? fmt(app.target_intake) : null, icon: '📅' },
                        { label: t('City', '都市', 'শহর'),        value: app.target_city ?? null, icon: '📍' },
                      ].map(f => (
                        <div key={f.label} className="flex items-start gap-2">
                          <span className="text-base leading-none mt-0.5">{f.icon}</span>
                          <div>
                            <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest mb-0.5">{f.label}</p>
                            <p className={`font-semibold ${f.value ? 'text-slate-700' : 'text-slate-300'}`}>{f.value ?? '—'}</p>
                          </div>
                        </div>
                      ))}
                    </div>

                    {/* ── Progress Stepper ── */}
                    {!['rejected','cancelled','incomplete'].includes(app.status) && (
                      <StatusStepper status={app.status} lang={L} />
                    )}

                    {/* ── Status note ── */}
                    <p className="text-[11px] text-slate-500 leading-relaxed">{cfg.note[L]}</p>

                    {/* ── Actions ── */}
                    <div className="flex flex-wrap items-center gap-2 pt-1">

                      {/* selected → Accept */}
                      {app.status === 'selected' && (
                        <>
                          <button
                            onClick={() => accept.mutate(app.id)}
                            disabled={accept.isPending}
                            className="inline-flex items-center gap-2 px-5 py-2.5 bg-green-700 hover:bg-green-800 text-white text-xs font-bold rounded-xl shadow-md shadow-green-700/20 transition-all disabled:opacity-50">
                            {accept.isPending ? (
                              <span className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                            ) : (
                              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
                              </svg>
                            )}
                            {t('Accept Application', '承認する', 'আবেদন গ্রহণ করুন')}
                          </button>

                          {confirmingId === app.id && confirmType === 'cancel' ? (
                            <>
                              <button onClick={() => cancel.mutate(app.id)} disabled={cancel.isPending}
                                className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white text-xs font-bold rounded-xl disabled:opacity-50">
                                {cancel.isPending ? '…' : t('Confirm Remove', '確認', 'নিশ্চিত')}
                              </button>
                              <button onClick={() => { setConfirmingId(null); setConfirmType(null); }}
                                className="px-3 py-2 text-xs text-slate-500 border border-slate-200 rounded-xl hover:bg-slate-50">
                                {t('Back', '戻る', 'ফিরুন')}
                              </button>
                            </>
                          ) : (
                            <button onClick={() => { setConfirmingId(app.id); setConfirmType('cancel'); }}
                              className="px-3 py-2 text-xs text-slate-400 border border-slate-200 rounded-xl hover:text-red-600 hover:border-red-200 transition-colors">
                              {t('Remove from List', 'リストから削除', 'তালিকা থেকে সরান')}
                            </button>
                          )}
                        </>
                      )}

                      {/* accepted → waiting pulse + withdraw */}
                      {app.status === 'accepted' && (
                        <>
                          <div className="flex items-center gap-2 px-3 py-2 bg-amber-50 border border-amber-200 rounded-xl">
                            <span className="w-2 h-2 rounded-full bg-amber-400 animate-pulse shrink-0" />
                            <span className="text-xs text-amber-700 font-semibold">
                              {t('Awaiting Tensai coordination', 'Tensaiの連絡をお待ちください', 'Tensai সমন্বয়ের অপেক্ষায়')}
                            </span>
                          </div>
                          <div className="flex-1" />
                          {confirmingId === app.id && confirmType === 'reject' ? (
                            <>
                              <button onClick={() => reject.mutate(app.id)} disabled={reject.isPending}
                                className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white text-xs font-bold rounded-xl disabled:opacity-50">
                                {reject.isPending ? '…' : t('Confirm Withdrawal', '確認', 'নিশ্চিত')}
                              </button>
                              <button onClick={() => { setConfirmingId(null); setConfirmType(null); }}
                                className="px-3 py-2 text-xs text-slate-500 border border-slate-200 rounded-xl hover:bg-slate-50">
                                {t('Back', '戻る', 'ফিরুন')}
                              </button>
                            </>
                          ) : (
                            <button onClick={() => { setConfirmingId(app.id); setConfirmType('reject'); }}
                              className="px-3 py-2 text-xs text-slate-400 border border-slate-200 rounded-xl hover:text-red-600 hover:border-red-200 transition-colors">
                              {t('Withdraw Acceptance', '承認を取り消す', 'গ্রহণ প্রত্যাহার')}
                            </button>
                          )}
                        </>
                      )}

                      {/* processing */}
                      {app.status === 'processing' && (
                        <div className="flex items-center gap-2 px-3 py-2 bg-blue-50 border border-blue-200 rounded-xl">
                          <span className="w-2 h-2 rounded-full bg-blue-500 animate-pulse shrink-0" />
                          <span className="text-xs text-blue-700 font-semibold">
                            {t('Processing underway — Tensai will keep you updated.', '手続き進行中。Tensaiより随時ご連絡します。', 'প্রক্রিয়া চলমান — Tensai আপডেট রাখবে।')}
                          </span>
                        </div>
                      )}

                      {/* complete */}
                      {app.status === 'complete' && (
                        <div className="flex items-center gap-2 px-3 py-2 bg-emerald-50 border border-emerald-200 rounded-xl">
                          <svg className="w-4 h-4 text-emerald-600 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                          </svg>
                          <span className="text-xs text-emerald-700 font-semibold">
                            {t('Enrollment complete. Thank you for partnering with Tensai.', '入学手続き完了。ご協力ありがとうございます。', 'ভর্তি সম্পন্ন। Tensai-এর সাথে অংশীদারিত্বের জন্য ধন্যবাদ।')}
                          </span>
                        </div>
                      )}

                      {/* revive */}
                      {revivableEligible && (
                        revivable ? (
                          <button onClick={() => revive.mutate(app.id)} disabled={revive.isPending}
                            className="inline-flex items-center gap-2 px-4 py-2 bg-slate-700 hover:bg-slate-800 text-white text-xs font-bold rounded-xl transition-colors disabled:opacity-50">
                            {revive.isPending ? '…' : (
                              <>
                                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                                </svg>
                                {t('Revive Application', '申請を再開', 'আবেদন পুনরুদ্ধার')}
                              </>
                            )}
                          </button>
                        ) : (
                          <span className="text-xs text-slate-400 italic">
                            {t('Revival period expired (30 days). Contact Tensai to proceed.', '再開期限切れ（30日）。Tensaiにご連絡ください。', 'পুনরুদ্ধারের মেয়াদ শেষ। Tensai-এ যোগাযোগ করুন।')}
                          </span>
                        )
                      )}
                    </div>

                  </div>
                </div>
              );
            })}
          </div>

          {/* ── Footer hint ── */}
          {pendingCount > 0 && (
            <p className="mt-5 text-center text-xs text-slate-400">
              {t(`${pendingCount} application${pendingCount !== 1 ? 's' : ''} awaiting your review`, `${pendingCount}件の申請が審査待ちです`, `${pendingCount}টি আবেদন আপনার পর্যালোচনার অপেক্ষায়`)}
            </p>
          )}
        </>
      )}
    </DashboardLayout>
  );
}

function Field({ label, value }: { label: string; value: string | null | undefined }) {
  return (
    <div>
      <p className="text-[10px] font-semibold text-slate-400 uppercase tracking-wide mb-0.5">{label}</p>
      <p className="font-semibold text-slate-700">{value ?? <span className="text-slate-300 font-normal">—</span>}</p>
    </div>
  );
}

type Lang = 'en' | 'ja' | 'bn';
const JOURNEY = [
  { key: 'selected',   en: 'Selected',   ja: '選択済み',  bn: 'নির্বাচিত' },
  { key: 'accepted',   en: 'Accepted',   ja: '承認済み',  bn: 'গৃহীত' },
  { key: 'processing', en: 'Processing', ja: '手続き中',  bn: 'প্রক্রিয়া' },
  { key: 'complete',   en: 'Enrolled',   ja: '入学確定',  bn: 'ভর্তি সম্পন্ন' },
] as const;

function StatusStepper({ status, lang }: { status: string; lang: Lang }) {
  const idx = JOURNEY.findIndex(s => s.key === status);
  return (
    <div className="pt-3 border-t border-slate-100">
      <div className="flex items-center gap-0">
        {JOURNEY.map((step, i) => {
          const done    = i < idx;
          const current = i === idx;
          const future  = i > idx;
          return (
            <div key={step.key} className="flex items-center flex-1 last:flex-none">
              <div className="flex flex-col items-center gap-1 min-w-0">
                <div className={`w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-black shrink-0
                  ${done    ? 'bg-emerald-500 text-white' : ''}
                  ${current ? 'bg-green-700 text-white ring-4 ring-green-700/20' : ''}
                  ${future  ? 'bg-slate-100 text-slate-300' : ''}`}>
                  {done ? '✓' : i + 1}
                </div>
                <span className={`text-[9px] font-semibold whitespace-nowrap ${done ? 'text-emerald-600' : current ? 'text-green-700' : 'text-slate-300'}`}>
                  {step[lang]}
                </span>
              </div>
              {i < 3 && (
                <div className={`flex-1 h-0.5 mx-1 mb-3.5 rounded-full ${done ? 'bg-emerald-400' : 'bg-slate-100'}`} />
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

function TimelineStep({ icon, color, label, date }: { icon: string; color: string; label: string; date: string }) {
  return (
    <div className="flex items-center gap-1.5">
      <span className={`text-xs font-bold ${color}`}>{icon}</span>
      <span className="text-[11px] text-slate-500">{label}</span>
      <span className="text-[11px] text-slate-400">{date}</span>
    </div>
  );
}
