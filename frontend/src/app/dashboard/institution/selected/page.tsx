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
  accepted_at: string | null;
  rejected_at: string | null;
  processing_at: string | null;
  completed_at: string | null;
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
  note: { en: string; ja: string; bn: string };
}> = {
  selected: {
    label: { en: 'Pending Review', ja: '審査待ち', bn: 'পর্যালোচনা বাকি' },
    badge:  'bg-indigo-100 text-indigo-700',
    border: 'border-l-indigo-400',
    note:   { en: 'Accept this application to begin coordination with Tensai.', ja: '承認するとTensaiが手続きを開始します。', bn: 'গ্রহণ করুন — Tensai সমন্বয় শুরু করবে।' },
  },
  accepted: {
    label: { en: 'Accepted', ja: '承認済み', bn: 'গৃহীত' },
    badge:  'bg-amber-100 text-amber-700',
    border: 'border-l-amber-400',
    note:   { en: 'A Tensai manager will contact your representative within 24 hours.', ja: '24時間以内にTensaiマネージャーがご連絡します。', bn: '২৪ ঘণ্টার মধ্যে Tensai ম্যানেজার যোগাযোগ করবেন।' },
  },
  processing: {
    label: { en: 'In Progress', ja: '手続き中', bn: 'প্রক্রিয়াধীন' },
    badge:  'bg-blue-100 text-blue-700',
    border: 'border-l-blue-500',
    note:   { en: 'Tensai is actively coordinating the enrollment process.', ja: '手続きが進行中です。Tensaiが連携して進めています。', bn: 'ভর্তি প্রক্রিয়া সক্রিয়ভাবে চলছে।' },
  },
  complete: {
    label: { en: 'Enrolled', ja: '入学確定', bn: 'ভর্তি সম্পন্ন' },
    badge:  'bg-emerald-100 text-emerald-700',
    border: 'border-l-emerald-500',
    note:   { en: 'Enrollment complete. The student has been successfully placed.', ja: '入学手続きが完了しました。', bn: 'ভর্তি সম্পন্ন। শিক্ষার্থী সফলভাবে নিযুক্ত হয়েছে।' },
  },
  rejected: {
    label: { en: 'Withdrawn', ja: '取り下げ', bn: 'প্রত্যাহার করা হয়েছে' },
    badge:  'bg-red-100 text-red-600',
    border: 'border-l-red-400',
    note:   { en: 'You withdrew this application. Revive within 30 days to reconsider.', ja: '取り下げました。30日以内であれば再開可能です。', bn: 'প্রত্যাহার করা হয়েছে। ৩০ দিনের মধ্যে পুনরুদ্ধার করুন।' },
  },
  cancelled: {
    label: { en: 'Cancelled', ja: 'キャンセル', bn: 'বাতিল' },
    badge:  'bg-slate-100 text-slate-500',
    border: 'border-l-slate-300',
    note:   { en: 'This selection was cancelled. Revive within 30 days if needed.', ja: 'キャンセル済みです。30日以内であれば再開可能です。', bn: 'বাতিল করা হয়েছে। ৩০ দিনের মধ্যে পুনরুদ্ধার করা যাবে।' },
  },
  incomplete: {
    label: { en: 'Incomplete', ja: '未完了', bn: 'অসম্পূর্ণ' },
    badge:  'bg-orange-100 text-orange-700',
    border: 'border-l-orange-400',
    note:   { en: 'Process was not completed. Revive within 30 days to try again.', ja: '手続きが完了しませんでした。30日以内に再開できます。', bn: 'প্রক্রিয়া অসম্পূর্ণ। ৩০ দিনের মধ্যে পুনরুদ্ধার করুন।' },
  },
};

function isRevivable(app: SelectedApplication): boolean {
  if (!['cancelled', 'rejected', 'incomplete'].includes(app.status)) return false;
  const ts = app.rejected_at ?? app.selected_at;
  if (!ts) return false;
  return (Date.now() - new Date(ts).getTime()) / 86400000 <= 30;
}

function cap(s: string) { return s ? s.charAt(0).toUpperCase() + s.slice(1) : s; }
function fmt(d: string) { return new Date(d).toLocaleDateString(undefined, { dateStyle: 'medium' }); }

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
  const onError = () => { setActionErr(t('Action failed. Please try again.', '操作に失敗しました。', 'ব্যর্থ হয়েছে।')); };

  const { data, isLoading } = useQuery({
    queryKey: ['institution-selected'],
    queryFn: () => api.get('/institution/selected-applications').then(r => r.data),
    staleTime: 30_000,
  });

  const selected: SelectedApplication[] = data?.data ?? [];

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

      {successMsg && (
        <div className="mb-4 p-3 bg-emerald-50 border border-emerald-200 rounded-lg text-sm text-emerald-700 font-medium">
          ✓ {successMsg}
        </div>
      )}
      {actionErr && (
        <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-600">⚠ {actionErr}</div>
      )}

      {isLoading ? (
        <div className="text-center py-20 text-slate-400 text-sm">{t('Loading…', '読み込み中…', 'লোড হচ্ছে…')}</div>
      ) : selected.length === 0 ? (
        <div className="bg-white rounded-xl border border-dashed border-slate-200 p-16 text-center">
          <p className="text-2xl mb-3">📋</p>
          <p className="font-semibold text-slate-600 mb-1">{t('No selected applications', '選択済み申請はありません', 'কোনো নির্বাচিত আবেদন নেই')}</p>
          <p className="text-xs text-slate-400">{t('Go to Application Pool to select candidates.', '申請一覧から候補者を選択してください。', 'Application Pool থেকে প্রার্থী নির্বাচন করুন।')}</p>
        </div>
      ) : (
        <div className="space-y-3">
          {selected.map(app => {
            const cfg = STATUS_CONFIG[app.status];
            const revivable = isRevivable(app);
            const revivableEligible = ['cancelled', 'rejected', 'incomplete'].includes(app.status);
            const dimmed = ['cancelled', 'rejected'].includes(app.status);

            return (
              <div key={app.id}
                className={`bg-white rounded-xl border border-slate-200 border-l-4 ${cfg.border} shadow-sm overflow-hidden ${dimmed ? 'opacity-70' : ''}`}>

                <div className="p-5">

                  {/* ── Row 1: name + status ── */}
                  <div className="flex items-start justify-between gap-3 mb-3">
                    <div className="min-w-0">
                      <h3 className="text-base font-bold text-slate-900 leading-tight">
                        {app.student_name ?? t('Unnamed Applicant', '申請者', 'আবেদনকারী')}
                      </h3>
                      <div className="flex items-center gap-2 mt-0.5">
                        <span className="font-mono text-[11px] text-slate-400">{app.lead_code}</span>
                        <span className="text-slate-300">·</span>
                        <span className="text-[11px] text-slate-400">
                          {t('Selected', '選択', 'নির্বাচন')} {fmt(app.selected_at)}
                        </span>
                      </div>
                    </div>
                    <span className={`shrink-0 px-2.5 py-1 rounded-full text-xs font-semibold ${cfg.badge}`}>
                      {cfg.label[L]}
                    </span>
                  </div>

                  {/* ── Row 2: applicant quality ── */}
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 p-3 bg-slate-50 rounded-lg mb-3 text-xs">
                    <Field label={t('Education', '学歴', 'শিক্ষা')}    value={app.last_education} />
                    <Field label="GPA"                                   value={app.gpa} />
                    <Field label="JLPT"                                  value={app.jlpt_level} />
                    <Field label={t('Age', '年齢', 'বয়স')}             value={app.age ? `${app.age} ${t('yrs', '歳', 'বছর')}` : null} />
                  </div>

                  {/* ── Row 3: application targets ── */}
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs mb-4">
                    <Field label={t('Country', '国', 'দেশ')}     value={app.target_country ? cap(app.target_country) : null} />
                    <Field label={t('Course', 'コース', 'কোর্স')} value={app.target_course} />
                    <Field label={t('Intake', '入学', 'ইনটেক')}  value={app.target_intake ? fmt(app.target_intake) : null} />
                    <Field
                      label={t('City', '都市', 'শহর')}
                      value={app.target_city
                        ? `${app.target_city}${app.city_type === 'fixed' ? ` (${t('fixed', '固定', 'ফিক্সড')})` : ''}`
                        : null}
                    />
                  </div>

                  {/* ── Timeline (if progressed) ── */}
                  {(app.accepted_at || app.processing_at || app.completed_at) && (
                    <div className="flex flex-wrap gap-3 text-[11px] text-slate-500 mb-4 pb-4 border-b border-slate-100">
                      {app.accepted_at   && <span>✓ {t('Accepted', '承認', 'গৃহীত')} {fmt(app.accepted_at)}</span>}
                      {app.processing_at && <span>→ {t('Processing from', '手続開始', 'প্রক্রিয়া শুরু')} {fmt(app.processing_at)}</span>}
                      {app.completed_at  && <span>✓ {t('Completed', '完了', 'সম্পন্ন')} {fmt(app.completed_at)}</span>}
                    </div>
                  )}

                  {/* ── Status note ── */}
                  <p className="text-xs text-slate-500 mb-4">{cfg.note[L]}</p>

                  {/* ── Actions ── */}
                  <div className="flex flex-wrap items-center gap-2">

                    {/* selected */}
                    {app.status === 'selected' && (
                      <>
                        <button onClick={() => accept.mutate(app.id)} disabled={accept.isPending}
                          className="px-4 py-2 bg-green-700 hover:bg-green-800 text-white text-xs font-semibold rounded-lg transition-colors disabled:opacity-50">
                          {accept.isPending ? '…' : t('Accept Application', '承認する', 'আবেদন গ্রহণ করুন')}
                        </button>
                        {confirmingId === app.id && confirmType === 'cancel' ? (
                          <>
                            <button onClick={() => cancel.mutate(app.id)} disabled={cancel.isPending}
                              className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white text-xs font-semibold rounded-lg disabled:opacity-50">
                              {cancel.isPending ? '…' : t('Confirm', '確認', 'নিশ্চিত')}
                            </button>
                            <button onClick={() => { setConfirmingId(null); setConfirmType(null); }}
                              className="px-3 py-2 text-xs text-slate-500 border border-slate-200 rounded-lg hover:bg-slate-50">
                              {t('Back', '戻る', 'ফিরুন')}
                            </button>
                          </>
                        ) : (
                          <button onClick={() => { setConfirmingId(app.id); setConfirmType('cancel'); }}
                            className="px-3 py-2 text-xs text-slate-400 border border-slate-200 rounded-lg hover:text-red-600 hover:border-red-200 transition-colors">
                            {t('Remove from List', 'リストから削除', 'তালিকা থেকে সরান')}
                          </button>
                        )}
                      </>
                    )}

                    {/* accepted */}
                    {app.status === 'accepted' && (
                      <>
                        <div className="flex items-center gap-1.5 text-xs text-amber-700 font-medium">
                          <span className="w-1.5 h-1.5 rounded-full bg-amber-400 animate-pulse" />
                          {t('Awaiting Tensai coordination', 'Tensaiの連絡をお待ちください', 'Tensai সমন্বয়ের অপেক্ষায়')}
                        </div>
                        {confirmingId === app.id && confirmType === 'reject' ? (
                          <>
                            <button onClick={() => reject.mutate(app.id)} disabled={reject.isPending}
                              className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white text-xs font-semibold rounded-lg disabled:opacity-50">
                              {reject.isPending ? '…' : t('Confirm Withdrawal', '確認', 'নিশ্চিত')}
                            </button>
                            <button onClick={() => { setConfirmingId(null); setConfirmType(null); }}
                              className="px-3 py-2 text-xs text-slate-500 border border-slate-200 rounded-lg hover:bg-slate-50">
                              {t('Back', '戻る', 'ফিরুন')}
                            </button>
                          </>
                        ) : (
                          <button onClick={() => { setConfirmingId(app.id); setConfirmType('reject'); }}
                            className="ml-auto px-3 py-2 text-xs text-slate-400 border border-slate-200 rounded-lg hover:text-red-600 hover:border-red-200 transition-colors">
                            {t('Withdraw Acceptance', '承認を取り消す', 'গ্রহণ প্রত্যাহার')}
                          </button>
                        )}
                      </>
                    )}

                    {/* processing */}
                    {app.status === 'processing' && (
                      <span className="text-xs text-blue-600 font-medium">
                        {t('Processing underway — Tensai will keep you updated.', '手続き進行中。Tensaiより随時ご連絡します。', 'প্রক্রিয়া চলমান — Tensai আপডেট রাখবে।')}
                      </span>
                    )}

                    {/* complete */}
                    {app.status === 'complete' && (
                      <span className="text-xs text-emerald-700 font-medium">
                        {t('Enrollment complete. Thank you for partnering with Tensai.', '入学手続き完了。ご協力ありがとうございます。', 'ভর্তি সম্পন্ন। Tensai-এর সাথে অংশীদারিত্বের জন্য ধন্যবাদ।')}
                      </span>
                    )}

                    {/* revive */}
                    {revivableEligible && (
                      revivable ? (
                        <button onClick={() => revive.mutate(app.id)} disabled={revive.isPending}
                          className="px-4 py-2 bg-slate-700 hover:bg-slate-800 text-white text-xs font-semibold rounded-lg transition-colors disabled:opacity-50">
                          {revive.isPending ? '…' : t('Revive Application', '申請を再開', 'আবেদন পুনরুদ্ধার')}
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
